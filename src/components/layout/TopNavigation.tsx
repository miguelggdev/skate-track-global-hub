import React, { useState, useEffect, useRef } from 'react';
import { Bell, Moon, Sun, Search, User, LogOut, Settings, ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

interface SearchResult {
  id: string;
  title: string;
  type: 'athlete' | 'competition' | 'training';
  subtitle?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  timestamp: string;
}

interface TopNavigationProps {
  userRole?: string;
  userEmail?: string;
  userAvatar?: string;
  onMenuToggle?: () => void;
}

const TopNavigation = ({ userRole = 'User', userEmail, userAvatar, onMenuToggle }: TopNavigationProps) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [clubLogo, setClubLogo] = useState<string>('');
  const searchRef = useRef<HTMLDivElement>(null);
  const { profile } = useUserProfile();

  // Fetch club logo on component mount
  useEffect(() => {
    const fetchClubLogo = async () => {
      try {
        const { data, error } = await supabase
          .from('club_settings')
          .select('club_logo_url')
          .maybeSingle();
        
        if (data?.club_logo_url) {
          setClubLogo(data.club_logo_url);
        }
      } catch (error) {
        console.error('Error fetching club logo:', error);
      }
    };
    
    fetchClubLogo();
  }, []);

  // Mock notifications data
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Nueva competencia',
        message: 'Se ha añadido una nueva competencia: Campeonato Nacional',
        type: 'info',
        read: false,
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Entrenamiento cancelado',
        message: 'El entrenamiento de mañana ha sido cancelado por condiciones climáticas',
        type: 'warning',
        read: false,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '3',
        title: 'Pago recibido',
        message: 'Se ha recibido el pago de la cuota mensual',
        type: 'success',
        read: true,
        timestamp: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  // Search functionality (role-aware)
  useEffect(() => {
    const searchDatabase = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setIsSearchOpen(false);
        return;
      }

      try {
        const results: SearchResult[] = [];
        const role = profile?.role;

        const canSearchAthletes = role === 'admin' || role === 'coach' || role === 'leader';
        const canSearchCompetitions = role === 'admin' || role === 'coach' || role === 'athlete' || role === 'leader' || role === 'delegate';
        const canSearchTraining = role === 'admin' || role === 'coach' || role === 'athlete' || role === 'leader';

        const athletePromise = canSearchAthletes
          ? supabase
              .from('athletes')
              .select('id, first_name, last_name, athlete_number')
              .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,athlete_number.ilike.%${searchQuery}%`)
              .limit(5)
          : Promise.resolve({ data: [] as any[] });

        const competitionPromise = canSearchCompetitions
          ? supabase
              .from('competitions')
              .select('id, name, location')
              .ilike('name', `%${searchQuery}%`)
              .limit(3)
          : Promise.resolve({ data: [] as any[] });

        const trainingPromise = canSearchTraining
          ? supabase
              .from('training_sessions')
              .select('id, name, date')
              .ilike('name', `%${searchQuery}%`)
              .limit(3)
          : Promise.resolve({ data: [] as any[] });

        const [athletesRes, competitionsRes, trainingRes] = await Promise.all([
          athletePromise,
          competitionPromise,
          trainingPromise,
        ]);

        (athletesRes as any)?.data?.forEach((athlete: any) => {
          results.push({
            id: athlete.id,
            title: `${athlete.first_name} ${athlete.last_name}`,
            type: 'athlete',
            subtitle: athlete.athlete_number,
          });
        });

        (competitionsRes as any)?.data?.forEach((competition: any) => {
          results.push({
            id: competition.id,
            title: competition.name,
            type: 'competition',
            subtitle: competition.location,
          });
        });

        (trainingRes as any)?.data?.forEach((session: any) => {
          results.push({
            id: session.id,
            title: session.name,
            type: 'training',
            subtitle: new Date(session.date).toLocaleDateString(),
          });
        });

        setSearchResults(results);
        setIsSearchOpen(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    const debounceTimer = setTimeout(searchDatabase, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, profile]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation for search
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSearchResultClick = (result: SearchResult) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    
    switch (result.type) {
      case 'athlete':
        navigate(`/athletes?highlight=${result.id}`);
        break;
      case 'competition':
        navigate(`/competitions?highlight=${result.id}`);
        break;
      case 'training':
        navigate(`/training?highlight=${result.id}`);
        break;
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace un momento';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-border shadow-md transition-all duration-200">
      <div className="flex items-center px-4 lg:px-6 py-3">
        {/* Hamburger Menu - Always Visible */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="mr-3 transition-all duration-200 hover:scale-110"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Club Logo */}
        <div className="flex-shrink-0 mr-4">
          {clubLogo ? (
            <img
              src={clubLogo}
              alt="Club logo"
              className="club-logo-header"
              onClick={() => navigate('/')}
            />
          ) : (
            <img
              src="/logo.svg"
              alt="SpeedSkate Academy logo"
              className="club-logo-header"
              onClick={() => navigate('/')}
            />
          )}
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-[60%] mr-4" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar atletas, competencias, entrenamientos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-4 bg-muted/50 dark:bg-gray-800/50 border-border focus:bg-background dark:focus:bg-gray-800 transition-all"
            />
            
            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background dark:bg-gray-800 border border-border dark:border-gray-700 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="px-4 py-3 hover:bg-muted dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-border dark:border-gray-700 last:border-b-0"
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        result.type === 'athlete' ? 'bg-blue-500' :
                        result.type === 'competition' ? 'bg-green-500' : 'bg-orange-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {result.type === 'athlete' ? 'Atleta' :
                         result.type === 'competition' ? 'Competencia' : 'Entrenamiento'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* Right Side Actions */}
        <div className="flex items-center space-x-2">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="transition-all hover:scale-110"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative transition-all hover:scale-110">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-background dark:bg-gray-800 border-border dark:border-gray-700" align="end">
              <div className="p-4 border-b border-border dark:border-gray-700">
                <h4 className="font-semibold text-foreground dark:text-gray-100">Notificaciones</h4>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No hay notificaciones</p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-border dark:border-gray-700 last:border-b-0 hover:bg-muted dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-muted/50 dark:bg-gray-700/50' : ''
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'info' ? 'bg-blue-500' :
                          notification.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground dark:text-gray-100">{notification.title}</p>
                          <p className="text-sm text-muted-foreground dark:text-gray-300 mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400 mt-2">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-2 transition-all hover:scale-105">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userAvatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(userRole)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="font-medium text-sm truncate max-w-24">{userRole}</p>
                  {userEmail && (
                    <p className="text-xs text-muted-foreground truncate max-w-24">{userEmail}</p>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background dark:bg-gray-800 border-border dark:border-gray-700">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;