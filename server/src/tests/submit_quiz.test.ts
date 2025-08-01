
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, quizzesTable, quizAttemptsTable } from '../db/schema';
import { type SubmitQuizInput } from '../schema';
import { submitQuiz } from '../handlers/submit_quiz';
import { eq } from 'drizzle-orm';

// Test data setup
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password',
  first_name: 'Test',
  last_name: 'User'
};

const testCourse = {
  title: 'Test Course',
  description: 'A test course',
  slug: 'test-course',
  difficulty: 'beginner' as const,
  estimated_duration: 60,
  category: 'Programming',
  order_index: 1
};

const testLesson = {
  title: 'Test Lesson',
  description: 'A test lesson',
  slug: 'test-lesson',
  order_index: 1
};

const testQuestions = [
  {
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correct_answer: 1
  },
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correct_answer: 2
  }
];

const testQuiz = {
  title: 'Test Quiz',
  questions: JSON.stringify(testQuestions),
  passing_score: 50
};

describe('submitQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should submit quiz attempt with correct score calculation', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable).values(testUser).returning().execute();
    const courses = await db.insert(coursesTable).values(testCourse).returning().execute();
    const lessons = await db.insert(lessonsTable).values({
      ...testLesson,
      course_id: courses[0].id
    }).returning().execute();
    const quizzes = await db.insert(quizzesTable).values({
      ...testQuiz,
      lesson_id: lessons[0].id
    }).returning().execute();

    // Submit quiz with all correct answers
    const correctAnswers = [1, 2]; // Both correct
    const input: SubmitQuizInput = {
      user_id: users[0].id,
      quiz_id: quizzes[0].id,
      answers: JSON.stringify(correctAnswers)
    };

    const result = await submitQuiz(input);

    expect(result.user_id).toEqual(users[0].id);
    expect(result.quiz_id).toEqual(quizzes[0].id);
    expect(result.answers).toEqual(JSON.stringify(correctAnswers));
    expect(result.score).toEqual(100); // 2/2 correct = 100%
    expect(result.is_passed).toBe(true); // 100% > 50% passing score
    expect(result.id).toBeDefined();
    expect(result.attempted_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should calculate partial score correctly', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable).values(testUser).returning().execute();
    const courses = await db.insert(coursesTable).values(testCourse).returning().execute();
    const lessons = await db.insert(lessonsTable).values({
      ...testLesson,
      course_id: courses[0].id
    }).returning().execute();
    const quizzes = await db.insert(quizzesTable).values({
      ...testQuiz,
      lesson_id: lessons[0].id
    }).returning().execute();

    // Submit quiz with one correct answer
    const partialAnswers = [1, 0]; // First correct, second wrong
    const input: SubmitQuizInput = {
      user_id: users[0].id,
      quiz_id: quizzes[0].id,
      answers: JSON.stringify(partialAnswers)
    };

    const result = await submitQuiz(input);

    expect(result.score).toEqual(50); // 1/2 correct = 50%
    expect(result.is_passed).toBe(true); // 50% = 50% passing score
  });

  it('should mark as failed when score below passing threshold', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable).values(testUser).returning().execute();
    const courses = await db.insert(coursesTable).values(testCourse).returning().execute();
    const lessons = await db.insert(lessonsTable).values({
      ...testLesson,
      course_id: courses[0].id
    }).returning().execute();
    
    // Quiz with higher passing score
    const highPassingQuiz = {
      ...testQuiz,
      lesson_id: lessons[0].id,
      passing_score: 75
    };
    const quizzes = await db.insert(quizzesTable).values(highPassingQuiz).returning().execute();

    // Submit quiz with partial correct answers
    const partialAnswers = [1, 0]; // 50% score
    const input: SubmitQuizInput = {
      user_id: users[0].id,
      quiz_id: quizzes[0].id,
      answers: JSON.stringify(partialAnswers)
    };

    const result = await submitQuiz(input);

    expect(result.score).toEqual(50);
    expect(result.is_passed).toBe(false); // 50% < 75% passing score
  });

  it('should save quiz attempt to database', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable).values(testUser).returning().execute();
    const courses = await db.insert(coursesTable).values(testCourse).returning().execute();
    const lessons = await db.insert(lessonsTable).values({
      ...testLesson,
      course_id: courses[0].id
    }).returning().execute();
    const quizzes = await db.insert(quizzesTable).values({
      ...testQuiz,
      lesson_id: lessons[0].id
    }).returning().execute();

    const correctAnswers = [1, 2];
    const input: SubmitQuizInput = {
      user_id: users[0].id,
      quiz_id: quizzes[0].id,
      answers: JSON.stringify(correctAnswers)
    };

    const result = await submitQuiz(input);

    // Verify it was saved to database
    const attempts = await db.select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.id, result.id))
      .execute();

    expect(attempts).toHaveLength(1);
    expect(attempts[0].user_id).toEqual(users[0].id);
    expect(attempts[0].quiz_id).toEqual(quizzes[0].id);
    expect(attempts[0].score).toEqual(100);
    expect(attempts[0].is_passed).toBe(true);
  });

  it('should throw error for non-existent quiz', async () => {
    const input: SubmitQuizInput = {
      user_id: 1,
      quiz_id: 999, // Non-existent quiz
      answers: JSON.stringify([1, 2])
    };

    await expect(submitQuiz(input)).rejects.toThrow(/Quiz with ID 999 not found/i);
  });

  it('should throw error for invalid JSON answers', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable).values(testUser).returning().execute();
    const courses = await db.insert(coursesTable).values(testCourse).returning().execute();
    const lessons = await db.insert(lessonsTable).values({
      ...testLesson,
      course_id: courses[0].id
    }).returning().execute();
    const quizzes = await db.insert(quizzesTable).values({
      ...testQuiz,
      lesson_id: lessons[0].id
    }).returning().execute();

    const input: SubmitQuizInput = {
      user_id: users[0].id,
      quiz_id: quizzes[0].id,
      answers: 'invalid json'
    };

    await expect(submitQuiz(input)).rejects.toThrow(/Invalid JSON format/i);
  });
});
