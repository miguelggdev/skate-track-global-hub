import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ReportType = 'income' | 'expenses' | 'balance' | 'complete';
export type ReportPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface FinancialTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  payment_status: string;
  transaction_date: string;
  description?: string | null;
  athlete_id?: string | null;
  created_at?: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface FinancialReport {
  type: ReportType;
  period: ReportPeriod;
  dateRange: DateRange;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    transactionCount: number;
    pendingAmount: number;
  };
  transactions: FinancialTransaction[];
  categoryBreakdown: {
    income: { [key: string]: number };
    expenses: { [key: string]: number };
  };
  monthlyTrends: {
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }[];
}

const getDateRangeFromPeriod = (period: ReportPeriod): DateRange => {
  const today = new Date();
  let startDate: Date;
  let endDate = new Date(today);

  switch (period) {
    case 'week':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'quarter':
      const currentQuarter = Math.floor(today.getMonth() / 3);
      startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
      break;
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return { startDate, endDate };
};

const getTransactionTypeLabels = () => ({
  // Income types
  mensualidad: 'Cuota Mensual',
  anualidad: 'Cuota Anual',
  registration_fee: 'Cuota de Inscripción',
  // Expense types
  equipment: 'Equipamiento',
  travel: 'Viajes',
  coaching: 'Entrenamiento',
  poliza_deportiva: 'Póliza Deportiva',
  psicologia: 'Psicología',
  other: 'Otros'
});

export const useFinancialReports = (reportType: ReportType, period: ReportPeriod, customDateRange?: DateRange) => {
  return useQuery({
    queryKey: ['financial-reports', reportType, period, customDateRange],
    queryFn: async (): Promise<FinancialReport> => {
      const dateRange = customDateRange || getDateRangeFromPeriod(period);

      const startIso = dateRange.startDate.toISOString().split('T')[0];
      const endIso   = dateRange.endDate.toISOString().split('T')[0];

      const { data: filteredTransactions = [], error } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('transaction_date', startIso)
        .lte('transaction_date', endIso)
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      const INCOME_TYPES = ['mensualidad', 'anualidad', 'registration_fee', 'league_registration_renewal', 'federation_registration_renewal', 'inscripcion_competencia'];
      const EXPENSE_TYPES = ['poliza_deportiva', 'psicologia', 'prendas_deportivas', 'equipment', 'travel', 'accident_insurance', 'otro', 'other'];

      // Separate income and expense transactions
      const incomeTransactions = filteredTransactions.filter(t =>
        INCOME_TYPES.includes(t.transaction_type)
      );
      const expenseTransactions = filteredTransactions.filter(t =>
        EXPENSE_TYPES.includes(t.transaction_type)
      );

      // Calculate summary
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const netBalance = totalIncome - totalExpenses;
      const pendingAmount = filteredTransactions
        .filter(t => t.payment_status === 'pending')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Category breakdown
      const typeLabels = getTransactionTypeLabels();
      const incomeBreakdown: { [key: string]: number } = {};
      const expenseBreakdown: { [key: string]: number } = {};

      incomeTransactions.forEach(t => {
        const label = typeLabels[t.transaction_type as keyof typeof typeLabels] || t.transaction_type;
        incomeBreakdown[label] = (incomeBreakdown[label] ?? 0) + Math.abs(t.amount);
      });

      expenseTransactions.forEach(t => {
        const label = typeLabels[t.transaction_type as keyof typeof typeLabels] || t.transaction_type;
        expenseBreakdown[label] = (expenseBreakdown[label] ?? 0) + Math.abs(t.amount);
      });

      // Monthly trends (for the past 6 months) — single query, grouped in JS
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      const trendsStart = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1);

      const { data: trendsRaw = [] } = await supabase
        .from('financial_transactions')
        .select('amount, transaction_type, transaction_date')
        .gte('transaction_date', trendsStart.toISOString().split('T')[0]);

      const monthlyTrends = Array.from({ length: 6 }, (_, idx) => {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - (5 - idx));
        const yr = monthDate.getFullYear();
        const mo = monthDate.getMonth();

        const monthTransactions = trendsRaw.filter(t => {
          const d = new Date(t.transaction_date);
          return d.getFullYear() === yr && d.getMonth() === mo;
        });

        const monthIncome = monthTransactions
          .filter(t => INCOME_TYPES.includes(t.transaction_type))
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const monthExpenses = monthTransactions
          .filter(t => EXPENSE_TYPES.includes(t.transaction_type))
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
          month: monthDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
          income: monthIncome,
          expenses: monthExpenses,
          balance: monthIncome - monthExpenses,
        };
      });

      // Filter transactions based on report type
      let reportTransactions = filteredTransactions;
      if (reportType === 'income') {
        reportTransactions = incomeTransactions;
      } else if (reportType === 'expenses') {
        reportTransactions = expenseTransactions;
      }

      return {
        type: reportType,
        period,
        dateRange,
        summary: {
          totalIncome,
          totalExpenses,
          netBalance,
          transactionCount: filteredTransactions.length,
          pendingAmount
        },
        transactions: reportTransactions,
        categoryBreakdown: {
          income: incomeBreakdown,
          expenses: expenseBreakdown
        },
        monthlyTrends
      };
    },
  });
};