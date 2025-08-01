
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema, 
  loginInputSchema,
  createCourseInputSchema,
  createLessonInputSchema,
  createQuizInputSchema,
  markLessonCompleteInputSchema,
  submitQuizInputSchema,
  enrollUserInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { getCourses } from './handlers/get_courses';
import { createCourse } from './handlers/create_course';
import { getCourseLessons } from './handlers/get_course_lessons';
import { createLesson } from './handlers/create_lesson';
import { createQuiz } from './handlers/create_quiz';
import { markLessonComplete } from './handlers/mark_lesson_complete';
import { submitQuiz } from './handlers/submit_quiz';
import { enrollUserInCourse } from './handlers/enroll_user_in_course';
import { getUserProgress } from './handlers/get_user_progress';
import { getUserEnrollments } from './handlers/get_user_enrollments';
import { getQuizAttempts } from './handlers/get_quiz_attempts';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Course management
  getCourses: publicProcedure
    .query(() => getCourses()),

  createCourse: publicProcedure
    .input(createCourseInputSchema)
    .mutation(({ input }) => createCourse(input)),

  getCourseLessons: publicProcedure
    .input(z.object({ courseId: z.number().positive() }))
    .query(({ input }) => getCourseLessons(input.courseId)),

  // Lesson management
  createLesson: publicProcedure
    .input(createLessonInputSchema)
    .mutation(({ input }) => createLesson(input)),

  // Quiz management
  createQuiz: publicProcedure
    .input(createQuizInputSchema)
    .mutation(({ input }) => createQuiz(input)),

  submitQuiz: publicProcedure
    .input(submitQuizInputSchema)
    .mutation(({ input }) => submitQuiz(input)),

  getQuizAttempts: publicProcedure
    .input(z.object({ 
      userId: z.number().positive(),
      quizId: z.number().positive().optional()
    }))
    .query(({ input }) => getQuizAttempts(input.userId, input.quizId)),

  // Progress tracking
  markLessonComplete: publicProcedure
    .input(markLessonCompleteInputSchema)
    .mutation(({ input }) => markLessonComplete(input)),

  getUserProgress: publicProcedure
    .input(z.object({ 
      userId: z.number().positive(),
      courseId: z.number().positive().optional()
    }))
    .query(({ input }) => getUserProgress(input.userId, input.courseId)),

  // Enrollment management
  enrollUserInCourse: publicProcedure
    .input(enrollUserInputSchema)
    .mutation(({ input }) => enrollUserInCourse(input)),

  getUserEnrollments: publicProcedure
    .input(z.object({ userId: z.number().positive() }))
    .query(({ input }) => getUserEnrollments(input.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
