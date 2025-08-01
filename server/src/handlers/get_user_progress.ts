
import { db } from '../db';
import { userProgressTable, lessonsTable } from '../db/schema';
import { type UserProgress } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getUserProgress = async (userId: number, courseId?: number): Promise<UserProgress[]> => {
  try {
    if (courseId !== undefined) {
      // Query with join to filter by course
      const results = await db.select()
        .from(userProgressTable)
        .innerJoin(
          lessonsTable,
          eq(userProgressTable.lesson_id, lessonsTable.id)
        )
        .where(and(
          eq(userProgressTable.user_id, userId),
          eq(lessonsTable.course_id, courseId)
        ))
        .execute();

      return results.map(result => result.user_progress);
    } else {
      // Simple query without join
      const results = await db.select()
        .from(userProgressTable)
        .where(eq(userProgressTable.user_id, userId))
        .execute();

      return results;
    }
  } catch (error) {
    console.error('Failed to get user progress:', error);
    throw error;
  }
};
