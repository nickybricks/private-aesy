
import axios from 'axios';

// Use import.meta.env instead of process.env for Vite projects
const API_KEY = import.meta.env.VITE_FMP_API_KEY || '';

// Function to determine if currency conversion is needed
export const shouldConvertCurrency = (fromCurrency: string, toCurrency: string): boolean => {
  return fromCurrency !== toCurrency;
};

// Alias for shouldConvertCurrency for more semantic usage
export const needsCurrencyConversion = shouldConvertCurrency;

// Function to get the exchange rate from API
export const getExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<number | null> => {
  try {
    const response = await axios.get(`https://financialmodelingprep.com/api/v3/fx/${fromCurrency}${toCurrency}?apikey=${API_KEY}`);
    if (response.data && response.data[0] && response.data[0].rate) {
      return response.data[0].rate;
    }
    return null;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
};

// The convertCurrency function should take 3 arguments: value, fromCurrency, toCurrency
export const convertCurrency = async (
  value: number, 
  fromCurrency: string, 
  toCurrency: string
): Promise<number> => {
  if (!shouldConvertCurrency(fromCurrency, toCurrency)) return value;
  
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  if (rate === null) return value; // If rate fetch fails, return original value
  
  return value * rate;
};

// Alias for convertCurrency to maintain compatibility with StockChart.tsx
export const convertWithCurrency = convertCurrency;

// Function to determine appropriate decimal places for a currency
export const getCurrencyDecimalPlaces = (currency: string): number => {
  // Most currencies use 2 decimal places
  const specialCurrencies: Record<string, number> = {
    'JPY': 0, // Japanese Yen typically doesn't use decimal places
    'KRW': 0, // Korean Won
    'HUF': 0, // Hungarian Forint
    'BTC': 8, // Bitcoin often uses 8 decimal places
    // Add more special cases as needed
  };
  
  return specialCurrencies[currency] !== undefined ? specialCurrencies[currency] : 2;
};

// Function to format currency values properly
export const formatCurrency = (
  value: number | string, 
  currency: string,
  wasConverted: boolean = false,
  originalValue?: number | string,
  originalCurrency?: string,
  isPercentage?: boolean,
  isMultiplier?: boolean
): string => {
  if (value === 'N/A' || value === null || value === undefined) {
    return 'N/A';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'N/A';
  }
  
  const decimalPlaces = getCurrencyDecimalPlaces(currency);
  
  let formattedValue = '';
  
  if (isPercentage) {
    formattedValue = `${numValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })}%`;
  } else if (isMultiplier) {
    formattedValue = `${numValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })}x`;
  } else {
    formattedValue = `${numValue.toLocaleString('de-DE', { maximumFractionDigits: decimalPlaces })} ${currency}`;
  }
  
  if (wasConverted && originalValue && originalCurrency) {
    const origNumValue = typeof originalValue === 'string' ? parseFloat(originalValue) : originalValue;
    const origDecimalPlaces = getCurrencyDecimalPlaces(originalCurrency);
    const formattedOriginal = origNumValue.toLocaleString('de-DE', { maximumFractionDigits: origDecimalPlaces });
    
    if (isPercentage) {
      return `${formattedValue} (ursprünglich: ${formattedOriginal}%)`;
    } else if (isMultiplier) {
      return `${formattedValue} (ursprünglich: ${formattedOriginal}x)`;
    } else {
      return `${formattedValue} (ursprünglich: ${formattedOriginal} ${originalCurrency})`;
    }
  }
  
  return formattedValue;
};

// Function to format large numbers with appropriate scale (Mio, Mrd, etc.)
export const formatScaledNumber = (value: number, currency: string): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  let scaledValue: number;
  let unit: string;
  
  if (value >= 1000000000000) {
    scaledValue = value / 1000000000000;
    unit = "Bio.";
  } else if (value >= 1000000000) {
    scaledValue = value / 1000000000;
    unit = "Mrd.";
  } else if (value >= 1000000) {
    scaledValue = value / 1000000;
    unit = "Mio.";
  } else {
    scaledValue = value;
    unit = "";
  }
  
  const decimalPlaces = unit ? 2 : getCurrencyDecimalPlaces(currency);
  
  return `${scaledValue.toFixed(decimalPlaces)} ${unit} ${currency}`;
};
