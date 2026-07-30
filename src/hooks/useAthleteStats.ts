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
  maleAthletes: number;
  femaleAthletes: number;
  newRecruitsThisMonth: number;
  newRecruitsThisYear: number;
  retentionRate: number;
  inactiveAthletes: number;
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

      if (totalError) throw totalError;

      // Get school athletes count (athletes with studies records)
      const { count: schoolAthletes, error: schoolError } = await supabase
        .from('athlete_studies')
        .select('athlete_id', { count: 'exact', head: true })
        .not('school_name', 'is', null);

      if (schoolError) throw schoolError;

      // Get detailed athlete data for additional statistics
      const { data: athleteData, error: athleteError } = await supabase
        .from('athletes')
        .select('category, gender, created_at, join_date, status');

      if (athleteError) throw athleteError;

      const activeAthletes = athleteData.filter(athlete => athlete.status === 'active');
      
      // Count athletes by category
      const categoryCounts = activeAthletes.reduce((acc, athlete) => {
        acc[athlete.category] = (acc[athlete.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Count athletes by gender
      const genderCounts = activeAthletes.reduce((acc, athlete) => {
        if (athlete.gender) {
          acc[athlete.gender] = (acc[athlete.gender] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Calculate new recruits this month and year
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisYearStart = new Date(now.getFullYear(), 0, 1);
      
      const newRecruitsThisMonth = activeAthletes.filter(athlete => {
        const joinDate = new Date(athlete.join_date);
        return joinDate >= thisMonthStart;
      }).length;
      
      const newRecruitsThisYear = activeAthletes.filter(athlete => {
        const joinDate = new Date(athlete.join_date);
        return joinDate >= thisYearStart;
      }).length;

      // Calculate retention rate (athletes who joined last year and are still active)
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
      
      const athletesJoinedLastYear = athleteData.filter(athlete => {
        const joinDate = new Date(athlete.join_date);
        return joinDate >= lastYearStart && joinDate <= lastYearEnd;
      }).length;
      
      const activeFromLastYear = athleteData.filter(athlete => {
        const joinDate = new Date(athlete.join_date);
        return (joinDate >= lastYearStart && joinDate <= lastYearEnd) && athlete.status === 'active';
      }).length;
      
      const retentionRate = athletesJoinedLastYear > 0 ? (activeFromLastYear / athletesJoinedLastYear) * 100 : 0;

      // Count inactive athletes
      const inactiveAthletes = athleteData.filter(athlete => athlete.status !== 'active').length;

      const stats: AthleteStats = {
        totalAthletes: totalAthletes || 0,
        schoolAthletes: schoolAthletes || 0,
        menoresAthletes: categoryCounts['menores'] || 0,
        transicionAthletes: categoryCounts['transicion'] || 0,
        mayoresAthletes: categoryCounts['mayores'] || 0,
        escuelaAthletes: categoryCounts['escuela'] || 0,
        juvenilAthletes: categoryCounts['juvenil'] || 0,
        maleAthletes: genderCounts['masculino'] || 0,
        femaleAthletes: genderCounts['femenino'] || 0,
        newRecruitsThisMonth,
        newRecruitsThisYear,
        retentionRate: Math.round(retentionRate),
        inactiveAthletes,
      };

      return stats;
    },
  });
};