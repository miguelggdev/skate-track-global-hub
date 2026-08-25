import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook to validate if an athlete has paid for the last month
export const useLastMonthPayment = (athleteId?: string) => {
  return useQuery({
    queryKey: ['last-month-payment', athleteId],
    queryFn: async () => {
      if (!athleteId) return null;

      // Get current date and calculate last month
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Look for payments of type 'mensualidad' in the last month
      const { data: transactions, error } = await supabase
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
        .gte('transaction_date', lastMonth.toISOString().split('T')[0])
        .lt('transaction_date', thisMonth.toISOString().split('T')[0]);

      if (error) {
        throw new Error(error.message);
      }

      // Return true if there's at least one paid monthly payment
      return {
        hasPaid: (transactions?.length ?? 0) > 0,
        transactions: transactions ?? [],
        athlete: transactions?.[0]?.athletes || null,
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
        .from('clubs')
        .select('id, club_name:name, club_logo_url:logo_url, address, contact_email, contact_phone, website_url')
        .maybeSingle();

      if (error) throw new Error(error.message);

      return data;
    },
  });
};