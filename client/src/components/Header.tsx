
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { User } from '../../../server/src/schema';

type AppView = 'login' | 'dashboard' | 'courses' | 'course' | 'lesson';

interface HeaderProps {
  user: User;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
}

export function Header({ user, currentView, onNavigate, onLogout }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('dashboard')}
              className="text-xl font-bold text-blue-600 hover:text-blue-700 p-0"
            >
              🎓 LearnHub
            </Button>
            
            <nav className="hidden md:flex items-center space-x-4">
              <Button 
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => onNavigate('dashboard')}
                size="sm"
              >
                Dashboard
              </Button>
              <Button 
                variant={currentView === 'courses' ? 'default' : 'ghost'}
                onClick={() => onNavigate('courses')}
                size="sm"
              >
                All Courses
              </Button>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-4">
              {user.current_streak > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Streak:</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    🔥 {user.current_streak} days
                  </Badge>
                </div>
              )}
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">
                  {user.first_name} {user.last_name}
                </span>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={onLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
