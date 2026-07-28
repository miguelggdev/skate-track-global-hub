import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, LogOut, Settings, ChevronDown, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
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
  type: 'athlete' | 'competition' | 'training' | 'financial' | 'equipment' | 'coach' | 'award' | 'team' | 'notification' | 'user';
  subtitle?: string;
  metadata?: string;
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
  // theme managed by ThemeToggle component
  const _ = useTheme(); // keep provider warm
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [clubLogo, setClubLogo] = useState<string>('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { profile } = useUserProfile();

  // Fetch user avatar when profile changes
  useEffect(() => {
    if (profile?.id) {
      const fetchUserAvatar = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', profile.id)
            .single();
          
          if (data?.avatar_url) {
            setUserAvatarUrl(data.avatar_url);
          }
        } catch (error) {
          console.error('Error fetching user avatar:', error);
        }
      };
      
      fetchUserAvatar();
    }
  }, [profile]);

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

  // Enhanced search functionality (role-aware)
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

        // Define role-based permissions
        const canSearchAthletes = role === 'admin' || role === 'coach' || role === 'leader' || role === 'delegate';
        const canSearchCompetitions = role === 'admin' || role === 'coach' || role === 'athlete' || role === 'leader' || role === 'delegate';
        const canSearchTraining = role === 'admin' || role === 'coach' || role === 'athlete' || role === 'leader';
        const canSearchFinancial = role === 'admin' || role === 'finance' || role === 'leader';
        const canSearchEquipment = role === 'admin' || role === 'coach' || role === 'leader';
        const canSearchCoaches = role === 'admin' || role === 'leader';
        const canSearchAwards = role === 'admin' || role === 'coach' || role === 'athlete' || role === 'leader' || role === 'delegate';
        const canSearchTeams = role === 'admin' || role === 'coach' || role === 'leader';
        const canSearchNotifications = true; // All authenticated users
        const canSearchUsers = role === 'admin' || role === 'leader';

        // Build search promises based on permissions
        const searchPromises: PromiseLike<any>[] = [];

        if (canSearchAthletes) {
          searchPromises.push(
            supabase
              .from('athletes')
              .select('id, first_name, last_name, athlete_number, category')
              .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,athlete_number.ilike.%${searchQuery}%`)
              .limit(8)
              .then(result => ({ type: 'athletes', data: result.data }))
          );
        }

        if (canSearchCompetitions) {
          searchPromises.push(
            supabase
              .from('competitions')
              .select('id, name, location, start_date')
              .ilike('name', `%${searchQuery}%`)
              .limit(5)
              .then(result => ({ type: 'competitions', data: result.data }))
          );
        }

        if (canSearchTraining) {
          searchPromises.push(
            supabase
              .from('training_sessions')
              .select('id, name, date, location')
              .ilike('name', `%${searchQuery}%`)
              .limit(5)
              .then(result => ({ type: 'training', data: result.data }))
          );
        }

        if (canSearchFinancial) {
          searchPromises.push(
            supabase
              .from('financial_transactions')
              .select('id, description, amount, payer_name, transaction_type')
              .or(`description.ilike.%${searchQuery}%,payer_name.ilike.%${searchQuery}%`)
              .limit(5)
              .then(result => ({ type: 'financial', data: result.data }))
          );
        }

        if (canSearchEquipment) {
          searchPromises.push(
            supabase
              .from('equipment')
              .select('id, name, brand, model, category')
              .or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%`)
              .limit(4)
              .then(result => ({ type: 'equipment', data: result.data }))
          );
        }

        if (canSearchCoaches) {
          searchPromises.push(
            supabase
              .from('profiles')
              .select('id, first_name, last_name, email')
              .eq('role', 'coach')
              .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
              .limit(4)
              .then(result => ({ type: 'coaches', data: result.data }))
          );
        }

        if (canSearchAwards) {
          searchPromises.push(
            supabase
              .from('awards')
              .select('id, award_name, award_type, award_date')
              .or(`award_name.ilike.%${searchQuery}%,award_type.ilike.%${searchQuery}%`)
              .limit(4)
              .then(result => ({ type: 'awards', data: result.data }))
          );
        }

        if (canSearchTeams) {
          searchPromises.push(
            supabase
              .from('teams')
              .select('id, name, description, location')
              .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
              .limit(4)
              .then(result => ({ type: 'teams', data: result.data }))
          );
        }

        if (canSearchNotifications) {
          searchPromises.push(
            supabase
              .from('notifications')
              .select('id, title, message, notification_type')
              .eq('recipient_id', profile?.id)
              .or(`title.ilike.%${searchQuery}%,message.ilike.%${searchQuery}%`)
              .limit(3)
              .then(result => ({ type: 'notifications', data: result.data }))
          );
        }

        if (canSearchUsers) {
          searchPromises.push(
            supabase
              .from('profiles')
              .select('id, first_name, last_name, email, role')
              .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
              .limit(5)
              .then(result => ({ type: 'users', data: result.data }))
          );
        }

        const searchResults = await Promise.all(searchPromises);

        // Process each result type
        searchResults.forEach((result) => {
          if (!result.data) return;

          switch (result.type) {
            case 'athletes':
              result.data.forEach((athlete: any) => {
                results.push({
                  id: athlete.id,
                  title: `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim(),
                  type: 'athlete',
                  subtitle: athlete.athlete_number || athlete.category,
                });
              });
              break;

            case 'competitions':
              result.data.forEach((competition: any) => {
                results.push({
                  id: competition.id,
                  title: competition.name,
                  type: 'competition',
                  subtitle: competition.location,
                  metadata: competition.start_date ? new Date(competition.start_date).toLocaleDateString() : undefined,
                });
              });
              break;

            case 'training':
              result.data.forEach((session: any) => {
                results.push({
                  id: session.id,
                  title: session.name,
                  type: 'training',
                  subtitle: session.location,
                  metadata: new Date(session.date).toLocaleDateString(),
                });
              });
              break;

            case 'financial':
              result.data.forEach((transaction: any) => {
                results.push({
                  id: transaction.id,
                  title: transaction.description,
                  type: 'financial',
                  subtitle: transaction.payer_name,
                  metadata: `${transaction.amount}€ - ${transaction.transaction_type}`,
                });
              });
              break;

            case 'equipment':
              result.data.forEach((equipment: any) => {
                results.push({
                  id: equipment.id,
                  title: equipment.name,
                  type: 'equipment',
                  subtitle: `${equipment.brand || ''} ${equipment.model || ''}`.trim(),
                  metadata: equipment.category,
                });
              });
              break;

            case 'coaches':
              result.data.forEach((coach: any) => {
                results.push({
                  id: coach.id,
                  title: `${coach.first_name || ''} ${coach.last_name || ''}`.trim(),
                  type: 'coach',
                  subtitle: coach.email,
                });
              });
              break;

            case 'awards':
              result.data.forEach((award: any) => {
                results.push({
                  id: award.id,
                  title: award.award_name,
                  type: 'award',
                  subtitle: award.award_type,
                  metadata: award.award_date ? new Date(award.award_date).toLocaleDateString() : undefined,
                });
              });
              break;

            case 'teams':
              result.data.forEach((team: any) => {
                results.push({
                  id: team.id,
                  title: team.name,
                  type: 'team',
                  subtitle: team.location,
                  metadata: team.description,
                });
              });
              break;

            case 'notifications':
              result.data.forEach((notification: any) => {
                results.push({
                  id: notification.id,
                  title: notification.title,
                  type: 'notification',
                  subtitle: notification.message,
                  metadata: notification.notification_type,
                });
              });
              break;

            case 'users':
              result.data.forEach((user: any) => {
                results.push({
                  id: user.id,
                  title: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                  type: 'user',
                  subtitle: user.email,
                  metadata: user.role,
                });
              });
              break;
          }
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
      case 'financial':
        navigate(`/finance?highlight=${result.id}`);
        break;
      case 'equipment':
        navigate(`/athletes?tab=equipment&highlight=${result.id}`);
        break;
      case 'coach':
        navigate(`/training?coach=${result.id}`);
        break;
      case 'award':
        navigate(`/competitions?tab=results&highlight=${result.id}`);
        break;
      case 'team':
        navigate(`/athletes?team=${result.id}`);
        break;
      case 'notification':
        // Keep notifications in the header, just mark as read
        markNotificationAsRead(result.id);
        break;
      case 'user':
        if (profile?.role === 'admin' || profile?.role === 'leader') {
          navigate(`/settings?tab=users&highlight=${result.id}`);
        }
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
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-border shadow-sm transition-all duration-300">
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
              className="pl-10 pr-4 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:bg-muted focus:border-orange-500/50 transition-all"
            />

            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border last:border-b-0"
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        result.type === 'athlete' ? 'bg-blue-500' :
                        result.type === 'competition' ? 'bg-green-500' :
                        result.type === 'training' ? 'bg-orange-500' :
                        result.type === 'financial' ? 'bg-emerald-500' :
                        result.type === 'equipment' ? 'bg-purple-500' :
                        result.type === 'coach' ? 'bg-indigo-500' :
                        result.type === 'award' ? 'bg-yellow-500' :
                        result.type === 'team' ? 'bg-pink-500' :
                        result.type === 'notification' ? 'bg-red-500' :
                        result.type === 'user' ? 'bg-gray-500' : 'bg-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                        )}
                        {result.metadata && (
                          <p className="text-xs text-muted-foreground truncate">{result.metadata}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {result.type === 'athlete' ? 'Atleta' :
                         result.type === 'competition' ? 'Competencia' :
                         result.type === 'training' ? 'Entrenamiento' :
                         result.type === 'financial' ? 'Finanzas' :
                         result.type === 'equipment' ? 'Equipo' :
                         result.type === 'coach' ? 'Entrenador' :
                         result.type === 'award' ? 'Premio' :
                         result.type === 'team' ? 'Equipo' :
                         result.type === 'notification' ? 'Notificación' :
                         result.type === 'user' ? 'Usuario' : 'Otro'}
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
          {/* Theme Toggle */}
          <ThemeToggle />

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
            <PopoverContent className="w-80 p-0 bg-popover border border-border shadow-xl rounded-xl" align="end">
              <div className="p-4 border-b border-border">
                <h4 className="font-semibold text-foreground text-sm">Notificaciones</h4>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">No hay notificaciones</p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-border last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-muted/30' : ''
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'info' ? 'bg-blue-500' :
                          notification.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground">{notification.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
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
                  <AvatarImage src={userAvatarUrl || userAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-700 text-white font-bold">
                    {profile ? getInitials(`${profile.first_name} ${profile.last_name}`) : getInitials(userRole)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="font-medium text-sm truncate max-w-24">
                    {profile ? `${profile.first_name} ${profile.last_name}` : userRole}
                  </p>
                  {profile?.email && (
                    <p className="text-xs text-muted-foreground truncate max-w-24">{profile.email}</p>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-xl rounded-xl">
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