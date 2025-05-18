
import axios from 'axios';

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || '';

/**
 * Check if a currency value needs to be converted between two currencies
 */
export const shouldConvertCurrency = (fromCurrency: string, toCurrency: string): boolean => {
  if (!fromCurrency || !toCurrency) return false;
  return fromCurrency.toUpperCase() !== toCurrency.toUpperCase();
};

/**
 * Check if currencies are different and conversion is needed
 */
export const needsCurrencyConversion = (reportedCurrency: string, stockCurrency: string): boolean => {
  return shouldConvertCurrency(reportedCurrency, stockCurrency);
};

/**
 * Fetches the exchange rate from one currency to another using the Financial Modeling Prep API.
 */
export const getExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<number | null> => {
  try {
    const apiKey = FMP_API_KEY;
    const url = `https://financialmodelingprep.com/api/v3/fx/${fromCurrency}${toCurrency}?apikey=${apiKey}`;
    
    const response = await axios.get(url);
    
    if (response.data && response.data[0] && response.data[0].price) {
      return response.data[0].price;
    } else {
      console.error('Failed to fetch exchange rate or invalid data structure:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
};

/**
 * Convert a monetary value using a pre-fetched exchange rate
 */
export const convertCurrency = (
  value: number | string | null | undefined,
  exchangeRate: number
): number => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 0;
  }
  
  const numericValue = Number(value);
  return numericValue * exchangeRate;
};

/**
 * Convert a monetary value from source currency to target currency
 */
export const convertWithCurrency = async (
  value: number | string | null | undefined,
  fromCurrency: string = 'USD',
  toCurrency: string = 'EUR'
): Promise<number> => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 0;
  }
  
  if (!shouldConvertCurrency(fromCurrency, toCurrency)) {
    return Number(value);
  }
  
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  if (!rate) return Number(value);
  
  const numericValue = Number(value);
  return numericValue * rate;
};

/**
 * Get decimal places to display for a given currency
 */
export const getCurrencyDecimalPlaces = (currency: string): number => {
  // Most currencies use 2 decimal places
  const currenciesWithMoreDecimals: Record<string, number> = {
    'JPY': 0,
    'KRW': 0,
    'BTC': 8,
    'ETH': 6
  };
  
  return currenciesWithMoreDecimals[currency.toUpperCase()] !== undefined 
    ? currenciesWithMoreDecimals[currency.toUpperCase()] 
    : 2;
};

/**
 * Format a currency value with proper formatting including showing original value
 */
export const formatCurrency = (
  value: number | string,
  currency: string,
  wasConverted: boolean = false,
  originalValue?: number | string,
  originalCurrency?: string,
  isPercentage?: boolean,
  isMultiplier?: boolean
): string => {
  if (value === null || value === undefined || value === 'N/A') {
    return 'N/A';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const decimalPlaces = getCurrencyDecimalPlaces(currency);
  
  if (isPercentage) {
    return `${numValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })}%`;
  }
  
  if (isMultiplier) {
    return `${numValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })}x`;
  }
  
  const formattedValue = `${numValue.toLocaleString('de-DE', { 
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces 
  })} ${currency}`;
  
  if (wasConverted && originalValue !== undefined && originalCurrency !== undefined) {
    const origNumValue = typeof originalValue === 'string' ? parseFloat(originalValue) : originalValue;
    const origDecimalPlaces = getCurrencyDecimalPlaces(originalCurrency);
    
    const formattedOriginal = `${origNumValue.toLocaleString('de-DE', {
      minimumFractionDigits: origDecimalPlaces,
      maximumFractionDigits: origDecimalPlaces
    })} ${originalCurrency}`;
    
    return `${formattedValue} (${formattedOriginal})`;
  }
  
  return formattedValue;
};

/**
 * Format a large number with appropriate scale (thousands, millions, billions)
 */
export const formatScaledNumber = (value: number, currency: string): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  let formatted: string;
  let suffix = '';
  
  if (value >= 1_000_000_000_000) {
    formatted = (value / 1_000_000_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 });
    suffix = ' Bio.';
  } else if (value >= 1_000_000_000) {
    formatted = (value / 1_000_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 });
    suffix = ' Mrd.';
  } else if (value >= 1_000_000) {
    formatted = (value / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 });
    suffix = ' Mio.';
  } else if (value >= 1_000) {
    formatted = (value / 1_000).toLocaleString('de-DE', { maximumFractionDigits: 2 });
    suffix = ' Tsd.';
  } else {
    formatted = value.toLocaleString('de-DE', { maximumFractionDigits: 2 });
  }
  
  return `${formatted}${suffix} ${currency}`;
};
