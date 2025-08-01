
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { coursesTable } from '../db/schema';
import { type CreateCourseInput } from '../schema';
import { getCourses } from '../handlers/get_courses';

// Test course data
const testCourse1: CreateCourseInput = {
  title: 'Advanced JavaScript',
  description: 'Master advanced JavaScript concepts',
  slug: 'advanced-js',
  thumbnail_url: 'https://example.com/thumb1.jpg',
  difficulty: 'advanced',
  estimated_duration: 480,
  category: 'Programming',
  order_index: 1
};

const testCourse2: CreateCourseInput = {
  title: 'Intro to Web Design',
  description: 'Learn the basics of web design',
  slug: 'intro-web-design',
  thumbnail_url: null,
  difficulty: 'beginner',
  estimated_duration: 240,
  category: 'Design',
  order_index: 0
};

const testCourse3: CreateCourseInput = {
  title: 'React Fundamentals',
  description: 'Build modern web apps with React',
  slug: 'react-fundamentals',
  thumbnail_url: 'https://example.com/thumb3.jpg',
  difficulty: 'intermediate',
  estimated_duration: 360,
  category: 'Programming',
  order_index: 0
};

describe('getCourses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no published courses exist', async () => {
    const result = await getCourses();
    expect(result).toEqual([]);
  });

  it('should return only published courses', async () => {
    // Create published course
    await db.insert(coursesTable)
      .values({
        ...testCourse1,
        is_published: true
      })
      .execute();

    // Create unpublished course
    await db.insert(coursesTable)
      .values({
        ...testCourse2,
        is_published: false
      })
      .execute();

    const result = await getCourses();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Advanced JavaScript');
    expect(result[0].is_published).toBe(true);
  });

  it('should return courses ordered by category then order_index', async () => {
    // Insert courses in random order
    await db.insert(coursesTable)
      .values([
        { ...testCourse1, is_published: true }, // Programming, order_index: 1
        { ...testCourse2, is_published: true }, // Design, order_index: 0
        { ...testCourse3, is_published: true }  // Programming, order_index: 0
      ])
      .execute();

    const result = await getCourses();

    expect(result).toHaveLength(3);
    
    // Should be ordered by category (Design first, then Programming)
    // Within Programming category, order_index 0 should come before 1
    expect(result[0].category).toEqual('Design');
    expect(result[0].title).toEqual('Intro to Web Design');
    
    expect(result[1].category).toEqual('Programming');
    expect(result[1].title).toEqual('React Fundamentals');
    expect(result[1].order_index).toEqual(0);
    
    expect(result[2].category).toEqual('Programming');
    expect(result[2].title).toEqual('Advanced JavaScript');
    expect(result[2].order_index).toEqual(1);
  });

  it('should return courses with all expected fields', async () => {
    await db.insert(coursesTable)
      .values({
        ...testCourse1,
        is_published: true
      })
      .execute();

    const result = await getCourses();

    expect(result).toHaveLength(1);
    const course = result[0];

    expect(course.id).toBeDefined();
    expect(course.title).toEqual('Advanced JavaScript');
    expect(course.description).toEqual('Master advanced JavaScript concepts');
    expect(course.slug).toEqual('advanced-js');
    expect(course.thumbnail_url).toEqual('https://example.com/thumb1.jpg');
    expect(course.difficulty).toEqual('advanced');
    expect(course.estimated_duration).toEqual(480);
    expect(course.is_published).toBe(true);
    expect(course.category).toEqual('Programming');
    expect(course.created_at).toBeInstanceOf(Date);
    expect(course.updated_at).toBeInstanceOf(Date);
    expect(course.order_index).toEqual(1);
  });

  it('should handle courses with null thumbnail_url', async () => {
    await db.insert(coursesTable)
      .values({
        ...testCourse2,
        is_published: true
      })
      .execute();

    const result = await getCourses();

    expect(result).toHaveLength(1);
    expect(result[0].thumbnail_url).toBeNull();
  });
});
