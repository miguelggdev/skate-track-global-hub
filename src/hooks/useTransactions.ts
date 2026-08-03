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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      queryClient.invalidateQueries({ queryKey: ['current-month-payment'] });
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      if (variables.athlete_id) {
        queryClient.invalidateQueries({ queryKey: ['athlete-transactions', variables.athlete_id] });
      }
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      queryClient.invalidateQueries({ queryKey: ['current-month-payment'] });
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      if (data.athlete_id) {
        queryClient.invalidateQueries({ queryKey: ['athlete-transactions', data.athlete_id] });
      }
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

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      // First get the transaction to check if it affects athlete status
      const { data: transaction, error: fetchError } = await supabase
        .from('financial_transactions')
        .select('*, athletes!inner(*)')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      // Delete the transaction
      const { error: deleteError } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', transactionId);

      if (deleteError) throw new Error(deleteError.message);

      return { deletedId: transactionId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      queryClient.invalidateQueries({ queryKey: ['current-month-payment'] });
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      queryClient.invalidateQueries({ queryKey: ['athlete-transactions'] });
      
      toast({
        title: "Transacción eliminada",
        description: "La transacción se ha eliminado correctamente y el estado del atleta se ha actualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar la transacción: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Hook to get paginated and filtered transactions
export const usePaginatedTransactions = (
  page: number = 1,
  pageSize: number = 15,
  month?: number | null,
  year?: number | null,
  type?: string
) => {
  return useQuery({
    queryKey: ['paginated-transactions', page, pageSize, month, year, type],
    queryFn: async () => {
      // Build base query
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          athletes:athlete_id (
            id,
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' });

      // Apply date filters if month and year are selected
      if (month !== null && month !== undefined && year !== null && year !== undefined) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);
        
        query = query
          .gte('transaction_date', startDate.toISOString().split('T')[0])
          .lte('transaction_date', endDate.toISOString().split('T')[0]);
      } else if (year !== null && year !== undefined) {
        // Only year selected
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        
        query = query
          .gte('transaction_date', startDate.toISOString().split('T')[0])
          .lte('transaction_date', endDate.toISOString().split('T')[0]);
      }

      // Apply type filter based on positive/negative amounts
      if (type === 'income') {
        query = query.gt('amount', 0);
      } else if (type === 'expense') {
        query = query.lt('amount', 0);
      }

      // Apply pagination
      const offset = (page - 1) * pageSize;
      query = query
        .range(offset, offset + pageSize - 1)
        .order('transaction_date', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: data ?? [],
        count: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
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