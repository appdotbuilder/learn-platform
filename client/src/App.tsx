
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { LoginForm } from '@/components/LoginForm';
import { Dashboard } from '@/components/Dashboard';
import { CourseView } from '@/components/CourseView';
import { LessonView } from '@/components/LessonView';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { User, Course, UserEnrollment, UserProgress } from '../../server/src/schema';

type AppView = 'login' | 'dashboard' | 'courses' | 'course' | 'lesson';

interface AppState {
  currentView: AppView;
  selectedCourseId?: number;
  selectedLessonId?: number;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>({ currentView: 'login' });
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCongratsMessage, setShowCongratsMessage] = useState(false);

  const loadUserData = useCallback(async (userId: number) => {
    try {
      setIsLoading(true);
      const [coursesData, enrollmentsData, progressData] = await Promise.all([
        trpc.getCourses.query(),
        trpc.getUserEnrollments.query({ userId }),
        trpc.getUserProgress.query({ userId })
      ]);
      
      setCourses(coursesData);
      setEnrollments(enrollmentsData);
      setUserProgress(progressData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData(user.id);
    }
  }, [user, loadUserData]);

  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const userData = await trpc.loginUser.mutate({ email, password });
      if (userData) {
        setUser(userData);
        setAppState({ currentView: 'dashboard' });
        
        // Show congratulations for streak
        if (userData.current_streak > 0) {
          setShowCongratsMessage(true);
          setTimeout(() => setShowCongratsMessage(false), 5000);
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAppState({ currentView: 'login' });
    setCourses([]);
    setEnrollments([]);
    setUserProgress([]);
  };

  const handleEnrollInCourse = async (courseId: number) => {
    if (!user) return;
    
    try {
      await trpc.enrollUserInCourse.mutate({ 
        user_id: user.id, 
        course_id: courseId 
      });
      // Refresh enrollments
      const updatedEnrollments = await trpc.getUserEnrollments.query({ userId: user.id });
      setEnrollments(updatedEnrollments);
    } catch (error) {
      console.error('Failed to enroll in course:', error);
    }
  };

  const handleMarkLessonComplete = async (lessonId: number, watchTime?: number) => {
    if (!user) return;
    
    try {
      await trpc.markLessonComplete.mutate({
        lesson_id: lessonId,
        user_id: user.id,
        watch_time: watchTime
      });
      
      // Refresh progress data
      const updatedProgress = await trpc.getUserProgress.query({ userId: user.id });
      setUserProgress(updatedProgress);
      
      // Show congratulations message
      setShowCongratsMessage(true);
      setTimeout(() => setShowCongratsMessage(false), 3000);
    } catch (error) {
      console.error('Failed to mark lesson as complete:', error);
    }
  };

  const navigateTo = (view: AppView, courseId?: number, lessonId?: number) => {
    setAppState({ 
      currentView: view, 
      selectedCourseId: courseId, 
      selectedLessonId: lessonId 
    });
  };

  const getEnrollmentForCourse = (courseId: number) => {
    return enrollments.find((enrollment: UserEnrollment) => enrollment.course_id === courseId);
  };

  const getProgressForLesson = (lessonId: number) => {
    return userProgress.find((progress: UserProgress) => progress.lesson_id === lessonId);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🎓 LearnHub</h1>
            <p className="text-gray-600">Your journey to mastery starts here</p>
          </div>
          <LoginForm onLogin={handleLogin} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onNavigate={navigateTo} 
        onLogout={handleLogout}
        currentView={appState.currentView}
      />
      
      {showCongratsMessage && (
        <div className="bg-green-500 text-white p-4 text-center">
          <span className="text-lg">🎉 Great job! Keep up the amazing work! 🎉</span>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {appState.currentView === 'dashboard' && (
          <Dashboard 
            user={user}
            courses={courses}
            enrollments={enrollments}
            userProgress={userProgress}
            onNavigate={navigateTo}
            onEnrollInCourse={handleEnrollInCourse}
            isLoading={isLoading}
          />
        )}

        {appState.currentView === 'courses' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">📚 All Courses</h1>
              <Button 
                variant="outline" 
                onClick={() => navigateTo('dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course: Course) => {
                const enrollment = getEnrollmentForCourse(course.id);
                return (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{course.title}</CardTitle>
                          <CardDescription className="mt-2">
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
                        
                        {enrollment && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress</span>
                              <span>{enrollment.progress_percentage}%</span>
                            </div>
                            <Progress value={enrollment.progress_percentage} className="h-2" />
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          {enrollment ? (
                            <Button 
                              onClick={() => navigateTo('course', course.id)}
                              className="flex-1"
                            >
                              Continue Learning
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handleEnrollInCourse(course.id)}
                              variant="outline"
                              className="flex-1"
                            >
                              Enroll Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {appState.currentView === 'course' && appState.selectedCourseId && (
          <CourseView 
            courseId={appState.selectedCourseId}
            enrollment={getEnrollmentForCourse(appState.selectedCourseId)}
            userProgress={userProgress}
            onNavigate={navigateTo}
          />
        )}

        {appState.currentView === 'lesson' && appState.selectedLessonId && appState.selectedCourseId && (
          <LessonView 
            lessonId={appState.selectedLessonId}
            courseId={appState.selectedCourseId}
            progress={getProgressForLesson(appState.selectedLessonId)}
            onNavigate={navigateTo}
            onMarkComplete={handleMarkLessonComplete}
          />
        )}
      </main>
    </div>
  );
}

export default App;
