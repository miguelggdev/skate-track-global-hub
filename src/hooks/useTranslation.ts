import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type LanguageCode = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
];

type TranslationRecord = Record<string, Record<LanguageCode, string>>;

interface TranslationContextType {
  t: (key: string) => string;
  currentLanguage: LanguageCode;
  setLanguage: (code: LanguageCode) => Promise<void>;
  isLoading: boolean;
  availableLanguages: Language[];
}

export const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export const useTranslationState = () => {
  const { user } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('es');

  // Fetch all translations once — stale for 5 min, no useEffect needed
  const { data: translations = {} } = useQuery<TranslationRecord>({
    queryKey: ['ui-translations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ui_translations')
        .select('key, es, en, fr, de, it, pt');
      if (error || !data) return {};
      return Object.fromEntries(
        data.map(row => [row.key, { es: row.es, en: row.en, fr: row.fr, de: row.de, it: row.it, pt: row.pt }])
      );
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch user's saved language preference
  const { data: savedLanguage, isLoading } = useQuery<LanguageCode | null>({
    queryKey: ['user-language-pref', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('language_code')
        .eq('id', user!.id)
        .maybeSingle();
      return (data?.language_code as LanguageCode) ?? null;
    },
    enabled: !!user?.id,
    staleTime: Infinity,
  });

  // Sync local state once DB preference is known
  useEffect(() => {
    if (savedLanguage) setCurrentLanguage(savedLanguage);
  }, [savedLanguage]);

  const t = useCallback((key: string): string => {
    const translation = translations[key]?.[currentLanguage];
    if (translation) return translation;
    if (translations[key]?.es) return translations[key].es;
    return key;
  }, [translations, currentLanguage]);

  const setLanguage = useCallback(async (code: LanguageCode) => {
    setCurrentLanguage(code);
    if (!user?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update({ language_code: code })
      .eq('id', user.id);
    if (error) throw error;
  }, [user?.id]);

  return {
    t,
    currentLanguage,
    setLanguage,
    isLoading,
    availableLanguages: AVAILABLE_LANGUAGES,
  };
};
