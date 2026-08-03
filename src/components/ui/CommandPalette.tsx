import React, { useEffect, useState } from 'react';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import {
  Home, Users, Calendar, Trophy, DollarSign, Settings,
  Cog, BarChart3, UserCheck, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';

interface SearchHit {
  id: string;
  label: string;
  sublabel?: string;
  group: string;
  path: string;
}

const STATIC_LINKS: Record<string, { label: string; icon: React.ElementType; path: string }[]> = {
  admin: [
    { label: 'Dashboard Admin',    icon: Home,       path: '/admin-dashboard' },
    { label: 'Atletas',            icon: Users,      path: '/athletes' },
    { label: 'Entrenamientos',     icon: Calendar,   path: '/training' },
    { label: 'Competencias',       icon: Trophy,     path: '/competitions' },
    { label: 'Finanzas',           icon: DollarSign, path: '/finance' },
    { label: 'Configuración Club', icon: Cog,        path: '/club-config' },
    { label: 'Gestión Usuarios',   icon: UserCheck,  path: '/user-management' },
    { label: 'Reportes',           icon: BarChart3,  path: '/reports' },
    { label: 'Ajustes',            icon: Settings,   path: '/settings' },
  ],
  coach: [
    { label: 'Dashboard Entrenador', icon: Home,     path: '/coach-dashboard' },
    { label: 'Atletas',              icon: Users,    path: '/athletes' },
    { label: 'Entrenamientos',       icon: Calendar, path: '/training' },
    { label: 'Competencias',         icon: Trophy,   path: '/competitions' },
    { label: 'Ajustes',              icon: Settings, path: '/settings' },
  ],
  athlete: [
    { label: 'Mi Dashboard',    icon: Home,     path: '/athlete-dashboard' },
    { label: 'Mis Entrenos',    icon: Calendar, path: '/athlete/training' },
    { label: 'Mis Competencias',icon: Trophy,   path: '/athlete/competitions' },
    { label: 'Ajustes',         icon: Settings, path: '/settings' },
  ],
  delegate: [
    { label: 'Dashboard Delegado', icon: Home,   path: '/delegate-dashboard' },
    { label: 'Atletas',            icon: Users,  path: '/delegate/athletes' },
    { label: 'Competencias',       icon: Trophy, path: '/delegate/competitions' },
    { label: 'Pagos',              icon: DollarSign, path: '/delegate/payments' },
  ],
  finance: [
    { label: 'Dashboard Financiero', icon: Home,       path: '/finance-dashboard' },
    { label: 'Finanzas',             icon: DollarSign, path: '/finance' },
    { label: 'Ajustes',              icon: Settings,   path: '/settings' },
  ],
  leader: [
    { label: 'Dashboard Líder', icon: Home,       path: '/leader-dashboard' },
    { label: 'Atletas',         icon: Users,      path: '/athletes' },
    { label: 'Finanzas',        icon: DollarSign, path: '/finance' },
    { label: 'Competencias',    icon: Trophy,     path: '/competitions' },
    { label: 'Ajustes',         icon: Settings,   path: '/settings' },
  ],
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const [query, setQuery] = useState('');
  const [athletes, setAthletes] = useState<SearchHit[]>([]);

  const role = profile?.role ?? 'athlete';
  const links = STATIC_LINKS[role] ?? STATIC_LINKS.athlete;

  useEffect(() => {
    if (!open) { setQuery(''); setAthletes([]); return; }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) { setAthletes([]); return; }
    const canSearchAthletes = role !== 'athlete';
    if (!canSearchAthletes) return;

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, category')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(6);

      setAthletes(
        (data ?? []).map(a => ({
          id: a.id,
          label: `${a.first_name} ${a.last_name}`,
          sublabel: a.category ?? undefined,
          group: 'Atletas',
          path: `/athletes?highlight=${a.id}`,
        }))
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [query, role]);

  const filteredLinks = links.filter(l =>
    !query || l.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar páginas, atletas, competencias..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Sin resultados para "{query}"</CommandEmpty>

        {filteredLinks.length > 0 && (
          <CommandGroup heading="Navegación">
            {filteredLinks.map(link => (
              <CommandItem
                key={link.path}
                value={link.label}
                onSelect={() => handleSelect(link.path)}
                className="flex items-center gap-2"
              >
                <link.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{link.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {athletes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Atletas">
              {athletes.map(hit => (
                <CommandItem
                  key={hit.id}
                  value={hit.label}
                  onSelect={() => handleSelect(hit.path)}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <div>
                    <span>{hit.label}</span>
                    {hit.sublabel && (
                      <span className="text-xs text-muted-foreground ml-2">{hit.sublabel}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
