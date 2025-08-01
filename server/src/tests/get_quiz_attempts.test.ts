
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, quizzesTable, quizAttemptsTable } from '../db/schema';
import { getQuizAttempts } from '../handlers/get_quiz_attempts';

describe('getQuizAttempts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get quiz attempts for a user', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create test course
    const course = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        slug: 'test-course',
        difficulty: 'beginner',
        estimated_duration: 60,
        category: 'Programming',
        order_index: 1
      })
      .returning()
      .execute();

    // Create test lesson
    const lesson = await db.insert(lessonsTable)
      .values({
        course_id: course[0].id,
        title: 'Test Lesson',
        description: 'A test lesson',
        slug: 'test-lesson',
        order_index: 1
      })
      .returning()
      .execute();

    // Create test quiz
    const quiz = await db.insert(quizzesTable)
      .values({
        lesson_id: lesson[0].id,
        title: 'Test Quiz',
        questions: JSON.stringify([{ question: 'What is 2+2?', options: ['3', '4', '5'], correct: 1 }]),
        passing_score: 70
      })
      .returning()
      .execute();

    // Create test quiz attempts
    const attempt1 = await db.insert(quizAttemptsTable)
      .values({
        user_id: user[0].id,
        quiz_id: quiz[0].id,
        answers: JSON.stringify({ question1: 'B' }),
        score: 85,
        is_passed: true,
        attempted_at: new Date('2024-01-15T10:00:00Z'),
        completed_at: new Date('2024-01-15T10:15:00Z')
      })
      .returning()
      .execute();

    const attempt2 = await db.insert(quizAttemptsTable)
      .values({
        user_id: user[0].id,
        quiz_id: quiz[0].id,
        answers: JSON.stringify({ question1: 'A' }),
        score: 60,
        is_passed: false,
        attempted_at: new Date('2024-01-14T10:00:00Z')
      })
      .returning()
      .execute();

    const result = await getQuizAttempts(user[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual(attempt1[0].id); // Most recent first (desc order)
    expect(result[0].user_id).toEqual(user[0].id);
    expect(result[0].quiz_id).toEqual(quiz[0].id);
    expect(result[0].score).toEqual(85);
    expect(result[0].is_passed).toEqual(true);
    expect(result[0].attempted_at).toBeInstanceOf(Date);

    expect(result[1].id).toEqual(attempt2[0].id); // Older attempt second
    expect(result[1].score).toEqual(60);
    expect(result[1].is_passed).toEqual(false);
    expect(result[1].completed_at).toBeNull();
  });

  it('should get quiz attempts filtered by quiz ID', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create test course
    const course = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        slug: 'test-course',
        difficulty: 'beginner',
        estimated_duration: 60,
        category: 'Programming',
        order_index: 1
      })
      .returning()
      .execute();

    // Create test lesson
    const lesson = await db.insert(lessonsTable)
      .values({
        course_id: course[0].id,
        title: 'Test Lesson',
        description: 'A test lesson',
        slug: 'test-lesson',
        order_index: 1
      })
      .returning()
      .execute();

    // Create two test quizzes
    const quiz1 = await db.insert(quizzesTable)
      .values({
        lesson_id: lesson[0].id,
        title: 'Test Quiz 1',
        questions: JSON.stringify([{ question: 'Question 1' }]),
        passing_score: 70
      })
      .returning()
      .execute();

    const quiz2 = await db.insert(quizzesTable)
      .values({
        lesson_id: lesson[0].id,
        title: 'Test Quiz 2',
        questions: JSON.stringify([{ question: 'Question 2' }]),
        passing_score: 70
      })
      .returning()
      .execute();

    // Create attempts for both quizzes
    await db.insert(quizAttemptsTable)
      .values({
        user_id: user[0].id,
        quiz_id: quiz1[0].id,
        answers: JSON.stringify({ question1: 'A' }),
        score: 80,
        is_passed: true
      })
      .execute();

    await db.insert(quizAttemptsTable)
      .values({
        user_id: user[0].id,
        quiz_id: quiz2[0].id,
        answers: JSON.stringify({ question1: 'B' }),
        score: 90,
        is_passed: true
      })
      .execute();

    // Test filtering by specific quiz ID
    const result = await getQuizAttempts(user[0].id, quiz1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].quiz_id).toEqual(quiz1[0].id);
    expect(result[0].score).toEqual(80);
  });

  it('should return empty array when no attempts found', async () => {
    // Create test user but no quiz attempts
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const result = await getQuizAttempts(user[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent quiz ID', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const result = await getQuizAttempts(user[0].id, 999);

    expect(result).toHaveLength(0);
  });
});
