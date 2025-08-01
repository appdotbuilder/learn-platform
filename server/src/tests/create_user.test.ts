
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'testpassword123',
  first_name: 'John',
  last_name: 'Doe',
  avatar_url: 'https://example.com/avatar.jpg'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.password_hash).toEqual('hashed_testpassword123');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.is_active).toBe(true);
    expect(result.last_login).toBeNull();
    expect(result.current_streak).toEqual(0);
    expect(result.longest_streak).toEqual(0);
  });

  it('should create a user without optional avatar_url', async () => {
    const inputWithoutAvatar = {
      ...testInput,
      avatar_url: undefined
    };

    const result = await createUser(inputWithoutAvatar);

    expect(result.email).toEqual('test@example.com');
    expect(result.avatar_url).toBeNull();
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].first_name).toEqual('John');
    expect(users[0].last_name).toEqual('Doe');
    expect(users[0].password_hash).toEqual('hashed_testpassword123');
    expect(users[0].is_active).toBe(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email
    const duplicateInput = {
      ...testInput,
      first_name: 'Jane'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should hash the password', async () => {
    const result = await createUser(testInput);

    // Password should be hashed, not stored in plain text
    expect(result.password_hash).not.toEqual(testInput.password);
    expect(result.password_hash).toEqual('hashed_testpassword123');
  });
});
