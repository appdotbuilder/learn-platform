
import { db } from '../db';
import { userEnrollmentsTable } from '../db/schema';
import { type UserEnrollment } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserEnrollments = async (userId: number): Promise<UserEnrollment[]> => {
  try {
    const results = await db.select()
      .from(userEnrollmentsTable)
      .where(eq(userEnrollmentsTable.user_id, userId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get user enrollments:', error);
    throw error;
  }
};
