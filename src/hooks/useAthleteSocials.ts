import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AthleteSocials {
  id: string;
  athlete_id: string;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  whatsapp: string | null;
  youtube: string | null;
  twitter: string | null;
}

export const useAthleteSocials = (athleteId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: socials = null, isLoading: loading, refetch } = useQuery({
    queryKey: ['athlete-socials', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_socials')
        .select('*')
        .eq('athlete_id', athleteId!)
        .maybeSingle();

      if (error) throw error;
      return data as AthleteSocials | null;
    },
    enabled: !!athleteId,
  });

  const updateSocials = async (updates: Partial<AthleteSocials>) => {
    if (!athleteId) return;
    try {
      if (socials) {
        const { error } = await supabase.from('athlete_socials').update(updates).eq('athlete_id', athleteId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('athlete_socials').insert({ athlete_id: athleteId, ...updates });
        if (error) throw error;
      }
      toast({ title: 'Redes sociales actualizadas' });
      queryClient.invalidateQueries({ queryKey: ['athlete-socials', athleteId] });
    } catch {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    }
  };

  return { socials, loading, updateSocials, refetch };
};
