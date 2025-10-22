
import axios from 'axios';

// Use import.meta.env instead of process.env for Vite projects
const API_KEY = import.meta.env.VITE_FMP_API_KEY || '';

// Function to determine if currency conversion is needed
export const shouldConvertCurrency = (fromCurrency: string, toCurrency: string): boolean => {
  return fromCurrency !== toCurrency;
};

// Alias for shouldConvertCurrency for more semantic usage
export const needsCurrencyConversion = shouldConvertCurrency;

// Helper function to debug DCF data
export const debugDCFData = (dcfData: any): void => {
  console.log('==== DEBUG DCF DATA ====');
  console.log('DCF Data received:', dcfData ? 'YES' : 'NO (null/undefined)');
  
  if (!dcfData) {
    console.warn('DCF ERROR: No DCF data available to debug');
    return;
  }
  
  // Log essential properties for DCF calculation
  console.log({
    'Currency': dcfData.currency,
    'WACC': dcfData.wacc,
    'Unlevered Free Cash Flows': dcfData.ufcf,
    'Present Value of Terminal': dcfData.presentTerminalValue,
    'Net Debt': dcfData.netDebt,
    'Diluted Shares Outstanding': dcfData.dilutedSharesOutstanding,
    'Sum of Present Value of UFCFs': dcfData.sumPvUfcfs,
    'Enterprise Value': dcfData.enterpriseValue,
    'Equity Value': dcfData.equityValue,
    'Intrinsic Value per Share': dcfData.intrinsicValue,
    'Equity Value per Share': dcfData.equityValuePerShare
  });
  
  // Check for missing critical fields
  const missingFields = [];
  if (!dcfData.ufcf || !Array.isArray(dcfData.ufcf) || dcfData.ufcf.length === 0) {
    missingFields.push('ufcf (Unlevered Free Cash Flows)');
  }
  
  if (dcfData.wacc === undefined || isNaN(dcfData.wacc)) {
    missingFields.push('wacc (Weighted Average Cost of Capital)');
  }
  
  if (dcfData.presentTerminalValue === undefined || isNaN(dcfData.presentTerminalValue)) {
    missingFields.push('presentTerminalValue (Present Value of Terminal Value)');
  }
  
  if (dcfData.netDebt === undefined || isNaN(dcfData.netDebt)) {
    missingFields.push('netDebt (Net Debt)');
  }
  
  if (!dcfData.dilutedSharesOutstanding || isNaN(dcfData.dilutedSharesOutstanding)) {
    missingFields.push('dilutedSharesOutstanding (Number of Shares)');
  }
  
  // Log any missing fields
  if (missingFields.length > 0) {
    console.warn('DCF ERROR: Missing critical fields:', missingFields.join(', '));
  } else {
    console.log('All critical DCF fields are present');
  }
  
  // Check for NaN in calculated values
  if (dcfData.intrinsicValue !== undefined && isNaN(dcfData.intrinsicValue)) {
    console.warn('DCF ERROR: Calculated intrinsic value is NaN');
  }
  
  if (dcfData.equityValuePerShare !== undefined && isNaN(dcfData.equityValuePerShare)) {
    console.warn('DCF ERROR: Equity value per share is NaN');
  }
  
  // Log raw DCF data for detailed inspection
  console.log('Raw DCF Data:', JSON.stringify(dcfData, null, 2));
  console.log('==== END DEBUG DCF DATA ====');
};

// Normalize currency symbols to standard codes
export const normalizeCurrencyCode = (currency: string): string => {
  console.log(`🔄 normalizeCurrencyCode Input: "${currency}" (Type: ${typeof currency})`);
  
  // Convert common currency symbols to their code equivalents
  const symbolToCode: Record<string, string> = {
    '€': 'EUR',
    '$': 'USD',
    '£': 'GBP',
    '¥': 'JPY',
    '₹': 'INR',
    '₽': 'RUB',
    '₩': 'KRW',
    'CHF': 'CHF', // Already a code
    'EUR': 'EUR', // Already a code
    'USD': 'USD', // Already a code
    'GBP': 'GBP', // Already a code
    'JPY': 'JPY', // Already a code
  };
  
  const result = symbolToCode[currency] || currency;
  console.log(`🔄 normalizeCurrencyCode Output: "${result}"`);
  
  return result;
};

// Function to get the exchange rate from API
export const getExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<number | null> => {
  console.log('=== EXCHANGE RATE ABRUF START ===');
  console.log(`Input: fromCurrency="${fromCurrency}", toCurrency="${toCurrency}"`);
  
  try {
    const normalizedFromCurrency = normalizeCurrencyCode(fromCurrency);
    const normalizedToCurrency = normalizeCurrencyCode(toCurrency);
    
    console.log(`Nach Normalisierung: from="${normalizedFromCurrency}", to="${normalizedToCurrency}"`);
    
    // Special case: same currency
    if (normalizedFromCurrency === normalizedToCurrency) {
      console.log(`✅ Gleiche Währung - Rate = 1.0`);
      return 1.0;
    }
    
    // Use toCurrency (Kurswährung) as base for fxratesapi.com
    const apiUrl = `https://api.fxratesapi.com/latest?base=${normalizedToCurrency}`;
    console.log(`🌐 API-Aufruf mit base=${normalizedToCurrency}: ${apiUrl}`);
    
    const response = await axios.get(apiUrl);
    
    console.log('📥 API Rohdaten erhalten (relevante Währungen):');
    console.log(JSON.stringify({
      success: response.data.success,
      base: response.data.base,
      date: response.data.date,
      rates: {
        [normalizedFromCurrency]: response.data.rates?.[normalizedFromCurrency]
      }
    }, null, 2));
    
    if (!response.data || !response.data.success || !response.data.rates) {
      console.error('❌ API-Response ungültig oder nicht erfolgreich');
      return null;
    }
    
    const rates = response.data.rates;
    const fromRate = rates[normalizedFromCurrency];
    
    if (!fromRate || isNaN(fromRate) || fromRate === 0) {
      console.error(`❌ Kein gültiger Kurs für ${normalizedFromCurrency} in base=${normalizedToCurrency} gefunden`);
      return null;
    }
    
    // Da base=toCurrency: fromCurrency → toCurrency = 1 / rates[fromCurrency]
    const finalRate = 1 / fromRate;
    
    console.log(`📊 Berechnung: 1 ${normalizedFromCurrency} = (1 / ${fromRate}) ${normalizedToCurrency} = ${finalRate}`);
    console.log(`✅ FINALER EXCHANGE RATE: ${finalRate}`);
    console.log(`Beispiel: 1,000,000 ${normalizedFromCurrency} = ${(1000000 * finalRate).toFixed(2)} ${normalizedToCurrency}`);
    console.log('=== EXCHANGE RATE ABRUF ERFOLG ===');
    
    return finalRate;
    
  } catch (error) {
    console.error('❌ FEHLER beim Exchange Rate Abruf:');
    console.error('Error Type:', error?.constructor?.name);
    console.error('Error Message:', error?.message);
    console.error('Full Error:', error);
    return null;
  }
};

// The convertCurrency function should take 3 arguments: value, fromCurrency, toCurrency
export const convertCurrency = async (
  value: number, 
  fromCurrency: string, 
  toCurrency: string
): Promise<number> => {
  // Debug input values
  console.log(`Converting currency: ${value} from ${fromCurrency} to ${toCurrency}`);
  
  if (!shouldConvertCurrency(fromCurrency, toCurrency)) return value;
  
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  if (rate === null) {
    console.warn(`DCF ERROR: Currency conversion failed - using original value ${value}`);
    return value; // If rate fetch fails, return original value
  }
  
  const convertedValue = value * rate;
  console.log(`Converted ${value} ${fromCurrency} to ${convertedValue} ${toCurrency} (rate: ${rate})`);
  
  if (isNaN(convertedValue)) {
    console.warn(`DCF ERROR: Converted value is NaN - using original value ${value}`);
    return value;
  }
  
  return convertedValue;
};

// Alias for convertCurrency to maintain compatibility with StockChart.tsx
export const convertWithCurrency = convertCurrency;

// Function to determine appropriate decimal places for a currency
export const getCurrencyDecimalPlaces = (currency: string): number => {
  // Most currencies use 2 decimal places
  const specialCurrencies: Record<string, number> = {
    'JPY': 0, // Japanese Yen typically doesn't use decimal places
    'KRW': 0, // Korean Won
    'HUF': 0, // Hungarian Forint
    'BTC': 8, // Bitcoin often uses 8 decimal places
    // Add more special cases as needed
  };
  
  // Normalize the currency code first
  const normalizedCode = normalizeCurrencyCode(currency);
  
  return specialCurrencies[normalizedCode] !== undefined ? specialCurrencies[normalizedCode] : 2;
};

// Function to format currency values properly
export const formatCurrency = (
  value: number | string, 
  currency: string,
  wasConverted: boolean = false,
  originalValue?: number | string,
  originalCurrency?: string,
  isPercentage?: boolean,
  isMultiplier?: boolean,
  isAlreadyPercent?: boolean
): string => {
  if (value === 'N/A' || value === null || value === undefined) {
    return 'N/A';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'N/A';
  }
  
  // Normalize the currency code
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const decimalPlaces = getCurrencyDecimalPlaces(normalizedCurrency);
  
  let formattedValue = '';
  
  if (isPercentage) {
    // Check if value is already in percentage format or needs conversion
    if (isAlreadyPercent) {
      // Value is already a percentage (e.g., 15.5 for 15.5%)
      formattedValue = `${numValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })}%`;
    } else {
      // Convert decimal values to percentage by multiplying by 100
      const percentageValue = numValue * 100;
      formattedValue = `${percentageValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })}%`;
    }
  } else if (isMultiplier) {
    formattedValue = `${numValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })}x`;
  } else {
    formattedValue = `${numValue.toLocaleString('de-DE', { maximumFractionDigits: decimalPlaces })} ${currency}`;
  }
  
  if (wasConverted && originalValue && originalCurrency) {
    const origNumValue = typeof originalValue === 'string' ? parseFloat(originalValue) : originalValue;
    const origDecimalPlaces = getCurrencyDecimalPlaces(originalCurrency);
    const formattedOriginal = origNumValue.toLocaleString('de-DE', { maximumFractionDigits: origDecimalPlaces });
    
    if (isPercentage) {
      // Check if original value is already in percentage format or needs conversion
      if (isAlreadyPercent) {
        // Original value is already a percentage
        return `${formattedValue} (ursprünglich: ${formattedOriginal}%)`;
      } else {
        // Convert decimal values to percentage by multiplying by 100
        const origPercentageValue = origNumValue * 100;
        return `${formattedValue} (ursprünglich: ${origPercentageValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })}%)`;
      }
    } else if (isMultiplier) {
      return `${formattedValue} (ursprünglich: ${formattedOriginal}x)`;
    } else {
      return `${formattedValue} (ursprünglich: ${formattedOriginal} ${originalCurrency})`;
    }
  }
  
  return formattedValue;
};

// Function to format large numbers with appropriate scale (Mio, Mrd, etc.)
export const formatScaledNumber = (value: number, currency: string): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  let scaledValue: number;
  let unit: string;
  
  if (value >= 1000000000000) {
    scaledValue = value / 1000000000000;
    unit = "Bio.";
  } else if (value >= 1000000000) {
    scaledValue = value / 1000000000;
    unit = "Mrd.";
  } else if (value >= 1000000) {
    scaledValue = value / 1000000;
    unit = "Mio.";
  } else {
    scaledValue = value;
    unit = "";
  }
  
  // Normalize the currency code
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const decimalPlaces = unit ? 2 : getCurrencyDecimalPlaces(normalizedCurrency);
  
  return `${scaledValue.toFixed(decimalPlaces)} ${unit} ${currency}`;
};
