import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type TransactionType = Database['public']['Enums']['transaction_type'];
type PaymentStatus = Database['public']['Enums']['transaction_status'];

export interface DelegatePayment {
  id: string;
  athlete_id: string | null;
  amount: number;
  transaction_type: TransactionType;
  transaction_date: string;
  payment_status: PaymentStatus;
  description: string;
  due_date: string | null;
  payer_name: string | null;
  payer_phone: string | null;
  payer_email: string | null;
  created_by: string | null;
  created_at: string;
  athletes?: {
    first_name: string | null;
    last_name: string | null;
    category: string;
  } | null;
}

export interface CreatePaymentData {
  athlete_id: string;
  amount: number;
  transaction_type: TransactionType;
  transaction_date: string;
  payment_status: PaymentStatus;
  description: string;
  due_date?: string;
  payer_name?: string;
  payer_phone?: string;
  payer_email?: string;
}

// Transaction types allowed for delegates (excluding monthly fees)
export const DELEGATE_TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'competition_district', label: 'Competencia Distrital' },
  { value: 'competition_departmental', label: 'Competencia Departamental' },
  { value: 'competition_marathon', label: 'Competencia Maratón' },
  { value: 'competition_panamerican', label: 'Competencia Panamericana' },
  { value: 'competition_interleague', label: 'Competencia Interligas' },
  { value: 'accident_insurance', label: 'Seguro de Accidentes' },
  { value: 'league_registration_renewal', label: 'Renovación Inscripción Liga' },
  { value: 'federation_registration_renewal', label: 'Renovación Inscripción Federación' },
  { value: 'registration_fee', label: 'Cuota de Inscripción' },
  { value: 'equipment', label: 'Equipamiento' },
  { value: 'travel', label: 'Viaje' },
  { value: 'other', label: 'Otros' },
];

export const useDelegatePayments = (filters?: {
  athleteId?: string;
  competitionId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: PaymentStatus;
}) => {
  return useQuery({
    queryKey: ['delegate-payments', filters],
    queryFn: async (): Promise<DelegatePayment[]> => {
      let query = supabase
        .from('financial_transactions')
        .select(`
          id,
          athlete_id,
          amount,
          transaction_type,
          transaction_date,
          payment_status,
          description,
          due_date,
          payer_name,
          payer_phone,
          payer_email,
          created_by,
          created_at,
          athletes (
            first_name,
            last_name,
            category
          )
        `)
        .not('transaction_type', 'in', '("mensualidad","anualidad")')
        .order('transaction_date', { ascending: false });

      if (filters?.athleteId) {
        query = query.eq('athlete_id', filters.athleteId);
      }
      if (filters?.dateFrom) {
        query = query.gte('transaction_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('transaction_date', filters.dateTo);
      }
      if (filters?.status) {
        query = query.eq('payment_status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as DelegatePayment[];
    },
  });
};

export const useCreateDelegatePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paymentData: CreatePaymentData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
          ...paymentData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegate-payments'] });
      queryClient.invalidateQueries({ queryKey: ['delegate-stats'] });
      toast({
        title: 'Pago registrado',
        description: 'El pago se ha registrado correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo registrar el pago.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateDelegatePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreatePaymentData> & { id: string }) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegate-payments'] });
      queryClient.invalidateQueries({ queryKey: ['delegate-stats'] });
      toast({
        title: 'Pago actualizado',
        description: 'El pago se ha actualizado correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el pago.',
        variant: 'destructive',
      });
    },
  });
};
