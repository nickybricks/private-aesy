import axios from 'axios';

const API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY;

// Function to determine if currency conversion is needed
export const shouldConvertCurrency = (fromCurrency: string, toCurrency: string): boolean => {
  return fromCurrency !== toCurrency;
};

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
  return value * rate;
};
