import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, quizzesTable, userEnrollmentsTable } from '../db/schema';
import { seedDatabase } from '../handlers/seed_database';
import { eq } from 'drizzle-orm';

describe('seedDatabase', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create demo user with correct credentials', async () => {
    await seedDatabase();

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, 'demo@example.com'))
      .execute();

    expect(users).toHaveLength(1);
    const user = users[0];
    
    expect(user.email).toEqual('demo@example.com');
    expect(user.password_hash).toEqual('hashed_password123');
    expect(user.first_name).toEqual('Demo');
    expect(user.last_name).toEqual('User');
    expect(user.is_active).toBe(true);
    expect(user.current_streak).toEqual(0);
    expect(user.longest_streak).toEqual(0);
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });

  it('should create sample course with correct properties', async () => {
    await seedDatabase();

    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.slug, 'introduction-to-learning'))
      .execute();

    expect(courses).toHaveLength(1);
    const course = courses[0];
    
    expect(course.title).toEqual('Introduction to Learning');
    expect(course.description).toContain('comprehensive course');
    expect(course.slug).toEqual('introduction-to-learning');
    expect(course.difficulty).toEqual('beginner');
    expect(course.estimated_duration).toEqual(60);
    expect(course.is_published).toBe(true);
    expect(course.category).toEqual('Getting Started');
    expect(course.order_index).toEqual(0);
    expect(course.created_at).toBeInstanceOf(Date);
    expect(course.updated_at).toBeInstanceOf(Date);
  });

  it('should create two sample lessons for the course', async () => {
    await seedDatabase();

    const course = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.slug, 'introduction-to-learning'))
      .execute();

    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.course_id, course[0].id))
      .execute();

    expect(lessons).toHaveLength(2);

    // Check first lesson
    const lesson1 = lessons.find(l => l.order_index === 0);
    expect(lesson1).toBeDefined();
    expect(lesson1!.title).toEqual('Welcome to the Platform');
    expect(lesson1!.description).toContain('Get familiar with');
    expect(lesson1!.slug).toEqual('welcome-to-the-platform');
    expect(lesson1!.video_url).toEqual('https://example.com/videos/welcome.mp4');
    expect(lesson1!.video_duration).toEqual(300);
    expect(lesson1!.text_content).toContain('Welcome to our learning platform');
    expect(lesson1!.code_examples).toBeNull();
    expect(lesson1!.is_published).toBe(true);

    // Check second lesson
    const lesson2 = lessons.find(l => l.order_index === 1);
    expect(lesson2).toBeDefined();
    expect(lesson2!.title).toEqual('How to Complete Lessons');
    expect(lesson2!.description).toContain('Learn the process');
    expect(lesson2!.slug).toEqual('how-to-complete-lessons');
    expect(lesson2!.video_url).toEqual('https://example.com/videos/complete-lessons.mp4');
    expect(lesson2!.video_duration).toEqual(480);
    expect(lesson2!.text_content).toContain('Completing lessons is simple');
    expect(lesson2!.code_examples).toContain('console.log');
    expect(lesson2!.is_published).toBe(true);
  });

  it('should create a quiz for the second lesson', async () => {
    await seedDatabase();

    const course = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.slug, 'introduction-to-learning'))
      .execute();

    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.course_id, course[0].id))
      .execute();

    const lesson2 = lessons.find(l => l.order_index === 1);
    
    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.lesson_id, lesson2!.id))
      .execute();

    expect(quizzes).toHaveLength(1);
    const quiz = quizzes[0];
    
    expect(quiz.title).toEqual('Lesson Completion Quiz');
    expect(quiz.passing_score).toEqual(70);
    expect(quiz.created_at).toBeInstanceOf(Date);
    expect(quiz.updated_at).toBeInstanceOf(Date);

    // Parse and check questions
    const questions = JSON.parse(quiz.questions);
    expect(questions).toHaveLength(2);
    expect(questions[0].question).toContain('after watching a lesson video');
    expect(questions[1].question).toContain('track your progress');
    expect(questions[0].correct_answer).toEqual(1);
    expect(questions[1].correct_answer).toEqual(1);
  });

  it('should enroll demo user in the sample course', async () => {
    await seedDatabase();

    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, 'demo@example.com'))
      .execute();

    const course = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.slug, 'introduction-to-learning'))
      .execute();

    const enrollments = await db.select()
      .from(userEnrollmentsTable)
      .where(eq(userEnrollmentsTable.user_id, user[0].id))
      .execute();

    expect(enrollments).toHaveLength(1);
    const enrollment = enrollments[0];
    
    expect(enrollment.user_id).toEqual(user[0].id);
    expect(enrollment.course_id).toEqual(course[0].id);
    expect(enrollment.progress_percentage).toEqual(0);
    expect(enrollment.is_completed).toBe(false);
    expect(enrollment.completed_at).toBeNull();
    expect(enrollment.enrolled_at).toBeInstanceOf(Date);
  });

  it('should handle multiple seeding calls gracefully', async () => {
    // First seeding
    await seedDatabase();

    // Attempt second seeding - should not create duplicates due to unique constraints
    try {
      await seedDatabase();
      // If it doesn't throw, that's fine - the handler should handle duplicates gracefully
    } catch (error) {
      // If it throws due to unique constraint, that's expected behavior
      expect(error).toBeDefined();
    }

    // Verify only one demo user exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, 'demo@example.com'))
      .execute();

    expect(users).toHaveLength(1);
  });
});