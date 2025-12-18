import { useState, useEffect } from 'react';
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
  const [socials, setSocials] = useState<AthleteSocials | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSocials = async () => {
    if (!athleteId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('athlete_socials')
        .select('*')
        .eq('athlete_id', athleteId)
        .maybeSingle();

      if (error) throw error;
      setSocials(data);
    } catch (error) {
      console.error('Error fetching socials:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSocials = async (updates: Partial<AthleteSocials>) => {
    if (!athleteId) return;

    try {
      if (socials) {
        const { error } = await supabase
          .from('athlete_socials')
          .update(updates)
          .eq('athlete_id', athleteId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('athlete_socials')
          .insert({ athlete_id: athleteId, ...updates });

        if (error) throw error;
      }

      toast({ title: 'Redes sociales actualizadas' });
      await fetchSocials();
    } catch (error) {
      console.error('Error updating socials:', error);
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchSocials();
  }, [athleteId]);

  return { socials, loading, updateSocials, refetch: fetchSocials };
};
