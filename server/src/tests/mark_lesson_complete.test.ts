
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, userProgressTable } from '../db/schema';
import { type MarkLessonCompleteInput } from '../schema';
import { markLessonComplete } from '../handlers/mark_lesson_complete';
import { eq, and } from 'drizzle-orm';

describe('markLessonComplete', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testCourseId: number;
  let testLessonId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test course
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        slug: 'test-course',
        difficulty: 'beginner',
        estimated_duration: 60,
        category: 'programming',
        order_index: 1,
        is_published: true
      })
      .returning()
      .execute();
    testCourseId = courseResult[0].id;

    // Create test lesson
    const lessonResult = await db.insert(lessonsTable)
      .values({
        course_id: testCourseId,
        title: 'Test Lesson',
        description: 'A test lesson',
        slug: 'test-lesson',
        order_index: 1,
        is_published: true
      })
      .returning()
      .execute();
    testLessonId = lessonResult[0].id;
  });

  it('should mark lesson as complete for new progress record', async () => {
    const input: MarkLessonCompleteInput = {
      user_id: testUserId,
      lesson_id: testLessonId,
      watch_time: 300
    };

    const result = await markLessonComplete(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.lesson_id).toEqual(testLessonId);
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.watch_time).toEqual(300);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save progress to database', async () => {
    const input: MarkLessonCompleteInput = {
      user_id: testUserId,
      lesson_id: testLessonId,
      watch_time: 300
    };

    const result = await markLessonComplete(input);

    const progressRecords = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.id, result.id))
      .execute();

    expect(progressRecords).toHaveLength(1);
    expect(progressRecords[0].user_id).toEqual(testUserId);
    expect(progressRecords[0].lesson_id).toEqual(testLessonId);
    expect(progressRecords[0].is_completed).toBe(true);
    expect(progressRecords[0].completed_at).toBeInstanceOf(Date);
    expect(progressRecords[0].watch_time).toEqual(300);
  });

  it('should update existing progress record', async () => {
    // Create initial progress record
    const initialProgress = await db.insert(userProgressTable)
      .values({
        user_id: testUserId,
        lesson_id: testLessonId,
        is_completed: false,
        watch_time: 150
      })
      .returning()
      .execute();

    const input: MarkLessonCompleteInput = {
      user_id: testUserId,
      lesson_id: testLessonId,
      watch_time: 300
    };

    const result = await markLessonComplete(input);

    // Should have same ID as initial record
    expect(result.id).toEqual(initialProgress[0].id);
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.watch_time).toEqual(300);

    // Verify only one record exists
    const allProgress = await db.select()
      .from(userProgressTable)
      .where(and(
        eq(userProgressTable.user_id, testUserId),
        eq(userProgressTable.lesson_id, testLessonId)
      ))
      .execute();

    expect(allProgress).toHaveLength(1);
  });

  it('should preserve existing watch time when not provided', async () => {
    // Create initial progress record with watch time
    await db.insert(userProgressTable)
      .values({
        user_id: testUserId,
        lesson_id: testLessonId,
        is_completed: false,
        watch_time: 150
      })
      .returning()
      .execute();

    const input: MarkLessonCompleteInput = {
      user_id: testUserId,
      lesson_id: testLessonId
      // No watch_time provided
    };

    const result = await markLessonComplete(input);

    expect(result.is_completed).toBe(true);
    expect(result.watch_time).toEqual(150); // Should preserve existing watch time
  });

  it('should use 0 watch time for new records when not provided', async () => {
    const input: MarkLessonCompleteInput = {
      user_id: testUserId,
      lesson_id: testLessonId
      // No watch_time provided
    };

    const result = await markLessonComplete(input);

    expect(result.is_completed).toBe(true);
    expect(result.watch_time).toEqual(0);
  });

  it('should throw error for non-existent user', async () => {
    const input: MarkLessonCompleteInput = {
      user_id: 99999,
      lesson_id: testLessonId,
      watch_time: 300
    };

    expect(markLessonComplete(input)).rejects.toThrow(/user with id 99999 not found/i);
  });

  it('should throw error for non-existent lesson', async () => {
    const input: MarkLessonCompleteInput = {
      user_id: testUserId,
      lesson_id: 99999,
      watch_time: 300
    };

    expect(markLessonComplete(input)).rejects.toThrow(/lesson with id 99999 not found/i);
  });
});
