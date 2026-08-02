import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MedicalSession {
  id: string;
  athlete_id: string;
  session_type: string;
  session_date: string;
  provider_name: string | null;
  notes: string | null;
  status: string;
}

export const useAthleteMedicalSessions = (athleteId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['medical-sessions', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_sessions')
        .select('*')
        .eq('athlete_id', athleteId!)
        .order('session_date', { ascending: false });

      if (error) throw error;
      return (data ?? []) as MedicalSession[];
    },
    enabled: !!athleteId,
  });

  const addMutation = useMutation({
    mutationFn: async (session: Omit<MedicalSession, 'id'>) => {
      const { error } = await supabase.from('medical_sessions').insert(session);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Sesión médica registrada' });
      queryClient.invalidateQueries({ queryKey: ['medical-sessions', athleteId] });
    },
    onError: () => {
      toast({ title: 'Error al registrar sesión', variant: 'destructive' });
    },
  });

  const getSessionCounts = (year?: number, month?: number) => {
    let filtered = sessions;
    if (year)            filtered = filtered.filter(s => new Date(s.session_date).getFullYear() === year);
    if (month !== undefined) filtered = filtered.filter(s => new Date(s.session_date).getMonth() === month);

    return {
      physiotherapy: filtered.filter(s => s.session_type === 'physiotherapy').length,
      psychology:    filtered.filter(s => s.session_type === 'psychology').length,
      medical:       filtered.filter(s => s.session_type === 'medical_followup').length,
      total:         filtered.length,
    };
  };

  return { sessions, loading, addSession: addMutation.mutate, isAdding: addMutation.isPending, getSessionCounts, refetch };
};
