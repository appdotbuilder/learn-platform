
import { type Course } from '../schema';

export const getCourses = async (): Promise<Course[]> => {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is fetching all published courses from the database,
    // ordered by order_index and category.
    return Promise.resolve([
        {
            id: 1,
            title: 'Introduction to Programming',
            description: 'Learn the basics of programming with hands-on examples',
            slug: 'intro-programming',
            thumbnail_url: null,
            difficulty: 'beginner' as const,
            estimated_duration: 300,
            is_published: true,
            category: 'Programming',
            created_at: new Date(),
            updated_at: new Date(),
            order_index: 0
        }
    ] as Course[]);
};
