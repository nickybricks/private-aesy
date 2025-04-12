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
  KRW: 0.00067, // 1 KRW = 0.00067 EUR (approx. 1 EUR = 1490 KRW)
  CNY: 0.13, // 1 CNY = 0.13 EUR
  HKD: 0.12, // 1 HKD = 0.12 EUR
  CHF: 1.0, // 1 CHF = 1 EUR
  CAD: 0.68, // 1 CAD = 0.68 EUR
  AUD: 0.61, // 1 AUD = 0.61 EUR
  MXN: 0.05, // 1 MXN = 0.05 EUR
  SGD: 0.68, // 1 SGD = 0.68 EUR
  // Add more currencies as needed
};

// List of available target currencies
export const availableTargetCurrencies = [
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'USD', name: 'US-Dollar ($)' },
  { code: 'GBP', name: 'Britisches Pfund (£)' },
  { code: 'CHF', name: 'Schweizer Franken (CHF)' },
  { code: 'CAD', name: 'Kanadischer Dollar (CAD)' },
  { code: 'JPY', name: 'Japanischer Yen (¥)' },
  { code: 'AUD', name: 'Australischer Dollar (AUD)' }
];

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
    console.log(`No conversion needed: ${numericValue} ${fromCurrency} (same currencies)`);
    return numericValue;
  }
  
  // Check if we have the exchange rates
  if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
    console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}. Using original value.`);
    return numericValue;
  }
  
  // Enhanced logging for KRW conversions, which often cause issues
  if (fromCurrency === 'KRW') {
    console.log(`KRW conversion START: ${numericValue} KRW`);
    console.log(`Exchange rate: 1 KRW = ${exchangeRates[fromCurrency]} EUR`);
    console.log(`Calculation: ${numericValue} × ${exchangeRates[fromCurrency]} = ${numericValue * exchangeRates[fromCurrency]} EUR`);
  }
  
  // First convert to EUR (our base currency for conversion)
  const valueInEUR = numericValue * exchangeRates[fromCurrency];
  
  // If target is EUR, we're done
  if (toCurrency === 'EUR') {
    console.log(`Conversion result: ${numericValue} ${fromCurrency} → ${valueInEUR.toFixed(4)} EUR`);
    
    // Sanity check for KRW to EUR conversion
    if (fromCurrency === 'KRW' && valueInEUR > 1000) {
      console.warn(`⚠️ POTENTIALLY INCORRECT CONVERSION: ${numericValue} KRW → ${valueInEUR.toFixed(2)} EUR`);
      console.warn(`This value seems unusually high. For reference, 1,000,000 KRW ≈ 670 EUR`);
    }
    
    return valueInEUR;
  }
  
  // Otherwise convert from EUR to target currency
  const result = valueInEUR / exchangeRates[toCurrency];
  
  console.log(`Conversion result: ${numericValue} ${fromCurrency} → ${valueInEUR.toFixed(4)} EUR → ${result.toFixed(4)} ${toCurrency}`);
  return result;
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
    case 'JPY':
      formattedValue = `${numericValue.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} ¥`;
      break;
    case 'KRW':
      formattedValue = `${numericValue.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} ₩`;
      break;
    case 'CHF':
      formattedValue = `${numericValue.toLocaleString('de-CH', { maximumFractionDigits: 2 })} CHF`;
      break;
    case 'CAD':
      formattedValue = `$${numericValue.toLocaleString('en-CA', { maximumFractionDigits: 2 })} CAD`;
      break;
    case 'AUD':
      formattedValue = `$${numericValue.toLocaleString('en-AU', { maximumFractionDigits: 2 })} AUD`;
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
      case 'JPY':
        origFormattedValue = `${origNumericValue.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} ¥`;
        break;
      case 'KRW':
        origFormattedValue = `${origNumericValue.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} ₩`;
        break;
      default:
        origFormattedValue = `${origNumericValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${originalCurrency}`;
    }
    
    // Calculate and display exchange rate - improved for clarity
    const exchangeRateInfo = originalCurrency && currency ? 
      ` (Wechselkurs: 1 ${originalCurrency} = ${(exchangeRates[originalCurrency]/exchangeRates[currency]).toFixed(4)} ${currency})` : '';
    
    return `${formattedValue} (ursprünglich ${origFormattedValue}${exchangeRateInfo})`;
  }
  
  return formattedValue;
};

/**
 * Format a percentage value for display
 * @param value The value to format
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number | string | null): string => {
  if (value === null || value === undefined || value === '' || 
      (typeof value === 'string' && value.toLowerCase().includes('n/a'))) {
    return 'N/A';
  }
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return `${numericValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })}%`;
};

/**
 * Check if we need to convert this value from its original currency
 * @param currency The currency code to check
 * @param targetCurrency The target currency code
 * @returns True if conversion is needed
 */
export const needsCurrencyConversion = (
  currency: string, 
  targetCurrency: string = 'EUR'
): boolean => {
  if (!currency) return false;
  return currency !== targetCurrency;
};

/**
 * Get a human-readable description of the currency
 * @param currencyCode The ISO currency code
 * @returns Human-readable currency name
 */
export const getCurrencyName = (currencyCode: string): string => {
  const currencyNames: Record<string, string> = {
    'USD': 'US-Dollar',
    'EUR': 'Euro',
    'GBP': 'Britisches Pfund',
    'JPY': 'Japanischer Yen',
    'KRW': 'Südkoreanischer Won',
    'CNY': 'Chinesischer Yuan',
    'HKD': 'Hongkong-Dollar',
    'CHF': 'Schweizer Franken',
    'CAD': 'Kanadischer Dollar',
    'AUD': 'Australischer Dollar',
    'MXN': 'Mexikanischer Peso',
    'SGD': 'Singapur-Dollar'
  };
  
  return currencyNames[currencyCode] || currencyCode;
};

/**
 * Get the currency symbol
 * @param currencyCode The ISO currency code
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'KRW': '₩',
    'CNY': '¥',
    'HKD': 'HK$',
    'CHF': 'CHF',
    'CAD': 'C$',
    'AUD': 'A$',
    'MXN': 'MX$',
    'SGD': 'S$'
  };
  
  return symbols[currencyCode] || currencyCode;
};

/**
 * Determine if a value needs to be displayed as a percentage
 * @param metricName The name of the metric
 * @returns True if the metric should be shown as a percentage
 */
export const isPercentageMetric = (metricName: string): boolean => {
  const percentageKeywords = [
    'rendite', 'yield', 'margin', 'marge', 'wachstum', 'growth', 
    'roe', 'roi', 'roic', 'ratio', '%', 'quote', 'deckungsgrad', 
    'eigenkapitalrendite', 'kapitalrendite', 'schuldenquote'
  ];
  
  const name = metricName.toLowerCase();
  return percentageKeywords.some(keyword => name.includes(keyword));
};

/**
 * Verify if a currency conversion result looks realistic
 * Could be used to warn users about potentially incorrect conversion results
 * @param originalValue The original value
 * @param convertedValue The converted value
 * @param conversionFactor The conversion factor used
 * @returns True if the conversion seems realistic
 */
export const isRealisticConversion = (
  originalValue: number,
  convertedValue: number,
  fromCurrency: string,
  toCurrency: string
): { realistic: boolean; warning?: string } => {
  // Skip check if we're not converting
  if (fromCurrency === toCurrency) {
    return { realistic: true };
  }
  
  // Special handling for KRW (Korean Won) conversions
  if (fromCurrency === 'KRW' && toCurrency === 'EUR') {
    if (convertedValue > 1000) {
      return {
        realistic: false,
        warning: `Ungewöhnlich hoher Wert (${convertedValue} ${toCurrency}) nach Umrechnung von ${originalValue} ${fromCurrency}. Möglicherweise fehlerhafte Währungsumrechnung. Koreanische Won haben einen niedrigen Wechselkurs (ca. 1 EUR = 1490 KRW).`
      };
    }
  }
  
  // Detect potentially unrealistic EPS values
  if (convertedValue > 1000 && toCurrency === 'EUR') {
    return {
      realistic: false,
      warning: `Ungewöhnlich hoher Wert (${convertedValue} ${toCurrency}) nach Umrechnung von ${originalValue} ${fromCurrency}. Möglicherweise fehlerhafte Währungsumrechnung.`
    };
  }
  
  // Detect potentially unrealistic intrinsic value
  if (convertedValue > 10000 && toCurrency === 'EUR') {
    return {
      realistic: false,
      warning: `Sehr hoher Wert (${convertedValue} ${toCurrency}) nach Umrechnung von ${originalValue} ${fromCurrency}. Dies könnte auf fehlerhafte Daten hindeuten.`
    };
  }
  
  return { realistic: true };
};
