
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, userEnrollmentsTable } from '../db/schema';
import { getUserEnrollments } from '../handlers/get_user_enrollments';

describe('getUserEnrollments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no enrollments', async () => {
    // Create a user but no enrollments
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const result = await getUserEnrollments(user.id);

    expect(result).toEqual([]);
  });

  it('should return user enrollments with correct data', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create course
    const [course] = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        slug: 'test-course',
        difficulty: 'beginner',
        estimated_duration: 120,
        category: 'programming',
        order_index: 1
      })
      .returning()
      .execute();

    // Create enrollment
    const enrollmentDate = new Date();
    const lastAccessedDate = new Date();
    
    const [enrollment] = await db.insert(userEnrollmentsTable)
      .values({
        user_id: user.id,
        course_id: course.id,
        enrolled_at: enrollmentDate,
        progress_percentage: 45,
        last_accessed_at: lastAccessedDate,
        is_completed: false,
        completed_at: null
      })
      .returning()
      .execute();

    const result = await getUserEnrollments(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(enrollment.id);
    expect(result[0].user_id).toEqual(user.id);
    expect(result[0].course_id).toEqual(course.id);
    expect(result[0].enrolled_at).toBeInstanceOf(Date);
    expect(result[0].progress_percentage).toEqual(45);
    expect(result[0].last_accessed_at).toBeInstanceOf(Date);
    expect(result[0].is_completed).toEqual(false);
    expect(result[0].completed_at).toBeNull();
  });

  it('should return multiple enrollments for user', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create multiple courses
    const courses = await db.insert(coursesTable)
      .values([
        {
          title: 'Course 1',
          description: 'First course',
          slug: 'course-1',
          difficulty: 'beginner',
          estimated_duration: 120,
          category: 'programming',
          order_index: 1
        },
        {
          title: 'Course 2',
          description: 'Second course',
          slug: 'course-2',
          difficulty: 'intermediate',
          estimated_duration: 180,
          category: 'programming',
          order_index: 2
        }
      ])
      .returning()
      .execute();

    // Create multiple enrollments
    await db.insert(userEnrollmentsTable)
      .values([
        {
          user_id: user.id,
          course_id: courses[0].id,
          progress_percentage: 30,
          is_completed: false
        },
        {
          user_id: user.id,
          course_id: courses[1].id,
          progress_percentage: 100,
          is_completed: true,
          completed_at: new Date()
        }
      ])
      .execute();

    const result = await getUserEnrollments(user.id);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual(user.id);
    expect(result[1].user_id).toEqual(user.id);
    expect(result[0].course_id).toEqual(courses[0].id);
    expect(result[1].course_id).toEqual(courses[1].id);
  });

  it('should not return enrollments for other users', async () => {
    // Create two users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: 'hashedpassword',
          first_name: 'User',
          last_name: 'One'
        },
        {
          email: 'user2@example.com',
          password_hash: 'hashedpassword',
          first_name: 'User',
          last_name: 'Two'
        }
      ])
      .returning()
      .execute();

    // Create course
    const [course] = await db.insert(coursesTable)
      .values({
        title: 'Test Course',
        description: 'A test course',
        slug: 'test-course',
        difficulty: 'beginner',
        estimated_duration: 120,
        category: 'programming',
        order_index: 1
      })
      .returning()
      .execute();

    // Create enrollments for both users
    await db.insert(userEnrollmentsTable)
      .values([
        {
          user_id: users[0].id,
          course_id: course.id,
          progress_percentage: 30
        },
        {
          user_id: users[1].id,
          course_id: course.id,
          progress_percentage: 60
        }
      ])
      .execute();

    // Get enrollments for first user only
    const result = await getUserEnrollments(users[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(users[0].id);
    expect(result[0].progress_percentage).toEqual(30);
  });
});
