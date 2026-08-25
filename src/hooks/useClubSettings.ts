import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClubSettings {
  id: string;
  club_name: string;
  club_logo_url?: string;
  club_description?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_twitter?: string;
  president_name?: string;
  president_phone?: string;
  president_email?: string;
  coach_name?: string;
  coach_phone?: string;
  coach_email?: string;
  delegate_name?: string;
  delegate_phone?: string;
  league?: string;
  country?: string;
}

const CLUB_SELECT =
  'id, club_name:name, club_logo_url:logo_url, club_description:description, ' +
  'address, contact_email, contact_phone, website_url, ' +
  'president_name, president_email, delegate_name, delegate_phone, league, country';

export const useClubSettings = () => {
  return useQuery({
    queryKey: ['club-settings'],
    queryFn: async (): Promise<ClubSettings | null> => {
      const { data, error } = await supabase
        .from('clubs')
        .select(CLUB_SELECT)
        .maybeSingle();

      if (error) throw error;

      return data as unknown as ClubSettings | null;
    },
  });
};
