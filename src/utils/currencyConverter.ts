
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
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();

    if (!data.rates) {
      console.error('Exchange rate API error:', data);
      throw new Error('Failed to fetch exchange rates: No rates in response');
    }

    rateCache = {
      rates: data.rates,
      lastUpdated: Date.now(),
      baseCurrency
    };

    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Return a fallback rate of 1 for all currencies when API fails
    return { USD: 1, EUR: 1, JPY: 110, GBP: 0.8, CAD: 1.3, CHF: 0.9, AUD: 1.3, KRW: 1450 };
  }
};

/**
 * Convert a monetary value from source currency to target currency
 * Safely handles null or undefined values
 */
export const convertCurrency = async (
  value: number | string | null | undefined,
  fromCurrency: string = 'USD',
  toCurrency: string = 'EUR'
): Promise<number> => {
  // Handle non-numeric or invalid inputs
  if (value === null || value === undefined || value === '' || 
      (typeof value === 'string' && value.toLowerCase().includes('n/a'))) {
    return 0;
  }
  
  // Convert string to number if needed
  let numericValue: number;
  try {
    numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(numericValue)) return 0;
  } catch (e) {
    console.error('Error converting value to number:', e, value);
    return 0;
  }
  
  // Special handling for KRW and other high-value currencies
  // This ensures the scale is maintained properly
  if (fromCurrency === 'KRW') {
    console.log(`Converting KRW value: ${numericValue}`);
  }
  
  // Check if conversion is needed
  if (fromCurrency === toCurrency) {
    return numericValue;
  }

  try {
    const rates = await fetchExchangeRates(fromCurrency);
    
    // If we don't have a rate for the target currency, return the original value
    if (!rates[toCurrency]) {
      console.warn(`No exchange rate available for ${fromCurrency} to ${toCurrency}`);
      return numericValue;
    }
    
    const convertedValue = numericValue * rates[toCurrency];
    console.log(`Converted ${numericValue} ${fromCurrency} to ${convertedValue.toFixed(2)} ${toCurrency} (rate: ${rates[toCurrency]})`);
    return convertedValue;
  } catch (error) {
    console.error('Error converting currency:', error);
    return numericValue; // Return original value if conversion fails
  }
};

/**
 * Format a currency value for display
 * Safely handles null or undefined values
 */
export const formatCurrency = (
  value: number | string | null | undefined,
  currency: string = 'EUR',
  showOriginal: boolean = false,
  originalValue?: number | string | null | undefined,
  originalCurrency?: string,
  isPercentage: boolean = false,
  isMultiplier: boolean = false
): string => {
  // Handle non-numeric or invalid inputs
  if (value === null || value === undefined || value === '' || 
      (typeof value === 'string' && value.toLowerCase().includes('n/a'))) {
    return 'N/A';
  }
  
  // Convert string to number if needed - ensure it's a number
  let numericValue: number;
  try {
    numericValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(numericValue)) throw new Error('Invalid number');
  } catch (e) {
    console.error('Error converting value to number:', e, value);
    return 'N/A';
  }
  
  // Format based on type
  let formattedValue = '';
  
  try {
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
      // Format large numbers with appropriate scaling
      let scaledValue = numericValue;
      let unit = '';
      
      if (Math.abs(numericValue) >= 1000000000000) {
        scaledValue = numericValue / 1000000000000;
        unit = ' Bio.';
      } else if (Math.abs(numericValue) >= 1000000000) {
        scaledValue = numericValue / 1000000000;
        unit = ' Mrd.';
      } else if (Math.abs(numericValue) >= 1000000) {
        scaledValue = numericValue / 1000000;
        unit = ' Mio.';
      }
      
      // Format the currency
      formattedValue = `${scaledValue.toLocaleString('de-DE', {
        maximumFractionDigits: 2
      })}${unit} ${currency}`;
    }
  } catch (e) {
    console.error('Error formatting value:', e, numericValue);
    return `${numericValue} ${isPercentage ? '%' : isMultiplier ? 'x' : currency}`;
  }
  
  // Add original value if requested and available
  if (showOriginal && originalValue !== undefined && originalValue !== null && originalCurrency !== undefined && 
      originalCurrency !== currency) {
    
    let origNumericValue: number;
    try {
      origNumericValue = typeof originalValue === 'string' ? parseFloat(originalValue) : Number(originalValue);
      if (isNaN(origNumericValue)) throw new Error('Invalid original number');
      
      let scaledOrigValue = origNumericValue;
      let origUnit = '';
      
      // Scale original value appropriately
      if (Math.abs(origNumericValue) >= 1000000000000) {
        scaledOrigValue = origNumericValue / 1000000000000;
        origUnit = ' Bio.';
      } else if (Math.abs(origNumericValue) >= 1000000000) {
        scaledOrigValue = origNumericValue / 1000000000;
        origUnit = ' Mrd.';
      } else if (Math.abs(origNumericValue) >= 1000000) {
        scaledOrigValue = origNumericValue / 1000000;
        origUnit = ' Mio.';
      }
      
      const origFormattedValue = isPercentage ? 
        `${origNumericValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })} %` :
        isMultiplier ?
        `${origNumericValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })}x` :
        `${scaledOrigValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })}${origUnit} ${originalCurrency}`;
      
      return `${formattedValue} (${origFormattedValue})`;
    } catch (e) {
      console.error('Error formatting original value:', e, originalValue);
      return formattedValue;
    }
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
  // For Korean Won, we typically don't show decimal places
  if (currency === 'KRW') return 0;
  return 2; // Use 2 decimal places for most currencies
};

/**
 * Get the exchange rate between two currencies
 */
export const getExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<number | null> => {
  try {
    const rates = await fetchExchangeRates(fromCurrency);
    return rates[toCurrency] || null;
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    return null;
  }
};

/**
 * Format a number with the appropriate scale (millions, billions, etc.)
 */
export const formatScaledNumber = (value: number, currency?: string): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return 'N/A';
  }
  
  let scaledValue = value;
  let unit = '';
  
  if (Math.abs(value) >= 1000000000000) {
    scaledValue = value / 1000000000000;
    unit = ' Bio.';
  } else if (Math.abs(value) >= 1000000000) {
    scaledValue = value / 1000000000;
    unit = ' Mrd.';
  } else if (Math.abs(value) >= 1000000) {
    scaledValue = value / 1000000;
    unit = ' Mio.';
  }
  
  const decimals = currency === 'KRW' ? 0 : 2;
  return `${scaledValue.toLocaleString('de-DE', { maximumFractionDigits: decimals })}${unit}${currency ? ' ' + currency : ''}`;
};
