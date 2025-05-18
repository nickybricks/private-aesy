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

// Fallback rates to use when API is unavailable - common currency pairs
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  'USD': {
    'EUR': 0.89529,
    'GBP': 0.753041,
    'JPY': 145.6692,
    'CHF': 0.837907,
    'CAD': 1.397036,
    'AUD': 1.560946,
    'CNY': 7.210675,
    'HKD': 7.814117,
    'SGD': 1.299216,
    'INR': 85.620333,
    'KRW': 1396.588552
  },
  'EUR': {
    'USD': 1.1169,
    'GBP': 0.84112,
    'JPY': 162.71,
    'CHF': 0.93593,
    'CAD': 1.56051,
    'AUD': 1.74355,
    'CNY': 8.0542,
    'HKD': 8.7284,
    'SGD': 1.4511,
    'INR': 95.6337,
    'KRW': 1559.93
  }
};

// Fetch live exchange rates from exchangerate.host
const fetchExchangeRates = async (baseCurrency: string = 'USD'): Promise<Record<string, number>> => {
  try {
    if (rateCache && 
        rateCache.baseCurrency === baseCurrency && 
        (Date.now() - rateCache.lastUpdated) < CACHE_DURATION) {
      console.log('Using cached exchange rates for', baseCurrency);
      return rateCache.rates;
    }

    console.log('Fetching fresh exchange rates for', baseCurrency);
    
    // Try to fetch with regular fetch first
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`, {
        mode: 'cors', // Try with CORS first
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.rates) {
          // Store in cache
          rateCache = {
            rates: data.rates,
            lastUpdated: Date.now(),
            baseCurrency
          };
          
          return data.rates;
        }
      }
      
      throw new Error(`API returned status ${response.status}`);
    } catch (apiError) {
      console.warn('Error fetching exchange rates via standard fetch, trying fallback:', apiError);
      
      // If we have fallback rates for this currency, use them
      if (FALLBACK_RATES[baseCurrency]) {
        console.log(`Using fallback rates for ${baseCurrency} due to API connectivity issues`);
        
        // Store in cache
        rateCache = {
          rates: FALLBACK_RATES[baseCurrency],
          lastUpdated: Date.now(),
          baseCurrency
        };
        
        return FALLBACK_RATES[baseCurrency];
      }
      
      // If we have USD fallback and need another currency, use USD as base and invert
      if (baseCurrency !== 'USD' && FALLBACK_RATES['USD'][baseCurrency]) {
        console.log(`Deriving ${baseCurrency} rates from USD fallback rates`);
        
        const usdToBaseCurrencyRate = FALLBACK_RATES['USD'][baseCurrency];
        const derivedRates: Record<string, number> = {};
        
        for (const [currency, rate] of Object.entries(FALLBACK_RATES['USD'])) {
          if (currency !== baseCurrency) {
            derivedRates[currency] = rate / usdToBaseCurrencyRate;
          }
        }
        
        // Add USD rate
        derivedRates['USD'] = 1 / usdToBaseCurrencyRate;
        
        // Store in cache
        rateCache = {
          rates: derivedRates,
          lastUpdated: Date.now(),
          baseCurrency
        };
        
        return derivedRates;
      }
      
      throw new Error(`Failed to fetch exchange rates for ${baseCurrency} and no fallback available`);
    }
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw new Error(`Failed to fetch exchange rates for ${baseCurrency}`);
  }
};

/**
 * Convert a monetary value from source currency to target currency
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
  
  // Check if conversion is needed - if currencies are the same, just return original value
  if (fromCurrency === toCurrency) {
    console.log(`No conversion needed: ${fromCurrency} = ${toCurrency}`);
    return numericValue;
  }

  try {
    const rates = await fetchExchangeRates(fromCurrency);
    
    if (!rates[toCurrency]) {
      console.error(`No exchange rate available for ${fromCurrency} to ${toCurrency}`);
      
      // Try the reverse conversion if possible
      try {
        const reverseRates = await fetchExchangeRates(toCurrency);
        if (reverseRates[fromCurrency]) {
          const convertedValue = numericValue / reverseRates[fromCurrency];
          console.log(`Converted ${numericValue} ${fromCurrency} to ${convertedValue.toFixed(2)} ${toCurrency} using reverse rate`);
          return convertedValue;
        }
      } catch (reverseError) {
        console.error('Reverse conversion also failed:', reverseError);
      }
      
      // Direct fallback for common currency pairs
      if (fromCurrency === 'USD' && toCurrency === 'EUR') {
        return numericValue * 0.89529;
      } else if (fromCurrency === 'EUR' && toCurrency === 'USD') {
        return numericValue * 1.1169;
      }
      
      throw new Error(`No exchange rate available for ${fromCurrency} to ${toCurrency}`);
    }
    
    const convertedValue = numericValue * rates[toCurrency];
    console.log(`Converted ${numericValue} ${fromCurrency} to ${convertedValue.toFixed(2)} ${toCurrency} (rate: ${rates[toCurrency]})`);
    return convertedValue;
  } catch (error) {
    console.error('Error converting currency:', error);
    
    // Fallback for common currency pairs
    if (fromCurrency === 'USD' && toCurrency === 'EUR') {
      const fallbackValue = numericValue * 0.89529;
      console.log(`Using fallback conversion: ${numericValue} ${fromCurrency} to ${fallbackValue.toFixed(2)} ${toCurrency}`);
      return fallbackValue;
    } else if (fromCurrency === 'EUR' && toCurrency === 'USD') {
      const fallbackValue = numericValue * 1.1169;
      console.log(`Using fallback conversion: ${numericValue} ${fromCurrency} to ${fallbackValue.toFixed(2)} ${toCurrency}`);
      return fallbackValue;
    }
    
    // If all else fails, just return the original value
    console.warn(`Failed to convert ${fromCurrency} to ${toCurrency}. Using original value.`);
    return numericValue;
  }
};

/**
 * Determines if currency conversion is needed based on stock price currency and reported currency
 * This is a new function to implement the specific business logic requested
 */
export const shouldConvertCurrency = (
  reportedCurrency: string,
  stockPriceCurrency: string
): boolean => {
  // Only convert if the reported currency is different from the stock price currency
  return reportedCurrency !== stockPriceCurrency;
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
    
    // Fallback for common currency pairs
    if (fromCurrency === 'USD' && toCurrency === 'EUR') {
      return 0.89529;
    } else if (fromCurrency === 'EUR' && toCurrency === 'USD') {
      return 1.1169;
    }
    
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
