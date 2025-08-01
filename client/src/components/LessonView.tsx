
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, Play, Code, FileText } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Course, Lesson, UserProgress } from '../../../server/src/schema';

type AppView = 'login' | 'dashboard' | 'courses' | 'course' | 'lesson';

interface LessonViewProps {
  lessonId: number;
  courseId: number;
  progress: UserProgress | undefined;
  onNavigate: (view: AppView, courseId?: number, lessonId?: number) => void;
  onMarkComplete: (lessonId: number, watchTime?: number) => Promise<void>;
}

interface CodeExample {
  language: string;
  code: string;
}

export function LessonView({ 
  lessonId, 
  courseId, 
  progress,
  onNavigate, 
  onMarkComplete 
}: LessonViewProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [watchTime, setWatchTime] = useState(0);
  const [isWatching, setIsWatching] = useState(false);

  const loadLessonData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [courseData, lessonsData] = await Promise.all([
        trpc.getCourses.query(),
        trpc.getCourseLessons.query({ courseId })
      ]);
      
      const selectedCourse = courseData.find((c: Course) => c.id === courseId);
      const selectedLesson = lessonsData.find((l: Lesson) => l.id === lessonId);
      
      setCourse(selectedCourse || null);
      setLesson(selectedLesson || null);
      setLessons(lessonsData);
      
      // Initialize watch time from progress
      if (progress?.watch_time) {
        setWatchTime(progress.watch_time);
      }
    } catch (error) {
      console.error('Failed to load lesson data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, lessonId, progress]);

  useEffect(() => {
    loadLessonData();
  }, [loadLessonData]);

  // Simple watch time tracking
  useEffect(() => {
    let interval: number;
    if (isWatching) {
      interval = window.setInterval(() => {
        setWatchTime((prev: number) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [isWatching]);

  const handleMarkComplete = async () => {
    await onMarkComplete(lessonId, watchTime);
  };

  const getCurrentLessonIndex = () => {
    return lessons.findIndex((l: Lesson) => l.id === lessonId);
  };

  const getNextLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    return lessons[currentIndex + 1] || null;
  };

  const getPreviousLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    return lessons[currentIndex - 1] || null;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const parseCodeExamples = (codeExamplesJson: string | null): CodeExample[] => {
    if (!codeExamplesJson) return [];
    try {
      return JSON.parse(codeExamplesJson);
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">📖</div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Lesson not found</h3>
        <Button onClick={() => onNavigate('course', courseId)}>
          Back to Course
        </Button>
      </div>
    );
  }

  const codeExamples = parseCodeExamples(lesson.code_examples);
  const isCompleted = progress?.is_completed || false;
  const nextLesson = getNextLesson();
  const previousLesson = getPreviousLesson();
  const currentIndex = getCurrentLessonIndex();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Lesson Header */}
      <div>
        <div className="flex items-center space-x-4 mb-4">
          <Button 
            variant="outline" 
            onClick={() => onNavigate('course', courseId)}
          >
            ← Back to Course
          </Button>
          <Badge variant="outline">
            Lesson {currentIndex + 1} of {lessons.length}
          </Badge>
          {isCompleted && (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
        
        <div className="mb-2">
          <h3 className="text-sm font-medium text-gray-600">{course.title}</h3>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {lesson.title}
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          {lesson.description}
        </p>
        
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          {lesson.video_duration && (
            <div className="flex items-center space-x-1">
              <Play className="h-4 w-4" />
              <span>Video: {formatDuration(lesson.video_duration)}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>Watch time: {formatDuration(watchTime)}</span>
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="space-y-8">
        {/* Video Section */}
        {lesson.video_url && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5" />
                <span>Video Lesson</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-8 text-center text-white">
                <div className="text-6xl mb-4">🎥</div>
                <p className="text-lg mb-4">Video Player Placeholder</p>
                <p className="text-sm text-gray-400 mb-6">
                  Video URL: {lesson.video_url}
                </p>
                <div className="flex justify-center space-x-4">
                  <Button 
                    onClick={() => setIsWatching(!isWatching)}
                    variant={isWatching ? 'destructive' : 'secondary'}
                  >
                    {isWatching ? 'Pause' : 'Play'} Video
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Content</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span>Code Examples ({codeExamples.length})</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center space-x-2">
              <span>📝</span>
              <span>Notes</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Content</CardTitle>
              </CardHeader>
              <CardContent>
                {lesson.text_content ? (
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {lesson.text_content}
                    </div>
                  </div>
                
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No text content available for this lesson.</p>
                    <p className="text-sm">Focus on the video content above.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="code" className="mt-6">
            <div className="space-y-4">
              {codeExamples.length > 0 ? (
                codeExamples.map((example: CodeExample, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Code Example {index + 1}</span>
                        <Badge variant="outline">{example.language}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm">
                          <code>{example.code}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8 text-gray-500">
                    <Code className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No code examples available for this lesson.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="notes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Notes</CardTitle>
                <CardDescription>
                  Take notes while learning (feature coming soon!)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-4 block">📝</span>
                  <p>Note-taking feature coming soon!</p>
                  <p className="text-sm">For now, use your favorite note-taking app.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Lesson Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              {previousLesson ? (
                <Button 
                  variant="outline"
                  onClick={() => onNavigate('lesson', courseId, previousLesson.id)}
                >
                  ← Previous: {previousLesson.title}
                </Button>
              ) : (
                <div></div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {!isCompleted && (
                <Button onClick={handleMarkComplete}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Complete
                </Button>
              )}
              
              {nextLesson ? (
                <Button 
                  onClick={() => onNavigate('lesson', courseId, nextLesson.id)}
                >
                  Next: {nextLesson.title} →
                </Button>
              ) : (
                <Button 
                  onClick={() => onNavigate('course', courseId)}
                  variant="outline"
                >
                  Back to Course
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Celebration */}
      {isCompleted && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Lesson Completed!
            </h3>
            <p className="text-green-600">
              Great job! You've successfully completed this lesson. 
              {nextLesson ? ' Ready for the next one?' : ' You\'ve finished all lessons in this course!'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
