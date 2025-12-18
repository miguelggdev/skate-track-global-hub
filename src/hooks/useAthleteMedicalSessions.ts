import { useState, useEffect } from 'react';
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
  const [sessions, setSessions] = useState<MedicalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = async () => {
    if (!athleteId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('medical_sessions')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('session_date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching medical sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSession = async (session: Omit<MedicalSession, 'id'>) => {
    try {
      const { error } = await supabase
        .from('medical_sessions')
        .insert(session);

      if (error) throw error;
      toast({ title: 'Sesión médica registrada' });
      await fetchSessions();
    } catch (error) {
      console.error('Error adding session:', error);
      toast({ title: 'Error al registrar sesión', variant: 'destructive' });
    }
  };

  const getSessionCounts = (year?: number, month?: number) => {
    let filtered = sessions;
    
    if (year) {
      filtered = filtered.filter(s => new Date(s.session_date).getFullYear() === year);
    }
    if (month !== undefined) {
      filtered = filtered.filter(s => new Date(s.session_date).getMonth() === month);
    }

    return {
      physiotherapy: filtered.filter(s => s.session_type === 'physiotherapy').length,
      psychology: filtered.filter(s => s.session_type === 'psychology').length,
      medical: filtered.filter(s => s.session_type === 'medical_followup').length,
      total: filtered.length
    };
  };

  useEffect(() => {
    fetchSessions();
  }, [athleteId]);

  return { sessions, loading, addSession, getSessionCounts, refetch: fetchSessions };
};
