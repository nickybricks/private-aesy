/**
 * Currency conversion utility for financial data
 */

// Exchange rates (ideally these would be fetched from an API)
// In a production environment, these should be updated from an API like exchangerate.host or fixer.io
const exchangeRates: Record<string, number> = {
  USD: 0.92, // 1 USD = 0.92 EUR
  EUR: 1.0,  // 1 EUR = 1 EUR
  GBP: 1.17, // 1 GBP = 1.17 EUR
  JPY: 0.0061, // 1 JPY = 0.0061 EUR
  KRW: 0.00067, // 1 KRW = 0.00067 EUR
  CNY: 0.13, // 1 CNY = 0.13 EUR
  HKD: 0.12, // 1 HKD = 0.12 EUR
  CHF: 1.0, // 1 CHF = 1 EUR
  CAD: 0.68, // 1 CAD = 0.68 EUR
  AUD: 0.61, // 1 AUD = 0.61 EUR
  MXN: 0.05, // 1 MXN = 0.05 EUR
  SGD: 0.68, // 1 SGD = 0.68 EUR
  // Add more currencies as needed
};

/**
 * Convert a value from source currency to target currency
 * @param value The value to convert
 * @param fromCurrency The source currency code
 * @param toCurrency The target currency code
 * @returns The converted value
 */
export const convertCurrency = (
  value: number | string,
  fromCurrency: string = 'USD',
  toCurrency: string = 'EUR'
): number => {
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
  
  // Check if we have the exchange rates
  if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
    console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}. Using original value.`);
    return numericValue;
  }
  
  // Convert to EUR first (as our base currency)
  const valueInEUR = numericValue * exchangeRates[fromCurrency];
  
  // If target is EUR, return the EUR value
  if (toCurrency === 'EUR') {
    return valueInEUR;
  }
  
  // Otherwise convert from EUR to target currency
  return valueInEUR / exchangeRates[toCurrency];
};

/**
 * Format a currency value for display
 * @param value The value to format
 * @param currency The currency code
 * @param showOriginal Whether to show the original value (for transparency)
 * @param originalValue The original value before conversion
 * @param originalCurrency The original currency before conversion
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number | string,
  currency: string = 'EUR',
  showOriginal: boolean = false,
  originalValue?: number | string,
  originalCurrency?: string
): string => {
  // Handle non-numeric or invalid inputs
  if (value === null || value === undefined || value === '' || 
      (typeof value === 'string' && value.toLowerCase().includes('n/a'))) {
    return 'N/A';
  }
  
  // Convert string to number if needed
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Format with currency symbol
  let formattedValue = '';
  
  switch (currency) {
    case 'EUR':
      formattedValue = `${numericValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })} €`;
      break;
    case 'USD':
      formattedValue = `$${numericValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
      break;
    case 'GBP':
      formattedValue = `£${numericValue.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;
      break;
    default:
      formattedValue = `${numericValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;
  }
  
  // Add original value if requested and available
  if (showOriginal && originalValue !== undefined && originalCurrency !== undefined && originalCurrency !== currency) {
    const origNumericValue = typeof originalValue === 'string' ? parseFloat(originalValue) : originalValue;
    
    let origFormattedValue = '';
    switch (originalCurrency) {
      case 'EUR':
        origFormattedValue = `${origNumericValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })} €`;
        break;
      case 'USD':
        origFormattedValue = `$${origNumericValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
        break;
      case 'GBP':
        origFormattedValue = `£${origNumericValue.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;
        break;
      default:
        origFormattedValue = `${origNumericValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${originalCurrency}`;
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
