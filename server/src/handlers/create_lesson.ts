
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type CreateLessonInput, type Lesson } from '../schema';

export const createLesson = async (input: CreateLessonInput): Promise<Lesson> => {
  try {
    // Insert lesson record
    const result = await db.insert(lessonsTable)
      .values({
        course_id: input.course_id,
        title: input.title,
        description: input.description,
        slug: input.slug,
        video_url: input.video_url || null,
        video_duration: input.video_duration || null,
        text_content: input.text_content || null,
        code_examples: input.code_examples || null,
        order_index: input.order_index,
        is_published: false // Default to unpublished
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Lesson creation failed:', error);
    throw error;
  }
};
