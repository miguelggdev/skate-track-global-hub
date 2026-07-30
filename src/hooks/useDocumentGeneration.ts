import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SaveDocumentInput {
  title: string;
  document_type: 'carta_permiso_colegio' | 'carnet_deportista' | 'planilla_inscripcion';
  athlete_id?: string;
  competition_id?: string;
  notes?: string;
}

export function useSaveDocument() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveDocumentInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase
        .from('documents')
        .insert({
          ...input,
          generated_pdf: true,
          doc_status: 'activo',
          issued_by: session?.user.id ?? null,
          issued_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Registro guardado', description: 'El documento quedó en el historial.' });
    },
  });
}

export function useDocumentHistory(athleteId?: string) {
  return useQuery({
    queryKey: ['documents', athleteId],
    queryFn: async () => {
      let q = supabase
        .from('documents')
        .select('id, title, document_type, issued_at, doc_status, athlete_id, competition_id')
        .order('issued_at', { ascending: false })
        .limit(50);
      if (athleteId) q = q.eq('athlete_id', athleteId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: true,
  });
}
