import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type AthleteCategory = Database['public']['Enums']['athlete_category'];
type AthleteStatus = Database['public']['Enums']['athlete_status'];

type AthleteGender = Database['public']['Enums']['athlete_gender'];
type AthleteLevel = Database['public']['Enums']['athlete_level'];

export interface DelegateAthlete {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: AthleteGender | null;
  category: AthleteCategory;
  level: AthleteLevel;
  status: AthleteStatus;
  profile_image_url: string | null;
  athlete_number: string | null;
  main_discipline: string | null;
  payment_status: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  join_date: string;
}

export const useDelegateAthletes = (filters?: {
  category?: AthleteCategory;
  status?: AthleteStatus;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['delegate-athletes', filters],
    queryFn: async (): Promise<DelegateAthlete[]> => {
      let query = supabase
        .from('athletes')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          email,
          date_of_birth,
          gender,
          category,
          level,
          status,
          profile_image_url,
          athlete_number,
          main_discipline,
          payment_status,
          emergency_contact_name,
          emergency_contact_phone,
          join_date
        `)
        .order('first_name', { ascending: true });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DelegateAthlete[];
    },
  });
};

export const useUpdateDelegateAthlete = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DelegateAthlete> & { id: string }) => {
      const { data, error } = await supabase
        .from('athletes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegate-athletes'] });
      queryClient.invalidateQueries({ queryKey: ['delegate-stats'] });
      toast({
        title: 'Atleta actualizado',
        description: 'La información del atleta se ha actualizado correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la información del atleta.',
        variant: 'destructive',
      });
      console.error('Error updating athlete:', error);
    },
  });
};
