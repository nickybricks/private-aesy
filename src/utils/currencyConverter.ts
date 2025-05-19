
import axios from 'axios';

// Use import.meta.env instead of process.env for Vite projects
const API_KEY = import.meta.env.VITE_FMP_API_KEY || '';

// Function to determine if currency conversion is needed
export const shouldConvertCurrency = (fromCurrency: string, toCurrency: string): boolean => {
  return fromCurrency !== toCurrency;
};

// Alias for shouldConvertCurrency for more semantic usage
export const needsCurrencyConversion = shouldConvertCurrency;

// Normalize currency symbols to standard codes
export const normalizeCurrencyCode = (currency: string): string => {
  // Convert common currency symbols to their code equivalents
  const symbolToCode: Record<string, string> = {
    '€': 'EUR',
    '$': 'USD',
    '£': 'GBP',
    '¥': 'JPY',
    '₹': 'INR',
    '₽': 'RUB',
    '₩': 'KRW',
    'CHF': 'CHF', // Already a code
    'EUR': 'EUR', // Already a code
    'USD': 'USD', // Already a code
    'GBP': 'GBP', // Already a code
    'JPY': 'JPY', // Already a code
  };
  
  return symbolToCode[currency] || currency;
};

// Function to get the exchange rate from API
export const getExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<number | null> => {
  try {
    // Normalize currency codes before making the API call
    const normalizedFromCurrency = normalizeCurrencyCode(fromCurrency);
    const normalizedToCurrency = normalizeCurrencyCode(toCurrency);
    
    console.log(`Getting exchange rate from ${normalizedFromCurrency} to ${normalizedToCurrency}`);
    
    // Updated to use exchangerate.host API which is more reliable and CORS-friendly
    const response = await axios.get(`https://api.exchangerate.host/latest?base=${normalizedFromCurrency}&symbols=${normalizedToCurrency}`);
    
    if (response.data && response.data.rates && response.data.rates[normalizedToCurrency]) {
      const rate = response.data.rates[normalizedToCurrency];
      console.log(`Exchange rate from ${normalizedFromCurrency} to ${normalizedToCurrency}: ${rate}`);
      return rate;
    }
    
    // Fallback to FMP API if exchangerate.host fails
    console.log(`Fallback to FMP API for exchange rate from ${normalizedFromCurrency} to ${normalizedToCurrency}`);
    const fmpResponse = await axios.get(`https://financialmodelingprep.com/api/v3/fx/${normalizedFromCurrency}${normalizedToCurrency}?apikey=${API_KEY}`);
    
    if (fmpResponse.data && fmpResponse.data[0] && fmpResponse.data[0].rate) {
      console.log(`FMP exchange rate: ${fmpResponse.data[0].rate}`);
      return fmpResponse.data[0].rate;
    }
    
    console.warn('Exchange rate not found in response');
    return null;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    
    // Try fallback API if first one fails
    try {
      const normalizedFromCurrency = normalizeCurrencyCode(fromCurrency);
      const normalizedToCurrency = normalizeCurrencyCode(toCurrency);
      
      console.log(`Trying fallback API for exchange rate from ${normalizedFromCurrency} to ${normalizedToCurrency}`);
      const fallbackResponse = await axios.get(`https://api.exchangerate.host/latest?base=${normalizedFromCurrency}&symbols=${normalizedToCurrency}`);
      
      if (fallbackResponse.data && fallbackResponse.data.rates && fallbackResponse.data.rates[normalizedToCurrency]) {
        const rate = fallbackResponse.data.rates[normalizedToCurrency];
        console.log(`Fallback exchange rate: ${rate}`);
        return rate;
      }
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
    }
    
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
  
  // Normalize the currency code first
  const normalizedCode = normalizeCurrencyCode(currency);
  
  return specialCurrencies[normalizedCode] !== undefined ? specialCurrencies[normalizedCode] : 2;
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
  
  // Normalize the currency code
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const decimalPlaces = getCurrencyDecimalPlaces(normalizedCurrency);
  
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
  
  // Normalize the currency code
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const decimalPlaces = unit ? 2 : getCurrencyDecimalPlaces(normalizedCurrency);
  
  return `${scaledValue.toFixed(decimalPlaces)} ${unit} ${currency}`;
};
