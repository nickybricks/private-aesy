import axios from 'axios';

const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY;

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
