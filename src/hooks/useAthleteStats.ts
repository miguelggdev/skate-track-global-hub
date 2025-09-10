import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AthleteStats {
  totalAthletes: number;
  schoolAthletes: number;
  menoresAthletes: number;
  transicionAthletes: number;
  mayoresAthletes: number;
  escuelaAthletes: number;
  juvenilAthletes: number;
}

export const useAthleteStats = () => {
  return useQuery({
    queryKey: ['athlete-stats'],
    queryFn: async () => {
      // Get total athletes count
      const { count: totalAthletes, error: totalError } = await supabase
        .from('athletes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (totalError) {
        console.error('Error fetching total athletes:', totalError);
        throw totalError;
      }

      // Get school athletes count (athletes with studies records)
      const { count: schoolAthletes, error: schoolError } = await supabase
        .from('athlete_studies')
        .select('athlete_id', { count: 'exact', head: true })
        .not('school_name', 'is', null);

      if (schoolError) {
        console.error('Error fetching school athletes:', schoolError);
        throw schoolError;
      }

      // Get athletes by category
      const { data: categoryData, error: categoryError } = await supabase
        .from('athletes')
        .select('category')
        .eq('status', 'active');

      if (categoryError) {
        console.error('Error fetching category data:', categoryError);
        throw categoryError;
      }

      // Count athletes by category
      const categoryCounts = categoryData.reduce((acc, athlete) => {
        acc[athlete.category] = (acc[athlete.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const stats: AthleteStats = {
        totalAthletes: totalAthletes || 0,
        schoolAthletes: schoolAthletes || 0,
        menoresAthletes: categoryCounts['menores'] || 0,
        transicionAthletes: categoryCounts['transicion'] || 0,
        mayoresAthletes: categoryCounts['mayores'] || 0,
        escuelaAthletes: categoryCounts['escuela'] || 0,
        juvenilAthletes: categoryCounts['juvenil'] || 0,
      };

      return stats;
    },
  });
};