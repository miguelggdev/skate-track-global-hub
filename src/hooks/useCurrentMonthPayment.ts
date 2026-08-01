import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook to validate if an athlete has paid for the current month
export const useCurrentMonthPayment = (athleteId?: string) => {
  return useQuery({
    queryKey: ['current-month-payment', athleteId],
    queryFn: async () => {
      if (!athleteId) return null;

      // Get the athlete info
      const { data: athlete, error: athleteError } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', athleteId)
        .single();

      if (athleteError) {
        throw new Error(athleteError.message);
      }

      // Get current month boundaries (local time to avoid timezone issues)
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      // Format dates as YYYY-MM-DD for Supabase
      const startDateStr = currentMonthStart.toISOString().split('T')[0];
      const endDateStr = nextMonthStart.toISOString().split('T')[0];

      // Query paid monthly payments within current month directly
      const { data: currentMonthPayments, error: paymentsError } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          athletes:athlete_id (
            id,
            first_name,
            last_name,
            athlete_number,
            date_of_birth
          )
        `)
        .eq('athlete_id', athleteId)
        .eq('transaction_type', 'mensualidad')
        .eq('payment_status', 'paid')
        .gte('transaction_date', startDateStr)
        .lt('transaction_date', endDateStr)
        .order('transaction_date', { ascending: false })
        .limit(3);

      if (paymentsError) {
        throw new Error(paymentsError.message);
      }

      // Athlete has paid if at least one paid mensualidad exists in current month
      const hasPaid = (currentMonthPayments?.length ?? 0) > 0;
      const lastTx = currentMonthPayments?.[0] ?? null;

      return {
        hasPaid,
        paymentStatus: hasPaid ? 'paid' : 'pending',
        lastPaymentMonth: lastTx?.transaction_date ?? null,
        lastPaymentDate: lastTx?.transaction_date ?? null,
        transactions: currentMonthPayments ?? [],
        athlete: athlete,
      };
    },
    enabled: !!athleteId,
    staleTime: 0, // Always re-evaluate on invalidation
  });
};

// Hook to get club settings for letter generation
export const useClubSettings = () => {
  return useQuery({
    queryKey: ['club-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw new Error(error.message);
      }

      return data;
    },
  });
};
