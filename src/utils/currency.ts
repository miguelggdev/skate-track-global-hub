// Currency utilities for formatting and managing different currencies

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'COP';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  decimalPlaces: number;
}

// Currency configurations
export const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimalPlaces: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'es-ES',
    decimalPlaces: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
    decimalPlaces: 2,
  },
  COP: {
    code: 'COP',
    symbol: 'COP$',
    name: 'Colombian Peso',
    locale: 'es-CO',
    decimalPlaces: 0, // Colombian pesos typically don't use decimal places
  },
};

/**
 * Format a number as currency based on the provided currency code
 */
export const formatCurrency = (amount: number, currencyCode: CurrencyCode = 'COP'): string => {
  const currency = CURRENCIES[currencyCode];
  
  if (!currency) {
    console.warn(`Unknown currency code: ${currencyCode}. Defaulting to COP.`);
    return formatCurrency(amount, 'COP');
  }

  // For Colombian Peso, we format differently to show the symbol at the beginning
  if (currencyCode === 'COP') {
    return `${currency.symbol}${Math.round(amount).toLocaleString('es-CO')}`;
  }

  // For other currencies, use standard Intl.NumberFormat
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  }).format(amount);
};

/**
 * Get currency symbol for a given currency code
 */
export const getCurrencySymbol = (currencyCode: CurrencyCode = 'COP'): string => {
  return CURRENCIES[currencyCode]?.symbol || 'COP$';
};

/**
 * Get currency name for a given currency code
 */
export const getCurrencyName = (currencyCode: CurrencyCode = 'COP'): string => {
  return CURRENCIES[currencyCode]?.name || 'Colombian Peso';
};

/**
 * Get all available currencies as options for select components
 */
export const getCurrencyOptions = () => {
  return Object.values(CURRENCIES).map(currency => ({
    value: currency.code,
    label: `${currency.name} (${currency.symbol})`,
    symbol: currency.symbol,
  }));
};

/**
 * Parse currency string back to number (useful for form inputs)
 */
export const parseCurrencyString = (currencyString: string, currencyCode: CurrencyCode = 'COP'): number => {
  const currency = CURRENCIES[currencyCode];
  
  if (!currency) {
    return 0;
  }

  // Remove currency symbols and normalize the string
  let cleanString = currencyString
    .replace(new RegExp(`[${currency.symbol}]`, 'g'), '')
    .replace(/,/g, '')
    .trim();

  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
};