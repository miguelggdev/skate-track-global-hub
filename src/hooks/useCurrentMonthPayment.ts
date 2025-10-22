import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook to validate if an athlete has paid for the current month
export const useCurrentMonthPayment = (athleteId?: string) => {
  return useQuery({
    queryKey: ['current-month-payment', athleteId],
    queryFn: async () => {
      if (!athleteId) return null;

      // Get the athlete with payment status
      const { data: athlete, error: athleteError } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', athleteId)
        .single();

      if (athleteError) {
        throw new Error(athleteError.message);
      }

      // Get current month boundaries
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Check if athlete has paid for current month
      const isCurrentMonthPaid = athlete.last_payment_month 
        ? new Date(athlete.last_payment_month) >= currentMonthStart
        : false;

      // Get recent transactions for display
      const { data: transactions } = await supabase
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
        .order('transaction_date', { ascending: false })
        .limit(3);

      return {
        hasPaid: isCurrentMonthPaid,
        paymentStatus: athlete.payment_status || 'pending',
        lastPaymentMonth: athlete.last_payment_month,
        lastPaymentDate: athlete.last_payment_date,
        transactions: transactions || [],
        athlete: athlete,
      };
    },
    enabled: !!athleteId,
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
