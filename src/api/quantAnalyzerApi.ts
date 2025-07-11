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
  { id: 'DJI', name: 'Dow Jones Industrial (USA)', currency: 'USD' },
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
    dividendYield: { value: number | null; pass: boolean }
  };
  price: number;
  currency: string;
  originalValues?: {
    roe?: number | null;
    roic?: number | null;
    netMargin?: number | null;
    eps?: number | null;
    revenue?: number | null;
    pe?: number | null;
    pb?: number | null;
    price?: number | null;
  };
}

// Safe value extractor
const safeValue = (value: any) => {
  if (value === undefined || value === null) return null;
  const numValue = Number(value);
  return isNaN(numValue) ? null : numValue;
};

// Analyze a single ticker by Buffett criteria
export const analyzeStockByBuffettCriteria = async (ticker: string): Promise<QuantAnalysisResult | null> => {
  try {
    // Fetch all necessary data in parallel
    const [
      ratiosTTM, 
      profile, 
      incomeStatements, 
      balanceSheets,
      keyMetrics,
      quote
    ] = await Promise.all([
      fetchFromFMP(`/ratios-ttm/${ticker}`),
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
    const dividendYield = safeValue(ratios.dividendYieldTTM) * 100;
    const dividendYieldPass = dividendYield !== null && dividendYield > 2;

    // Calculate Buffett Score (1 point per criterion met)
    const buffettScore = [
      roePass, roicPass, netMarginPass, epsGrowthPass, revenueGrowthPass,
      interestCoveragePass, debtRatioPass, pePass, pbPass, dividendYieldPass
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
        dividendYield: { value: dividendYield, pass: dividendYieldPass }
      },
      price: quoteData ? quoteData.price : 0,
      currency: stockCurrency,
      originalValues
    };
  } catch (error) {
    console.error(`Error analyzing ${ticker}:`, error);
    return null;
  }
};

// Batch-Analyse für mehrere Aktien einer Börse
export const analyzeExchange = async (exchange: string, limit: number = 500) => {
  try {
    // Aktien der Börse abrufen
    const stocks = await fetchFromFMP(`/stock/list`);
    const exchangeStocks = stocks
      .filter((stock: any) => stock.exchangeShortName === exchange && stock.type === 'stock')
      .slice(0, limit); // Begrenzt auf die gewählte Anzahl
    
    console.log(`Analysiere ${exchangeStocks.length} Aktien von ${exchange}`);
    
    // Progressives Laden und Analysieren der Aktien
    const results: QuantAnalysisResult[] = [];
    
    for (const stock of exchangeStocks) {
      try {
        const analysis = await analyzeStockByBuffettCriteria(stock.symbol);
        if (analysis) {
          results.push(analysis);
        }
      } catch (error) {
        console.error(`Fehler bei der Analyse von ${stock.symbol}:`, error);
      }
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
    'Price', 'Currency'
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
    result.price.toFixed(2),
    result.currency
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
