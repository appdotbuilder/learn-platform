import { db } from '../db';
import { usersTable, coursesTable, lessonsTable, quizzesTable, userEnrollmentsTable } from '../db/schema';

export const seedDatabase = async (): Promise<void> => {
  try {
    // Create demo user
    const demoUsers = await db.insert(usersTable)
      .values({
        email: 'demo@example.com',
        password_hash: 'hashed_password123', // Simple hashed format for demo
        first_name: 'Demo',
        last_name: 'User',
        avatar_url: null,
        is_active: true,
        current_streak: 0,
        longest_streak: 0
      })
      .returning()
      .execute();

    const demoUser = demoUsers[0];

    // Create sample course
    const courses = await db.insert(coursesTable)
      .values({
        title: 'Introduction to Learning',
        description: 'A comprehensive course to get you started with our learning platform. Learn the basics of how to navigate lessons, complete quizzes, and track your progress.',
        slug: 'introduction-to-learning',
        thumbnail_url: null,
        difficulty: 'beginner',
        estimated_duration: 60, // 60 minutes
        is_published: true,
        category: 'Getting Started',
        order_index: 0
      })
      .returning()
      .execute();

    const course = courses[0];

    // Create sample lessons
    const lesson1 = await db.insert(lessonsTable)
      .values({
        course_id: course.id,
        title: 'Welcome to the Platform',
        description: 'Get familiar with the learning platform interface and features.',
        slug: 'welcome-to-the-platform',
        video_url: 'https://example.com/videos/welcome.mp4',
        video_duration: 300, // 5 minutes
        text_content: 'Welcome to our learning platform! In this lesson, you\'ll discover how to navigate through courses, track your progress, and make the most of your learning experience. Take your time to explore the interface and get comfortable with the layout.',
        code_examples: null,
        order_index: 0,
        is_published: true
      })
      .returning()
      .execute();

    const lesson2 = await db.insert(lessonsTable)
      .values({
        course_id: course.id,
        title: 'How to Complete Lessons',
        description: 'Learn the process of completing lessons and tracking your progress.',
        slug: 'how-to-complete-lessons',
        video_url: 'https://example.com/videos/complete-lessons.mp4',
        video_duration: 480, // 8 minutes
        text_content: 'Completing lessons is simple! Watch the video content, read through any supplementary materials, and practice with the provided examples. When you\'re ready, mark the lesson as complete to track your progress. Remember, learning is a journey - take your time and enjoy the process!',
        code_examples: '{"example1": "console.log(\'Hello, Learning!\');", "language": "javascript"}',
        order_index: 1,
        is_published: true
      })
      .returning()
      .execute();

    // Create a sample quiz for the second lesson
    await db.insert(quizzesTable)
      .values({
        lesson_id: lesson2[0].id,
        title: 'Lesson Completion Quiz',
        questions: JSON.stringify([
          {
            id: 1,
            question: 'What should you do after watching a lesson video?',
            options: [
              'Close the browser immediately',
              'Read supplementary materials and practice examples',
              'Skip to the next course',
              'Nothing else is needed'
            ],
            correct_answer: 1
          },
          {
            id: 2,
            question: 'How do you track your progress in a lesson?',
            options: [
              'By taking notes only',
              'By marking the lesson as complete',
              'By watching the video twice',
              'Progress is tracked automatically'
            ],
            correct_answer: 1
          }
        ]),
        passing_score: 70 // 70% to pass
      })
      .execute();

    // Enroll demo user in the sample course
    await db.insert(userEnrollmentsTable)
      .values({
        user_id: demoUser.id,
        course_id: course.id,
        enrolled_at: new Date(),
        progress_percentage: 0,
        last_accessed_at: null,
        is_completed: false,
        completed_at: null
      })
      .execute();

    console.log('Database seeded successfully!');
    console.log('Demo user created: demo@example.com / password123');
    console.log('Sample course created: Introduction to Learning');
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  }
};