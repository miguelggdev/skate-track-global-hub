import React from 'react';
import { TranslationContext, useTranslationState } from '@/hooks/useTranslation';

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const translationState = useTranslationState();

  return (
    <TranslationContext.Provider value={translationState}>
      {children}
    </TranslationContext.Provider>
  );
};
