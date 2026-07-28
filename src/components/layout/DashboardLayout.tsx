import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Home, Users, Calendar, Trophy, DollarSign, Settings, Cog, LogOut
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTranslation } from '@/hooks/useTranslation';
import TopNavigation from './TopNavigation';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  userRole?: string;
}

const SpeedSkateLogoMark = () => (
  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM5 9l4-3 3 2 4-3 3 2-1 2-3-1.5-4 3-3-2-2 1.5L5 9Zm-1 5 2-1 12 5-1 2-13-6Z"/>
    </svg>
  </div>
);

const DashboardLayout = ({ children, title, userRole = 'User' }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut();
    toast({ title: t('menu.logout'), description: t('message.saved_successfully') });
    navigate('/login');
  };

  const getNavigationItems = (role?: string) => {
    if (role === 'athlete') {
      return [
        { title: t('menu.dashboard'), icon: Home, path: '/athlete-dashboard' },
        { title: t('menu.training'), icon: Calendar, path: '/athlete/training' },
        { title: t('menu.competitions'), icon: Trophy, path: '/athlete/competitions' },
        { title: t('menu.settings'), icon: Settings, path: '/settings' },
      ];
    }
    return [
      { title: t('menu.dashboard'), icon: Home, path: '/' },
      { title: t('menu.athletes'), icon: Users, path: '/athletes' },
      { title: t('menu.training'), icon: Calendar, path: '/training' },
      { title: t('menu.competitions'), icon: Trophy, path: '/competitions' },
      { title: t('menu.finance'), icon: DollarSign, path: '/finance' },
      { title: t('menu.club_config'), icon: Cog, path: '/club-config' },
      { title: t('menu.settings'), icon: Settings, path: '/settings' },
    ];
  };

  const getDashboardPath = (role?: string) => {
    const paths: Record<string, string> = {
      admin: '/admin-dashboard',
      coach: '/coach-dashboard',
      athlete: '/athlete-dashboard',
      delegate: '/delegate-dashboard',
      leader: '/leader-dashboard',
      finance: '/finance-dashboard',
    };
    return paths[role ?? ''] ?? '/';
  };

  const getRoleLabel = (role?: string) => {
    const labels: Record<string, string> = {
      admin: t('role.admin'),
      coach: t('role.coach'),
      athlete: t('role.athlete'),
      delegate: t('role.delegate'),
      leader: t('role.leader'),
      finance: t('role.finance'),
    };
    return labels[role ?? ''] ?? t('role.user');
  };

  const getVisibleNavigationItems = () => {
    const role = profile?.role;
    const roleItems = getNavigationItems(role);
    if (role === 'athlete') return roleItems;

    const dashboardTitle = t('menu.dashboard');
    const allowedByRole: Record<string, string[]> = {
      admin:    [dashboardTitle, t('menu.athletes'), t('menu.training'), t('menu.competitions'), t('menu.finance'), t('menu.club_config'), t('menu.settings')],
      coach:    [dashboardTitle, t('menu.athletes'), t('menu.training'), t('menu.competitions'), t('menu.settings')],
      delegate: [dashboardTitle, t('menu.competitions'), t('menu.settings')],
      leader:   [dashboardTitle, t('menu.athletes'), t('menu.training'), t('menu.competitions'), t('menu.finance'), t('menu.club_config'), t('menu.settings')],
      finance:  [dashboardTitle, t('menu.finance'), t('menu.settings')],
    };
    const titles = role ? allowedByRole[role] : roleItems.map(i => i.title);
    return roleItems
      .map(item => item.title === dashboardTitle ? { ...item, path: getDashboardPath(role) } : item)
      .filter(item => titles?.includes(item.title));
  };

  if (profileLoading) {
    return (
      <div className="flex h-screen bg-background overflow-hidden items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-500/30 animate-pulse" />
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 mx-auto" />
        </div>
      </div>
    );
  }

  const navigationItems = getVisibleNavigationItems();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col',
        'border-r border-border',
        'transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        'bg-sidebar backdrop-blur-xl',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Ambient orb decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-r-none">
          <div className="absolute -top-20 -left-10 w-48 h-48 bg-orange-600/5 rounded-full blur-[80px] animate-orb-1" />
          <div className="absolute bottom-20 -right-10 w-36 h-36 bg-blue-600/5 rounded-full blur-[60px] animate-orb-2" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3 px-5 h-16 border-b border-sidebar-border flex-shrink-0">
          <SpeedSkateLogoMark />
          <div className="leading-none">
            <span className="text-foreground font-black text-base tracking-tight">
              SpeedSkate<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Track</span>
            </span>
            <div className="text-[9px] text-muted-foreground font-medium tracking-widest uppercase mt-0.5">Club Management</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto p-3 space-y-0.5 mt-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.title}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-orange-500 dark:text-orange-400 bg-gradient-to-r from-orange-500/12 dark:from-orange-500/15 to-transparent border-l-2 border-orange-500 pl-[calc(1rem-2px)]'
                    : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent'
                )}
              >
                <item.icon className={cn('h-4.5 w-4.5 flex-shrink-0', isActive ? 'text-orange-400' : '')} />
                {item.title}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="relative border-t border-sidebar-border p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(user?.email?.[0] ?? 'U').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : user?.email}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{getRoleLabel(profile?.role)}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/8 transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t('menu.logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavigation
          userRole={getRoleLabel(profile?.role)}
          userEmail={user?.email ?? undefined}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 lg:p-6 pt-20 lg:pt-20">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
