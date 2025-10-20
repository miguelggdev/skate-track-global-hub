import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserMedicalInfo {
  blood_type?: string;
  rh_factor?: string;
  diseases?: string;
  allergies?: string;
  disability?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  health_insurance?: string;
  sports_insurance_policy?: string;
  insurance_expiry_date?: string;
  insurance_document_url?: string;
}

export interface CoachDetails {
  id?: string;
  license_number?: string;
  certification_level?: string;
  specialization?: string;
  years_experience?: number;
  hourly_rate?: number;
  academic_level?: string;
  degree_title?: string;
  education_institution?: string;
  training_certifications?: string;
  experience_description?: string;
  coach_category?: string;
  federation_license_expiry?: string;
  license_photo_url?: string;
}

export interface UserDocument {
  id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  uploaded_at: string;
}

export interface UserDetails {
  // Profile data
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  avatar_url?: string;
  bio?: string;
  role: string;
  id_type?: string;
  id_number?: string;
  gender?: string;
  nationality?: string;
  address?: string;
  city?: string;
  department?: string;
  country?: string;
  landline_phone?: string;
  id_document_photo_url?: string;
  languages?: string[];
  observations?: string;
  status?: string;
  registered_by?: string;
  digital_signature_url?: string;
  data_consent?: boolean;
  accepts_regulations?: boolean;
  created_at: string;
  updated_at: string;
  
  // Medical info
  medical_info?: UserMedicalInfo;
  
  // Coach details (if applicable)
  coach_details?: CoachDetails;
  
  // Documents
  documents?: UserDocument[];
}

export const useUserDetails = (userId: string | null) => {
  return useQuery({
    queryKey: ['user-details', userId],
    queryFn: async (): Promise<UserDetails | null> => {
      if (!userId) return null;

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      if (!profile) return null;

      // Fetch medical info
      const { data: medicalInfo } = await supabase
        .from('user_medical_info')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Fetch coach details if role is coach
      let coachDetails = null;
      if (profile.role === 'coach') {
        const { data: coach } = await supabase
          .from('coaches')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        coachDetails = coach;
      }

      // Fetch documents
      const { data: documents } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      return {
        ...profile,
        medical_info: medicalInfo || undefined,
        coach_details: coachDetails || undefined,
        documents: documents || [],
      };
    },
    enabled: !!userId,
  });
};
