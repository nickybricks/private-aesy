
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

// Available exchanges
export const exchanges = [
  { id: 'XETRA', name: 'XETRA (Deutschland)', currency: 'EUR' },
  { id: 'NYSE', name: 'NYSE (New York)', currency: 'USD' },
  { id: 'NASDAQ', name: 'NASDAQ', currency: 'USD' },
  { id: 'LSE', name: 'LSE (London)', currency: 'GBP' },
  { id: 'EURONEXT', name: 'EURONEXT', currency: 'EUR' },
  { id: 'TSX', name: 'TSX (Toronto)', currency: 'CAD' },
  { id: 'HKSE', name: 'HKSE (Hong Kong)', currency: 'HKD' }
];

// Get tickers for an exchange
export const getStocksByExchange = async (exchange: string) => {
  const stocks = await fetchFromFMP('/stock/list');
  return stocks.filter((stock: any) => 
    stock.exchangeShortName === exchange && 
    stock.type === 'stock' && 
    !stock.isEtf && 
    !stock.isActivelyTrading !== false
  );
};

// Function types for Quantitative Analysis
export interface QuantAnalysisResult {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  buffettScore: number;
  criteria: {
    roe: { value: number | null; pass: boolean },
    roic: { value: number | null; pass: boolean },
    netMargin: { value: number | null; pass: boolean },
    epsGrowth: { value: number | null; pass: boolean },
    revenueGrowth: { value: number | null; pass: boolean },
    interestCoverage: { value: number | null; pass: boolean },
    debtRatio: { value: number | null; pass: boolean },
    pe: { value: number | null; pass: boolean },
    pb: { value: number | null; pass: boolean },
    dividendYield: { value: number | null; pass: boolean },
    intrinsicValue: { value: number | null; pass: boolean },
    intrinsicValueWithMargin: { value: number | null; pass: boolean }
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
      quote
    ] = await Promise.all([
      fetchFromFMP(`/ratios-ttm/${ticker}`),
      fetchFromFMP(`/ratios/${ticker}?limit=3`),
      fetchFromFMP(`/profile/${ticker}`),
      fetchFromFMP(`/income-statement/${ticker}?limit=10`),
      fetchFromFMP(`/balance-sheet-statement/${ticker}?limit=5`),
      fetchFromFMP(`/key-metrics-ttm/${ticker}`),
      fetchFromFMP(`/quote/${ticker}`)
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

    // 1. ROE > 15%
    const roe = safeValue(ratios.returnOnEquityTTM) * 100;
    const roePass = roe !== null && roe > 15;

    // 2. ROIC > 10%
    const roic = metrics ? safeValue(metrics.roicTTM) * 100 : null;
    const roicPass = roic !== null && roic > 10;

    // 3. Net margin > 10%
    const netMargin = safeValue(ratios.netProfitMarginTTM) * 100;
    const netMarginPass = netMargin !== null && netMargin > 10;

    // 4. Stable EPS growth
    let epsGrowth = null;
    let epsGrowthPass = false;
    
    if (incomeStatements && incomeStatements.length >= 3) {
      const currentEps = safeValue(incomeStatements[0].eps);
      const pastEps = safeValue(incomeStatements[2].eps);
      
      if (currentEps !== null && pastEps !== null && pastEps !== 0) {
        epsGrowth = ((currentEps - pastEps) / Math.abs(pastEps)) * 100;
        epsGrowthPass = epsGrowth > 0;
      }
    }

    // 5. Stable revenue growth
    let revenueGrowth = null;
    let revenueGrowthPass = false;
    
    if (incomeStatements && incomeStatements.length >= 3) {
      const currentRevenue = safeValue(incomeStatements[0].revenue);
      const pastRevenue = safeValue(incomeStatements[2].revenue);
      
      if (currentRevenue !== null && pastRevenue !== null && pastRevenue !== 0) {
        revenueGrowth = ((currentRevenue - pastRevenue) / pastRevenue) * 100;
        revenueGrowthPass = revenueGrowth > 0;
      }
    }

    // 6. Interest coverage > 5
    const interestCoverage = safeValue(ratios.interestCoverageTTM);
    const interestCoveragePass = interestCoverage !== null && interestCoverage > 5;

    // 7. Debt ratio < 70%
    let debtRatio = null;
    let debtRatioPass = false;
    
    if (balanceSheets && balanceSheets.length > 0) {
      const totalDebt = safeValue(balanceSheets[0].totalDebt) || 
                       (safeValue(balanceSheets[0].shortTermDebt) + safeValue(balanceSheets[0].longTermDebt));
      const totalAssets = safeValue(balanceSheets[0].totalAssets);
      
      if (totalDebt !== null && totalAssets !== null && totalAssets !== 0) {
        debtRatio = (totalDebt / totalAssets) * 100;
        debtRatioPass = debtRatio < 70;
      }
    }

    // 8. P/E < 15
    const pe = safeValue(ratios.priceEarningsRatioTTM);
    const pePass = pe !== null && pe > 0 && pe < 15;

    // 9. P/B < 1.5 (or < 3 for moat companies)
    const pb = safeValue(ratios.priceToBookRatioTTM);
    // Simplified: We assume companies with higher gross margin might have a moat
    const hasMoat = safeValue(ratios.grossProfitMarginTTM) > 0.5; // 50% gross margin as a proxy for moat
    const pbThreshold = hasMoat ? 3 : 1.5;
    const pbPass = pb !== null && pb > 0 && pb < pbThreshold;

    // 10. Dividend yield > 2%
    let dividendYield = safeValue(ratios.dividendYieldTTM) * 100;
    
    // Falls aktuelle Dividendenrendite 0 ist, versuche historische Daten
    if (dividendYield === 0 && ratiosHistorical && ratiosHistorical.length > 1) {
      const previousYearRatios = ratiosHistorical[1];
      const previousDividendYield = safeValue(previousYearRatios.dividendYield) * 100;
      if (previousDividendYield > 0) {
        dividendYield = previousDividendYield;
        console.log('Dividendenrendite aus Vorjahr verwendet (Quant):', dividendYield);
      }
    }
    
    const dividendYieldPass = dividendYield !== null && dividendYield > 2;

    // 11. Calculate Intrinsic Value and compare to current price
    const currentPrice = quoteData ? quoteData.price : 0;
    let intrinsicValueCalc = null;
    let intrinsicValuePass = false;
    let intrinsicValueWithMarginPass = false;
    let marginOfSafety = null;

    // Get additional data for intrinsic value calculation
    const currentEps = incomeStatements && incomeStatements.length > 0 ? safeValue(incomeStatements[0].eps) : null;
    const bookValuePerShare = balanceSheets && balanceSheets.length > 0 ? 
      safeValue(balanceSheets[0].totalStockholdersEquity) / safeValue(companyProfile.mktCap / currentPrice) : null;
    const currentRevenue = incomeStatements && incomeStatements.length > 0 ? safeValue(incomeStatements[0].revenue) : null;
    const sharesOutstanding = safeValue(companyProfile.mktCap / currentPrice);

    // Calculate intrinsic value using our simplified method
    intrinsicValueCalc = calculateSimplifiedIntrinsicValue(
      currentEps,
      bookValuePerShare, 
      pe,
      currentRevenue,
      netMargin,
      sharesOutstanding
    );

    if (intrinsicValueCalc !== null && currentPrice > 0) {
      // Check if intrinsic value > current price (positive)
      intrinsicValuePass = intrinsicValueCalc > currentPrice;
      
      // Check if intrinsic value with 20% margin > current price (even more positive)  
      const intrinsicValueWith20PercentMargin = intrinsicValueCalc * 0.8; // 20% safety margin
      intrinsicValueWithMarginPass = intrinsicValueWith20PercentMargin > currentPrice;
      
      // Calculate margin of safety percentage
      marginOfSafety = ((intrinsicValueCalc - currentPrice) / currentPrice) * 100;
      
      console.log(`${ticker}: Intrinsic Value: ${intrinsicValueCalc}, Price: ${currentPrice}, Margin of Safety: ${marginOfSafety?.toFixed(2)}%`);
    }

    // Store original intrinsic value
    const updatedOriginalValues = {
      ...originalValues,
      intrinsicValue: intrinsicValueCalc
    };

    // Calculate Buffett Score (1 point per criterion met) - now 12 criteria total
    const buffettScore = [
      roePass, roicPass, netMarginPass, epsGrowthPass, revenueGrowthPass,
      interestCoveragePass, debtRatioPass, pePass, pbPass, dividendYieldPass,
      intrinsicValuePass, intrinsicValueWithMarginPass
    ].filter(Boolean).length;

    return {
      symbol: ticker,
      name: companyProfile.companyName,
      exchange: companyProfile.exchangeShortName,
      sector: companyProfile.sector || 'Unknown',
      buffettScore,
      criteria: {
        roe: { value: roe, pass: roePass },
        roic: { value: roic, pass: roicPass },
        netMargin: { value: netMargin, pass: netMarginPass },
        epsGrowth: { value: epsGrowth, pass: epsGrowthPass },
        revenueGrowth: { value: revenueGrowth, pass: revenueGrowthPass },
        interestCoverage: { value: interestCoverage, pass: interestCoveragePass },
        debtRatio: { value: debtRatio, pass: debtRatioPass },
        pe: { value: pe, pass: pePass },
        pb: { value: pb, pass: pbPass },
        dividendYield: { value: dividendYield, pass: dividendYieldPass },
        intrinsicValue: { value: intrinsicValueCalc, pass: intrinsicValuePass },
        intrinsicValueWithMargin: { value: intrinsicValueCalc ? intrinsicValueCalc * 0.8 : null, pass: intrinsicValueWithMarginPass }
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

// Batch-Analyse für mehrere Aktien einer Börse mit Rate-Limiting
export const analyzeExchange = async (
  exchange: string, 
  limit: number = 500,
  onProgress?: (progress: number, currentOperation: string) => void
) => {
  try {
    // Aktien der Börse abrufen
    const stocks = await fetchFromFMP(`/stock/list`);
    const exchangeStocks = stocks
      .filter((stock: any) => stock.exchangeShortName === exchange && stock.type === 'stock')
      .slice(0, limit);
    
    console.log(`Analysiere ${exchangeStocks.length} Aktien von ${exchange} in Batches`);
    
    const results: QuantAnalysisResult[] = [];
    const batchSize = 50; // Etwa 50 Aktien pro Minute (300 API calls / 6 calls per stock)
    const totalBatches = Math.ceil(exchangeStocks.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, exchangeStocks.length);
      const batch = exchangeStocks.slice(startIndex, endIndex);
      
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
    console.error('Fehler bei der Börsenanalyse:', error);
    throw error;
  }
};

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
    result.criteria.intrinsicValueWithMargin.value !== null ? result.criteria.intrinsicValueWithMargin.value.toFixed(2) : 'N/A',
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
