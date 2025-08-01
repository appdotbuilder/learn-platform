
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  avatar_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  is_active: z.boolean(),
  last_login: z.coerce.date().nullable(),
  current_streak: z.number().int(),
  longest_streak: z.number().int()
});

export type User = z.infer<typeof userSchema>;

// Course schema
export const courseSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  slug: z.string(),
  thumbnail_url: z.string().nullable(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimated_duration: z.number().int(), // in minutes
  is_published: z.boolean(),
  category: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  order_index: z.number().int()
});

export type Course = z.infer<typeof courseSchema>;

// Lesson schema
export const lessonSchema = z.object({
  id: z.number(),
  course_id: z.number(),
  title: z.string(),
  description: z.string(),
  slug: z.string(),
  video_url: z.string().nullable(),
  video_duration: z.number().int().nullable(), // in seconds
  text_content: z.string().nullable(),
  code_examples: z.string().nullable(), // JSON string
  order_index: z.number().int(),
  is_published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Lesson = z.infer<typeof lessonSchema>;

// Quiz schema
export const quizSchema = z.object({
  id: z.number(),
  lesson_id: z.number(),
  title: z.string(),
  questions: z.string(), // JSON string containing quiz questions
  passing_score: z.number().int(), // percentage required to pass
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Quiz = z.infer<typeof quizSchema>;

// User progress schema
export const userProgressSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  lesson_id: z.number(),
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable(),
  watch_time: z.number().int(), // in seconds
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserProgress = z.infer<typeof userProgressSchema>;

// Quiz attempt schema
export const quizAttemptSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  quiz_id: z.number(),
  answers: z.string(), // JSON string containing user answers
  score: z.number().int(), // percentage score
  is_passed: z.boolean(),
  attempted_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable()
});

export type QuizAttempt = z.infer<typeof quizAttemptSchema>;

// User enrollment schema
export const userEnrollmentSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  course_id: z.number(),
  enrolled_at: z.coerce.date(),
  progress_percentage: z.number().int(), // 0-100
  last_accessed_at: z.coerce.date().nullable(),
  is_completed: z.boolean(),
  completed_at: z.coerce.date().nullable()
});

export type UserEnrollment = z.infer<typeof userEnrollmentSchema>;

// Input schemas for creating/updating
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  avatar_url: z.string().url().nullable().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const createCourseInputSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  slug: z.string().min(1),
  thumbnail_url: z.string().url().nullable().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimated_duration: z.number().int().positive(),
  category: z.string().min(1),
  order_index: z.number().int().nonnegative()
});

export type CreateCourseInput = z.infer<typeof createCourseInputSchema>;

export const createLessonInputSchema = z.object({
  course_id: z.number().positive(),
  title: z.string().min(1),
  description: z.string(),
  slug: z.string().min(1),
  video_url: z.string().url().nullable().optional(),
  video_duration: z.number().int().positive().nullable().optional(),
  text_content: z.string().nullable().optional(),
  code_examples: z.string().nullable().optional(),
  order_index: z.number().int().nonnegative()
});

export type CreateLessonInput = z.infer<typeof createLessonInputSchema>;

export const createQuizInputSchema = z.object({
  lesson_id: z.number().positive(),
  title: z.string().min(1),
  questions: z.string().min(1), // JSON string
  passing_score: z.number().int().min(0).max(100)
});

export type CreateQuizInput = z.infer<typeof createQuizInputSchema>;

export const markLessonCompleteInputSchema = z.object({
  lesson_id: z.number().positive(),
  user_id: z.number().positive(),
  watch_time: z.number().int().nonnegative().optional()
});

export type MarkLessonCompleteInput = z.infer<typeof markLessonCompleteInputSchema>;

export const submitQuizInputSchema = z.object({
  quiz_id: z.number().positive(),
  user_id: z.number().positive(),
  answers: z.string().min(1) // JSON string
});

export type SubmitQuizInput = z.infer<typeof submitQuizInputSchema>;

export const enrollUserInputSchema = z.object({
  user_id: z.number().positive(),
  course_id: z.number().positive()
});

export type EnrollUserInput = z.infer<typeof enrollUserInputSchema>;
