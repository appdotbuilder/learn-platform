
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Play, Clock } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Course, Lesson, UserEnrollment, UserProgress } from '../../../server/src/schema';

type AppView = 'login' | 'dashboard' | 'courses' | 'course' | 'lesson';

interface CourseViewProps {
  courseId: number;
  enrollment: UserEnrollment | undefined;
  userProgress: UserProgress[];
  onNavigate: (view: AppView, courseId?: number, lessonId?: number) => void;
}

export function CourseView({ 
  courseId, 
  enrollment,
  userProgress, 
  onNavigate
}: CourseViewProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCourseData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [courseData, lessonsData] = await Promise.all([
        trpc.getCourses.query(), // We'll find our course in the list
        trpc.getCourseLessons.query({ courseId })
      ]);
      
      const selectedCourse = courseData.find((c: Course) => c.id === courseId);
      setCourse(selectedCourse || null);
      setLessons(lessonsData);
    } catch (error) {
      console.error('Failed to load course data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  const getLessonProgress = (lessonId: number) => {
    return userProgress.find((progress: UserProgress) => progress.lesson_id === lessonId);
  };

  const completedLessons = lessons.filter((lesson: Lesson) => {
    const progress = getLessonProgress(lesson.id);
    return progress?.is_completed;
  }).length;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Course not found</h3>
        <Button onClick={() => onNavigate('dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Course Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => onNavigate('dashboard')}
            >
              ← Back to Dashboard
            </Button>
            <Badge variant={
              course.difficulty === 'beginner' ? 'secondary' :
              course.difficulty === 'intermediate' ? 'default' : 'destructive'
            }>
              {course.difficulty}
            </Badge>
            <Badge variant="outline">{course.category}</Badge>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {course.title}
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            {course.description}
          </p>
          
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{Math.floor(course.estimated_duration / 60)}h {course.estimated_duration % 60}m</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span>{completedLessons} of {lessons.length} lessons completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      {enrollment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📈</span>
              <span>Your Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Course Progress</span>
                <span className="text-sm font-bold">{enrollment.progress_percentage}%</span>
              </div>
              <Progress value={enrollment.progress_percentage} className="h-3" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{completedLessons}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{lessons.length - completedLessons}</div>
                  <div className="text-sm text-gray-600">Remaining</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{lessons.length}</div>
                  <div className="text-sm text-gray-600">Total Lessons</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {enrollment.is_completed ? '🎉' : '⏳'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {enrollment.is_completed ? 'Completed!' : 'In Progress'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lessons List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Lessons</h2>
        <div className="space-y-4">
          {lessons.map((lesson: Lesson, index: number) => {
            const progress = getLessonProgress(lesson.id);
            const isCompleted = progress?.is_completed || false;
            const watchTime = progress?.watch_time || 0;
            
            return (
              <Card 
                key={lesson.id} 
                className={`hover:shadow-md transition-shadow ${
                  isCompleted ? 'border-green-200 bg-green-50' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      ) : (
                        <Circle className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {index + 1}. {lesson.title}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {lesson.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            {lesson.video_duration && (
                              <div className="flex items-center space-x-1">
                                <Play className="h-3 w-3" />
                                <span>{formatDuration(lesson.video_duration)}</span>
                              </div>
                            )}
                            {isCompleted && watchTime > 0 && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>Watched: {formatDuration(watchTime)}</span>
                              </div>
                            )}
                            {lesson.text_content && (
                              <Badge variant="outline" className="text-xs">
                                📝 Text
                              </Badge>
                            )}
                            {lesson.code_examples && (
                              <Badge variant="outline" className="text-xs">
                                💻 Code
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            onClick={() => onNavigate('lesson', courseId, lesson.id)}
                            variant={isCompleted ? 'outline' : 'default'}
                            size="sm"
                          >
                            {isCompleted ? 'Review' : 'Start Lesson'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {lessons.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No lessons available yet</h3>
          <p className="text-gray-600">This course is still being prepared. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
