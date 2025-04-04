// Currency conversion map - add more currencies as needed
const currencyConversionMap = {
  'KRW': { symbol: '₩', rate: 1450 }, // 1 EUR = 1450 KRW (example)
  'JPY': { symbol: '¥', rate: 160 },  // 1 EUR = 160 JPY
  'USD': { symbol: '$', rate: 1.1 },  // 1 EUR = 1.1 USD
  // Add more currencies as needed
};

// Function to detect currency from stock data
function detectCurrency(stockData) {
  // Check various fields that might indicate currency
  const ticker = stockData.symbol || '';
  const exchange = stockData.exchange || '';
  
  // Korean stocks
  if (exchange.includes('KRX') || exchange.includes('KOSPI') || ticker.endsWith('.KS')) {
    return 'KRW';
  }
  
  // Japanese stocks
  if (exchange.includes('TSE') || exchange.includes('TOKYO') || ticker.endsWith('.T')) {
    return 'JPY';
  }
  
  // US stocks
  if (exchange.includes('NASDAQ') || exchange.includes('NYSE') || !ticker.includes('.')) {
    return 'USD';
  }
  
  // Default to EUR
  return 'EUR';
}

// Function to normalize financial values
function normalizeFinancialValues(financialData, sourceCurrency, targetCurrency = 'EUR') {
  if (!financialData || !sourceCurrency || sourceCurrency === targetCurrency) {
    return { 
      ...financialData, 
      originalCurrency: null, 
      currencyConversionRate: null 
    };
  }
  
  const conversionData = currencyConversionMap[sourceCurrency];
  if (!conversionData) {
    return { 
      ...financialData, 
      originalCurrency: null, 
      currencyConversionRate: null 
    };
  }
  
  const conversionRate = conversionData.rate;
  
  // Create a deep copy and normalize all numeric values that might be currency
  const normalizedData = JSON.parse(JSON.stringify(financialData));
  
  // Normalize specific fields we know are financial values
  if (normalizedData.eps && typeof normalizedData.eps === 'number') {
    normalizedData.eps = normalizedData.eps / conversionRate;
  }
  
  if (normalizedData.freeCashFlow && typeof normalizedData.freeCashFlow === 'number') {
    normalizedData.freeCashFlow = normalizedData.freeCashFlow / conversionRate;
  }
  
  // Add metadata about the conversion
  normalizedData.originalCurrency = sourceCurrency;
  normalizedData.currencyConversionRate = conversionRate;
  
  return normalizedData;
}
