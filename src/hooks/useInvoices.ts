import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Invoice {
  id: string;
  invoice_number: string;
  athlete_id: string;
  period_year: number;
  period_month: number;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  concept: string;
  pdf_url: string | null;
  sent_at: string | null;
  due_date: string;
  paid_at: string | null;
  transaction_id: string | null;
  created_at: string;
  athletes?: {
    first_name: string;
    last_name: string;
    email: string | null;
    category: string | null;
  };
}

export interface InvoiceSummary {
  total_invoices: number;
  paid: number;
  pending: number;
  cancelled: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  collection_rate: number;
}

export function useInvoices(year: number, month: number) {
  return useQuery<Invoice[]>({
    queryKey: ['invoices', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices' as any)
        .select('*, athletes(first_name, last_name, email, category)')
        .eq('period_year', year)
        .eq('period_month', month)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Invoice[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useInvoiceSummary(year: number, month: number) {
  return useQuery<InvoiceSummary | null>({
    queryKey: ['invoice-summary', year, month],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_invoice_summary_by_month' as any, {
        p_year: year,
        p_month: month,
      });
      if (error) throw error;
      return data as InvoiceSummary | null;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useMarkInvoicePaid() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({
      invoiceId,
      transactionId,
    }: {
      invoiceId: string;
      transactionId?: string;
    }) => {
      const { data, error } = await supabase.rpc('mark_invoice_paid' as any, {
        p_invoice_id: invoiceId,
        p_transaction_id: transactionId ?? null,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result?.success) throw new Error(result?.error ?? 'Error al marcar como pagada');
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice-summary'] });
      toast({ title: 'Factura marcada como pagada' });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error inesperado',
        variant: 'destructive',
      });
    },
  });
}
