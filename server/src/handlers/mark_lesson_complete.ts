
import { db } from '../db';
import { userProgressTable, usersTable, lessonsTable } from '../db/schema';
import { type MarkLessonCompleteInput, type UserProgress } from '../schema';
import { eq, and } from 'drizzle-orm';

export const markLessonComplete = async (input: MarkLessonCompleteInput): Promise<UserProgress> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Verify lesson exists
    const lesson = await db.select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, input.lesson_id))
      .execute();

    if (lesson.length === 0) {
      throw new Error(`Lesson with id ${input.lesson_id} not found`);
    }

    // Check if progress record already exists
    const existingProgress = await db.select()
      .from(userProgressTable)
      .where(and(
        eq(userProgressTable.user_id, input.user_id),
        eq(userProgressTable.lesson_id, input.lesson_id)
      ))
      .execute();

    let result;

    if (existingProgress.length > 0) {
      // Update existing progress record
      const updateResult = await db.update(userProgressTable)
        .set({
          is_completed: true,
          completed_at: new Date(),
          watch_time: input.watch_time || existingProgress[0].watch_time,
          updated_at: new Date()
        })
        .where(eq(userProgressTable.id, existingProgress[0].id))
        .returning()
        .execute();

      result = updateResult[0];
    } else {
      // Create new progress record
      const insertResult = await db.insert(userProgressTable)
        .values({
          user_id: input.user_id,
          lesson_id: input.lesson_id,
          is_completed: true,
          completed_at: new Date(),
          watch_time: input.watch_time || 0
        })
        .returning()
        .execute();

      result = insertResult[0];
    }

    return result;
  } catch (error) {
    console.error('Mark lesson complete failed:', error);
    throw error;
  }
};
