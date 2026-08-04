import React, { useState, useEffect, useRef } from 'react';
import { Search, User, LogOut, Settings, ChevronDown, Menu, Globe } from 'lucide-react';
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
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useMarkNotificationRead } from '@/hooks/useNotifications';
import { useTranslation, AVAILABLE_LANGUAGES, LanguageCode } from '@/hooks/useTranslation';

interface SearchResult {
  id: string;
  title: string;
  type: 'athlete' | 'competition' | 'training' | 'financial' | 'equipment' | 'coach' | 'award' | 'team' | 'notification' | 'user';
  subtitle?: string;
  metadata?: string;
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
  const { t, currentLanguage, setLanguage } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [clubLogo, setClubLogo] = useState<string>('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { profile } = useUserProfile();
  const markNotificationRead = useMarkNotificationRead();

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
      }
    };
    
    fetchClubLogo();
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
              .select('id, title, scheduled_at, location')
              .ilike('title', `%${searchQuery}%`)
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
              .from('coaches')
              .select('id, user_id, profiles(id, first_name, last_name)')
              .eq('is_active', true)
              .limit(4)
              .then(result => ({
                type: 'coaches',
                data: (result.data ?? [])
                  .map((c: any) => ({ ...c.profiles, id: c.user_id }))
                  .filter((p: any) => {
                    const q = searchQuery.toLowerCase();
                    return (p.first_name ?? '').toLowerCase().includes(q)
                      || (p.last_name ?? '').toLowerCase().includes(q);
                  }),
              }))
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
              .from('relay_teams')
              .select('id, team_name, club_name')
              .or(`team_name.ilike.%${searchQuery}%,club_name.ilike.%${searchQuery}%`)
              .limit(4)
              .then(result => ({ type: 'teams', data: result.data }))
          );
        }

        if (canSearchNotifications) {
          searchPromises.push(
            supabase
              .from('notifications')
              .select('id, title, message, type')
              .eq('user_id', profile?.id)
              .or(`title.ilike.%${searchQuery}%,message.ilike.%${searchQuery}%`)
              .limit(3)
              .then(result => ({ type: 'notifications', data: result.data }))
          );
        }

        if (canSearchUsers) {
          searchPromises.push(
            supabase
              .from('profiles')
              .select('id, first_name, last_name, email')
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
                  title: `${athlete.first_name ?? ''} ${athlete.last_name ?? ''}`.trim(),
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
                  title: session.title,
                  type: 'training',
                  subtitle: session.location,
                  metadata: session.scheduled_at ? new Date(session.scheduled_at).toLocaleDateString() : undefined,
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
                  subtitle: `${equipment.brand ?? ''} ${equipment.model ?? ''}`.trim(),
                  metadata: equipment.category,
                });
              });
              break;

            case 'coaches':
              result.data.forEach((coach: any) => {
                results.push({
                  id: coach.id,
                  title: `${coach.first_name ?? ''} ${coach.last_name ?? ''}`.trim(),
                  type: 'coach',
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
                  title: team.team_name || team.club_name || '—',
                  type: 'team',
                  subtitle: team.club_name,
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
                  metadata: notification.type,
                });
              });
              break;

            case 'users':
              result.data.forEach((user: any) => {
                results.push({
                  id: user.id,
                  title: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
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
        navigate(`/equipamiento?highlight=${result.id}`);
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
        markNotificationRead.mutate(result.id);
        break;
      case 'user':
        if (profile?.role === 'admin' || profile?.role === 'leader') {
          navigate(`/settings?tab=users&highlight=${result.id}`);
        }
        break;
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      toast({
        title: t('message.session_closed'),
        description: t('message.session_closed_desc'),
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('message.logout_error'),
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-border shadow-sm transition-all duration-300">
      <div className="flex items-center px-4 lg:px-6 py-3">
        {/* Hamburger Menu - Always Visible */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="mr-3 transition-all duration-200 hover:scale-110"
          aria-label="Abrir menú de navegación"
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

        {/* Search Bar — desktop only */}
        <div className="hidden sm:block flex-1 max-w-[60%] mr-4" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-4 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:bg-muted focus:border-orange-500/50 transition-all"
            />

            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    type="button"
                    key={result.id}
                    className="w-full text-left px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border last:border-b-0"
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
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
                        {t(`search.${result.type}`)}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* Right Side Actions */}
        <div className="flex items-center space-x-1 sm:space-x-2 ml-auto">
          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="sm:hidden"
            onClick={() => { setMobileSearchOpen(v => !v); setSearchQuery(''); setIsSearchOpen(false); }}
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2 gap-1 text-xs font-medium" aria-label="Language">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {AVAILABLE_LANGUAGES.find(l => l.code === currentLanguage)?.flag}
                  {' '}{currentLanguage.toUpperCase()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-popover border border-border shadow-xl rounded-xl">
              {AVAILABLE_LANGUAGES.map(lang => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as LanguageCode)}
                  className={currentLanguage === lang.code ? 'bg-muted font-semibold' : ''}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.nativeName}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationBell />

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
              <DropdownMenuLabel>{t('common.my_account')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <User className="mr-2 h-4 w-4" />
                {t('common.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                {t('common.config')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('common.close_session')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile search row */}
      {mobileSearchOpen && (
        <div className="sm:hidden px-3 pb-2 border-t border-border/40">
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') { setMobileSearchOpen(false); setSearchQuery(''); }
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-500/50"
            />
          </div>
          {isSearchOpen && searchResults.length > 0 && (
            <div className="mt-1 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  type="button"
                  key={result.id}
                  className="w-full text-left px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border last:border-b-0"
                  onClick={() => { handleSearchResultClick(result); setMobileSearchOpen(false); }}
                >
                  <p className="font-medium text-sm text-foreground truncate">{result.title}</p>
                  {result.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default TopNavigation;