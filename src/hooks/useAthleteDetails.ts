import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AthleteDetails {
  // Basic athlete info
  id: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  category: string;
  level: string;
  status: string;
  performance_score?: number;
  join_date: string;
  created_at: string;
  athlete_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_notes?: string;
  achievements?: string;
  date_of_birth?: string;
  gender?: string;
  
  // Profile data
  phone?: string;
  avatar_url?: string;
  bio?: string;
  id_number?: string;
  id_type?: string;
  
  // Family data
  family?: {
    parent_name?: string;
    parent_phone?: string;
    parent_email?: string;
    guardian_name?: string;
    guardian_relationship?: string;
    guardian_phone?: string;
    guardian_email?: string;
  };
  
  // Body/Medical data
  body_info?: {
    weight?: number;
    height?: number;
    size?: string;
    blood_type?: string;
    allergies?: string;
    surgeries?: string;
    injuries?: string;
    limitations?: string;
  };
  
  // Studies data
  studies?: {
    education_level?: string;
    current_grade?: string;
    school_name?: string;
    school_address?: string;
    school_phone?: string;
    school_email?: string;
  };
  
  // Equipment data
  equipment?: {
    boot_size?: number;
    wheel_diameter?: number;
    frame_size?: string;
    boot_brand?: string;
    frame_brand?: string;
    track_wheels_brand?: string;
    helmet_brand?: string;
  };
  
  // History data
  history?: {
    years_experience?: number;
    start_date?: string;
    league_date?: string;
    federation_date?: string;
    is_league?: boolean;
    is_federated?: boolean;
    previous_club?: string;
  };
}

export const useAthleteDetails = (athleteId: string | null) => {
  return useQuery({
    queryKey: ['athlete-details', athleteId],
    queryFn: async (): Promise<AthleteDetails | null> => {
      if (!athleteId) return null;

      // Fetch athlete basic data with profile
      const { data: athleteData, error: athleteError } = await supabase
        .from('athletes')
        .select(`
          *,
          profiles!inner(
            phone,
            avatar_url,
            bio,
            id_number,
            id_type
          )
        `)
        .eq('id', athleteId)
        .single();

      if (athleteError) {
        console.error('Error fetching athlete:', athleteError);
        throw athleteError;
      }

      // Fetch family data
      const { data: familyData } = await supabase
        .from('athlete_family')
        .select('*')
        .eq('athlete_id', athleteId)
        .maybeSingle();

      // Fetch body info
      const { data: bodyData } = await supabase
        .from('athlete_body_info')
        .select('*')
        .eq('athlete_id', athleteId)
        .maybeSingle();

      // Fetch studies data
      const { data: studiesData } = await supabase
        .from('athlete_studies')
        .select('*')
        .eq('athlete_id', athleteId)
        .maybeSingle();

      // Fetch equipment data
      const { data: equipmentData } = await supabase
        .from('athlete_equipment')
        .select('*')
        .eq('athlete_id', athleteId)
        .maybeSingle();

      // Fetch history data
      const { data: historyData } = await supabase
        .from('athlete_history')
        .select('*')
        .eq('athlete_id', athleteId)
        .maybeSingle();

      // Combine all data
      const details: AthleteDetails = {
        ...athleteData,
        phone: athleteData.profiles?.phone,
        avatar_url: athleteData.profiles?.avatar_url,
        bio: athleteData.profiles?.bio,
        id_number: athleteData.profiles?.id_number,
        id_type: athleteData.profiles?.id_type,
        family: familyData || undefined,
        body_info: bodyData || undefined,
        studies: studiesData || undefined,
        equipment: equipmentData || undefined,
        history: historyData || undefined,
      };

      return details;
    },
    enabled: !!athleteId,
  });
};