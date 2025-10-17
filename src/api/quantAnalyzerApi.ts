
import axios from 'axios';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';

const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Helper function for API requests
const fetchFromFMP = async (endpoint: string, params = {}) => {
  try {
    // Always use the hardcoded API key
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      params: {
        apikey: DEFAULT_FMP_API_KEY,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error(`Fehler beim Abrufen von Daten. Bitte versuchen Sie es später erneut.`);
  }
};

// Available exchanges and indices
export const marketOptions = [
  // Börsen
  { id: 'XETRA', name: 'XETRA (Deutschland)', currency: 'EUR', type: 'exchange' },
  { id: 'NYSE', name: 'NYSE (New York)', currency: 'USD', type: 'exchange' },
  { id: 'NASDAQ', name: 'NASDAQ', currency: 'USD', type: 'exchange' },
  { id: 'LSE', name: 'LSE (London)', currency: 'GBP', type: 'exchange' },
  { id: 'EURONEXT', name: 'EURONEXT', currency: 'EUR', type: 'exchange' },
  { id: 'TSX', name: 'TSX (Toronto)', currency: 'CAD', type: 'exchange' },
  { id: 'HKSE', name: 'HKSE (Hong Kong)', currency: 'HKD', type: 'exchange' },
  
  // Major Indices
  { id: 'SP500', name: 'S&P 500', currency: 'USD', type: 'index' },
  { id: 'DOW', name: 'Dow Jones', currency: 'USD', type: 'index' },
  { id: 'NASDAQ100', name: 'NASDAQ 100', currency: 'USD', type: 'index' },
  { id: 'DAX', name: 'DAX (Deutschland)', currency: 'EUR', type: 'index' },
  { id: 'FTSE100', name: 'FTSE 100', currency: 'GBP', type: 'index' },
  { id: 'NIKKEI', name: 'Nikkei 225', currency: 'JPY', type: 'index' }
];

// Backwards compatibility
export const exchanges = marketOptions.filter(option => option.type === 'exchange');

// Get tickers for an exchange or index
export const getStocksByMarket = async (marketId: string) => {
  const marketOption = marketOptions.find(option => option.id === marketId);
  
  if (!marketOption) {
    throw new Error(`Unknown market: ${marketId}`);
  }
  
  if (marketOption.type === 'exchange') {
    // Existing exchange logic
    const stocks = await fetchFromFMP('/stock/list');
    return stocks.filter((stock: any) => 
      stock.exchangeShortName === marketId && 
      stock.type === 'stock' && 
      !stock.isEtf && 
      !stock.isActivelyTrading !== false
    );
  } else if (marketOption.type === 'index') {
    // Index constituent logic
    return await getIndexConstituents(marketId);
  }
  
  return [];
};

// Get index constituents
const getIndexConstituents = async (indexId: string) => {
  try {
    let endpoint = '';
    
    switch (indexId) {
      case 'SP500':
        endpoint = '/sp500_constituent';
        break;
      case 'DOW':
        endpoint = '/dowjones_constituent';  
        break;
      case 'NASDAQ100':
        endpoint = '/nasdaq_constituent';
        break;
      case 'DAX':
        // DAX constituents via custom logic or fallback to German exchanges
        const germanStocks = await fetchFromFMP('/stock/list');
        return germanStocks.filter((stock: any) => 
          stock.exchangeShortName === 'XETRA' && 
          stock.type === 'stock' && 
          !stock.isEtf
        ).slice(0, 40); // Approximate DAX size
      case 'FTSE100':
        const ukStocks = await fetchFromFMP('/stock/list');
        return ukStocks.filter((stock: any) => 
          stock.exchangeShortName === 'LSE' && 
          stock.type === 'stock' && 
          !stock.isEtf
        ).slice(0, 100);
      case 'NIKKEI':
        // Fallback for Nikkei - would need more sophisticated mapping
        return [];
      default:
        return [];
    }
    
    if (endpoint) {
      const constituents = await fetchFromFMP(endpoint);
      return constituents.map((constituent: any) => ({
        symbol: constituent.symbol,
        name: constituent.name || constituent.companyName,
        exchangeShortName: constituent.exchange || 'NYSE', // Default fallback
        type: 'stock'
      }));
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching index constituents for ${indexId}:`, error);
    return [];
  }
};

// Backwards compatibility
export const getStocksByExchange = getStocksByMarket;

// Function types for Quantitative Analysis
export interface QuantAnalysisResult {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  buffettScore: number; // Max 13 points
  criteria: {
    roe: { value: number | null; pass: boolean },
    roic: { value: number | null; pass: boolean; wacc?: number | null; spread?: number | null },
    netMargin: { value: number | null; pass: boolean; fcfMargin?: number | null },
    epsGrowth: { value: number | null; pass: boolean; cagr5y?: number | null; positiveYears?: number },
    revenueGrowth: { value: number | null; pass: boolean; cagr5y?: number | null; negativeYears?: number },
    interestCoverage: { value: number | null; pass: boolean },
    debtRatio: { 
      value: number | null; 
      pass: boolean;
      netDebtToEbitda?: number | null;
      netDebtToFcf?: number | null;
      debtToEquity?: number | null;
    },
    pe: { value: number | null; pass: boolean },
    pb: { value: number | null; pass: boolean },
    dividendYield: { 
      value: number | null; 
      pass: boolean;
      payoutRatio?: number | null;
      dividendGrowth5y?: number | null;
    },
    intrinsicValue: { 
      value: number | null; 
      pass: boolean;
      points: 0 | 1 | 2; // Gestaffelte Punktevergabe
    }
  };
  price: number;
  currency: string;
  intrinsicValue?: number | null;
  marginOfSafety?: number | null;
  originalValues?: {
    roe?: number | null;
    roic?: number | null;
    netMargin?: number | null;
    eps?: number | null;
    revenue?: number | null;
    pe?: number | null;
    pb?: number | null;
    price?: number | null;
    intrinsicValue?: number | null;
  };
}

// Safe value extractor
const safeValue = (value: any) => {
  if (value === undefined || value === null) return null;
  const numValue = Number(value);
  return isNaN(numValue) ? null : numValue;
};

// Helper: Calculate simplified WACC
const calculateSimplifiedWACC = (
  marketCap: number | null,
  totalDebt: number | null,
  interestExpense: number | null,
  taxRate: number | null,
  beta: number | null
): number | null => {
  if (!marketCap || !totalDebt || marketCap <= 0 || totalDebt < 0) return null;
  
  const riskFreeRate = 0.04; // 4% (10-Year Treasury)
  const marketRiskPremium = 0.08; // 8%
  const safeBeta = beta && beta > 0 ? beta : 1.0; // Default to 1.0 if missing
  
  // Cost of Equity: Risk-free rate + Beta × Market Risk Premium
  const costOfEquity = riskFreeRate + safeBeta * marketRiskPremium;
  
  // Cost of Debt: Interest Expense / Total Debt
  let costOfDebt = 0.05; // Default 5%
  if (interestExpense && totalDebt > 0) {
    costOfDebt = Math.abs(interestExpense) / totalDebt;
  }
  
  const safeTaxRate = taxRate && taxRate > 0 && taxRate < 1 ? taxRate : 0.25; // Default 25%
  
  const totalValue = marketCap + totalDebt;
  const equityWeight = marketCap / totalValue;
  const debtWeight = totalDebt / totalValue;
  
  const wacc = (equityWeight * costOfEquity) + (debtWeight * costOfDebt * (1 - safeTaxRate));
  
  return wacc * 100; // Return as percentage
};

// Helper: Calculate 5-year CAGR
const calculate5YearCAGR = (values: number[]): number | null => {
  if (values.length < 5) return null;
  
  const startValue = values[4]; // Oldest (5 years ago)
  const endValue = values[0]; // Most recent
  
  if (!startValue || startValue <= 0 || !endValue || endValue <= 0) return null;
  
  const years = 5;
  const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  
  return isNaN(cagr) ? null : cagr;
};

// Helper: Count positive years
const countPositiveYears = (values: number[]): number => {
  let count = 0;
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] > values[i + 1]) {
      count++;
    }
  }
  return count;
};

// Helper: Count negative years
const countNegativeYears = (values: number[]): number => {
  let count = 0;
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] < values[i + 1]) {
      count++;
    }
  }
  return count;
};

// Helper: Calculate FCF Margin
const calculateFCFMargin = (fcf: number | null, revenue: number | null): number | null => {
  if (!fcf || !revenue || revenue <= 0) return null;
  return (fcf / revenue) * 100;
};

// Helper: Calculate Net Debt
const calculateNetDebt = (totalDebt: number | null, cash: number | null): number => {
  const debt = totalDebt || 0;
  const cashAmount = cash || 0;
  return Math.max(0, debt - cashAmount); // Net debt can't be negative for our purposes
};

// Helper: Calculate Dividend Payout Ratio (FCF-based)
const calculateDividendPayoutRatio = (totalDividends: number | null, fcf: number | null): number | null => {
  if (!totalDividends || !fcf || fcf <= 0) return null;
  return (totalDividends / fcf) * 100;
};

// Helper: Calculate 5-year dividend growth
const calculate5YearDividendGrowth = (dividends: number[]): number | null => {
  if (dividends.length < 5) return null;
  
  const startDiv = dividends[4];
  const endDiv = dividends[0];
  
  if (!startDiv || startDiv <= 0 || !endDiv || endDiv <= 0) return null;
  
  const growth = (Math.pow(endDiv / startDiv, 1 / 5) - 1) * 100;
  return isNaN(growth) ? null : growth;
};

// Calculate simplified intrinsic value using multiple methods
const calculateSimplifiedIntrinsicValue = (
  eps: number | null,
  bookValue: number | null,
  pe: number | null,
  revenue: number | null,
  netMargin: number | null,
  sharesOutstanding: number | null
): number | null => {
  console.log('Calculating intrinsic value with:', { eps, bookValue, pe, revenue, netMargin, sharesOutstanding });
  
  const results: number[] = [];
  
  // Method 1: Graham Number (conservative)
  if (eps !== null && eps > 0 && bookValue !== null && bookValue > 0) {
    const grahamNumber = Math.sqrt(22.5 * eps * bookValue);
    if (!isNaN(grahamNumber) && grahamNumber > 0) {
      results.push(grahamNumber);
      console.log(`Graham Number: ${grahamNumber}`);
    }
  }
  
  // Method 2: Simple P/E based valuation (using conservative P/E of 12-15)
  if (eps !== null && eps > 0) {
    const conservativePE = 12; // Buffett's preferred range
    const peBasedValue = eps * conservativePE;
    if (!isNaN(peBasedValue) && peBasedValue > 0) {
      results.push(peBasedValue);
      console.log(`P/E based value (12x): ${peBasedValue}`);
    }
  }
  
  // Method 3: Revenue-based valuation (for growth companies)
  if (revenue !== null && revenue > 0 && netMargin !== null && netMargin > 0 && sharesOutstanding !== null && sharesOutstanding > 0) {
    const estimatedEarnings = (revenue * (netMargin / 100)) / sharesOutstanding;
    const revenueBasedValue = estimatedEarnings * 10; // Conservative 10x multiple
    if (!isNaN(revenueBasedValue) && revenueBasedValue > 0) {
      results.push(revenueBasedValue);
      console.log(`Revenue based value: ${revenueBasedValue}`);
    }
  }
  
  if (results.length === 0) {
    console.log('No valid intrinsic value calculation possible');
    return null;
  }
  
  // Use median of available methods for robustness
  results.sort((a, b) => a - b);
  const median = results.length % 2 === 0 
    ? (results[results.length / 2 - 1] + results[results.length / 2]) / 2
    : results[Math.floor(results.length / 2)];
  
  console.log(`Intrinsic value methods used: ${results.length}, median: ${median}`);
  return parseFloat(median.toFixed(2));
};

// Sleep function for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Analyze a single ticker by Buffett criteria
export const analyzeStockByBuffettCriteria = async (ticker: string): Promise<QuantAnalysisResult | null> => {
  try {
    // Fetch all necessary data in parallel
    const [
      ratiosTTM, 
      ratiosHistorical,
      profile, 
      incomeStatements, 
      balanceSheets,
      keyMetrics,
      cashFlowStatements,
      quote,
      dividendHistory
    ] = await Promise.all([
      fetchFromFMP(`/ratios-ttm/${ticker}`),
      fetchFromFMP(`/ratios/${ticker}?limit=6`),
      fetchFromFMP(`/profile/${ticker}`),
      fetchFromFMP(`/income-statement/${ticker}?limit=10`),
      fetchFromFMP(`/balance-sheet-statement/${ticker}?limit=6`),
      fetchFromFMP(`/key-metrics-ttm/${ticker}`),
      fetchFromFMP(`/cash-flow-statement/${ticker}?limit=6`),
      fetchFromFMP(`/quote/${ticker}`),
      fetchFromFMP(`/historical-price-full/stock_dividend/${ticker}?limit=6`).catch(() => null)
    ]);

    // Check if we have enough data
    if (!ratiosTTM || ratiosTTM.length === 0 || !profile || profile.length === 0) {
      console.warn(`Not enough data for ${ticker}`);
      return null;
    }

    const companyProfile = profile[0];
    const ratios = ratiosTTM[0];
    const metrics = keyMetrics && keyMetrics.length > 0 ? keyMetrics[0] : null;
    const quoteData = quote && quote.length > 0 ? quote[0] : null;
    
    // Extract currency info
    const stockCurrency = companyProfile.currency || 'USD';
    console.log(`Analyzing ${ticker} with currency: ${stockCurrency}`);
    
    // Store original values before any currency conversion
    const originalValues = {
      roe: safeValue(ratios.returnOnEquityTTM) * 100,
      roic: metrics ? safeValue(metrics.roicTTM) * 100 : null,
      netMargin: safeValue(ratios.netProfitMarginTTM) * 100,
      price: quoteData ? quoteData.price : 0
    };

    // Prepare data for advanced criteria
    const totalDebt = balanceSheets && balanceSheets.length > 0 ? 
      (safeValue(balanceSheets[0].totalDebt) || 
       (safeValue(balanceSheets[0].shortTermDebt) + safeValue(balanceSheets[0].longTermDebt))) : null;
    const cash = balanceSheets && balanceSheets.length > 0 ? safeValue(balanceSheets[0].cashAndCashEquivalents) : null;
    const netDebt = calculateNetDebt(totalDebt, cash);
    const ebitda = incomeStatements && incomeStatements.length > 0 ? safeValue(incomeStatements[0].ebitda) : null;
    const fcf = cashFlowStatements && cashFlowStatements.length > 0 ? safeValue(cashFlowStatements[0].freeCashFlow) : null;
    const equity = balanceSheets && balanceSheets.length > 0 ? safeValue(balanceSheets[0].totalStockholdersEquity) : null;

    // Calculate WACC for ROIC criterion
    const marketCap = safeValue(companyProfile.mktCap);
    const interestExpense = incomeStatements && incomeStatements.length > 0 ? safeValue(incomeStatements[0].interestExpense) : null;
    const taxRate = incomeStatements && incomeStatements.length > 0 ? safeValue(incomeStatements[0].incomeTaxExpense) / safeValue(incomeStatements[0].incomeBeforeTax) : null;
    const beta = safeValue(companyProfile.beta);
    const wacc = calculateSimplifiedWACC(marketCap, totalDebt, interestExpense, taxRate, beta);

    // 1. ROIC ≥ 12% AND ROIC > WACC + 5 pp
    const roic = metrics ? safeValue(metrics.roicTTM) * 100 : null;
    let roicSpread = null;
    let roicPass = false;
    if (roic !== null && roic >= 12) {
      if (wacc !== null) {
        roicSpread = roic - wacc;
        roicPass = roicSpread > 5;
      } else {
        // If WACC not available, just check ROIC ≥ 12%
        roicPass = true;
      }
    }

    // 2. ROE ≥ 15% (nur wenn auch ROIC > 10% UND Net Debt/EBITDA ≤ 2,5)
    const roe = safeValue(ratios.returnOnEquityTTM) * 100;
    let roePass = false;
    if (roe !== null && roe >= 15) {
      // Check combination rule
      const roicForRoe = roic !== null && roic > 10;
      const netDebtToEbitda = ebitda && ebitda > 0 ? netDebt / ebitda : null;
      const debtOk = netDebtToEbitda !== null && netDebtToEbitda <= 2.5;
      roePass = roicForRoe && debtOk;
    }

    // 3. Nettomarge ≥ 10% ODER FCF-Marge ≥ 5%
    const netMargin = safeValue(ratios.netProfitMarginTTM) * 100;
    const currentRevenue = incomeStatements && incomeStatements.length > 0 ? safeValue(incomeStatements[0].revenue) : null;
    const fcfMargin = calculateFCFMargin(fcf, currentRevenue);
    const netMarginPass = (netMargin !== null && netMargin >= 10) || (fcfMargin !== null && fcfMargin >= 5);

    // 4. EPS 5-J CAGR ≥ 5% & 4/5 Jahre ↑
    let epsGrowth = null;
    let epsCagr5y = null;
    let epsPositiveYears = 0;
    let epsGrowthPass = false;
    
    if (incomeStatements && incomeStatements.length >= 6) {
      const epsValues = incomeStatements.slice(0, 6).map(stmt => safeValue(stmt.eps)).filter(v => v !== null) as number[];
      if (epsValues.length >= 5) {
        epsCagr5y = calculate5YearCAGR(epsValues);
        epsPositiveYears = countPositiveYears(epsValues);
        epsGrowthPass = epsCagr5y !== null && epsCagr5y >= 5 && epsPositiveYears >= 4;
      }
      // Fallback: simple growth for display
      const currentEps = safeValue(incomeStatements[0].eps);
      const pastEps = safeValue(incomeStatements[2].eps);
      if (currentEps !== null && pastEps !== null && pastEps !== 0) {
        epsGrowth = ((currentEps - pastEps) / Math.abs(pastEps)) * 100;
      }
    }

    // 5. Umsatz 5-J CAGR ≥ 3% & max. 1 Jahr ↓
    let revenueGrowth = null;
    let revenueCagr5y = null;
    let revenueNegativeYears = 0;
    let revenueGrowthPass = false;
    
    if (incomeStatements && incomeStatements.length >= 6) {
      const revenueValues = incomeStatements.slice(0, 6).map(stmt => safeValue(stmt.revenue)).filter(v => v !== null) as number[];
      if (revenueValues.length >= 5) {
        revenueCagr5y = calculate5YearCAGR(revenueValues);
        revenueNegativeYears = countNegativeYears(revenueValues);
        revenueGrowthPass = revenueCagr5y !== null && revenueCagr5y >= 3 && revenueNegativeYears <= 1;
      }
      // Fallback: simple growth for display
      if (revenueValues.length >= 3) {
        const currentRev = revenueValues[0];
        const pastRev = revenueValues[2];
        if (pastRev && pastRev !== 0) {
          revenueGrowth = ((currentRev - pastRev) / pastRev) * 100;
        }
      }
    }

    // 6. EBIT/Interest > 6
    const interestCoverage = safeValue(ratios.interestCoverageTTM);
    const interestCoveragePass = interestCoverage !== null && interestCoverage > 6;

    // 7. Schuldenquote: Net Debt/EBITDA < 2,5 (primär) ODER Net Debt/FCF < 4 ODER Debt/Equity < 1
    let debtRatio = null;
    let debtRatioPass = false;
    let netDebtToEbitda: number | null = null;
    let netDebtToFcf: number | null = null;
    let debtToEquity: number | null = null;
    
    // Primary: Net Debt/EBITDA < 2.5
    if (ebitda && ebitda > 0) {
      netDebtToEbitda = netDebt / ebitda;
      debtRatio = netDebtToEbitda;
      debtRatioPass = netDebtToEbitda < 2.5;
    }
    
    // Alternative: Net Debt/FCF < 4
    if (!debtRatioPass && fcf && fcf > 0) {
      netDebtToFcf = netDebt / fcf;
      debtRatio = netDebtToFcf;
      debtRatioPass = netDebtToFcf < 4;
    }
    
    // Fallback: Debt/Equity < 1
    if (!debtRatioPass && totalDebt && equity && equity > 0) {
      debtToEquity = totalDebt / equity;
      debtRatio = debtToEquity;
      debtRatioPass = debtToEquity < 1;
    }

    // 8. P/E < 15
    const pe = safeValue(ratios.priceEarningsRatioTTM);
    const pePass = pe !== null && pe > 0 && pe < 15;

    // 9. P/B < 1.5 (or < 3 for moat companies)
    const pb = safeValue(ratios.priceToBookRatioTTM);
    const hasMoat = safeValue(ratios.grossProfitMarginTTM) > 0.5;
    const pbThreshold = hasMoat ? 3 : 1.5;
    const pbPass = pb !== null && pb > 0 && pb < pbThreshold;

    // 10. Dividendenrendite > 2% UND Payout (FCF) ≤ 60% UND 5-J-Dividendenwachstum ≥ 3%
    let dividendYield = safeValue(ratios.dividendYieldTTM) * 100;
    let dividendPayoutRatio: number | null = null;
    let dividendGrowth5y: number | null = null;
    let dividendYieldPass = false;
    
    // Falls aktuelle Dividendenrendite 0 ist, versuche historische Daten
    if (dividendYield === 0 && ratiosHistorical && ratiosHistorical.length > 1) {
      const previousYearRatios = ratiosHistorical[1];
      const previousDividendYield = safeValue(previousYearRatios.dividendYield) * 100;
      if (previousDividendYield > 0) {
        dividendYield = previousDividendYield;
      }
    }
    
    if (dividendYield !== null && dividendYield > 2) {
      // Check payout ratio
      const totalDividendsPaid = incomeStatements && incomeStatements.length > 0 ? 
        Math.abs(safeValue(incomeStatements[0].dividendsPaid)) : null;
      dividendPayoutRatio = calculateDividendPayoutRatio(totalDividendsPaid, fcf);
      
      // Check 5-year dividend growth
      if (dividendHistory && dividendHistory.historical && dividendHistory.historical.length >= 5) {
        const divs = dividendHistory.historical.slice(0, 6).map((d: any) => safeValue(d.dividend)).filter((v: number | null) => v !== null) as number[];
        dividendGrowth5y = calculate5YearDividendGrowth(divs);
      }
      
      const payoutOk = dividendPayoutRatio === null || dividendPayoutRatio <= 60; // If no data, pass
      const growthOk = dividendGrowth5y === null || dividendGrowth5y >= 3; // If no data, pass
      
      dividendYieldPass = payoutOk && growthOk;
    }

    // 11. Innerer Wert mit gestaffelter Punktevergabe (0, 1, 2)
    const currentPrice = quoteData ? quoteData.price : 0;
    let intrinsicValueCalc = null;
    let intrinsicValuePass = false;
    let intrinsicValuePoints: 0 | 1 | 2 = 0;
    let marginOfSafety = null;

    const currentEps = incomeStatements && incomeStatements.length > 0 ? safeValue(incomeStatements[0].eps) : null;
    const bookValuePerShare = balanceSheets && balanceSheets.length > 0 ? 
      safeValue(balanceSheets[0].totalStockholdersEquity) / safeValue(companyProfile.mktCap / currentPrice) : null;
    const sharesOutstanding = safeValue(companyProfile.mktCap / currentPrice);

    intrinsicValueCalc = calculateSimplifiedIntrinsicValue(
      currentEps,
      bookValuePerShare, 
      pe,
      currentRevenue,
      netMargin,
      sharesOutstanding
    );

    if (intrinsicValueCalc !== null && currentPrice > 0) {
      marginOfSafety = ((intrinsicValueCalc - currentPrice) / currentPrice) * 100;
      
      if (intrinsicValueCalc > currentPrice) {
        intrinsicValuePass = true;
        // Tiered points based on margin of safety
        if (marginOfSafety >= 20) {
          intrinsicValuePoints = 2;
        } else {
          intrinsicValuePoints = 1;
        }
      }
      
      console.log(`${ticker}: Intrinsic Value: ${intrinsicValueCalc}, Price: ${currentPrice}, Margin of Safety: ${marginOfSafety?.toFixed(2)}%, Points: ${intrinsicValuePoints}`);
    }

    // Store original intrinsic value
    const updatedOriginalValues = {
      ...originalValues,
      intrinsicValue: intrinsicValueCalc
    };

    // Calculate Buffett Score - now max 13 points
    const buffettScore = [
      roePass, roicPass, netMarginPass, epsGrowthPass, revenueGrowthPass,
      interestCoveragePass, debtRatioPass, pePass, pbPass, dividendYieldPass
    ].filter(Boolean).length + intrinsicValuePoints;

    return {
      symbol: ticker,
      name: companyProfile.companyName,
      exchange: companyProfile.exchangeShortName,
      sector: companyProfile.sector || 'Unknown',
      buffettScore,
      criteria: {
        roe: { value: roe, pass: roePass },
        roic: { value: roic, pass: roicPass, wacc, spread: roicSpread },
        netMargin: { value: netMargin, pass: netMarginPass, fcfMargin },
        epsGrowth: { value: epsGrowth, pass: epsGrowthPass, cagr5y: epsCagr5y, positiveYears: epsPositiveYears },
        revenueGrowth: { value: revenueGrowth, pass: revenueGrowthPass, cagr5y: revenueCagr5y, negativeYears: revenueNegativeYears },
        interestCoverage: { value: interestCoverage, pass: interestCoveragePass },
        debtRatio: { value: debtRatio, pass: debtRatioPass, netDebtToEbitda, netDebtToFcf, debtToEquity },
        pe: { value: pe, pass: pePass },
        pb: { value: pb, pass: pbPass },
        dividendYield: { value: dividendYield, pass: dividendYieldPass, payoutRatio: dividendPayoutRatio, dividendGrowth5y },
        intrinsicValue: { value: intrinsicValueCalc, pass: intrinsicValuePass, points: intrinsicValuePoints }
      },
      price: currentPrice,
      currency: stockCurrency,
      intrinsicValue: intrinsicValueCalc,
      marginOfSafety: marginOfSafety,
      originalValues: updatedOriginalValues
    };
  } catch (error) {
    console.error(`Error analyzing ${ticker}:`, error);
    return null;
  }
};

// Batch-Analyse für mehrere Aktien einer Börse oder eines Index mit Rate-Limiting
export const analyzeMarket = async (
  marketId: string, 
  limit: number = 500,
  onProgress?: (progress: number, currentOperation: string) => void
) => {
  try {
    const marketOption = marketOptions.find(option => option.id === marketId);
    const marketName = marketOption ? marketOption.name : marketId;
    
    // Aktien des Marktes abrufen (Börse oder Index)
    const marketStocks = await getStocksByMarket(marketId);
    const stocksToAnalyze = marketStocks.slice(0, limit);
    
    console.log(`Analysiere ${stocksToAnalyze.length} Aktien von ${marketName} in Batches`);
    
    const results: QuantAnalysisResult[] = [];
    const batchSize = 50; // Etwa 50 Aktien pro Minute (300 API calls / 6 calls per stock)
    const totalBatches = Math.ceil(stocksToAnalyze.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, stocksToAnalyze.length);
      const batch = stocksToAnalyze.slice(startIndex, endIndex);
      
      console.log(`Batch ${batchIndex + 1}/${totalBatches}: Analysiere Aktien ${startIndex + 1}-${endIndex}`);
      
      if (onProgress) {
        const progress = Math.round((batchIndex / totalBatches) * 100);
        onProgress(progress, `Batch ${batchIndex + 1}/${totalBatches}: Analysiere ${batch.length} Aktien...`);
      }
      
      // Analyze stocks in current batch
      for (const stock of batch) {
        try {
          const analysis = await analyzeStockByBuffettCriteria(stock.symbol);
          if (analysis) {
            results.push(analysis);
          }
        } catch (error) {
          console.error(`Fehler bei der Analyse von ${stock.symbol}:`, error);
        }
      }
      
      // Wait 65 seconds between batches (to ensure we don't hit the rate limit)
      if (batchIndex < totalBatches - 1) {
        console.log(`Warte 65 Sekunden vor dem nächsten Batch...`);
        if (onProgress) {
          onProgress(
            Math.round((batchIndex / totalBatches) * 100), 
            `Warte 65 Sekunden vor Batch ${batchIndex + 2}/${totalBatches}...`
          );
        }
        await sleep(65000); // 65 seconds delay
      }
    }
    
    if (onProgress) {
      onProgress(100, `Analyse abgeschlossen: ${results.length} Aktien analysiert`);
    }
    
    // Nach Buffett-Score sortieren (absteigend)
    return results.sort((a, b) => b.buffettScore - a.buffettScore);
  } catch (error) {
    console.error('Fehler bei der Marktanalyse:', error);
    throw error;
  }
};

// Backwards compatibility
export const analyzeExchange = analyzeMarket;

// Exportieren der CSV-Datei
export const exportToCsv = (results: QuantAnalysisResult[]) => {
  const headers = [
    'Symbol', 'Name', 'Exchange', 'Sector', 'Buffett Score',
    'ROE (%)', 'ROIC (%)', 'Net Margin (%)', 'EPS Growth (%)', 'Revenue Growth (%)',
    'Interest Coverage', 'Debt Ratio (%)', 'P/E', 'P/B', 'Dividend Yield (%)',
    'Intrinsic Value', 'Intrinsic Value with Margin', 'Price', 'Currency', 'Margin of Safety (%)'
  ];
  
  const rows = results.map(result => [
    result.symbol,
    result.name,
    result.exchange,
    result.sector,
    result.buffettScore,
    result.criteria.roe.value !== null ? result.criteria.roe.value.toFixed(2) : 'N/A',
    result.criteria.roic.value !== null ? result.criteria.roic.value.toFixed(2) : 'N/A',
    result.criteria.netMargin.value !== null ? result.criteria.netMargin.value.toFixed(2) : 'N/A',
    result.criteria.epsGrowth.value !== null ? result.criteria.epsGrowth.value.toFixed(2) : 'N/A',
    result.criteria.revenueGrowth.value !== null ? result.criteria.revenueGrowth.value.toFixed(2) : 'N/A',
    result.criteria.interestCoverage.value !== null ? result.criteria.interestCoverage.value.toFixed(2) : 'N/A',
    result.criteria.debtRatio.value !== null ? result.criteria.debtRatio.value.toFixed(2) : 'N/A',
    result.criteria.pe.value !== null ? result.criteria.pe.value.toFixed(2) : 'N/A',
    result.criteria.pb.value !== null ? result.criteria.pb.value.toFixed(2) : 'N/A',
    result.criteria.dividendYield.value !== null ? result.criteria.dividendYield.value.toFixed(2) : 'N/A',
    result.criteria.intrinsicValue.value !== null ? result.criteria.intrinsicValue.value.toFixed(2) : 'N/A',
    result.criteria.intrinsicValue.points,
    result.price.toFixed(2),
    result.currency,
    result.marginOfSafety !== null ? result.marginOfSafety.toFixed(2) : 'N/A'
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `buffett-analysis-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
