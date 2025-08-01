
import { db } from '../db';
import { quizAttemptsTable } from '../db/schema';
import { type QuizAttempt } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export const getQuizAttempts = async (userId: number, quizId?: number): Promise<QuizAttempt[]> => {
  try {
    // Build conditions array
    const conditions = [eq(quizAttemptsTable.user_id, userId)];
    
    if (quizId !== undefined) {
      conditions.push(eq(quizAttemptsTable.quiz_id, quizId));
    }

    // Build and execute query in one chain
    const results = await db.select()
      .from(quizAttemptsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(quizAttemptsTable.attempted_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get quiz attempts:', error);
    throw error;
  }
};
