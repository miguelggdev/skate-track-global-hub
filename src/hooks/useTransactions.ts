import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Transaction = Database['public']['Tables']['financial_transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['financial_transactions']['Insert'];

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          athletes:athlete_id (
            id,
            first_name,
            last_name,
            email
          ),
          teams:team_id (
            id,
            name
          )
        `)
        .order('transaction_date', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      queryClient.invalidateQueries({ queryKey: ['current-month-payment'] });
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear la transacción: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TransactionInsert> }) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      queryClient.invalidateQueries({ queryKey: ['current-month-payment'] });
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar la transacción: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Hook to get transactions for a specific athlete
export const useAthleteTransactions = (athleteId?: string) => {
  return useQuery({
    queryKey: ['athlete-transactions', athleteId],
    queryFn: async () => {
      if (!athleteId) return [];
      
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          athletes:athlete_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('athlete_id', athleteId)
        .order('transaction_date', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!athleteId,
  });
};

export const useFinancialStats = () => {
  return useQuery({
    queryKey: ['financial-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('amount, transaction_type, payment_status, transaction_date, payer_name, payer_email');

      if (error) {
        throw new Error(error.message);
      }

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Calculate totals
      const totalIncome = data
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = Math.abs(data
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0));

      const pendingPayments = data
        .filter(t => t.payment_status === 'pending')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const netProfit = totalIncome - totalExpenses;

      // Calculate monthly changes
      const currentMonthData = data.filter(t => {
        const date = new Date(t.transaction_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      const lastMonthData = data.filter(t => {
        const date = new Date(t.transaction_date);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      });

      const currentMonthIncome = currentMonthData
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const lastMonthIncome = lastMonthData
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const incomeChange = lastMonthIncome === 0 ? 0 : 
        ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;

      const currentMonthExpenses = Math.abs(currentMonthData
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0));

      const lastMonthExpenses = Math.abs(lastMonthData
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0));

      const expensesChange = lastMonthExpenses === 0 ? 0 : 
        ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;

      const pendingCount = data.filter(t => t.payment_status === 'pending').length;

      return {
        totalIncome,
        totalExpenses,
        pendingPayments,
        netProfit,
        incomeChange,
        expensesChange,
        pendingCount,
        data,
      };
    },
  });
};