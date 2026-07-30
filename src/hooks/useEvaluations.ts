import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type EvaluationRow = Database['public']['Tables']['evaluations']['Row'];
type EvaluationInsert = Database['public']['Tables']['evaluations']['Insert'];
type EvaluationUpdate = Database['public']['Tables']['evaluations']['Update'];

export type Evaluation = EvaluationRow & {
  athletes?: { first_name: string; last_name: string; category: string } | null;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useEvaluations(athleteId?: string) {
  return useQuery({
    queryKey: ['evaluations', athleteId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('evaluations')
        .select('*, athletes (first_name, last_name, category)')
        .order('evaluation_date', { ascending: false });
      if (athleteId) q = q.eq('athlete_id', athleteId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Evaluation[];
    },
  });
}

export function useLatestEvaluation(athleteId: string | null) {
  return useQuery({
    queryKey: ['evaluation-latest', athleteId],
    enabled: !!athleteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('athlete_id', athleteId!)
        .order('evaluation_date', { ascending: false })
        .limit(2);
      if (error) throw error;
      return (data ?? []) as EvaluationRow[];
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAddEvaluation() {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: EvaluationInsert) => {
      const { data, error } = await supabase
        .from('evaluations')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['evaluations'] });
      qc.invalidateQueries({ queryKey: ['evaluation-latest', vars.athlete_id] });
      toast({ title: 'Evaluación registrada' });
    },
  });
}

export function useUpdateEvaluation() {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...update }: { id: string } & EvaluationUpdate) => {
      const { data, error } = await supabase
        .from('evaluations')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluations'] });
      qc.invalidateQueries({ queryKey: ['evaluation-latest'] });
      toast({ title: 'Evaluación actualizada' });
    },
  });
}
