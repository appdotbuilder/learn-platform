
import { db } from '../db';
import { coursesTable } from '../db/schema';
import { type Course } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getCourses = async (): Promise<Course[]> => {
  try {
    const results = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.is_published, true))
      .orderBy(asc(coursesTable.category), asc(coursesTable.order_index))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    throw error;
  }
};
