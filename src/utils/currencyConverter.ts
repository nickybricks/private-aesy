
/**
 * Currency conversion utility for financial data using live exchange rates
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

    console.log('Fetching fresh exchange rates');
    const response = await fetch(`https://api.exchangerate.host/latest?base=${baseCurrency}`);
    const data = await response.json();

    if (!data.success) {
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
    // Fallback to static rates if API fails - updated with more accurate KRW conversion
    return {
      USD: 0.92,
      EUR: 1.0,
      GBP: 1.17,
      JPY: 0.0061,
      KRW: 0.00067, // Correct Korean Won rate
      CNY: 0.13,
      HKD: 0.12,
      CHF: 1.0,
      CAD: 0.68,
      AUD: 0.61,
      MXN: 0.05,
      SGD: 0.68
    };
  }
};

/**
 * Convert a value from source currency to target currency
 * @param value The value to convert
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @returns The converted value
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
    const rates = await fetchExchangeRates('USD');
    
    // Special handling for currencies with very different scales
    if (fromCurrency === 'KRW' && ['EUR', 'USD', 'GBP', 'CHF'].includes(toCurrency)) {
      // Convert directly using the rate - KRW to EUR/USD/GBP/CHF
      const directRate = rates['KRW'] ? (1 / rates['KRW']) * rates[toCurrency] : 0.00067;
      return numericValue * directRate;
    }
    
    // Convert to USD first (as base currency)
    const valueInUSD = fromCurrency === 'USD' ? 
      numericValue : 
      numericValue / rates[fromCurrency];
    
    // Convert from USD to target currency
    const convertedValue = toCurrency === 'USD' ? 
      valueInUSD : 
      valueInUSD * rates[toCurrency];
    
    return convertedValue;
  } catch (error) {
    console.error('Error converting currency:', error);
    return numericValue; // Return original value if conversion fails
  }
};

/**
 * Format a currency value for display
 * @param value The value to format
 * @param currency The currency code
 * @param showOriginal Whether to show the original value (for transparency)
 * @param originalValue The original value before conversion
 * @param originalCurrency The original currency before conversion
 * @param isPercentage Whether this is a percentage value
 * @param isMultiplier Whether this is a multiplier value
 * @returns Formatted string
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
    // Format as percentage with German locale (comma as decimal separator)
    formattedValue = `${numericValue.toLocaleString('de-DE', { 
      maximumFractionDigits: 2 
    })} %`;
  } else if (isMultiplier) {
    // Format as multiplier with German locale and 'x' suffix
    formattedValue = `${numericValue.toLocaleString('de-DE', { 
      maximumFractionDigits: 2 
    })}x`;
  } else {
    // Format as currency
    switch (currency) {
      case 'EUR':
        formattedValue = `${numericValue.toLocaleString('de-DE', { 
          maximumFractionDigits: 2 
        })} €`;
        break;
      case 'USD':
        formattedValue = `$${numericValue.toLocaleString('en-US', { 
          maximumFractionDigits: 2 
        })}`;
        break;
      case 'GBP':
        formattedValue = `£${numericValue.toLocaleString('en-GB', { 
          maximumFractionDigits: 2 
        })}`;
        break;
      case 'KRW':
        // Format Korean Won without decimal places as they're typically not used
        formattedValue = `${numericValue.toLocaleString('ko-KR', { 
          maximumFractionDigits: 0 
        })} ₩`;
        break;
      default:
        formattedValue = `${numericValue.toLocaleString('en-US', { 
          maximumFractionDigits: 2 
        })} ${currency}`;
    }
  }
  
  // Add original value if requested and available
  if (showOriginal && originalValue !== undefined && originalCurrency !== undefined && 
      originalCurrency !== currency) {
    const origNumericValue = typeof originalValue === 'string' ? 
      parseFloat(originalValue) : originalValue;
    
    let origFormattedValue = '';
    
    if (isPercentage) {
      origFormattedValue = `${origNumericValue.toLocaleString('de-DE', { 
        maximumFractionDigits: 2 
      })} %`;
    } else if (isMultiplier) {
      origFormattedValue = `${origNumericValue.toLocaleString('de-DE', { 
        maximumFractionDigits: 2 
      })}x`;
    } else {
      switch (originalCurrency) {
        case 'EUR':
          origFormattedValue = `${origNumericValue.toLocaleString('de-DE', { 
            maximumFractionDigits: 2 
          })} €`;
          break;
        case 'USD':
          origFormattedValue = `$${origNumericValue.toLocaleString('en-US', { 
            maximumFractionDigits: 2 
          })}`;
          break;
        case 'GBP':
          origFormattedValue = `£${origNumericValue.toLocaleString('en-GB', { 
            maximumFractionDigits: 2 
          })}`;
          break;
        case 'KRW':
          // Format Korean Won without decimal places
          origFormattedValue = `${origNumericValue.toLocaleString('ko-KR', { 
            maximumFractionDigits: 0 
          })} ₩`;
          break;
        default:
          origFormattedValue = `${origNumericValue.toLocaleString('en-US', { 
            maximumFractionDigits: 2 
          })} ${originalCurrency}`;
      }
    }
    
    return `${formattedValue} (umgerechnet aus ${origFormattedValue})`;
  }
  
  return formattedValue;
};

/**
 * Check if we need to convert this value from its original currency
 * @param currency The currency code to check
 * @returns True if conversion is needed
 */
export const needsCurrencyConversion = (currency: string): boolean => {
  return currency !== 'EUR';
};

/**
 * Get appropriate decimal places for a currency
 * @param currency The currency code
 * @returns Number of decimal places to use
 */
export const getCurrencyDecimalPlaces = (currency: string): number => {
  // Some currencies typically don't use decimal places
  if (['JPY', 'KRW', 'TWD', 'HUF', 'CLP', 'ISK'].includes(currency)) {
    return 0;
  }
  return 2;
};
