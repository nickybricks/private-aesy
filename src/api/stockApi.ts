
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

// Mock API functions that were missing
// These would normally fetch data from an actual API, but for now we'll implement mock versions

/**
 * Fetches stock information for a given ticker symbol
 * @param ticker The stock ticker symbol
 * @returns Promise containing stock information
 */
export const fetchStockInfo = async (ticker: string) => {
  console.log(`Fetching stock information for ${ticker}`);
  // In a real implementation, this would call an API
  // For now, return a mock response with some data
  return {
    ticker: ticker,
    name: `${ticker} Corp`,
    exchange: ticker.endsWith('.KS') ? 'KRX' : 'NYSE', // Example logic
    price: 108,
    currency: ticker.endsWith('.KS') ? 'KRW' : 'USD',
    country: ticker.endsWith('.KS') ? 'South Korea' : 'United States',
    sector: 'Technology',
    industry: 'Semiconductors',
    description: `Mock description for ${ticker}`,
    marketCap: 500000000000,
    eps: ticker.endsWith('.KS') ? 28736 : 5.2, // High value for Korean stocks to demonstrate the currency issue
    peRatio: 12.5,
    yearHigh: 120,
    yearLow: 80,
    // Add other relevant stock info fields
  };
};

/**
 * Analyzes a stock based on Warren Buffett's investment criteria
 * @param ticker The stock ticker symbol
 * @returns Promise containing Buffett criteria analysis
 */
export const analyzeBuffettCriteria = async (ticker: string) => {
  console.log(`Analyzing Buffett criteria for ${ticker}`);
  // Mock criteria analysis
  return {
    simpleBusiness: { 
      fulfilled: true, 
      score: 3, 
      details: 'The business model is straightforward and easy to understand.' 
    },
    stableHistory: { 
      fulfilled: true, 
      score: 3, 
      details: 'The company has a consistent operating history.' 
    },
    longTermProspects: { 
      fulfilled: true, 
      score: 3, 
      details: 'Long-term growth prospects appear favorable.' 
    },
    management: { 
      fulfilled: true, 
      score: 2, 
      details: 'Management seems competent but has had some missteps.' 
    },
    roic: { 
      fulfilled: true, 
      score: 3, 
      details: 'Return on invested capital is strong at over 15%.' 
    },
    shareholderOriented: { 
      fulfilled: false, 
      score: 1, 
      details: 'Limited shareholder returns through dividends or buybacks.' 
    },
    freeCashFlow: { 
      fulfilled: true, 
      score: 3, 
      details: 'Consistently strong free cash flow generation.' 
    },
    debtLevels: { 
      fulfilled: true, 
      score: 2, 
      details: 'Reasonable debt levels that can be serviced by operating income.' 
    },
    marginExpansion: { 
      fulfilled: false, 
      score: 1, 
      details: 'Profit margins have been relatively flat.' 
    },
    antiCyclical: { 
      fulfilled: false, 
      score: 1, 
      details: 'Business tends to be cyclical with semiconductor demand cycles.' 
    },
    // Add other criteria as needed
    total: 22,
    maxPossible: 30,
    percentage: 73
  };
};

/**
 * Gets key financial metrics for a stock
 * @param ticker The stock ticker symbol
 * @returns Promise containing financial metrics
 */
export const getFinancialMetrics = async (ticker: string) => {
  console.log(`Getting financial metrics for ${ticker}`);
  
  // Determine if we should use high values (to simulate KRW) based on ticker
  const isKoreanStock = ticker.endsWith('.KS');
  const multiplier = isKoreanStock ? 1450 : 1;
  
  // Generate historical data (last 5 years)
  const currentYear = new Date().getFullYear();
  const historicalData = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 4 + i;
    // Simulate some growth and fluctuation
    const growthFactor = 1 + (i * 0.05) + (Math.random() * 0.1 - 0.05);
    
    return {
      year,
      revenue: 50000000000 * growthFactor * multiplier,
      netIncome: 10000000000 * growthFactor * multiplier,
      eps: (5 * growthFactor) * multiplier,
      freeCashFlow: 12000000000 * growthFactor * multiplier,
      dividendPerShare: 0.5 * growthFactor * multiplier,
      bookValuePerShare: 25 * growthFactor * multiplier,
      roic: 15 + (i * 0.5) + (Math.random() * 2 - 1),
      debtToEquity: 0.4 - (i * 0.02) + (Math.random() * 0.1 - 0.05),
    };
  });
  
  // Current metrics
  const metrics = [
    { name: 'Umsatz (TTM)', value: 55000000000 * multiplier, unit: 'EUR', trend: 'up' },
    { name: 'Gewinn pro Aktie', value: 5.5 * multiplier, unit: 'EUR', trend: 'up' },
    { name: 'Free Cash Flow', value: 13000000000 * multiplier, unit: 'EUR', trend: 'up' },
    { name: 'Eigenkapitalrendite', value: 18, unit: '%', trend: 'stable' },
    { name: 'Verschuldungsgrad', value: 0.35, unit: 'ratio', trend: 'down' },
    { name: 'Dividendenrendite', value: 0.69, unit: '%', trend: 'stable' },
    { name: 'Kurs-Gewinn-Verhältnis', value: 12.5, unit: 'ratio', trend: 'down' },
    { name: 'Kurs-Buchwert-Verhältnis', value: 2.1, unit: 'ratio', trend: 'stable' },
  ];
  
  return {
    metrics,
    historicalData,
    // Include original currency information if it's a Korean stock
    ...(isKoreanStock && {
      originalCurrency: 'KRW',
      targetCurrency: 'EUR',
      conversionRate: 1450
    })
  };
};

/**
 * Calculates an overall rating and investment recommendation for a stock
 * @param ticker The stock ticker symbol
 * @returns Promise containing overall rating and recommendations
 */
export const getOverallRating = async (ticker: string) => {
  console.log(`Getting overall rating for ${ticker}`);
  
  // Determine if we should use high values (to simulate KRW) based on ticker
  const isKoreanStock = ticker.endsWith('.KS');
  const multiplier = isKoreanStock ? 1450 : 1;
  
  // Calculate intrinsic value using a simple DCF model
  const currentEPS = 5.5 * multiplier;
  const growthRate = 0.03; // 3% annual growth
  const discountRate = 0.08; // 8% discount rate
  const terminalMultiple = 15;
  
  // 10-year DCF calculation
  let intrinsicValue = 0;
  for (let i = 1; i <= 10; i++) {
    const futureEPS = currentEPS * Math.pow(1 + growthRate, i);
    intrinsicValue += futureEPS / Math.pow(1 + discountRate, i);
  }
  
  // Terminal value
  const terminalEPS = currentEPS * Math.pow(1 + growthRate, 10);
  const terminalValue = terminalEPS * terminalMultiple;
  intrinsicValue += terminalValue / Math.pow(1 + discountRate, 10);
  
  // Add margin of safety (20%)
  const marginOfSafety = 0.2;
  const bestBuyPrice = intrinsicValue * (1 - marginOfSafety);
  
  // Current market price
  const currentPrice = 108;
  
  // Calculate undervaluation percentage
  const undervaluedPercent = ((intrinsicValue - currentPrice) / currentPrice) * 100;
  
  // Determine recommendation
  let recommendation = 'Beobachten';
  let reason = 'Die Aktie ist nahe am fairen Wert.';
  
  if (undervaluedPercent > 20) {
    recommendation = 'Kaufen';
    reason = `Die Aktie ist um ${Math.round(undervaluedPercent)}% unterbewertet.`;
  } else if (undervaluedPercent < -10) {
    recommendation = 'Vermeiden';
    reason = `Die Aktie ist um ${Math.round(Math.abs(undervaluedPercent))}% überbewertet.`;
  }
  
  return {
    qualityScore: 7.3, // out of 10
    valuationScore: 8.5, // out of 10
    momentumScore: 6.4, // out of 10
    overallScore: 7.4, // weighted average
    intrinsicValue: intrinsicValue,
    bestBuyPrice: bestBuyPrice,
    currentPrice: currentPrice,
    undervaluedPercent: undervaluedPercent,
    recommendation: recommendation,
    reason: reason,
    strengths: [
      'Starke Marktposition im Halbleitersektor',
      'Gute finanzielle Stabilität',
      'Hohe Eigenkapitalrendite',
      'Konsistenter Free Cash Flow'
    ],
    weaknesses: [
      'Zyklisches Geschäftsmodell',
      'Niedrige Dividendenrendite',
      'Starker Wettbewerb in der Branche'
    ],
    dcfAssumptions: {
      growthRate: growthRate,
      discountRate: discountRate,
      terminalMultiple: terminalMultiple,
      timeHorizon: 10,
      marginOfSafety: marginOfSafety
    },
    // Include original currency information if it's a Korean stock
    ...(isKoreanStock && {
      originalCurrency: 'KRW',
      targetCurrency: 'EUR',
      conversionRate: 1450
    })
  };
};
