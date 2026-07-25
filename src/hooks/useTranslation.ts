import { useState, useEffect, useCallback, createContext, useContext } from 'react';
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
  const [translations, setTranslations] = useState<TranslationRecord>({});
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('es');
  const [isLoading, setIsLoading] = useState(true);

  // Load translations from Supabase
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const { data, error } = await supabase
          .from('ui_translations')
          .select('key, es, en, fr, de, it, pt');

        if (error) {
          console.error('Error loading translations:', error);
          return;
        }

        const translationMap: TranslationRecord = {};
        data?.forEach((row) => {
          translationMap[row.key] = {
            es: row.es,
            en: row.en,
            fr: row.fr,
            de: row.de,
            it: row.it,
            pt: row.pt,
          };
        });
        setTranslations(translationMap);
      } catch (error) {
        console.error('Error loading translations:', error);
      }
    };

    loadTranslations();
  }, []);

  // Load user's language preference
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('language_code')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading user language:', error);
          setIsLoading(false);
          return;
        }

        if (data?.language_code) {
          setCurrentLanguage(data.language_code as LanguageCode);
        }
      } catch (error) {
        console.error('Error loading user language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserLanguage();
  }, [user?.id]);

  // Translation function with fallback
  const t = useCallback((key: string): string => {
    const translation = translations[key]?.[currentLanguage];
    // Fallback chain: requested language → Spanish → key
    if (translation) return translation;
    if (translations[key]?.es) return translations[key].es;
    return key;
  }, [translations, currentLanguage]);

  // Update user's language preference
  const setLanguage = useCallback(async (code: LanguageCode) => {
    if (!user?.id) {
      // If not logged in, just update local state
      setCurrentLanguage(code);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ language_code: code })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating language:', error);
        throw error;
      }

      setCurrentLanguage(code);
    } catch (error) {
      console.error('Error updating language:', error);
      throw error;
    }
  }, [user?.id]);

  return {
    t,
    currentLanguage,
    setLanguage,
    isLoading,
    availableLanguages: AVAILABLE_LANGUAGES,
  };
};
