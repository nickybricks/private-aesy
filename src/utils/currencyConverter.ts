
/**
 * Currency conversion utility using Exchange Rate API
 */

// Cache for exchange rates to avoid too many API calls
interface ExchangeRateCache {
  rates: Record<string, number>;
  lastUpdated: number;
  baseCurrency: string;
}

let rateCache: ExchangeRateCache | null = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

// Fetch live exchange rates from exchangerate.host
const fetchExchangeRates = async (baseCurrency: string = 'USD'): Promise<Record<string, number>> => {
  try {
    if (rateCache && 
        rateCache.baseCurrency === baseCurrency && 
        (Date.now() - rateCache.lastUpdated) < CACHE_DURATION) {
      console.log('Using cached exchange rates');
      return rateCache.rates;
    }

    console.log('Fetching fresh exchange rates for', baseCurrency);
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    const data = await response.json();

    if (!data.rates) {
      throw new Error('Failed to fetch exchange rates');
    }

    rateCache = {
      rates: data.rates,
      lastUpdated: Date.now(),
      baseCurrency
    };

    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw new Error('Failed to fetch exchange rates');
  }
};

/**
 * Convert a monetary value from source currency to target currency
 */
export const convertCurrency = async (
  value: number | string,
  fromCurrency: string = 'USD',
  toCurrency: string = 'EUR'
): Promise<number> => {
  // Handle non-numeric or invalid inputs
  if (value === null || value === undefined || value === '' || 
      (typeof value === 'string' && value.toLowerCase().includes('n/a'))) {
    return 0;
  }
  
  // Convert string to number if needed
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if conversion is needed
  if (fromCurrency === toCurrency) {
    return numericValue;
  }

  try {
    const rates = await fetchExchangeRates(fromCurrency);
    const convertedValue = numericValue * rates[toCurrency];
    return convertedValue;
  } catch (error) {
    console.error('Error converting currency:', error);
    return numericValue; // Return original value if conversion fails
  }
};

/**
 * Format a currency value for display
 */
export const formatCurrency = (
  value: number | string,
  currency: string = 'EUR',
  showOriginal: boolean = false,
  originalValue?: number | string,
  originalCurrency?: string,
  isPercentage: boolean = false,
  isMultiplier: boolean = false
): string => {
  // Handle non-numeric or invalid inputs
  if (value === null || value === undefined || value === '' || 
      (typeof value === 'string' && value.toLowerCase().includes('n/a'))) {
    return 'N/A';
  }
  
  // Convert string to number if needed
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Format based on type
  let formattedValue = '';
  
  if (isPercentage) {
    // Format as percentage with German locale
    formattedValue = `${numericValue.toLocaleString('de-DE', { 
      maximumFractionDigits: 2 
    })} %`;
  } else if (isMultiplier) {
    // Format as multiplier with German locale
    formattedValue = `${numericValue.toLocaleString('de-DE', { 
      maximumFractionDigits: 2 
    })}x`;
  } else {
    // Format as currency using Intl.NumberFormat
    const formatter = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2
    });
    formattedValue = formatter.format(numericValue);
  }
  
  // Add original value if requested and available
  if (showOriginal && originalValue !== undefined && originalCurrency !== undefined && 
      originalCurrency !== currency) {
    const origNumericValue = typeof originalValue === 'string' ? 
      parseFloat(originalValue) : originalValue;
    
    const origFormatter = new Intl.NumberFormat('de-DE', {
      style: isPercentage ? 'percent' : 'currency',
      currency: originalCurrency,
      maximumFractionDigits: 2
    });
    
    const origFormattedValue = isPercentage ? 
      `${origNumericValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })} %` :
      origFormatter.format(origNumericValue);
    
    return `${formattedValue} (umgerechnet aus ${origFormattedValue})`;
  }
  
  return formattedValue;
};

/**
 * Check if we need to convert this value from its original currency
 */
export const needsCurrencyConversion = (currency: string): boolean => {
  return currency !== 'EUR';
};

/**
 * Get appropriate decimal places for any currency
 */
export const getCurrencyDecimalPlaces = (currency: string): number => {
  return 2; // Use 2 decimal places for all currencies
};
