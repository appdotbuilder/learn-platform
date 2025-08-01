
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { coursesTable, lessonsTable } from '../db/schema';
import { getCourseLessons } from '../handlers/get_course_lessons';

describe('getCourseLessons', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return lessons for a specific course ordered by order_index', async () => {
    // Create a test course
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

    const courseId = courseResult[0].id;

    // Create test lessons with different order_index values
    await db.insert(lessonsTable)
      .values([
        {
          course_id: courseId,
          title: 'Third Lesson',
          description: 'The third lesson',
          slug: 'third-lesson',
          order_index: 2,
          is_published: true
        },
        {
          course_id: courseId,
          title: 'First Lesson',
          description: 'The first lesson',
          slug: 'first-lesson',
          order_index: 0,
          is_published: true
        },
        {
          course_id: courseId,
          title: 'Second Lesson',
          description: 'The second lesson',
          slug: 'second-lesson',
          order_index: 1,
          is_published: true
        }
      ])
      .execute();

    const result = await getCourseLessons(courseId);

    expect(result).toHaveLength(3);
    
    // Verify lessons are ordered by order_index
    expect(result[0].title).toEqual('First Lesson');
    expect(result[0].order_index).toEqual(0);
    expect(result[1].title).toEqual('Second Lesson');
    expect(result[1].order_index).toEqual(1);
    expect(result[2].title).toEqual('Third Lesson');
    expect(result[2].order_index).toEqual(2);

    // Verify all lessons belong to the correct course
    result.forEach(lesson => {
      expect(lesson.course_id).toEqual(courseId);
      expect(lesson.created_at).toBeInstanceOf(Date);
      expect(lesson.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when course has no lessons', async () => {
    // Create a course with no lessons
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Empty Course',
        description: 'A course with no lessons',
        slug: 'empty-course',
        difficulty: 'beginner',
        estimated_duration: 60,
        category: 'programming',
        order_index: 0
      })
      .returning()
      .execute();

    const result = await getCourseLessons(courseResult[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return lessons including both published and unpublished', async () => {
    // Create a test course
    const courseResult = await db.insert(coursesTable)
      .values({
        title: 'Mixed Course',
        description: 'Course with mixed lesson states',
        slug: 'mixed-course',
        difficulty: 'intermediate',
        estimated_duration: 180,
        category: 'programming',
        order_index: 0
      })
      .returning()
      .execute();

    const courseId = courseResult[0].id;

    // Create lessons with different published states
    await db.insert(lessonsTable)
      .values([
        {
          course_id: courseId,
          title: 'Published Lesson',
          description: 'A published lesson',
          slug: 'published-lesson',
          order_index: 0,
          is_published: true
        },
        {
          course_id: courseId,
          title: 'Unpublished Lesson',
          description: 'An unpublished lesson',
          slug: 'unpublished-lesson',
          order_index: 1,
          is_published: false
        }
      ])
      .execute();

    const result = await getCourseLessons(courseId);

    expect(result).toHaveLength(2);
    expect(result[0].is_published).toBe(true);
    expect(result[1].is_published).toBe(false);
  });

  it('should not return lessons from other courses', async () => {
    // Create two test courses
    const course1Result = await db.insert(coursesTable)
      .values({
        title: 'Course 1',
        description: 'First course',
        slug: 'course-1',
        difficulty: 'beginner',
        estimated_duration: 120,
        category: 'programming',
        order_index: 0
      })
      .returning()
      .execute();

    const course2Result = await db.insert(coursesTable)
      .values({
        title: 'Course 2',
        description: 'Second course',
        slug: 'course-2',
        difficulty: 'advanced',
        estimated_duration: 240,
        category: 'programming',
        order_index: 1
      })
      .returning()
      .execute();

    const course1Id = course1Result[0].id;
    const course2Id = course2Result[0].id;

    // Create lessons for both courses
    await db.insert(lessonsTable)
      .values([
        {
          course_id: course1Id,
          title: 'Course 1 Lesson',
          description: 'Lesson for course 1',
          slug: 'course-1-lesson',
          order_index: 0,
          is_published: true
        },
        {
          course_id: course2Id,
          title: 'Course 2 Lesson',
          description: 'Lesson for course 2',
          slug: 'course-2-lesson',
          order_index: 0,
          is_published: true
        }
      ])
      .execute();

    const result = await getCourseLessons(course1Id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Course 1 Lesson');
    expect(result[0].course_id).toEqual(course1Id);
  });
});
