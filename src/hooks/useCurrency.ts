import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CurrencyCode } from '@/utils/currency';

const VALID_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'COP'];

export const useCurrency = () => {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, isError } = useQuery({
    queryKey: ['club-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clubs')
        .select('id, currency')
        .maybeSingle();

      if (error) throw error;
      return data ?? null;
    },
  });

  const rawCurrency = data?.currency as CurrencyCode | undefined;
  const currency: CurrencyCode =
    rawCurrency && VALID_CURRENCIES.includes(rawCurrency) ? rawCurrency : 'COP';

  const updateMutation = useMutation({
    mutationFn: async (newCurrency: CurrencyCode) => {
      if (!data?.id) throw new Error('No se pudo determinar el club actual');
      const { error } = await supabase
        .from('clubs')
        .update({ currency: newCurrency })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-settings'] });
    },
  });

  const updateCurrency = async (newCurrency: CurrencyCode): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync(newCurrency);
      return true;
    } catch {
      return false;
    }
  };

  return {
    currency,
    loading,
    error: isError ? 'Error al cargar moneda' : null,
    updateCurrency,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['club-settings'] }),
  };
};
