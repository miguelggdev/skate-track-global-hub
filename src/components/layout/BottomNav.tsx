import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Trophy, Settings, Users, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  icon: React.ElementType;
  path: string;
}

const ITEMS_BY_ROLE: Record<string, NavItem[]> = {
  athlete: [
    { title: 'Inicio',        icon: Home,     path: '/athlete-dashboard' },
    { title: 'Entreno',       icon: Calendar, path: '/athlete/training' },
    { title: 'Competencias',  icon: Trophy,   path: '/athlete/competitions' },
    { title: 'Ajustes',       icon: Settings, path: '/settings' },
  ],
  coach: [
    { title: 'Inicio',        icon: Home,     path: '/coach-dashboard' },
    { title: 'Atletas',       icon: Users,    path: '/athletes' },
    { title: 'Entrenos',      icon: Calendar, path: '/training' },
    { title: 'Ajustes',       icon: Settings, path: '/settings' },
  ],
  delegate: [
    { title: 'Inicio',        icon: Home,     path: '/delegate-dashboard' },
    { title: 'Atletas',       icon: Users,    path: '/delegate/athletes' },
    { title: 'Competencias',  icon: Trophy,   path: '/delegate/competitions' },
    { title: 'Ajustes',       icon: Settings, path: '/settings' },
  ],
  finance: [
    { title: 'Inicio',        icon: Home,       path: '/finance-dashboard' },
    { title: 'Finanzas',      icon: DollarSign, path: '/finance' },
    { title: 'Ajustes',       icon: Settings,   path: '/settings' },
  ],
  parent: [
    { title: 'Inicio',        icon: Home,     path: '/parent-dashboard' },
    { title: 'Ajustes',       icon: Settings, path: '/settings' },
  ],
  admin: [
    { title: 'Inicio',        icon: Home,     path: '/admin-dashboard' },
    { title: 'Atletas',       icon: Users,    path: '/athletes' },
    { title: 'Entrenos',      icon: Calendar, path: '/training' },
    { title: 'Ajustes',       icon: Settings, path: '/settings' },
  ],
  leader: [
    { title: 'Inicio',        icon: Home,     path: '/leader-dashboard' },
    { title: 'Atletas',       icon: Users,    path: '/athletes' },
    { title: 'Finanzas',      icon: DollarSign, path: '/finance' },
    { title: 'Ajustes',       icon: Settings, path: '/settings' },
  ],
};

interface BottomNavProps {
  role?: string;
}

export function BottomNav({ role }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const items = ITEMS_BY_ROLE[role ?? 'athlete'] ?? ITEMS_BY_ROLE.athlete;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-xl border-t border-border safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1">
        {items.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path.split('?')[0]));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[56px] transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 transition-all', isActive && 'scale-110')} />
              <span className={cn('text-[10px] font-medium leading-none', isActive ? 'text-primary' : 'text-muted-foreground')}>
                {item.title}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
