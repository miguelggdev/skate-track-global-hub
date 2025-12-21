import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DelegateStats {
  totalAthletes: number;
  athletesByCategory: Record<string, number>;
  upcomingCompetitions: number;
  pendingPayments: number;
  pendingPaymentsAmount: number;
  completedPaymentsAmount: number;
  upcomingBirthdays: Array<{
    id: string;
    name: string;
    date_of_birth: string;
    daysUntil: number;
  }>;
}

export const useDelegateStats = () => {
  return useQuery({
    queryKey: ['delegate-stats'],
    queryFn: async (): Promise<DelegateStats> => {
      // Get total athletes
      const { data: athletes, error: athletesError } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, category, date_of_birth, status')
        .eq('status', 'active');

      if (athletesError) throw athletesError;

      // Calculate athletes by category
      const athletesByCategory: Record<string, number> = {};
      athletes?.forEach(athlete => {
        const category = athlete.category || 'Sin categoría';
        athletesByCategory[category] = (athletesByCategory[category] || 0) + 1;
      });

      // Calculate upcoming birthdays (next 30 days)
      const today = new Date();
      const upcomingBirthdays = athletes
        ?.filter(athlete => athlete.date_of_birth)
        .map(athlete => {
          const dob = new Date(athlete.date_of_birth!);
          const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          if (thisYearBirthday < today) {
            thisYearBirthday.setFullYear(today.getFullYear() + 1);
          }
          const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: athlete.id,
            name: `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim(),
            date_of_birth: athlete.date_of_birth!,
            daysUntil,
          };
        })
        .filter(b => b.daysUntil <= 30 && b.daysUntil >= 0)
        .sort((a, b) => a.daysUntil - b.daysUntil) || [];

      // Get upcoming competitions
      const { data: competitions, error: competitionsError } = await supabase
        .from('competitions')
        .select('id')
        .gte('start_date', today.toISOString().split('T')[0])
        .in('status', ['upcoming', 'ongoing']);

      if (competitionsError) throw competitionsError;

      // Get payments (excluding mensualidad and anualidad for delegate view)
      const { data: payments, error: paymentsError } = await supabase
        .from('financial_transactions')
        .select('id, amount, payment_status, transaction_type')
        .not('transaction_type', 'in', '("mensualidad","anualidad")');

      if (paymentsError) throw paymentsError;

      const pendingPayments = payments?.filter(p => p.payment_status === 'pending' || p.payment_status === 'overdue') || [];
      const completedPayments = payments?.filter(p => p.payment_status === 'paid') || [];

      return {
        totalAthletes: athletes?.length || 0,
        athletesByCategory,
        upcomingCompetitions: competitions?.length || 0,
        pendingPayments: pendingPayments.length,
        pendingPaymentsAmount: pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        completedPaymentsAmount: completedPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        upcomingBirthdays,
      };
    },
  });
};
