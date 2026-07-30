import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatTimeMs } from '@/lib/time-formatter';

export interface RaceEvent {
  id: string;
  name: string;
  event_type: string;
  distance_m: number | null;
  description: string | null;
  category: string | null;
}

export interface TimeRecord {
  id: string;
  athlete_id: string;
  race_event_id: string;
  competition_id: string | null;
  session_id: string | null;
  time_ms: number;
  time_formatted: string | null;
  position: number | null;
  is_personal_best: boolean;
  is_club_record: boolean;
  conditions: string | null;
  recorded_by: string | null;
  recorded_at: string;
  notes: string | null;
  // joined
  race_events?: { name: string; event_type: string; distance_m: number | null };
  athletes?: { first_name: string; last_name: string; category: string | null; gender: string | null };
}

export interface NewTimeRecord {
  athlete_id: string;
  race_event_id: string;
  competition_id?: string | null;
  session_id?: string | null;
  time_ms: number;
  time_formatted: string;
  position?: number | null;
  conditions?: string | null;
  notes?: string | null;
  recorded_by?: string | null;
}

export interface ClubRankingRow {
  athlete_id: string;
  first_name: string;
  last_name: string;
  category: string | null;
  gender: string | null;
  best_time_ms: number;
  recorded_at: string;
  is_club_record: boolean;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useRaceEvents() {
  return useQuery({
    queryKey: ['race-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('race_events')
        .select('*')
        .order('distance_m', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as RaceEvent[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useTimeRecords(athleteId: string, raceEventId?: string) {
  return useQuery({
    queryKey: ['time-records', athleteId, raceEventId],
    queryFn: async () => {
      let q = supabase
        .from('time_records')
        .select('*, race_events(name, event_type, distance_m)')
        .eq('athlete_id', athleteId)
        .order('recorded_at', { ascending: true });

      if (raceEventId) q = q.eq('race_event_id', raceEventId);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TimeRecord[];
    },
    enabled: !!athleteId,
  });
}

export function useClubRanking(raceEventId: string) {
  return useQuery({
    queryKey: ['club-ranking', raceEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_records')
        .select(`
          athlete_id,
          time_ms,
          recorded_at,
          is_club_record,
          athletes!inner(first_name, last_name, category, gender)
        `)
        .eq('race_event_id', raceEventId)
        .eq('is_personal_best', true)
        .order('time_ms', { ascending: true });

      if (error) throw error;

      interface RankingRaw {
        athlete_id: string;
        time_ms: number;
        recorded_at: string;
        is_club_record: boolean;
        athletes: { first_name: string; last_name: string; category: string; gender: string };
      }
      return (data ?? [] as RankingRaw[]).map(r => {
        const row = r as RankingRaw;
        return {
          athlete_id: row.athlete_id,
          first_name: row.athletes.first_name,
          last_name: row.athletes.last_name,
          category: row.athletes.category,
          gender: row.athletes.gender,
          best_time_ms: row.time_ms,
          recorded_at: row.recorded_at,
          is_club_record: row.is_club_record,
        };
      }) as ClubRankingRow[];
    },
    enabled: !!raceEventId,
  });
}

export function useAddTimeRecord() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (record: NewTimeRecord) => {
      const { data, error } = await supabase
        .from('time_records')
        .insert(record)
        .select('id, is_personal_best')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['time-records', variables.athlete_id] });
      qc.invalidateQueries({ queryKey: ['club-ranking', variables.race_event_id] });
      if (data.is_personal_best) {
        toast.success('¡Nuevo récord personal!', { description: `Tiempo: ${formatTimeMs(variables.time_ms)}s` });
      } else {
        toast.success('Tiempo registrado correctamente');
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTimeRecord() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, athleteId, raceEventId }: { id: string; athleteId: string; raceEventId: string }) => {
      const { error } = await supabase.from('time_records').delete().eq('id', id);
      if (error) throw error;
      return { athleteId, raceEventId };
    },
    onSuccess: ({ athleteId, raceEventId }) => {
      qc.invalidateQueries({ queryKey: ['time-records', athleteId] });
      qc.invalidateQueries({ queryKey: ['club-ranking', raceEventId] });
      toast.success('Tiempo eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
