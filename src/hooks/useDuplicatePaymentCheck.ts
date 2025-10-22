import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDuplicatePaymentCheck = (
  athleteId: string | undefined, 
  transactionDate: Date | undefined,
  transactionType: string | undefined,
  excludeTransactionId?: string // For edit mode: exclude current transaction
) => {
  return useQuery({
    queryKey: ['duplicate-payment-check', athleteId, transactionDate, transactionType, excludeTransactionId],
    queryFn: async () => {
      if (!athleteId || !transactionDate || transactionType !== 'mensualidad') {
        return { hasDuplicate: false, existingPayment: null };
      }

      // Get month start and end boundaries
      const date = new Date(transactionDate);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      let query = supabase
        .from('financial_transactions')
        .select('*')
        .eq('athlete_id', athleteId)
        .eq('transaction_type', 'mensualidad')
        .neq('payment_status', 'cancelled')
        .gte('transaction_date', monthStart.toISOString().split('T')[0])
        .lte('transaction_date', monthEnd.toISOString().split('T')[0]);

      // Exclude current transaction if editing
      if (excludeTransactionId) {
        query = query.neq('id', excludeTransactionId);
      }

      const { data, error } = await query.maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      return {
        hasDuplicate: !!data,
        existingPayment: data,
      };
    },
    enabled: !!athleteId && !!transactionDate && transactionType === 'mensualidad',
    staleTime: 0, // Always fetch fresh data
  });
};
