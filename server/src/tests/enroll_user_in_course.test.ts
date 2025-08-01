
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, userEnrollmentsTable } from '../db/schema';
import { type EnrollUserInput } from '../schema';
import { enrollUserInCourse } from '../handlers/enroll_user_in_course';
import { eq, and } from 'drizzle-orm';

describe('enrollUserInCourse', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should enroll a user in a course', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create test course
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        slug: 'test-course',
        difficulty: 'beginner',
        estimated_duration: 120,
        category: 'Programming',
        order_index: 1
      })
      .returning()
      .execute();

    const testInput: EnrollUserInput = {
      user_id: userResult[0].id,
      course_id: courseResult[0].id
    };

    const result = await enrollUserInCourse(testInput);

    // Verify enrollment record
    expect(result.user_id).toEqual(testInput.user_id);
    expect(result.course_id).toEqual(testInput.course_id);
    expect(result.progress_percentage).toEqual(0);
    expect(result.is_completed).toEqual(false);
    expect(result.completed_at).toBeNull();
    expect(result.last_accessed_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.enrolled_at).toBeInstanceOf(Date);
  });

  it('should save enrollment to database', async () => {
    // Create test user and course
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        slug: 'test-course',
        difficulty: 'beginner',
        estimated_duration: 120,
        category: 'Programming',
        order_index: 1
      })
      .returning()
      .execute();

    const testInput: EnrollUserInput = {
      user_id: userResult[0].id,
      course_id: courseResult[0].id
    };

    const result = await enrollUserInCourse(testInput);

    // Query database to verify enrollment was saved
    const enrollments = await db.select()
      .from(userEnrollmentsTable)
      .where(eq(userEnrollmentsTable.id, result.id))
      .execute();

    expect(enrollments).toHaveLength(1);
    expect(enrollments[0].user_id).toEqual(testInput.user_id);
    expect(enrollments[0].course_id).toEqual(testInput.course_id);
    expect(enrollments[0].progress_percentage).toEqual(0);
    expect(enrollments[0].is_completed).toEqual(false);
    expect(enrollments[0].enrolled_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    // Create test course only
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        slug: 'test-course',
        difficulty: 'beginner',
        estimated_duration: 120,
        category: 'Programming',
        order_index: 1
      })
      .returning()
      .execute();

    const testInput: EnrollUserInput = {
      user_id: 999, // Non-existent user
      course_id: courseResult[0].id
    };

    await expect(enrollUserInCourse(testInput)).rejects.toThrow(/user with id 999 not found/i);
  });

  it('should throw error when course does not exist', async () => {
    // Create test user only
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const testInput: EnrollUserInput = {
      user_id: userResult[0].id,
      course_id: 999 // Non-existent course
    };

    await expect(enrollUserInCourse(testInput)).rejects.toThrow(/course with id 999 not found/i);
  });

  it('should throw error when user is already enrolled', async () => {
    // Create test user and course
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        slug: 'test-course',
        difficulty: 'beginner',
        estimated_duration: 120,
        category: 'Programming',
        order_index: 1
      })
      .returning()
      .execute();

    const testInput: EnrollUserInput = {
      user_id: userResult[0].id,
      course_id: courseResult[0].id
    };

    // First enrollment should succeed
    await enrollUserInCourse(testInput);

    // Second enrollment should fail
    await expect(enrollUserInCourse(testInput)).rejects.toThrow(/user is already enrolled in this course/i);
  });

  it('should handle multiple users enrolled in different courses', async () => {
    // Create multiple users and courses
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        first_name: 'User',
        last_name: 'One'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        first_name: 'User',
        last_name: 'Two'
      })
      .returning()
      .execute();

    const course1Result = await db.insert(coursesTable)
      .values({
        title: 'Course One',
        description: 'First test course',
        slug: 'course-one',
        difficulty: 'beginner',
        estimated_duration: 120,
        category: 'Programming',
        order_index: 1
      })
      .returning()
      .execute();

    const course2Result = await db.insert(coursesTable)
      .values({
        title: 'Course Two',
        description: 'Second test course',
        slug: 'course-two',
        difficulty: 'intermediate',
        estimated_duration: 180,
        category: 'Design',
        order_index: 2
      })
      .returning()
      .execute();

    // Enroll user1 in course1 and user2 in course2
    const enrollment1 = await enrollUserInCourse({
      user_id: user1Result[0].id,
      course_id: course1Result[0].id
    });

    const enrollment2 = await enrollUserInCourse({
      user_id: user2Result[0].id,
      course_id: course2Result[0].id
    });

    // Verify both enrollments exist in database
    const allEnrollments = await db.select()
      .from(userEnrollmentsTable)
      .execute();

    expect(allEnrollments).toHaveLength(2);
    expect(allEnrollments.some(e => e.id === enrollment1.id)).toBe(true);
    expect(allEnrollments.some(e => e.id === enrollment2.id)).toBe(true);
  });
});
