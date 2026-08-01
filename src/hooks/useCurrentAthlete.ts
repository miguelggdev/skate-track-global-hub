import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';

interface AthleteData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string | null;
  category: string;
  level: string;
  status: string;
  performance_score: number;
  athlete_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_notes: string | null;
  achievements: string | null;
  bio?: string | null;
  personal_values?: string | null;
  short_term_goals?: string | null;
  long_term_goals?: string | null;
  years_experience?: number | null;
  photo_url?: string | null;
  gender?: string | null;
  coach_id?: string | null;
}

export const useCurrentAthlete = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();

  const isAthlete = !!profile && profile.role === 'athlete';

  const { data: athlete = null, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['current-athlete', user?.id],
    queryFn: async (): Promise<AthleteData | null> => {
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No athlete record — create one automatically from profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, date_of_birth')
            .eq('id', user!.id)
            .single();

          const { data: created, error: createError } = await supabase
            .from('athletes')
            .insert({
              user_id:           user!.id,
              first_name:        profileData?.first_name ?? '',
              last_name:         profileData?.last_name  ?? '',
              email:             profileData?.email      ?? '',
              date_of_birth:     profileData?.date_of_birth,
              category:          'juvenil',
              level:             'juvenil_primer_ano',
              status:            'active',
              performance_score: 0,
            })
            .select()
            .single();

          if (createError) throw createError;
          return created as AthleteData;
        }
        throw error;
      }

      return data as AthleteData;
    },
    enabled: !!user && isAthlete,
  });

  const refreshAthlete = () => queryClient.invalidateQueries({ queryKey: ['current-athlete', user?.id] });

  return {
    athlete,
    loading,
    error: queryError ? 'Failed to fetch athlete data' : null,
    refreshAthlete,
  };
};
