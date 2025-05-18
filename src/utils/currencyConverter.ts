
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
      console.log('Using cached exchange rates for', baseCurrency);
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

    // Store in cache
    rateCache = {
      rates: data.rates,
      lastUpdated: Date.now(),
      baseCurrency
    };

    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw new Error(`Failed to fetch exchange rates for ${baseCurrency}`);
  }
};

/**
 * Convert a monetary value using an exchange rate directly
 */
export const convertCurrency = (
  value: number | string | null | undefined,
  rate: number
): number => {
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
  
  const convertedValue = numericValue * rate;
  return convertedValue;
};

/**
 * Convert a monetary value from source currency to target currency
 */
export const convertWithCurrency = async (
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
      throw new Error(`No exchange rate available for ${fromCurrency} to ${toCurrency}`);
    }
    
    const convertedValue = numericValue * rates[toCurrency];
    console.log(`Converted ${numericValue} ${fromCurrency} to ${convertedValue.toFixed(2)} ${toCurrency} (rate: ${rates[toCurrency]})`);
    return convertedValue;
  } catch (error) {
    console.error('Error converting currency:', error);
    throw error; // Propagate the error to handle it in the components
  }
};

/**
 * Determines if currency conversion is needed based on stock price currency and reported currency
 * Updated to respect the new rules - only convert if reported currency differs from stock currency
 */
export const shouldConvertCurrency = (
  stockPriceCurrency: string,
  reportedCurrency: string
): boolean => {
  // Only convert if the reported currency is different from the stock price currency
  return stockPriceCurrency !== reportedCurrency;
};

/**
 * Format a currency value for display
 * Safely handles null or undefined values
 */
export const formatCurrency = (
  value: number | string | null | undefined,
  currency: string = 'USD',
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
 * Modified to no longer check if currency is EUR, but whether conversion is needed at all
 */
export const needsCurrencyConversion = (reportedCurrency: string, stockCurrency: string): boolean => {
  return reportedCurrency !== stockCurrency;
};

/**
 * Get appropriate decimal places for any currency
 */
export const getCurrencyDecimalPlaces = (currency: string): number => {
  // For Korean Won, Japanese Yen we typically don't show decimal places
  if (currency === 'KRW' || currency === 'JPY') return 0;
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
  
  const decimals = currency === 'KRW' || currency === 'JPY' ? 0 : 2;
  return `${scaledValue.toLocaleString('de-DE', { maximumFractionDigits: decimals })}${unit}${currency ? ' ' + currency : ''}`;
};
