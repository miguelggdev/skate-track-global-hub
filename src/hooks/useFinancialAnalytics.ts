import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format, differenceInMonths } from "date-fns";

export interface FinancialKPIs {
  currentMonthRevenue: number;
  currentMonthRevenuePrevChange: number;
  pendingPaymentsAmount: number;
  pendingPaymentsPrevChange: number;
  athletesUpToDateCount: number;
  athletesUpToDatePercentage: number;
  athletesInArrearsCount: number;
  athletesInArrearsPercentage: number;
  averageMonthlyIncome: number;
  paymentsThisMonthCount: number;
  paymentsThisMonthPrevChange: number;
  
  paymentStatusBreakdown: {
    paid: number;
    pending: number;
    overdue: number;
  };
  
  monthlyRevenueData: Array<{
    month: string;
    revenue: number;
    average: number;
  }>;
  
  athleteComplianceData: Array<{
    month: string;
    paid: number;
    unpaid: number;
  }>;
  
  incomeByTypeData: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  
  topDelinquentAthletes: Array<{
    id: string;
    name: string;
    monthsOverdue: number;
    totalPending: number;
    lastPaymentDate: string | null;
  }>;
  
  paymentSummaryByCategory: Array<{
    category: string;
    monthlyFee: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
    percentageCollected: number;
    totalCollected: number;
    totalPending: number;
  }>;
}

interface FilterState {
  month?: number;
  year?: number;
  categories?: string[];
}

export function useFinancialAnalytics(filters?: FilterState) {
  return useQuery({
    queryKey: ["financial-analytics", filters],
    queryFn: async (): Promise<FinancialKPIs> => {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const prevMonthStart = startOfMonth(subMonths(now, 1));
      const prevMonthEnd = endOfMonth(subMonths(now, 1));

      // Fetch all transactions for the last 12 months
      const twelveMonthsAgo = subMonths(now, 12);
      const { data: transactions, error: transError } = await supabase
        .from("financial_transactions")
        .select("*, athletes(*)")
        .gte("transaction_date", format(twelveMonthsAgo, "yyyy-MM-dd"))
        .order("transaction_date", { ascending: true });

      if (transError) throw transError;

      // Fetch all athletes
      const { data: athletes, error: athletesError } = await supabase
        .from("athletes")
        .select("*");

      if (athletesError) throw athletesError;

      // Apply category filter if provided
      const filteredAthletes = filters?.categories?.length
        ? athletes.filter(a => filters.categories!.includes(a.category))
        : athletes;

      // Current month transactions (paid only)
      const currentMonthPaidTransactions = transactions.filter(
        t => t.payment_status === "paid" &&
        new Date(t.transaction_date) >= currentMonthStart &&
        new Date(t.transaction_date) <= currentMonthEnd
      );

      const prevMonthPaidTransactions = transactions.filter(
        t => t.payment_status === "paid" &&
        new Date(t.transaction_date) >= prevMonthStart &&
        new Date(t.transaction_date) <= prevMonthEnd
      );

      const currentMonthRevenue = currentMonthPaidTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const prevMonthRevenue = prevMonthPaidTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const currentMonthRevenuePrevChange = prevMonthRevenue > 0
        ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
        : 0;

      // Pending payments calculation
      const pendingPaymentsAmount = filteredAthletes
        .filter(a => a.payment_status === "pending" || a.payment_status === "overdue")
        .length * 50000; // Approximate monthly fee

      // Athletes payment status
      const athletesUpToDateCount = filteredAthletes.filter(a => a.payment_status === "active").length;
      const athletesInArrearsCount = filteredAthletes.filter(a => a.payment_status === "overdue").length;
      const totalAthletes = filteredAthletes.length;

      const athletesUpToDatePercentage = totalAthletes > 0 ? (athletesUpToDateCount / totalAthletes) * 100 : 0;
      const athletesInArrearsPercentage = totalAthletes > 0 ? (athletesInArrearsCount / totalAthletes) * 100 : 0;

      // Payment status breakdown
      const paymentStatusBreakdown = {
        paid: athletesUpToDateCount,
        pending: filteredAthletes.filter(a => a.payment_status === "pending").length,
        overdue: athletesInArrearsCount,
      };

      // Payments this month count
      const paymentsThisMonthCount = currentMonthPaidTransactions.length;
      const paymentsLastMonthCount = prevMonthPaidTransactions.length;
      const paymentsThisMonthPrevChange = paymentsLastMonthCount > 0
        ? ((paymentsThisMonthCount - paymentsLastMonthCount) / paymentsLastMonthCount) * 100
        : 0;

      // Monthly revenue for last 12 months
      const monthlyRevenueData = [];
      let totalRevenueLast12Months = 0;

      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthTransactions = transactions.filter(
          t => t.payment_status === "paid" &&
          new Date(t.transaction_date) >= monthStart &&
          new Date(t.transaction_date) <= monthEnd
        );

        const revenue = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        totalRevenueLast12Months += revenue;

        monthlyRevenueData.push({
          month: format(monthDate, "MMM yyyy"),
          revenue,
          average: 0, // Will be filled later
        });
      }

      const averageMonthlyIncome = totalRevenueLast12Months / 12;
      monthlyRevenueData.forEach(d => d.average = averageMonthlyIncome);

      // Athlete compliance over time (last 12 months)
      const athleteComplianceData = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);

        // Count athletes who paid in that month
        const paidInMonth = transactions.filter(
          t => t.payment_status === "paid" &&
          t.transaction_type === "mensualidad" &&
          new Date(t.transaction_date) >= monthStart &&
          new Date(t.transaction_date) <= endOfMonth(monthDate)
        ).length;

        const unpaidInMonth = Math.max(0, totalAthletes - paidInMonth);

        athleteComplianceData.push({
          month: format(monthDate, "MMM yyyy"),
          paid: paidInMonth,
          unpaid: unpaidInMonth,
        });
      }

      // Income distribution by type
      const incomeByType: Record<string, number> = {};
      transactions
        .filter(t => t.payment_status === "paid")
        .forEach(t => {
          const type = t.transaction_type || "otros";
          incomeByType[type] = (incomeByType[type] || 0) + Number(t.amount);
        });

      const totalIncome = Object.values(incomeByType).reduce((sum, val) => sum + val, 0);
      const incomeByTypeData = Object.entries(incomeByType).map(([name, value]) => ({
        name: name === "mensualidad" ? "Cuota Mensual" :
              name === "anual" ? "Cuota Anual" :
              name === "inscripcion" ? "Cuota de Inscripción" : "Otros",
        value,
        percentage: totalIncome > 0 ? (value / totalIncome) * 100 : 0,
      }));

      // Top 10 delinquent athletes
      const delinquentAthletes = filteredAthletes
        .filter(a => a.payment_status === "overdue" && a.last_payment_month)
        .map(a => {
          const monthsOverdue = a.last_payment_month
            ? differenceInMonths(now, new Date(a.last_payment_month))
            : 12;
          
          return {
            id: a.id,
            name: `${a.first_name} ${a.last_name}`,
            monthsOverdue,
            totalPending: monthsOverdue * 50000, // Approximate
            lastPaymentDate: a.last_payment_date,
          };
        })
        .sort((a, b) => b.monthsOverdue - a.monthsOverdue)
        .slice(0, 10);

      // Payment summary by category
      const categories = ["escuela", "menores", "transicion", "prejuvenil", "juvenil", "mayores"];
      const paymentSummaryByCategory = categories.map(category => {
        const categoryAthletes = filteredAthletes.filter(a => a.category === category);
        const paidCount = categoryAthletes.filter(a => a.payment_status === "active").length;
        const pendingCount = categoryAthletes.filter(a => a.payment_status === "pending").length;
        const overdueCount = categoryAthletes.filter(a => a.payment_status === "overdue").length;
        const total = categoryAthletes.length;

        const monthlyFee = 50000; // Default, could be fetched from settings
        const totalCollected = paidCount * monthlyFee;
        const totalPending = (pendingCount + overdueCount) * monthlyFee;
        const percentageCollected = total > 0 ? (paidCount / total) * 100 : 0;

        return {
          category: category.charAt(0).toUpperCase() + category.slice(1),
          monthlyFee,
          paidCount,
          pendingCount,
          overdueCount,
          percentageCollected,
          totalCollected,
          totalPending,
        };
      });

      return {
        currentMonthRevenue,
        currentMonthRevenuePrevChange,
        pendingPaymentsAmount,
        pendingPaymentsPrevChange: 0, // Could be calculated if needed
        athletesUpToDateCount,
        athletesUpToDatePercentage,
        athletesInArrearsCount,
        athletesInArrearsPercentage,
        averageMonthlyIncome,
        paymentsThisMonthCount,
        paymentsThisMonthPrevChange,
        paymentStatusBreakdown,
        monthlyRevenueData,
        athleteComplianceData,
        incomeByTypeData,
        topDelinquentAthletes: delinquentAthletes,
        paymentSummaryByCategory,
      };
    },
  });
}
