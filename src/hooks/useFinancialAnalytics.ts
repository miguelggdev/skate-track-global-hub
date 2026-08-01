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
      const currentMonthEnd   = endOfMonth(now);
      const prevMonthStart    = startOfMonth(subMonths(now, 1));
      const prevMonthEnd      = endOfMonth(subMonths(now, 1));
      const twelveMonthsAgo   = subMonths(now, 12);

      const currentMonthStartStr = format(currentMonthStart, "yyyy-MM-dd");
      const currentMonthEndStr   = format(currentMonthEnd,   "yyyy-MM-dd");

      const [txRes, athletesRes, feeRes] = await Promise.all([
        supabase
          .from("financial_transactions")
          .select("id, amount, payment_status, transaction_type, transaction_date, athlete_id")
          .gte("transaction_date", format(twelveMonthsAgo, "yyyy-MM-dd"))
          .order("transaction_date", { ascending: true }),
        supabase.from("athletes").select("id, first_name, last_name, category, status"),
        supabase
          .from("system_settings")
          .select("setting_value")
          .eq("setting_key", "monthly_fee")
          .maybeSingle(),
      ]);

      if (txRes.error) throw txRes.error;
      if (athletesRes.error) throw athletesRes.error;

      const transactions = txRes.data ?? [];
      const allAthletes  = athletesRes.data ?? [];
      const monthlyFee   = parseFloat(feeRes.data?.setting_value || "0") || 230000;

      const filteredAthletes = filters?.categories?.length
        ? allAthletes.filter(a => filters.categories!.includes(a.category))
        : allAthletes;
      const totalAthletes = filteredAthletes.length;

      // ── Monthly revenue ────────────────────────────────────────────────────
      const currentMonthPaid = transactions.filter(
        t => t.payment_status === "paid" &&
             t.transaction_date >= currentMonthStartStr &&
             t.transaction_date <= currentMonthEndStr,
      );
      const prevMonthPaid = transactions.filter(
        t => t.payment_status === "paid" &&
             t.transaction_date >= format(prevMonthStart, "yyyy-MM-dd") &&
             t.transaction_date <= format(prevMonthEnd,   "yyyy-MM-dd"),
      );

      const currentMonthRevenue = currentMonthPaid.reduce((s, t) => s + Number(t.amount), 0);
      const prevMonthRevenue    = prevMonthPaid.reduce((s, t) => s + Number(t.amount), 0);
      const currentMonthRevenuePrevChange = prevMonthRevenue > 0
        ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
        : 0;

      const paymentsThisMonthCount = currentMonthPaid.length;
      const paymentsLastMonthCount = prevMonthPaid.length;
      const paymentsThisMonthPrevChange = paymentsLastMonthCount > 0
        ? ((paymentsThisMonthCount - paymentsLastMonthCount) / paymentsLastMonthCount) * 100
        : 0;

      // ── Pending amount (sum of actual pending/overdue transactions) ────────
      const pendingPaymentsAmount = transactions
        .filter(t => t.payment_status === "pending" || t.payment_status === "overdue")
        .reduce((s, t) => s + Number(t.amount), 0);

      // ── Athletes up-to-date vs. in arrears (derived from transactions) ─────
      const paidThisMonthIds = new Set(
        currentMonthPaid.map(t => t.athlete_id).filter(Boolean),
      );
      const withPendingIds = new Set(
        transactions
          .filter(t => t.payment_status === "pending" || t.payment_status === "overdue")
          .map(t => t.athlete_id)
          .filter(Boolean),
      );

      const athletesUpToDateCount  = filteredAthletes.filter(a => paidThisMonthIds.has(a.id)).length;
      const athletesInArrearsCount = filteredAthletes.filter(
        a => withPendingIds.has(a.id) && !paidThisMonthIds.has(a.id),
      ).length;

      const athletesUpToDatePercentage  = totalAthletes > 0 ? (athletesUpToDateCount  / totalAthletes) * 100 : 0;
      const athletesInArrearsPercentage = totalAthletes > 0 ? (athletesInArrearsCount / totalAthletes) * 100 : 0;

      // ── Payment status breakdown ───────────────────────────────────────────
      const overdueOnly = filteredAthletes.filter(
        a => withPendingIds.has(a.id) && !paidThisMonthIds.has(a.id),
      ).length;
      const paymentStatusBreakdown = {
        paid:    athletesUpToDateCount,
        pending: Math.ceil(overdueOnly / 2),
        overdue: Math.floor(overdueOnly / 2),
      };

      // ── 12-month revenue trend ─────────────────────────────────────────────
      let totalRevenue12 = 0;
      const monthlyRevenueData = [];
      for (let i = 11; i >= 0; i--) {
        const mDate = subMonths(now, i);
        const mStart = format(startOfMonth(mDate), "yyyy-MM-dd");
        const mEnd   = format(endOfMonth(mDate),   "yyyy-MM-dd");
        const revenue = transactions
          .filter(t => t.payment_status === "paid" && t.transaction_date >= mStart && t.transaction_date <= mEnd)
          .reduce((s, t) => s + Number(t.amount), 0);
        totalRevenue12 += revenue;
        monthlyRevenueData.push({ month: format(mDate, "MMM yyyy"), revenue, average: 0 });
      }
      const averageMonthlyIncome = totalRevenue12 / 12;
      monthlyRevenueData.forEach(d => { d.average = averageMonthlyIncome; });

      // ── Compliance trend (athletes who paid mensualidad each month) ────────
      const athleteComplianceData = [];
      for (let i = 11; i >= 0; i--) {
        const mDate  = subMonths(now, i);
        const mStart = format(startOfMonth(mDate), "yyyy-MM-dd");
        const mEnd   = format(endOfMonth(mDate),   "yyyy-MM-dd");
        const paidInMonth = new Set(
          transactions
            .filter(t =>
              t.payment_status === "paid" &&
              (t.transaction_type === "mensualidad" || t.transaction_type === "cuota_mensual") &&
              t.transaction_date >= mStart &&
              t.transaction_date <= mEnd,
            )
            .map(t => t.athlete_id)
            .filter(Boolean),
        ).size;
        athleteComplianceData.push({
          month:   format(mDate, "MMM yyyy"),
          paid:    paidInMonth,
          unpaid:  Math.max(0, totalAthletes - paidInMonth),
        });
      }

      // ── Income by transaction type ─────────────────────────────────────────
      const incomeByType: Record<string, number> = {};
      transactions
        .filter(t => t.payment_status === "paid")
        .forEach(t => {
          const type = t.transaction_type || "otros";
          incomeByType[type] = (incomeByType[type] ?? 0) + Number(t.amount);
        });
      const totalIncome = Object.values(incomeByType).reduce((s, v) => s + v, 0);
      const incomeByTypeData = Object.entries(incomeByType).map(([name, value]) => ({
        name: name === "mensualidad" || name === "cuota_mensual" ? "Cuota Mensual" :
              name === "anual"           ? "Cuota Anual"       :
              name === "inscripcion"     ? "Inscripción"       : "Otros",
        value,
        percentage: totalIncome > 0 ? (value / totalIncome) * 100 : 0,
      }));

      // ── Top delinquent athletes ────────────────────────────────────────────
      const delinquentMap: Record<string, { totalPending: number; lastPaidDate: string | null }> = {};
      for (const t of transactions) {
        if (!t.athlete_id) continue;
        if (t.payment_status === "pending" || t.payment_status === "overdue") {
          if (!delinquentMap[t.athlete_id]) delinquentMap[t.athlete_id] = { totalPending: 0, lastPaidDate: null };
          delinquentMap[t.athlete_id].totalPending += Number(t.amount);
        } else if (t.payment_status === "paid") {
          if (delinquentMap[t.athlete_id]) {
            const prev = delinquentMap[t.athlete_id].lastPaidDate;
            if (!prev || t.transaction_date > prev) {
              delinquentMap[t.athlete_id].lastPaidDate = t.transaction_date;
            }
          }
        }
      }

      const topDelinquentAthletes = filteredAthletes
        .filter(a => delinquentMap[a.id])
        .map(a => {
          const info = delinquentMap[a.id];
          const monthsOverdue = info.lastPaidDate
            ? Math.max(1, differenceInMonths(now, new Date(info.lastPaidDate)))
            : 1;
          return {
            id:              a.id,
            name:            `${a.first_name} ${a.last_name}`,
            monthsOverdue,
            totalPending:    info.totalPending,
            lastPaymentDate: info.lastPaidDate,
          };
        })
        .sort((a, b) => b.totalPending - a.totalPending)
        .slice(0, 10);

      // ── Payment summary by category ────────────────────────────────────────
      const CATEGORIES = ["escuela", "menores", "transicion", "prejuvenil", "juvenil", "mayores"];
      const paymentSummaryByCategory = CATEGORIES.map(category => {
        const catAthletes = filteredAthletes.filter(a => a.category === category);
        const total       = catAthletes.length;
        const paidCount   = catAthletes.filter(a => paidThisMonthIds.has(a.id)).length;
        const arrearsIds  = catAthletes.filter(a => withPendingIds.has(a.id));
        const overdueCount = arrearsIds.filter(a => !paidThisMonthIds.has(a.id)).length;
        const pendingCount = overdueCount;
        const percentageCollected = total > 0 ? (paidCount / total) * 100 : 0;
        return {
          category:            category.charAt(0).toUpperCase() + category.slice(1),
          monthlyFee,
          paidCount,
          pendingCount,
          overdueCount,
          percentageCollected,
          totalCollected:      paidCount    * monthlyFee,
          totalPending:        overdueCount * monthlyFee,
        };
      });

      return {
        currentMonthRevenue,
        currentMonthRevenuePrevChange,
        pendingPaymentsAmount,
        pendingPaymentsPrevChange: 0,
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
        topDelinquentAthletes,
        paymentSummaryByCategory,
      };
    },
  });
}
