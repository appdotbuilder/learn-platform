
import { db } from '../db';
import { coursesTable } from '../db/schema';
import { type CreateCourseInput, type Course } from '../schema';

export const createCourse = async (input: CreateCourseInput): Promise<Course> => {
  try {
    const result = await db.insert(coursesTable)
      .values({
        title: input.title,
        description: input.description,
        slug: input.slug,
        thumbnail_url: input.thumbnail_url || null,
        difficulty: input.difficulty,
        estimated_duration: input.estimated_duration,
        is_published: false, // Default to unpublished
        category: input.category,
        order_index: input.order_index
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Course creation failed:', error);
    throw error;
  }
};
