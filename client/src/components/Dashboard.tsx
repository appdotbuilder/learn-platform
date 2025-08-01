
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { User, Course, UserEnrollment, UserProgress } from '../../../server/src/schema';

type AppView = 'login' | 'dashboard' | 'courses' | 'course' | 'lesson';

interface DashboardProps {
  user: User;
  courses: Course[];
  enrollments: UserEnrollment[];
  userProgress: UserProgress[];
  onNavigate: (view: AppView, courseId?: number) => void;
  onEnrollInCourse: (courseId: number) => Promise<void>;
  isLoading: boolean;
}

export function Dashboard({ 
  user, 
  courses, 
  enrollments, 
  userProgress, 
  onNavigate, 
  onEnrollInCourse,
  isLoading 
}: DashboardProps) {
  const enrolledCourses = courses.filter((course: Course) => 
    enrollments.some((enrollment: UserEnrollment) => enrollment.course_id === course.id)
  );

  const availableCourses = courses.filter((course: Course) => 
    !enrollments.some((enrollment: UserEnrollment) => enrollment.course_id === course.id)
  );

  const completedLessons = userProgress.filter((progress: UserProgress) => progress.is_completed).length;
  const totalWatchTime = userProgress.reduce((total: number, progress: UserProgress) => total + progress.watch_time, 0);
  const totalWatchHours = Math.floor(totalWatchTime / 3600);
  const totalWatchMinutes = Math.floor((totalWatchTime % 3600) / 60);

  const getEnrollmentForCourse = (courseId: number) => {
    return enrollments.find((enrollment: UserEnrollment) => enrollment.course_id === courseId);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome back, {user.first_name}! 👋
        </h1>
        <p className="text-xl text-gray-600">Ready to continue your learning journey?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <span className="text-2xl">🔥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.current_streak} days</div>
            <p className="text-xs text-muted-foreground">
              Best: {user.longest_streak} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <span className="text-2xl">📚</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
            <p className="text-xs text-muted-foreground">
              {availableCourses.length} more available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedLessons}</div>
            <p className="text-xs text-muted-foreground">
              Keep it up!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
            <span className="text-2xl">⏱️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalWatchHours}h {totalWatchMinutes}m
            </div>
            <p className="text-xs text-muted-foreground">
              Time well spent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Section */}
      {enrolledCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Continue Learning 📖</h2>
            <Button variant="outline" onClick={() => onNavigate('courses')}>
              View All Courses
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrolledCourses.slice(0, 3).map((course: Course) => {
              const enrollment = getEnrollmentForCourse(course.id);
              return (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {course.category}
                        </CardDescription>
                      </div>
                      <Badge variant={
                        course.difficulty === 'beginner' ? 'secondary' :
                        course.difficulty === 'intermediate' ? 'default' : 'destructive'
                      }>
                        {course.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {enrollment && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{enrollment.progress_percentage}%</span>
                          </div>
                          <Progress value={enrollment.progress_percentage} className="h-2" />
                          {enrollment.last_accessed_at && (
                            <p className="text-xs text-gray-500">
                              Last accessed: {enrollment.last_accessed_at.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => onNavigate('course', course.id)}
                        className="w-full"
                      >
                        {enrollment?.progress_percentage === 100 ? 'Review Course' : 'Continue'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Courses Section */}
      {availableCourses.length > 0 && (
        <div>
          <Separator className="my-8" />
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Explore New Courses 🚀</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableCourses.slice(0, 3).map((course: Course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {course.description}
                      </CardDescription>
                    </div>
                    <Badge variant={
                      course.difficulty === 'beginner' ? 'secondary' :
                      course.difficulty === 'intermediate' ? 'default' : 'destructive'
                    }>
                      {course.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>⏱️ {Math.floor(course.estimated_duration / 60)}h {course.estimated_duration % 60}m</span>
                      <span>📁 {course.category}</span>
                    </div>
                    
                    <Button 
                      onClick={() => onEnrollInCourse(course.id)}
                      variant="outline"
                      className="w-full"
                      disabled={isLoading}
                    >
                      Enroll Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {availableCourses.length > 3 && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => onNavigate('courses')}>
                View All {courses.length} Courses
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {enrollments.length === 0 && courses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses available yet</h3>
          <p className="text-gray-600">Check back soon for new learning opportunities!</p>
        </div>
      )}
    </div>
  );
}
