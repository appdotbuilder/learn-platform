
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type CreateUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  password: 'testpassword123',
  first_name: 'John',
  last_name: 'Doe',
  avatar_url: 'https://example.com/avatar.jpg'
};

const loginInput: LoginInput = {
  email: 'test@example.com',
  password: 'testpassword123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user data when email exists', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        avatar_url: testUser.avatar_url
      })
      .execute();

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('test@example.com');
    expect(result!.first_name).toEqual('John');
    expect(result!.last_name).toEqual('Doe');
    expect(result!.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result!.is_active).toBe(true);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.last_login).toBeInstanceOf(Date);
  });

  it('should return null for non-existent email', async () => {
    const result = await loginUser({
      email: 'nonexistent@example.com',
      password: 'anypassword'
    });

    expect(result).toBeNull();
  });

  it('should update last_login timestamp', async () => {
    // Create test user
    const insertResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        avatar_url: testUser.avatar_url,
        last_login: null
      })
      .returning()
      .execute();

    const originalUser = insertResult[0];
    expect(originalUser.last_login).toBeNull();

    // Login user
    const loginResult = await loginUser(loginInput);

    // Verify last_login was updated
    expect(loginResult).not.toBeNull();
    expect(loginResult!.last_login).toBeInstanceOf(Date);
    expect(loginResult!.last_login).not.toBeNull();

    // Verify in database
    const dbUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, originalUser.id))
      .execute();

    expect(dbUsers[0].last_login).toBeInstanceOf(Date);
    expect(dbUsers[0].last_login).not.toBeNull();
  });

  it('should update updated_at timestamp on login', async () => {
    // Create test user
    const insertResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        avatar_url: testUser.avatar_url
      })
      .returning()
      .execute();

    const originalUpdatedAt = insertResult[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Login user
    const loginResult = await loginUser(loginInput);

    expect(loginResult).not.toBeNull();
    expect(loginResult!.updated_at).toBeInstanceOf(Date);
    expect(loginResult!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should preserve user streak data', async () => {
    // Create test user with streak data
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        avatar_url: testUser.avatar_url,
        current_streak: 7,
        longest_streak: 15
      })
      .execute();

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.current_streak).toEqual(7);
    expect(result!.longest_streak).toEqual(15);
  });
});
