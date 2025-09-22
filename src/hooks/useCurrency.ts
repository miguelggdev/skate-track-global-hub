import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CurrencyCode } from '@/utils/currency';

/**
 * Hook to manage currency settings for the application
 * Fetches the currency from club_settings and provides utilities
 */
export const useCurrency = () => {
  const [currency, setCurrency] = useState<CurrencyCode>('COP'); // Default to Colombian Peso
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrency = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('club_settings')
        .select('currency')
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw fetchError;
      }

      // Set currency from database or default to COP
      const dbCurrency = data?.currency as CurrencyCode;
      setCurrency(dbCurrency && ['USD', 'EUR', 'GBP', 'COP'].includes(dbCurrency) ? dbCurrency : 'COP');
      
    } catch (err: any) {
      console.error('Error fetching currency:', err);
      setError(err.message);
      // Keep default currency on error
      setCurrency('COP');
    } finally {
      setLoading(false);
    }
  };

  const updateCurrency = async (newCurrency: CurrencyCode) => {
    try {
      setError(null);
      
      // First try to get existing settings
      const { data: existingSettings } = await supabase
        .from('club_settings')
        .select('id')
        .limit(1)
        .single();

      if (existingSettings) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('club_settings')
          .update({ currency: newCurrency })
          .eq('id', existingSettings.id);
          
        if (updateError) throw updateError;
      } else {
        // Create new record with default values
        const { error: insertError } = await supabase
          .from('club_settings')
          .insert({ 
            currency: newCurrency,
            club_name: 'Mi Club',
            timezone: 'America/Bogota',
            language: 'es'
          });
          
        if (insertError) throw insertError;
      }

      setCurrency(newCurrency);
      return true;
    } catch (err: any) {
      console.error('Error updating currency:', err);
      setError(err.message);
      return false;
    }
  };

  useEffect(() => {
    fetchCurrency();
  }, []);

  return {
    currency,
    loading,
    error,
    updateCurrency,
    refetch: fetchCurrency,
  };
};
