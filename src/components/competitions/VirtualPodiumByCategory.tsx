import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MedalRecordingDialog } from './MedalRecordingDialog';
import { useUserProfile } from '@/hooks/useUserProfile';

type MedalType = 'gold' | 'silver' | 'bronze' | 'destacado';

interface MedalRecord {
  id: string;
  competition_id: string;
  athlete_id: string;
  event_type: string;
  medal_type: MedalType;
  position: number | null;
  time_achieved: string | null;
  notes: string | null;
  athletes?: {
    first_name: string;
    last_name: string;
    category: string;
    gender: string;
    avatar_url?: string;
  };
}

interface PodiumAthleteSlot {
  position: 1 | 2 | 3;
  medal: MedalType;
  name: string;
  initials: string;
  avatarUrl?: string;
  time?: string;
  event: string;
}

const MEDAL_CONFIG: Record<MedalType, { label: string; color: string; gradient: string; icon: React.ReactNode; height: string }> = {
  gold: {
    label: 'Oro', color: 'text-yellow-600', gradient: 'from-yellow-400 to-yellow-600',
    icon: <Trophy className="h-5 w-5 text-yellow-500" />, height: 'h-32',
  },
  silver: {
    label: 'Plata', color: 'text-slate-500', gradient: 'from-slate-300 to-slate-500',
    icon: <Medal className="h-5 w-5 text-slate-400" />, height: 'h-24',
  },
  bronze: {
    label: 'Bronce', color: 'text-amber-700', gradient: 'from-amber-400 to-amber-700',
    icon: <Award className="h-5 w-5 text-amber-600" />, height: 'h-20',
  },
  destacado: {
    label: 'Destacado', color: 'text-blue-600', gradient: 'from-blue-400 to-blue-600',
    icon: <Star className="h-5 w-5 text-blue-500" />, height: 'h-20',
  },
};

const PODIUM_ORDER: Array<{ position: 1 | 2 | 3; medal: MedalType }> = [
  { position: 2, medal: 'silver' },
  { position: 1, medal: 'gold' },
  { position: 3, medal: 'bronze' },
];

interface VirtualPodiumByCategoryProps {
  competitionId: string;
  competitionName: string;
}

export function VirtualPodiumByCategory({ competitionId, competitionName }: VirtualPodiumByCategoryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRama, setSelectedRama] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const { isAdmin, profile } = useUserProfile();
  const canManage = isAdmin || profile?.role === 'delegate';

  const { data: medals = [], isLoading } = useQuery({
    queryKey: ['competition-medals', competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_results')
        .select(`
          id, competition_id, athlete_id, event_type, medal_type, position, time_achieved, notes,
          athletes (first_name, last_name, category, gender, avatar_url)
        `)
        .eq('competition_id', competitionId)
        .not('medal_type', 'is', null)
        .order('medal_type', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MedalRecord[];
    },
  });

  const categories = useMemo(() => {
    const cats = [...new Set(medals.map(m => m.athletes?.category).filter(Boolean))];
    return cats.sort();
  }, [medals]);

  const events = useMemo(() => {
    const evts = [...new Set(medals.map(m => m.event_type).filter(Boolean))];
    return evts.sort();
  }, [medals]);

  const filtered = useMemo(() => {
    return medals.filter(m => {
      if (selectedCategory !== 'all' && m.athletes?.category !== selectedCategory) return false;
      if (selectedRama !== 'all') {
        const genderMatch = selectedRama === 'Damas'
          ? m.athletes?.gender === 'femenino'
          : m.athletes?.gender === 'masculino';
        if (!genderMatch) return false;
      }
      if (selectedEvent !== 'all' && m.event_type !== selectedEvent) return false;
      return true;
    });
  }, [medals, selectedCategory, selectedRama, selectedEvent]);

  const podiumSlots = useMemo<PodiumAthleteSlot[]>(() => {
    return PODIUM_ORDER.map(({ position, medal }) => {
      const record = filtered.find(m => m.medal_type === medal);
      if (!record) return null;
      const a = record.athletes;
      return {
        position,
        medal,
        name: a ? `${a.first_name} ${a.last_name}` : '—',
        initials: a ? `${a.first_name[0]}${a.last_name[0]}` : '?',
        avatarUrl: a?.avatar_url,
        time: record.time_achieved ?? undefined,
        event: record.event_type,
      };
    }).filter(Boolean) as PodiumAthleteSlot[];
  }, [filtered]);

  const medalCounts = useMemo(() => ({
    gold: filtered.filter(m => m.medal_type === 'gold').length,
    silver: filtered.filter(m => m.medal_type === 'silver').length,
    bronze: filtered.filter(m => m.medal_type === 'bronze').length,
    destacado: filtered.filter(m => m.medal_type === 'destacado').length,
  }), [filtered]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Podio Virtual por Categoría
            </CardTitle>
            <CardDescription>{competitionName}</CardDescription>
          </div>
          {canManage && (
            <MedalRecordingDialog competitionId={competitionId} competitionName={competitionName} />
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedRama} onValueChange={setSelectedRama}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Rama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Damas y Varones</SelectItem>
              <SelectItem value="Damas">Damas</SelectItem>
              <SelectItem value="Varones">Varones</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Prueba" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las pruebas</SelectItem>
              {events.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Cargando podio...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground text-sm">
              {medals.length === 0
                ? 'Aún no hay medallas registradas para esta competencia.'
                : 'No hay medallas con los filtros seleccionados.'}
            </p>
            {canManage && medals.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Usa el botón "Registrar Medalla" para asignar medallas a los atletas.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Podio visual */}
            <div className="flex items-end justify-center gap-4 sm:gap-8 py-6">
              {PODIUM_ORDER.map(({ position, medal }) => {
                const slot = podiumSlots.find(s => s.position === position);
                const cfg = MEDAL_CONFIG[medal];

                return (
                  <div key={position} className="flex flex-col items-center min-w-[90px]">
                    {slot ? (
                      <>
                        <div className="relative mb-3">
                          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-background shadow-lg ring-2 ring-border">
                            <AvatarImage src={slot.avatarUrl} alt={slot.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                              {slot.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-2 -right-2 bg-background rounded-full p-1 shadow-md">
                            {cfg.icon}
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-center leading-tight max-w-[90px] mb-1">
                          {slot.name}
                        </p>
                        {slot.time && (
                          <p className="text-[10px] text-muted-foreground font-mono mb-2">{slot.time}</p>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center mb-3">
                        <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-3`}>
                          <span className="text-2xl text-muted-foreground/30">{position}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">Sin asignar</p>
                      </div>
                    )}

                    <div className={`w-20 sm:w-24 ${cfg.height} bg-gradient-to-t ${cfg.gradient} rounded-t-lg flex items-end justify-center pb-2 shadow-lg`}>
                      <span className="text-white font-bold text-2xl">{position}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lista completa de medallas filtradas */}
            {filtered.length > 3 && (
              <div className="border border-border rounded-lg divide-y divide-border">
                {filtered.map(m => {
                  const cfg = MEDAL_CONFIG[m.medal_type];
                  const a = m.athletes;
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-shrink-0">{cfg.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {a ? `${a.first_name} ${a.last_name}` : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">{m.event_type} — {a?.category}</p>
                      </div>
                      {m.time_achieved && (
                        <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{m.time_achieved}</span>
                      )}
                      <Badge variant="outline" className={`text-xs flex-shrink-0 ${cfg.color}`}>
                        {cfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Conteo de medallas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border">
              {([['gold', 'Oro', 'text-yellow-600'], ['silver', 'Plata', 'text-slate-500'], ['bronze', 'Bronce', 'text-amber-700'], ['destacado', 'Destacado', 'text-blue-600']] as const).map(([key, label, cls]) => (
                <div key={key} className="text-center">
                  <p className={`text-2xl font-bold ${cls}`}>{medalCounts[key]}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
