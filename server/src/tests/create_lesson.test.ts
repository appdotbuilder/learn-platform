
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { lessonsTable, coursesTable } from '../db/schema';
import { type CreateLessonInput } from '../schema';
import { createLesson } from '../handlers/create_lesson';
import { eq } from 'drizzle-orm';

// Test course to satisfy foreign key constraint
const testCourse = {
  title: 'Test Course',
  description: 'A course for testing',
  slug: 'test-course',
  thumbnail_url: null,
  difficulty: 'beginner' as const,
  estimated_duration: 60,
  category: 'Programming',
  order_index: 0
};

// Simple test input
const testInput: CreateLessonInput = {
  course_id: 1, // Will be set after creating course
  title: 'Test Lesson',
  description: 'A lesson for testing',
  slug: 'test-lesson',
  video_url: 'https://example.com/video.mp4',
  video_duration: 300,
  text_content: 'This is test content',
  code_examples: '{"example": "console.log(\'hello\')"}',
  order_index: 0
};

describe('createLesson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a lesson', async () => {
    // Create prerequisite course first
    const courseResult = await db.insert(coursesTable)
      .values(testCourse)
      .returning()
      .execute();
    
    const courseId = courseResult[0].id;
    const input = { ...testInput, course_id: courseId };

    const result = await createLesson(input);

    // Basic field validation
    expect(result.course_id).toEqual(courseId);
    expect(result.title).toEqual('Test Lesson');
    expect(result.description).toEqual(input.description);
    expect(result.slug).toEqual('test-lesson');
    expect(result.video_url).toEqual('https://example.com/video.mp4');
    expect(result.video_duration).toEqual(300);
    expect(result.text_content).toEqual('This is test content');
    expect(result.code_examples).toEqual('{"example": "console.log(\'hello\')"}');
    expect(result.order_index).toEqual(0);
    expect(result.is_published).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save lesson to database', async () => {
    // Create prerequisite course first
    const courseResult = await db.insert(coursesTable)
      .values(testCourse)
      .returning()
      .execute();
    
    const courseId = courseResult[0].id;
    const input = { ...testInput, course_id: courseId };

    const result = await createLesson(input);

    // Query using proper drizzle syntax
    const lessons = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, result.id))
      .execute();

    expect(lessons).toHaveLength(1);
    expect(lessons[0].course_id).toEqual(courseId);
    expect(lessons[0].title).toEqual('Test Lesson');
    expect(lessons[0].description).toEqual(input.description);
    expect(lessons[0].slug).toEqual('test-lesson');
    expect(lessons[0].video_url).toEqual('https://example.com/video.mp4');
    expect(lessons[0].video_duration).toEqual(300);
    expect(lessons[0].text_content).toEqual('This is test content');
    expect(lessons[0].code_examples).toEqual('{"example": "console.log(\'hello\')"}');
    expect(lessons[0].order_index).toEqual(0);
    expect(lessons[0].is_published).toEqual(false);
    expect(lessons[0].created_at).toBeInstanceOf(Date);
    expect(lessons[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle optional fields as null', async () => {
    // Create prerequisite course first
    const courseResult = await db.insert(coursesTable)
      .values(testCourse)
      .returning()
      .execute();
    
    const courseId = courseResult[0].id;
    
    // Test input with minimal required fields
    const minimalInput: CreateLessonInput = {
      course_id: courseId,
      title: 'Minimal Lesson',
      description: 'A minimal lesson',
      slug: 'minimal-lesson',
      order_index: 1
    };

    const result = await createLesson(minimalInput);

    expect(result.video_url).toBeNull();
    expect(result.video_duration).toBeNull();
    expect(result.text_content).toBeNull();
    expect(result.code_examples).toBeNull();
    expect(result.title).toEqual('Minimal Lesson');
    expect(result.order_index).toEqual(1);
  });

  it('should fail with invalid course_id', async () => {
    const input = { ...testInput, course_id: 999 }; // Non-existent course

    await expect(createLesson(input)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
