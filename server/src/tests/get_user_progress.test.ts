
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, userProgressTable } from '../db/schema';
import { getUserProgress } from '../handlers/get_user_progress';

describe('getUserProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all user progress when no courseId provided', async () => {
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
    const userId = userResult[0].id;

    // Create test courses
    const courseResults = await db.insert(coursesTable)
      .values([
        {
          title: 'Course 1',
          description: 'First course',
          slug: 'course-1',
          difficulty: 'beginner',
          estimated_duration: 60,
          category: 'programming',
          order_index: 1
        },
        {
          title: 'Course 2',
          description: 'Second course',
          slug: 'course-2',
          difficulty: 'intermediate',
          estimated_duration: 120,
          category: 'programming',
          order_index: 2
        }
      ])
      .returning()
      .execute();

    // Create test lessons
    const lessonResults = await db.insert(lessonsTable)
      .values([
        {
          course_id: courseResults[0].id,
          title: 'Lesson 1',
          description: 'First lesson',
          slug: 'lesson-1',
          order_index: 1
        },
        {
          course_id: courseResults[1].id,
          title: 'Lesson 2',
          description: 'Second lesson',
          slug: 'lesson-2',
          order_index: 1
        }
      ])
      .returning()
      .execute();

    // Create user progress records
    await db.insert(userProgressTable)
      .values([
        {
          user_id: userId,
          lesson_id: lessonResults[0].id,
          is_completed: true,
          completed_at: new Date(),
          watch_time: 300
        },
        {
          user_id: userId,
          lesson_id: lessonResults[1].id,
          is_completed: false,
          watch_time: 150
        }
      ])
      .execute();

    const result = await getUserProgress(userId);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].lesson_id).toEqual(lessonResults[0].id);
    expect(result[0].is_completed).toBe(true);
    expect(result[0].watch_time).toEqual(300);
    expect(result[0].completed_at).toBeInstanceOf(Date);
    
    expect(result[1].user_id).toEqual(userId);
    expect(result[1].lesson_id).toEqual(lessonResults[1].id);
    expect(result[1].is_completed).toBe(false);
    expect(result[1].watch_time).toEqual(150);
    expect(result[1].completed_at).toBeNull();
  });

  it('should return progress for specific course when courseId provided', async () => {
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
    const userId = userResult[0].id;

    // Create test courses
    const courseResults = await db.insert(coursesTable)
      .values([
        {
          title: 'Course 1',
          description: 'First course',
          slug: 'course-1',
          difficulty: 'beginner',
          estimated_duration: 60,
          category: 'programming',
          order_index: 1
        },
        {
          title: 'Course 2',
          description: 'Second course',
          slug: 'course-2',
          difficulty: 'intermediate',
          estimated_duration: 120,
          category: 'programming',
          order_index: 2
        }
      ])
      .returning()
      .execute();

    // Create test lessons for both courses
    const lessonResults = await db.insert(lessonsTable)
      .values([
        {
          course_id: courseResults[0].id,
          title: 'Course 1 Lesson 1',
          description: 'First lesson of course 1',
          slug: 'c1-lesson-1',
          order_index: 1
        },
        {
          course_id: courseResults[0].id,
          title: 'Course 1 Lesson 2',
          description: 'Second lesson of course 1',
          slug: 'c1-lesson-2',
          order_index: 2
        },
        {
          course_id: courseResults[1].id,
          title: 'Course 2 Lesson 1',
          description: 'First lesson of course 2',
          slug: 'c2-lesson-1',
          order_index: 1
        }
      ])
      .returning()
      .execute();

    // Create user progress records for all lessons
    await db.insert(userProgressTable)
      .values([
        {
          user_id: userId,
          lesson_id: lessonResults[0].id,
          is_completed: true,
          completed_at: new Date(),
          watch_time: 300
        },
        {
          user_id: userId,
          lesson_id: lessonResults[1].id,
          is_completed: false,
          watch_time: 150
        },
        {
          user_id: userId,
          lesson_id: lessonResults[2].id,
          is_completed: true,
          completed_at: new Date(),
          watch_time: 450
        }
      ])
      .execute();

    // Get progress for course 1 only
    const result = await getUserProgress(userId, courseResults[0].id);

    expect(result).toHaveLength(2);
    
    // Verify all returned progress belongs to course 1 lessons
    const course1LessonIds = [lessonResults[0].id, lessonResults[1].id];
    result.forEach(progress => {
      expect(course1LessonIds).toContain(progress.lesson_id);
      expect(progress.user_id).toEqual(userId);
    });

    // Verify specific progress records
    const completedProgress = result.find(p => p.is_completed);
    const incompleteProgress = result.find(p => !p.is_completed);
    
    expect(completedProgress).toBeDefined();
    expect(completedProgress!.watch_time).toEqual(300);
    expect(completedProgress!.completed_at).toBeInstanceOf(Date);
    
    expect(incompleteProgress).toBeDefined();
    expect(incompleteProgress!.watch_time).toEqual(150);
    expect(incompleteProgress!.completed_at).toBeNull();
  });

  it('should return empty array when user has no progress', async () => {
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
    const userId = userResult[0].id;

    const result = await getUserProgress(userId);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when user has no progress for specific course', async () => {
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
    const userId = userResult[0].id;

    // Create test course
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Empty Course',
        description: 'Course with no progress',
        slug: 'empty-course',
        difficulty: 'beginner',
        estimated_duration: 60,
        category: 'programming',
        order_index: 1
      })
      .returning()
      .execute();

    const result = await getUserProgress(userId, courseResult[0].id);

    expect(result).toHaveLength(0);
  });
});
