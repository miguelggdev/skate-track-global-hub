import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type Transaction = Database['public']['Tables']['financial_transactions']['Row'];
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

export interface TransactionsPaginatedResult {
  data: Transaction[];
  count: number;
  totalPages: number;
  page: number;
}

export const useTransactionsPaginated = (page = 1, pageSize = 25) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return useQuery<TransactionsPaginatedResult>({
    queryKey: ['transactions', 'paginated', page, pageSize],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('financial_transactions')
        .select(`*, athletes:athlete_id(id, first_name, last_name, email)`, { count: 'exact' })
        .order('transaction_date', { ascending: false })
        .range(from, to);
      if (error) throw new Error(error.message);
      return {
        data: (data ?? []) as Transaction[],
        count: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
        page,
      };
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
      queryClient.invalidateQueries({ queryKey: ['paginated-transactions'] });
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
      queryClient.invalidateQueries({ queryKey: ['paginated-transactions'] });
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
      const { error: deleteError } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', transactionId);

      if (deleteError) throw new Error(deleteError.message);

      return { deletedId: transactionId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['paginated-transactions'] });
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

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  mensualidad: 'Cuotas de Socios',
  anualidad: 'Cuotas de Socios',
  poliza_deportiva: 'Pólizas Deportivas',
  psicologia: 'Psicología',
  prendas_deportivas: 'Prendas Deportivas',
  inscripcion_competencia: 'Inscripciones a Competencias',
  competition_district: 'Competencias',
  competition_departmental: 'Competencias',
  competition_marathon: 'Competencias',
  competition_panamerican: 'Competencias',
  competition_interleague: 'Competencias',
  accident_insurance: 'Seguro de Accidentes',
  league_registration_renewal: 'Renovación Liga',
  federation_registration_renewal: 'Renovación Federación',
  registration_fee: 'Cuota de Inscripción',
  equipment: 'Equipamiento',
  travel: 'Viajes',
  other: 'Otros',
  otro: 'Otros',
};

export interface IncomeDistributionItem {
  name: string;
  value: number;
  percentage: number;
}

export const useIncomeDistribution = () => {
  return useQuery<IncomeDistributionItem[]>({
    queryKey: ['income-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('transaction_type, amount')
        .gt('amount', 0);
      if (error) throw error;

      const totals = new Map<string, number>();
      let grandTotal = 0;
      for (const row of data ?? []) {
        const label = TRANSACTION_TYPE_LABELS[row.transaction_type ?? ''] ?? row.transaction_type ?? 'Otros';
        totals.set(label, (totals.get(label) ?? 0) + Number(row.amount));
        grandTotal += Number(row.amount);
      }

      return Array.from(totals.entries())
        .map(([name, value]) => ({
          name,
          value,
          percentage: grandTotal > 0 ? (value / grandTotal) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value);
    },
  });
};

export const useFinancialStats = () => {
  return useQuery({
    queryKey: ['financial-stats'],
    queryFn: async () => {
      // Use DB-side aggregation (RPC) instead of fetching all rows — prevents full-table scan
      const { data: summary, error: rpcError } = await supabase
        .rpc('get_financial_summary');

      if (rpcError) throw new Error(rpcError.message);

      const s = summary as {
        total_income: number;
        total_expenses: number;
        net_profit: number;
        pending_amount: number;
        pending_count: number;
        current_month_income: number;
        prev_month_income: number;
        current_month_expenses: number;
        prev_month_expenses: number;
        pending_count_current: number;
      };

      const totalIncome    = s.total_income    ?? 0;
      const totalExpenses  = s.total_expenses  ?? 0;
      const netProfit      = s.net_profit      ?? 0;
      const pendingPayments = s.pending_amount ?? 0;
      const pendingCount   = s.pending_count   ?? 0;

      const incomeChange = s.prev_month_income > 0
        ? ((s.current_month_income - s.prev_month_income) / s.prev_month_income) * 100
        : 0;
      const expensesChange = s.prev_month_expenses > 0
        ? ((s.current_month_expenses - s.prev_month_expenses) / s.prev_month_expenses) * 100
        : 0;

      return {
        totalIncome,
        totalExpenses,
        pendingPayments,
        netProfit,
        incomeChange,
        expensesChange,
        pendingCount,
      };
    },
  });
};