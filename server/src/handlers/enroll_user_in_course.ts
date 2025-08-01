
import { db } from '../db';
import { userEnrollmentsTable, usersTable, coursesTable } from '../db/schema';
import { type EnrollUserInput, type UserEnrollment } from '../schema';
import { eq, and } from 'drizzle-orm';

export const enrollUserInCourse = async (input: EnrollUserInput): Promise<UserEnrollment> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (!user.length) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Verify course exists
    const course = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, input.course_id))
      .execute();

    if (!course.length) {
      throw new Error(`Course with id ${input.course_id} not found`);
    }

    // Check if user is already enrolled
    const existingEnrollment = await db.select()
      .from(userEnrollmentsTable)
      .where(
        and(
          eq(userEnrollmentsTable.user_id, input.user_id),
          eq(userEnrollmentsTable.course_id, input.course_id)
        )
      )
      .execute();

    if (existingEnrollment.length > 0) {
      throw new Error('User is already enrolled in this course');
    }

    // Create enrollment record
    const result = await db.insert(userEnrollmentsTable)
      .values({
        user_id: input.user_id,
        course_id: input.course_id,
        progress_percentage: 0,
        is_completed: false
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User enrollment failed:', error);
    throw error;
  }
};
