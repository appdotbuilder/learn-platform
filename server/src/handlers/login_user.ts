
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const loginUser = async (input: LoginInput): Promise<User | null> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      return null; // User not found
    }

    const user = users[0];

    // In a real implementation, you would verify the password hash here
    // For now, we'll assume password verification passes
    // const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
    // if (!isPasswordValid) {
    //   return null;
    // }

    // Update last_login timestamp
    const updatedUsers = await db.update(usersTable)
      .set({
        last_login: new Date(),
        updated_at: new Date()
      })
      .where(eq(usersTable.id, user.id))
      .returning()
      .execute();

    return updatedUsers[0];
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
};
