/**
 * Currency conversion utility for the Buffett Benchmark Tool
 * Handles detection and conversion of financial data in different currencies
 */

// Currency conversion rates (as of April 2025)
// These should ideally come from an API or be updated regularly
const CURRENCY_CONVERSION_RATES: Record<string, number> = {
  'KRW': 1450, // 1 EUR = 1450 KRW (South Korean Won)
  'JPY': 160,  // 1 EUR = 160 JPY (Japanese Yen)
  'USD': 1.1,  // 1 EUR = 1.1 USD (US Dollar)
  'EUR': 1,    // Base currency
  'GBP': 0.85, // 1 EUR = 0.85 GBP (British Pound)
  'CNY': 8,    // 1 EUR = 8 CNY (Chinese Yuan)
  'INR': 90,   // 1 EUR = 90 INR (Indian Rupee)
  'HKD': 8.6,  // 1 EUR = 8.6 HKD (Hong Kong Dollar)
};

// Currency symbols for display
const CURRENCY_SYMBOLS: Record<string, string> = {
  'KRW': '₩',
  'JPY': '¥',
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'CNY': '¥',
  'INR': '₹',
  'HKD': 'HK$',
};

// High-value currencies that typically have large numerical values
const HIGH_VALUE_CURRENCIES = ['KRW', 'JPY', 'INR'];

/**
 * Detects the likely currency of a stock based on its ticker and exchange information
 */
export const detectCurrency = (
  ticker: string = '', 
  exchange: string = '', 
  country: string = ''
): string => {
  ticker = ticker.toUpperCase();
  exchange = exchange.toUpperCase();
  country = country.toUpperCase();
  
  // Check country first
  if (country.includes('KOREA') || country === 'KR') return 'KRW';
  if (country.includes('JAPAN') || country === 'JP') return 'JPY';
  if (country.includes('UNITED STATES') || country === 'US' || country === 'USA') return 'USD';
  if (country.includes('UNITED KINGDOM') || country === 'UK' || country === 'GB') return 'GBP';
  if (country.includes('CHINA') || country === 'CN') return 'CNY';
  if (country.includes('INDIA') || country === 'IN') return 'INR';
  if (country.includes('HONG KONG') || country === 'HK') return 'HKD';
  
  // Check exchange
  if (exchange.includes('KRX') || exchange.includes('KOSPI') || exchange.includes('KOREA')) return 'KRW';
  if (exchange.includes('TSE') || exchange.includes('TOKYO') || exchange.includes('JAPAN')) return 'JPY';
  if (exchange.includes('NASDAQ') || exchange.includes('NYSE') || exchange.includes('US')) return 'USD';
  if (exchange.includes('LSE') || exchange.includes('LONDON')) return 'GBP';
  if (exchange.includes('SSE') || exchange.includes('SZSE') || exchange.includes('SHANGHAI') || exchange.includes('SHENZHEN')) return 'CNY';
  if (exchange.includes('BSE') || exchange.includes('NSE') || exchange.includes('INDIA')) return 'INR';
  if (exchange.includes('HKEX') || exchange.includes('HONG KONG')) return 'HKD';
  
  // Check ticker suffix
  if (ticker.endsWith('.KS') || ticker.endsWith('.KQ')) return 'KRW';
  if (ticker.endsWith('.T') || ticker.endsWith('.JP')) return 'JPY';
  if (ticker.endsWith('.L')) return 'GBP';
  if (ticker.endsWith('.SS') || ticker.endsWith('.SZ')) return 'CNY';
  if (ticker.endsWith('.NS') || ticker.endsWith('.BO')) return 'INR';
  if (ticker.endsWith('.HK')) return 'HKD';
  
  // Default to USD for standard tickers
  if (!ticker.includes('.')) return 'USD';
  
  // If no specific indicators, default to EUR as our base currency
  return 'EUR';
};

/**
 * Determines if a currency is typically a high-value currency
 * (large numerical values, e.g. 1 EUR = 1450 KRW)
 */
export const isHighValueCurrency = (currency: string): boolean => {
  return HIGH_VALUE_CURRENCIES.includes(currency);
};

/**
 * Gets the conversion rate from source currency to target currency
 */
export const getConversionRate = (
  fromCurrency: string, 
  toCurrency: string = 'EUR'
): number | null => {
  if (fromCurrency === toCurrency) return 1;
  
  const fromRate = CURRENCY_CONVERSION_RATES[fromCurrency];
  const toRate = CURRENCY_CONVERSION_RATES[toCurrency];
  
  if (!fromRate || !toRate) return null;
  
  // Convert via EUR as the base currency
  return fromRate / toRate;
};

/**
 * Converts a financial value from one currency to another
 */
export const convertCurrency = (
  value: number,
  fromCurrency: string,
  toCurrency: string = 'EUR'
): number => {
  const rate = getConversionRate(fromCurrency, toCurrency);
  if (!rate) return value; // If conversion isn't possible, return the original value
  
  // If converting from a high-value currency to a lower-value one, divide
  if (isHighValueCurrency(fromCurrency) && !isHighValueCurrency(toCurrency)) {
    return value / rate;
  }
  
  // Otherwise, multiply by the rate
  return value * rate;
};

/**
 * Formats a currency value with the appropriate symbol
 */
export const formatCurrency = (
  value: number | undefined, 
  currency: string
): string => {
  if (value === undefined || value === null) return 'N/A';
  
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  
  // Format based on currency type
  if (isHighValueCurrency(currency)) {
    return `${Math.round(value).toLocaleString()} ${symbol}`;
  }
  
  // For regular currencies with decimal places
  return `${symbol}${value.toFixed(2)}`;
};

/**
 * Determines if a financial value is unrealistically high
 * and might need currency conversion
 */
export const isUnrealisticFinancialValue = (
  value: number | undefined, 
  metric: 'eps' | 'price' | 'intrinsicValue' | 'other' = 'other'
): boolean => {
  if (value === undefined || value === null) return false;
  
  // Thresholds for different metrics
  const thresholds = {
    eps: 500,         // EPS rarely exceeds $500
    price: 10000,     // Stock price rarely exceeds $10,000
    intrinsicValue: 20000, // Intrinsic value calculation
    other: 100000     // General high threshold
  };
  
  return value > thresholds[metric];
};

/**
 * Analyzes a stock's data to determine if currency conversion might be needed
 * Returns information about the detected currency and conversion requirements
 */
export const analyzeCurrencyData = (stockData: any): {
  originalCurrency: string;
  targetCurrency: string;
  conversionNeeded: boolean;
  conversionRate: number | null;
  isHighValue: boolean;
} => {
  // Default values
  const targetCurrency = 'EUR';
  
  // Extract relevant data for currency detection
  const ticker = stockData?.ticker || stockData?.symbol || '';
  const exchange = stockData?.exchange || '';
  const country = stockData?.country || '';
  
  // Check for unrealistic values that might indicate wrong currency
  const hasUnrealisticEPS = isUnrealisticFinancialValue(stockData?.eps, 'eps');
  const hasUnrealisticPrice = isUnrealisticFinancialValue(stockData?.price, 'price');
  
  // Detect original currency
  const detectedCurrency = detectCurrency(ticker, exchange, country);
  const conversionRate = getConversionRate(detectedCurrency, targetCurrency);
  const isHighValue = isHighValueCurrency(detectedCurrency);
  
  // Determine if conversion is needed
  const conversionNeeded = detectedCurrency !== targetCurrency && 
                           (isHighValue || hasUnrealisticEPS || hasUnrealisticPrice);
  
  return {
    originalCurrency: detectedCurrency,
    targetCurrency,
    conversionNeeded,
    conversionRate,
    isHighValue
  };
};

/**
 * Normalizes financial metrics by applying currency conversion if needed
 */
export const normalizeFinancialMetrics = (metrics: any, currencyInfo: ReturnType<typeof analyzeCurrencyData>): any => {
  if (!metrics || !currencyInfo.conversionNeeded || !currencyInfo.conversionRate) {
    return metrics;
  }
  
  const { originalCurrency, targetCurrency, conversionRate } = currencyInfo;
  
  // Create a deep copy of the metrics
  const normalizedMetrics = JSON.parse(JSON.stringify(metrics));
  
  // Add metadata about conversion
  normalizedMetrics.originalCurrency = originalCurrency;
  normalizedMetrics.targetCurrency = targetCurrency;
  normalizedMetrics.conversionRate = conversionRate;
  
  // Convert numeric values in specific fields (extend as needed)
  if (metrics.eps !== undefined && typeof metrics.eps === 'number') {
    normalizedMetrics.eps = metrics.eps / conversionRate;
  }
  
  if (metrics.freeCashFlow !== undefined && typeof metrics.freeCashFlow === 'number') {
    normalizedMetrics.freeCashFlow = metrics.freeCashFlow / conversionRate;
  }
  
  if (metrics.price !== undefined && typeof metrics.price === 'number') {
    normalizedMetrics.price = metrics.price / conversionRate;
  }
  
  if (metrics.intrinsicValue !== undefined && typeof metrics.intrinsicValue === 'number') {
    normalizedMetrics.intrinsicValue = metrics.intrinsicValue / conversionRate;
  }
  
  // If there's a nested metrics array, process each item
  if (Array.isArray(normalizedMetrics.metrics)) {
    normalizedMetrics.metrics = normalizedMetrics.metrics.map((metric: any) => {
      if (typeof metric.value === 'number' && 
          (metric.name.includes('Preis') || 
           metric.name.includes('Wert') || 
           metric.name.includes('Gewinn') ||
           metric.name.includes('Cash') ||
           metric.name.includes('Flow'))) {
        return { ...metric, value: metric.value / conversionRate };
      }
      return metric;
    });
  }
  
  return normalizedMetrics;
};

/**
 * Generates descriptive text about currency conversion for user information
 */
export const getCurrencyConversionInfo = (currencyInfo: ReturnType<typeof analyzeCurrencyData>): string | null => {
  if (!currencyInfo.conversionNeeded || !currencyInfo.conversionRate) {
    return null;
  }
  
  const { originalCurrency, targetCurrency, conversionRate } = currencyInfo;
  
  return `Die Finanzdaten wurden automatisch von ${originalCurrency} in ${targetCurrency} umgerechnet. Wechselkurs: 1 ${targetCurrency} = ${conversionRate} ${originalCurrency}`;
};
