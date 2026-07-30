import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  uploaded_by?: string;
  created_at: string;
}

export interface CoachDetails {
  id?: string;
  license_number?: string;
  certification_level?: string;
  specialization?: string;
  years_experience?: number;
  bio?: string;
  is_active?: boolean;
}

export interface UserDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  role: string;
  coach_details?: CoachDetails;
}

const ROLE_PRIORITY = ['admin', 'leader', 'coach', 'delegate', 'finance', 'athlete'];

export const useUserDetails = (userId: string | null) => {
  return useQuery({
    queryKey: ['user-details', userId],
    queryFn: async (): Promise<UserDetails | null> => {
      if (!userId) return null;

      const [
        { data: profile, error: profileError },
        { data: rolesData, error: rolesError },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ]);

      if (profileError) throw profileError;
      if (!profile) return null;
      if (rolesError) throw rolesError;

      const roles = (rolesData || []).map((r) => r.role);
      const role = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? 'athlete';

      let coachDetails: CoachDetails | undefined;
      if (role === 'coach') {
        const { data: coach } = await supabase
          .from('coaches')
          .select('id, license_number, certification_level, specialization, years_experience, bio, is_active')
          .eq('user_id', userId)
          .maybeSingle();
        if (coach) coachDetails = coach;
      }

      return { ...profile, role, coach_details: coachDetails };
    },
    enabled: !!userId,
  });
};
