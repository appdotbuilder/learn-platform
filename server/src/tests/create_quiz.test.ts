
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { quizzesTable, coursesTable, lessonsTable } from '../db/schema';
import { type CreateQuizInput } from '../schema';
import { createQuiz } from '../handlers/create_quiz';
import { eq } from 'drizzle-orm';

// Test input for quiz creation
const testInput: CreateQuizInput = {
  lesson_id: 1,
  title: 'JavaScript Basics Quiz',
  questions: JSON.stringify([
    {
      question: 'What is a variable?',
      options: ['A container', 'A function', 'A loop', 'A condition'],
      correct: 0
    }
  ]),
  passing_score: 70
};

describe('createQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a quiz', async () => {
    // Create prerequisite course and lesson
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        slug: 'test-course',
        difficulty: 'beginner',
        estimated_duration: 120,
        category: 'programming',
        order_index: 0
      })
      .returning()
      .execute();

    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: courseResult[0].id,
        title: 'Test Lesson',
        description: 'A test lesson',
        slug: 'test-lesson',
        order_index: 0
      })
      .returning()
      .execute();

    const inputWithValidLessonId = {
      ...testInput,
      lesson_id: lessonResult[0].id
    };

    const result = await createQuiz(inputWithValidLessonId);

    // Basic field validation
    expect(result.lesson_id).toEqual(lessonResult[0].id);
    expect(result.title).toEqual('JavaScript Basics Quiz');
    expect(result.questions).toEqual(testInput.questions);
    expect(result.passing_score).toEqual(70);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save quiz to database', async () => {
    // Create prerequisite course and lesson
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        slug: 'test-course',
        difficulty: 'beginner',
        estimated_duration: 120,
        category: 'programming',
        order_index: 0
      })
      .returning()
      .execute();

    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: courseResult[0].id,
        title: 'Test Lesson',
        description: 'A test lesson',
        slug: 'test-lesson',
        order_index: 0
      })
      .returning()
      .execute();

    const inputWithValidLessonId = {
      ...testInput,
      lesson_id: lessonResult[0].id
    };

    const result = await createQuiz(inputWithValidLessonId);

    // Query using proper drizzle syntax
    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, result.id))
      .execute();

    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].title).toEqual('JavaScript Basics Quiz');
    expect(quizzes[0].questions).toEqual(testInput.questions);
    expect(quizzes[0].passing_score).toEqual(70);
    expect(quizzes[0].lesson_id).toEqual(lessonResult[0].id);
    expect(quizzes[0].created_at).toBeInstanceOf(Date);
    expect(quizzes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for invalid lesson_id', async () => {
    const invalidInput = {
      ...testInput,
      lesson_id: 999 // Non-existent lesson ID
    };

    await expect(createQuiz(invalidInput)).rejects.toThrow(/foreign key constraint/i);
  });
});
