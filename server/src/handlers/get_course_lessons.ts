
import { db } from '../db';
import { lessonsTable } from '../db/schema';
import { type Lesson } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getCourseLessons = async (courseId: number): Promise<Lesson[]> => {
  try {
    const results = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.course_id, courseId))
      .orderBy(asc(lessonsTable.order_index))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch course lessons:', error);
    throw error;
  }
};
