
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const difficultyEnum = pgEnum('difficulty', ['beginner', 'intermediate', 'advanced']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  last_login: timestamp('last_login'),
  current_streak: integer('current_streak').default(0).notNull(),
  longest_streak: integer('longest_streak').default(0).notNull()
});

// Courses table
export const coursesTable = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  slug: text('slug').notNull().unique(),
  thumbnail_url: text('thumbnail_url'),
  difficulty: difficultyEnum('difficulty').notNull(),
  estimated_duration: integer('estimated_duration').notNull(), // in minutes
  is_published: boolean('is_published').default(false).notNull(),
  category: text('category').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  order_index: integer('order_index').default(0).notNull()
});

// Lessons table
export const lessonsTable = pgTable('lessons', {
  id: serial('id').primaryKey(),
  course_id: integer('course_id').notNull().references(() => coursesTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  slug: text('slug').notNull(),
  video_url: text('video_url'),
  video_duration: integer('video_duration'), // in seconds
  text_content: text('text_content'),
  code_examples: text('code_examples'), // JSON string
  order_index: integer('order_index').default(0).notNull(),
  is_published: boolean('is_published').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Quizzes table
export const quizzesTable = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  lesson_id: integer('lesson_id').notNull().references(() => lessonsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  questions: text('questions').notNull(), // JSON string containing quiz questions
  passing_score: integer('passing_score').notNull(), // percentage required to pass
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// User progress table
export const userProgressTable = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  lesson_id: integer('lesson_id').notNull().references(() => lessonsTable.id, { onDelete: 'cascade' }),
  is_completed: boolean('is_completed').default(false).notNull(),
  completed_at: timestamp('completed_at'),
  watch_time: integer('watch_time').default(0).notNull(), // in seconds
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Quiz attempts table
export const quizAttemptsTable = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  quiz_id: integer('quiz_id').notNull().references(() => quizzesTable.id, { onDelete: 'cascade' }),
  answers: text('answers').notNull(), // JSON string containing user answers
  score: integer('score').notNull(), // percentage score
  is_passed: boolean('is_passed').default(false).notNull(),
  attempted_at: timestamp('attempted_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at')
});

// User enrollments table
export const userEnrollmentsTable = pgTable('user_enrollments', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  course_id: integer('course_id').notNull().references(() => coursesTable.id, { onDelete: 'cascade' }),
  enrolled_at: timestamp('enrolled_at').defaultNow().notNull(),
  progress_percentage: integer('progress_percentage').default(0).notNull(), // 0-100
  last_accessed_at: timestamp('last_accessed_at'),
  is_completed: boolean('is_completed').default(false).notNull(),
  completed_at: timestamp('completed_at')
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  enrollments: many(userEnrollmentsTable),
  progress: many(userProgressTable),
  quizAttempts: many(quizAttemptsTable)
}));

export const coursesRelations = relations(coursesTable, ({ many }) => ({
  lessons: many(lessonsTable),
  enrollments: many(userEnrollmentsTable)
}));

export const lessonsRelations = relations(lessonsTable, ({ one, many }) => ({
  course: one(coursesTable, {
    fields: [lessonsTable.course_id],
    references: [coursesTable.id]
  }),
  quizzes: many(quizzesTable),
  progress: many(userProgressTable)
}));

export const quizzesRelations = relations(quizzesTable, ({ one, many }) => ({
  lesson: one(lessonsTable, {
    fields: [quizzesTable.lesson_id],
    references: [lessonsTable.id]
  }),
  attempts: many(quizAttemptsTable)
}));

export const userProgressRelations = relations(userProgressTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userProgressTable.user_id],
    references: [usersTable.id]
  }),
  lesson: one(lessonsTable, {
    fields: [userProgressTable.lesson_id],
    references: [lessonsTable.id]
  })
}));

export const quizAttemptsRelations = relations(quizAttemptsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [quizAttemptsTable.user_id],
    references: [usersTable.id]
  }),
  quiz: one(quizzesTable, {
    fields: [quizAttemptsTable.quiz_id],
    references: [quizzesTable.id]
  })
}));

export const userEnrollmentsRelations = relations(userEnrollmentsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userEnrollmentsTable.user_id],
    references: [usersTable.id]
  }),
  course: one(coursesTable, {
    fields: [userEnrollmentsTable.course_id],
    references: [coursesTable.id]
  })
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  courses: coursesTable,
  lessons: lessonsTable,
  quizzes: quizzesTable,
  userProgress: userProgressTable,
  quizAttempts: quizAttemptsTable,
  userEnrollments: userEnrollmentsTable
};
