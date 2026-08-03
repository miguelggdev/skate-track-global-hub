import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AthleteReportData {
  id: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  category: string;
  level: string;
  status: string;
  join_date: string;
  athlete_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_notes?: string;
  achievements?: string;
  date_of_birth?: string;
  gender?: string;
  // Profile data
  avatar_url?: string;
  id_type?: string;
  id_number?: string;
  phone?: string;
}

// Hook to fetch ALL athletes for report generation (no pagination)
export const useAllAthletes = () => {
  return useQuery({
    queryKey: ['athletes', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select(`
          *,
          profiles(
            avatar_url,
            date_of_birth,
            phone
          )
        `)
        .order('first_name', { ascending: true });

      if (error) throw error;

      // Flatten the profile data into the athlete object for easier access
      const flattenedAthletes = (data ?? []).map(athlete => ({
        ...athlete,
        avatar_url: athlete.profiles?.avatar_url ?? undefined,
        id_type: undefined,
        id_number: undefined,
        date_of_birth: athlete.profiles?.date_of_birth ?? undefined,
        phone: athlete.profiles?.phone ?? undefined,
      })) as AthleteReportData[];

      return flattenedAthletes;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};