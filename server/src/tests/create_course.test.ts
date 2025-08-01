
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { coursesTable } from '../db/schema';
import { type CreateCourseInput } from '../schema';
import { createCourse } from '../handlers/create_course';
import { eq } from 'drizzle-orm';

const testInput: CreateCourseInput = {
  title: 'Test Course',
  description: 'A comprehensive test course for learning',
  slug: 'test-course',
  thumbnail_url: 'https://example.com/thumbnail.jpg',
  difficulty: 'beginner',
  estimated_duration: 120,
  category: 'Programming',
  order_index: 1
};

describe('createCourse', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a course with all fields', async () => {
    const result = await createCourse(testInput);

    expect(result.title).toEqual('Test Course');
    expect(result.description).toEqual(testInput.description);
    expect(result.slug).toEqual('test-course');
    expect(result.thumbnail_url).toEqual('https://example.com/thumbnail.jpg');
    expect(result.difficulty).toEqual('beginner');
    expect(result.estimated_duration).toEqual(120);
    expect(result.is_published).toEqual(false);
    expect(result.category).toEqual('Programming');
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save course to database', async () => {
    const result = await createCourse(testInput);

    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, result.id))
      .execute();

    expect(courses).toHaveLength(1);
    expect(courses[0].title).toEqual('Test Course');
    expect(courses[0].slug).toEqual('test-course');
    expect(courses[0].difficulty).toEqual('beginner');
    expect(courses[0].is_published).toEqual(false);
    expect(courses[0].created_at).toBeInstanceOf(Date);
  });

  it('should create course with nullable thumbnail_url', async () => {
    const inputWithoutThumbnail = {
      ...testInput,
      thumbnail_url: undefined
    };

    const result = await createCourse(inputWithoutThumbnail);

    expect(result.thumbnail_url).toBeNull();
    
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, result.id))
      .execute();

    expect(courses[0].thumbnail_url).toBeNull();
  });

  it('should handle different difficulty levels', async () => {
    const advancedInput = {
      ...testInput,
      difficulty: 'advanced' as const,
      slug: 'advanced-course'
    };

    const result = await createCourse(advancedInput);

    expect(result.difficulty).toEqual('advanced');
    
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, result.id))
      .execute();

    expect(courses[0].difficulty).toEqual('advanced');
  });

  it('should enforce unique slug constraint', async () => {
    await createCourse(testInput);

    const duplicateInput = {
      ...testInput,
      title: 'Different Title'
    };

    await expect(createCourse(duplicateInput)).rejects.toThrow(/duplicate key value/i);
  });
});
