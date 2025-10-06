import axios from 'axios';
import { 
  analyzeBusinessModel, 
  analyzeEconomicMoat,
  analyzeManagementQuality,
  analyzeLongTermProspects,
  analyzeCyclicalBehavior,
  analyzeOneTimeEffects,
  analyzeTurnaround,
  analyzeRationalBehavior,
  hasOpenAiApiKey
} from './openaiApi';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';
import { convertCurrency, shouldConvertCurrency } from '@/utils/currencyConverter';
import { NewsItem } from '@/context/StockContextTypes';
import * as MetricsCalculator from '@/services/FinancialMetricsCalculator';

// Base URL for the Financial Modeling Prep API
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Hilfsfunktion, um API-Anfragen zu machen
const fetchFromFMP = async (endpoint: string, params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      params: {
        apikey: DEFAULT_FMP_API_KEY,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data from FMP:', error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error(`API-Key ist ungültig. Bitte kontaktieren Sie den Administrator.`);
    }
    throw new Error(`Fehler beim Abrufen von Daten. Bitte versuchen Sie es später erneut.`);
  }
};

// Helper to normalize news to unified shape
const normalizeNewsItems = (items: any[]): NewsItem[] => {
  if (!Array.isArray(items)) return [];
  return items.map((i) => {
    const url = i.url || i.link || '';
    let site = i.site || i.source || '';
    if (!site && url) {
      try { site = new URL(url).hostname.replace('www.', ''); } catch {}
    }
    const symbol = i.symbol || i.ticker || (Array.isArray(i.tickers) ? i.tickers[0] : '') || (Array.isArray(i.symbols) ? i.symbols[0] : '');
    return {
      title: i.title || i.headline || '',
      image: i.image || i.image_url || '',
      url,
      publishedDate: i.publishedDate || i.date || i.published_at || '',
      site: site || 'News',
      symbol: symbol || '',
      text: i.text || i.summary || ''
    } as NewsItem;
  }).filter(n => n.title && n.url);
};

// Funktion, um Stock News zu holen (NewsAPI first, FMP as fallback)
export const fetchStockNews = async (ticker: string, companyName?: string): Promise<NewsItem[]> => {
  console.log(`Fetching stock news for ${ticker}`);
  const standardizedTicker = ticker.trim().toUpperCase();
  
  // Try NewsAPI first if company name is available
  if (companyName) {
    try {
      const { fetchNewsFromNewsAPI } = await import('@/api/newsApi');
      const { newsItems } = await fetchNewsFromNewsAPI(standardizedTicker, companyName);
      
      if (newsItems.length > 0) {
        console.log(`✅ NewsAPI returned ${newsItems.length} articles - using as primary source`);
        return newsItems;
      }
      
      console.log('⚠️ NewsAPI returned 0 articles, falling back to FMP');
    } catch (newsApiError) {
      console.error('⚠️ NewsAPI failed, falling back to FMP:', newsApiError);
    }
  }
  
  // Fallback to FMP
  try {
    // Fetch from FMP (stable endpoint first)
    const stableResp = await axios.get('https://financialmodelingprep.com/stable/news/stock', {
      params: { symbols: standardizedTicker, apikey: DEFAULT_FMP_API_KEY }
    });
    let fmpData = normalizeNewsItems(stableResp.data);
    console.log('📰 FMP stable stock news:', fmpData.length);
    
    if (fmpData.length === 0) {
      // Fallback to v3 endpoint
      const v3 = await axios.get('https://financialmodelingprep.com/api/v3/stock_news', {
        params: { tickers: standardizedTicker, limit: 50, apikey: DEFAULT_FMP_API_KEY }
      });
      fmpData = normalizeNewsItems(v3.data);
      console.log('📰 FMP v3 fallback stock news:', fmpData.length);
    }
    
    return fmpData;
  } catch (error) {
    console.error('❌ Error fetching stock news from FMP:', error);
    return [];
  }
};

// Funktion, um Press Releases zu holen (NewsAPI first, FMP as fallback)
export const fetchPressReleases = async (ticker: string, companyName?: string): Promise<NewsItem[]> => {
  console.log(`Fetching press releases for ${ticker}`);
  const standardizedTicker = ticker.trim().toUpperCase();
  
  // Try NewsAPI first if company name is available
  if (companyName) {
    try {
      const { fetchNewsFromNewsAPI } = await import('@/api/newsApi');
      const { pressReleases } = await fetchNewsFromNewsAPI(standardizedTicker, companyName);
      
      if (pressReleases.length > 0) {
        console.log(`✅ NewsAPI returned ${pressReleases.length} press releases - using as primary source`);
        return pressReleases;
      }
      
      console.log('⚠️ NewsAPI returned 0 press releases, falling back to FMP');
    } catch (newsApiError) {
      console.error('⚠️ NewsAPI failed, falling back to FMP:', newsApiError);
    }
  }
  
  // Fallback to FMP
  try {
    // Fetch from FMP (stable endpoint first)
    const stableResp = await axios.get('https://financialmodelingprep.com/stable/news/press-releases', {
      params: { symbols: standardizedTicker, apikey: DEFAULT_FMP_API_KEY }
    });
    let fmpData = normalizeNewsItems(stableResp.data);
    console.log('📰 FMP stable press releases:', fmpData.length);
    
    if (fmpData.length === 0) {
      // Fallback to v3 endpoint
      const v3 = await axios.get(`https://financialmodelingprep.com/api/v3/press-releases/${standardizedTicker}`, {
        params: { limit: 50, apikey: DEFAULT_FMP_API_KEY }
      });
      fmpData = normalizeNewsItems(v3.data);
      console.log('📰 FMP v3 fallback press releases:', fmpData.length);
    }
    
    return fmpData;
  } catch (error) {
    console.error('Error fetching press releases:', error);
    return [];
  }
};

// Funktion, um Aktieninformationen zu holen
export const fetchStockInfo = async (ticker: string) => {
  console.log(`Fetching stock info for ${ticker}`);
  
  // Standardisieren des Tickers für die API
  const standardizedTicker = ticker.trim().toUpperCase();
  
  // Profil- und Kursdaten parallel abrufen
  const [profileData, quoteData] = await Promise.all([
    fetchFromFMP(`/profile/${standardizedTicker}`),
    fetchFromFMP(`/quote/${standardizedTicker}`)
  ]);
  
  // Überprüfen, ob Daten zurückgegeben wurden
  if (!profileData || profileData.length === 0 || !quoteData || quoteData.length === 0) {
    throw new Error(`Keine Daten gefunden für ${standardizedTicker}`);
  }
  
  const profile = profileData[0];
  const quote = quoteData[0];
  
  return {
    name: profile.companyName,
    ticker: profile.symbol,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changesPercentage,
    currency: profile.currency,
    marketCap: profile.mktCap,
  };
};

// Funktion, um Buffett-Kriterien zu analysieren
// Add debug logging to track toggle state
export const analyzeBuffettCriteria = async (ticker: string, enableDeepResearch = false) => {
  console.log(`Analyzing ${ticker} with Buffett criteria (Deep Research: ${enableDeepResearch})`);
  console.log('Deep Research Toggle Status:', enableDeepResearch);
  
  if (enableDeepResearch) {
    console.log('✅ Deep Research ENABLED - GPT analysis will run');
  } else {
    console.log('❌ Deep Research DISABLED - GPT analysis will be skipped');
  }
  
  // Standardisieren des Tickers für die API
  const standardizedTicker = ticker.trim().toUpperCase();
  
  // Verschiedene Finanzdaten abrufen
  const [ratios, keyMetrics, profile, incomeStatements, balanceSheets] = await Promise.all([
    fetchFromFMP(`/ratios/${standardizedTicker}`),
    fetchFromFMP(`/key-metrics/${standardizedTicker}`),
    fetchFromFMP(`/profile/${standardizedTicker}`),
    fetchFromFMP(`/income-statement/${standardizedTicker}?period=annual&limit=5`),
    fetchFromFMP(`/balance-sheet-statement/${standardizedTicker}`)
  ]);
  
  // Überprüfen, ob Daten zurückgegeben wurden
  if (!ratios || ratios.length === 0 || !keyMetrics || keyMetrics.length === 0 || !profile || profile.length === 0) {
    throw new Error(`Keine ausreichenden Finanzkennzahlen gefunden für ${standardizedTicker}`);
  }
  
  // Die neuesten Daten verwenden
  const latestRatios = ratios[0];
  const latestMetrics = keyMetrics[0];
  const companyProfile = profile[0];
  const latestIncomeStatement = incomeStatements && incomeStatements.length > 0 ? incomeStatements[0] : null;
  const latestBalanceSheet = balanceSheets && balanceSheets.length > 0 ? balanceSheets[0] : null;
  
  // Sicherstellen, dass alle erforderlichen Werte existieren
  // Falls nicht, Standardwerte oder 0 verwenden
  const safeValue = (value: any) => (value !== undefined && value !== null && !isNaN(Number(value))) ? Number(value) : 0;
  
  // Business Model Analyse - FIXED LOGIC
  // Improved logic to classify business model based on GPT analysis
  let businessModelStatus = companyProfile.description && companyProfile.description.length > 100 ? 'pass' : 'warning';
  let businessModelScore = 0;
  const businessModelMaxScore = 10; // FIXED: Changed from 3 to 10
  
  // GPT-basierte Analyse des Geschäftsmodells
  let businessModelGptAnalysis = null;
  if (enableDeepResearch && hasOpenAiApiKey()) {
    try {
      businessModelGptAnalysis = await analyzeBusinessModel(
        companyProfile.companyName, 
        companyProfile.industry || 'Unbekannt', 
        companyProfile.description || 'Keine Beschreibung verfügbar'
      );
      
      // FIXED: Automatically classify based on GPT response with accurate scoring
      if (businessModelGptAnalysis) {
        if (businessModelGptAnalysis.toLowerCase().includes('einfach') || 
            businessModelGptAnalysis.toLowerCase().includes('klar') || 
            businessModelGptAnalysis.toLowerCase().includes('verständlich')) {
          businessModelStatus = 'pass';
          businessModelScore = 10; // FIXED: Changed from 3 to 10
        } else if (businessModelGptAnalysis.toLowerCase().includes('moderat') || 
                  businessModelGptAnalysis.toLowerCase().includes('teilweise')) {
          businessModelStatus = 'warning';
          businessModelScore = 5; // FIXED: Proportional to 10-point scale
        } else if (businessModelGptAnalysis.toLowerCase().includes('komplex') || 
                  businessModelGptAnalysis.toLowerCase().includes('schwer verständlich')) {
          businessModelStatus = 'fail';
          businessModelScore = 0; // Zero score for complex business models
        }
      }
    } catch (error) {
      console.error('Error analyzing business model with GPT:', error);
      businessModelGptAnalysis = 'GPT-Analyse nicht verfügbar.';
    }
  }
  
  // Verbesserte Berechnungen für finanzielle Kennzahlen
  
  // Bruttomarge direkt aus Ratios oder berechnen
  const grossMargin = safeValue(latestRatios.grossProfitMargin) * 100;
  
  // Operative Marge direkt aus Ratios oder berechnen
  const operatingMargin = safeValue(latestRatios.operatingProfitMargin) * 100;
  
  // ROIC direkt aus Metriken oder berechnen
  let roic = safeValue(latestMetrics.roic) * 100;
  
  // Economic Moat scoring - FIXED: Normalize to 10 points
  let economicMoatScore = 0;
  const economicMoatMaxScore = 10; // FIXED: Changed from 9 to 10
  const moatWeight = 10 / 3; // 3.33 points per metric
  
  // Gross Margin scoring (0-3.33 points)
  if (grossMargin > 40) economicMoatScore += moatWeight;
  else if (grossMargin > 30) economicMoatScore += (moatWeight * 2/3);
  else if (grossMargin > 20) economicMoatScore += (moatWeight * 1/3);
  
  // Operating Margin scoring (0-3.33 points)
  if (operatingMargin > 20) economicMoatScore += moatWeight;
  else if (operatingMargin > 15) economicMoatScore += (moatWeight * 2/3);
  else if (operatingMargin > 10) economicMoatScore += (moatWeight * 1/3);
  
  // ROIC scoring (0-3.34 points to reach exactly 10)
  const roicWeight = 10 - (moatWeight * 2); // 3.34 points
  if (roic > 15) economicMoatScore += roicWeight;
  else if (roic > 10) economicMoatScore += (roicWeight * 2/3);
  else if (roic > 7) economicMoatScore += (roicWeight * 1/3);
  
  // Round to 2 decimal places to avoid floating point errors
  economicMoatScore = Math.round(economicMoatScore * 100) / 100;
  
  // Economic Moat status based on score
  let economicMoatStatus: 'pass' | 'warning' | 'fail' = 'fail';
  if (economicMoatScore >= 7) {
    economicMoatStatus = 'pass';
  } else if (economicMoatScore >= 4) {
    economicMoatStatus = 'warning';
  }
  
  // GPT-basierte Analyse des wirtschaftlichen Burggrabens
  let economicMoatGptAnalysis = null;
  if (enableDeepResearch && hasOpenAiApiKey()) {
    try {
      economicMoatGptAnalysis = await analyzeEconomicMoat(
        companyProfile.companyName,
        companyProfile.industry || 'Unbekannt',
        grossMargin,
        operatingMargin,
        roic
      );
    } catch (error) {
      console.error('Error analyzing economic moat with GPT:', error);
      economicMoatGptAnalysis = 'GPT-Analyse nicht verfügbar.';
    }
  }
  
  // Verbesserte ROE Berechnung
  let roe = safeValue(latestRatios.returnOnEquity) * 100;
  if (roe === 0 && latestIncomeStatement && latestBalanceSheet) {
    const netIncome = safeValue(latestIncomeStatement.netIncome);
    const equity = safeValue(latestBalanceSheet.totalStockholdersEquity);
    if (equity > 0) {
      roe = (netIncome / equity) * 100;
    }
  }
  
  // Verbesserte Nettomarge Berechnung
  let netMargin = safeValue(latestRatios.netProfitMargin) * 100;
  if (netMargin === 0 && latestIncomeStatement) {
    const netIncome = safeValue(latestIncomeStatement.netIncome);
    const revenue = safeValue(latestIncomeStatement.revenue);
    if (revenue > 0) {
      netMargin = (netIncome / revenue) * 100;
    }
  }
  
  // Financial Metrics scoring - FIXED: Normalize to exactly 10 points
  let financialMetricsScore = 0;
  const financialMetricsMaxScore = 10; // FIXED: Changed from 9 to 10
  const financialWeight = 10 / 3; // 3.33 points per metric
  
  // ROE scoring (0-3.33 points)
  if (roe > 15) financialMetricsScore += financialWeight;
  else if (roe > 10) financialMetricsScore += (financialWeight * 2/3);
  else if (roe > 7) financialMetricsScore += (financialWeight * 1/3);
  
  // Net Margin scoring (0-3.33 points)
  if (netMargin > 10) financialMetricsScore += financialWeight;
  else if (netMargin > 5) financialMetricsScore += (financialWeight * 2/3);
  else if (netMargin > 3) financialMetricsScore += (financialWeight * 1/3);
  
  // EPS Growth (3-year CAGR calculation)
  let epsGrowth = 0;
  let epsGrowthDetails = {
    currentYear: '',
    pastYear: '',
    currentEPS: 0,
    pastEPS: 0
  };
  
  if (incomeStatements && incomeStatements.length >= 4) {
    const currentStatement = incomeStatements[0];
    const pastStatement = incomeStatements[3];
    
    const currentEPS = safeValue(currentStatement.eps) || safeValue(currentStatement.epsdiluted) || 0;
    const pastEPS = safeValue(pastStatement.eps) || safeValue(pastStatement.epsdiluted) || 0;
    
    // Store details for tooltip
    epsGrowthDetails = {
      currentYear: currentStatement.calendarYear || currentStatement.date?.substring(0, 4) || 'Aktuell',
      pastYear: pastStatement.calendarYear || pastStatement.date?.substring(0, 4) || 'Vor 3 Jahren',
      currentEPS: currentEPS,
      pastEPS: pastEPS
    };
    
    console.log(`[EPS Growth Debug] ${ticker}:`, {
      currentYear: epsGrowthDetails.currentYear,
      currentEPS: currentEPS,
      pastYear: epsGrowthDetails.pastYear,
      pastEPS: pastEPS,
      statements: incomeStatements.map((s: any) => ({
        date: s.date,
        year: s.calendarYear,
        eps: s.eps,
        epsdiluted: s.epsdiluted
      }))
    });
    
    if (pastEPS > 0 && currentEPS > 0) {
      // Calculate 3-year CAGR: ((currentEPS / pastEPS) ^ (1/3) - 1) * 100
      const years = 3;
      epsGrowth = (Math.pow(currentEPS / pastEPS, 1 / years) - 1) * 100;
      console.log(`[EPS Growth] ${ticker}: ${epsGrowth.toFixed(2)}% CAGR over ${years} years`);
    } else if (pastEPS !== 0) {
      // Fallback to simple growth if one value is negative
      epsGrowth = ((currentEPS - pastEPS) / Math.abs(pastEPS)) * 100;
      console.log(`[EPS Growth] ${ticker}: ${epsGrowth.toFixed(2)}% (simple growth, negative EPS detected)`);
    } else {
      console.log(`[EPS Growth] ${ticker}: Cannot calculate (past EPS is zero)`);
    }
  } else {
    console.log(`[EPS Growth] ${ticker}: Insufficient data (${incomeStatements?.length || 0} statements available, need 4)`);
  }
  
  // EPS Growth scoring (0-3.34 points to reach exactly 10)
  const epsGrowthWeight = 10 - (financialWeight * 2); // 3.34 points
  if (epsGrowth > 15) financialMetricsScore += epsGrowthWeight;
  else if (epsGrowth > 10) financialMetricsScore += (epsGrowthWeight * 2/3);
  else if (epsGrowth > 5) financialMetricsScore += (epsGrowthWeight * 1/3);
  
  // Round to 2 decimal places to avoid floating point errors
  financialMetricsScore = Math.round(financialMetricsScore * 100) / 100;
  
  // Financial Metrics status based on score
  let financialMetricsStatus: 'pass' | 'warning' | 'fail' = 'fail';
  if (financialMetricsScore >= 7) {
    financialMetricsStatus = 'pass';
  } else if (financialMetricsScore >= 4) {
    financialMetricsStatus = 'warning';
  }
  
  // Verbesserte Verschuldungsquote Berechnung
  let debtToAssets = safeValue(latestRatios.debtToAssets) * 100;
  if (debtToAssets === 0 && latestBalanceSheet) {
    const totalDebt = safeValue(latestBalanceSheet.totalDebt) || 
                     (safeValue(latestBalanceSheet.shortTermDebt) + safeValue(latestBalanceSheet.longTermDebt));
    const totalAssets = safeValue(latestBalanceSheet.totalAssets);
    if (totalAssets > 0) {
      debtToAssets = (totalDebt / totalAssets) * 100;
    }
  }
  
  // Verbesserte Zinsdeckungsgrad Berechnung
  let interestCoverage = safeValue(latestRatios.interestCoverage);
  if (interestCoverage === 0 && latestIncomeStatement) {
    const ebit = safeValue(latestIncomeStatement.ebitda) - safeValue(latestIncomeStatement.depreciationAndAmortization);
    const interestExpense = safeValue(latestIncomeStatement.interestExpense);
    if (interestExpense !== 0) {
      interestCoverage = ebit / Math.abs(interestExpense);
    }
  }
  
  // Verbesserte Current Ratio Berechnung
  let currentRatio = safeValue(latestRatios.currentRatio);
  if (currentRatio === 0 && latestBalanceSheet) {
    const currentAssets = safeValue(latestBalanceSheet.totalCurrentAssets);
    const currentLiabilities = safeValue(latestBalanceSheet.totalCurrentLiabilities);
    if (currentLiabilities > 0) {
      currentRatio = currentAssets / currentLiabilities;
    }
  }
  
  // Verbesserte Debt to EBITDA Berechnung
  let debtToEBITDA = safeValue(latestRatios.debtToEBITDA);
  if (debtToEBITDA === 0 && latestIncomeStatement && latestBalanceSheet) {
    const totalDebt = safeValue(latestBalanceSheet.totalDebt) || 
                     (safeValue(latestBalanceSheet.shortTermDebt) + safeValue(latestBalanceSheet.longTermDebt));
    const ebitda = safeValue(latestIncomeStatement.ebitda);
    if (ebitda > 0) {
      debtToEBITDA = totalDebt / ebitda;
    }
  }
  
  // Financial Stability scoring - FIXED: Normalize to exactly 10 points
  let financialStabilityScore = 0;
  const financialStabilityMaxScore = 10; // FIXED: Changed from 9 to 10
  const stabilityWeight = 10 / 3; // 3.33 points per metric
  
  // Debt to Assets scoring (0-3.33 points)
  if (debtToAssets < 30) financialStabilityScore += stabilityWeight;
  else if (debtToAssets < 50) financialStabilityScore += (stabilityWeight * 2/3);
  else if (debtToAssets < 70) financialStabilityScore += (stabilityWeight * 1/3);
  
  // Interest Coverage scoring (0-3.33 points)
  if (interestCoverage > 7) financialStabilityScore += stabilityWeight;
  else if (interestCoverage > 5) financialStabilityScore += (stabilityWeight * 2/3);
  else if (interestCoverage > 3) financialStabilityScore += (stabilityWeight * 1/3);
  
  // Current Ratio scoring (0-3.34 points to reach exactly 10)
  const currentRatioWeight = 10 - (stabilityWeight * 2); // 3.34 points
  if (currentRatio > 2) financialStabilityScore += currentRatioWeight;
  else if (currentRatio > 1.5) financialStabilityScore += (currentRatioWeight * 2/3);
  else if (currentRatio > 1) financialStabilityScore += (currentRatioWeight * 1/3);
  
  // Round to 2 decimal places to avoid floating point errors
  financialStabilityScore = Math.round(financialStabilityScore * 100) / 100;
  
  // Financial Stability status based on score
  let financialStabilityStatus: 'pass' | 'warning' | 'fail' = 'fail';
  if (financialStabilityScore >= 7) {
    financialStabilityStatus = 'pass';
  } else if (financialStabilityScore >= 4) {
    financialStabilityStatus = 'warning';
  }
  
  // Management Qualität - FIXED LOGIC
  let managementStatus: 'pass' | 'warning' | 'fail' = 'warning'; // Default is warning until proven otherwise
  let managementScore = 5; // Default moderate score out of 10
  const managementMaxScore = 10; // FIXED: Changed from 3 to 10
  
  // GPT-basierte Analyse der Managementqualität
  let managementGptAnalysis = null;
  if (enableDeepResearch && hasOpenAiApiKey()) {
    try {
      managementGptAnalysis = await analyzeManagementQuality(
        companyProfile.companyName,
        companyProfile.ceo || 'Unbekannt'
      );
      
      // FIXED: Score based on GPT analysis, but more conservative
      if (managementGptAnalysis) {
        if (managementGptAnalysis.toLowerCase().includes('exzellent') || 
            managementGptAnalysis.toLowerCase().includes('hervorragend') || 
            managementGptAnalysis.toLowerCase().includes('stark aktionärsorientiert')) {
          managementStatus = 'pass';
          managementScore = 10;
        } else if (managementGptAnalysis.toLowerCase().includes('gut') || 
                  managementGptAnalysis.toLowerCase().includes('solide') || 
                  managementGptAnalysis.toLowerCase().includes('effektiv')) {
          managementStatus = 'warning';
          managementScore = 6;
        } else if (managementGptAnalysis.toLowerCase().includes('bedenken') || 
                  managementGptAnalysis.toLowerCase().includes('problematisch') || 
                  managementGptAnalysis.toLowerCase().includes('schwach')) {
          managementStatus = 'fail';
          managementScore = 0;
        }
      }
    } catch (error) {
      console.error('Error analyzing management quality with GPT:', error);
      managementGptAnalysis = 'GPT-Analyse nicht verfügbar.';
    }
  }
  
  // Verbesserte KGV Berechnung
  let pe = safeValue(latestRatios.priceEarningsRatio);
  
  // Verbesserte Dividendenrendite Berechnung
  let dividendYield = safeValue(latestRatios.dividendYield) * 100;
  
  // Falls aktuelle Dividendenrendite 0 ist, versuche Vorjahresdaten
  if (dividendYield === 0 && ratios.length > 1) {
    const previousYearRatios = ratios[1];
    const previousDividendYield = safeValue(previousYearRatios.dividendYield) * 100;
    if (previousDividendYield > 0) {
      dividendYield = previousDividendYield;
      console.log('Dividendenrendite aus Vorjahr verwendet:', dividendYield);
    }
  }
  
  // Kurs zu Buchwert Berechnung
  let priceToBook = safeValue(latestRatios.priceToBookRatio);
  
  // Kurs zu Cashflow Berechnung
  let priceToCashFlow = safeValue(latestRatios.priceCashFlowRatio);
  
  // Valuation scoring - FIXED: Normalize to exactly 10 points
  let valuationScore = 0;
  const valuationMaxScore = 10; // FIXED: Changed from 12 to 10
  const valuationWeight = 10 / 4; // 2.5 points per metric
  
  // Adjust the thresholds based on moat status
  const hasStrongMoat = economicMoatStatus === 'pass';
  
  // PE scoring (0-2.5 points)
  if (pe < 15) valuationScore += valuationWeight;
  else if (pe < 20 || (hasStrongMoat && pe < 25)) valuationScore += (valuationWeight * 2/3);
  else if (pe < 25 || (hasStrongMoat && pe < 30)) valuationScore += (valuationWeight * 1/3);
  
  // Dividend Yield scoring (0-2.5 points)
  if (dividendYield > 3) valuationScore += valuationWeight;
  else if (dividendYield > 2) valuationScore += (valuationWeight * 2/3);
  else if (dividendYield > 1) valuationScore += (valuationWeight * 1/3);
  
  // P/B scoring (0-2.5 points) with explanations
  if (priceToBook < 1.5) valuationScore += valuationWeight; // Unter 1,5 gilt als günstig
  else if (priceToBook < 3 || (hasStrongMoat && priceToBook < 4)) valuationScore += (valuationWeight * 2/3); // 1,5-3,0 als akzeptabel bei starkem Moat
  else if (priceToBook < 5 && hasStrongMoat) valuationScore += (valuationWeight * 1/3); // Höhere Werte nur mit starkem Moat akzeptabel
  
  // P/CF scoring (0-2.5 points) with explanations
  if (priceToCashFlow < 10) valuationScore += valuationWeight; // Unter 10 gilt als günstig
  else if (priceToCashFlow < 15 || (hasStrongMoat && priceToCashFlow < 20)) valuationScore += (valuationWeight * 2/3); // 10-20 als fair bewertet
  else if (priceToCashFlow < 25 && hasStrongMoat) valuationScore += (valuationWeight * 1/3); // Höhere Werte nur mit starkem Moat akzeptabel
  
  // Round to 2 decimal places to avoid floating point errors
  valuationScore = Math.round(valuationScore * 100) / 100;
  
  // Valuation status based on score
  let valuationStatus: 'pass' | 'warning' | 'fail' = 'fail';
  if (valuationScore >= 7) {
    valuationStatus = 'pass';
  } else if (valuationScore >= 4) {
    valuationStatus = 'warning';
  }
  
  // Langfristiger Horizont
  const sector = companyProfile.sector || 'Unbekannt';
  
  // Long-term Outlook scoring
  let longTermScore = 0;
  const longTermMaxScore = 10; // FIXED: Changed from 3 to 10
  
  // Sector-based initial scoring
  const stableSectors = [
    'Consumer Defensive', 'Healthcare', 'Utilities', 
    'Financial Services', 'Technology', 'Communication Services'
  ];
  
  if (stableSectors.includes(sector)) {
    longTermScore = 6; // Start with 6 points for stable sectors (out of 10)
  } else {
    longTermScore = 3; // Start with 3 points for other sectors (out of 10)
  }
  
  // GPT-basierte Analyse der langfristigen Perspektiven
  let longTermGptAnalysis = null;
  if (enableDeepResearch && hasOpenAiApiKey()) {
    try {
      longTermGptAnalysis = await analyzeLongTermProspects(
        companyProfile.companyName,
        companyProfile.industry || 'Unbekannt',
        sector
      );
    } catch (error) {
      console.error('Error analyzing long-term prospects with GPT:', error);
      longTermGptAnalysis = 'GPT-Analyse nicht verfügbar.';
    }
  }
  
  // Adjust long-term score based on GPT analysis
  if (longTermGptAnalysis) {
    if (longTermGptAnalysis.toLowerCase().includes('stark') || 
        longTermGptAnalysis.toLowerCase().includes('positiv') || 
        longTermGptAnalysis.toLowerCase().includes('vorteilhaft')) {
      longTermScore = Math.min(longTermScore + 3, 10);
    } else if (longTermGptAnalysis.toLowerCase().includes('risik') || 
               longTermGptAnalysis.toLowerCase().includes('bedenken') || 
               longTermGptAnalysis.toLowerCase().includes('problem')) {
      longTermScore = Math.max(longTermScore - 3, 0);
    }
    
    // Check for regulatory risks
    if (longTermGptAnalysis.toLowerCase().includes('regulat') || 
        longTermGptAnalysis.toLowerCase().includes('politik') || 
        longTermGptAnalysis.toLowerCase().includes('gesetz')) {
      longTermScore = Math.max(longTermScore - 2, 0);
    }
  }
  
  let longTermStatus: 'pass' | 'warning' | 'fail' = 'warning';
  if (longTermScore >= 7) {
    longTermStatus = 'pass';
  } else if (longTermScore <= 3) {
    longTermStatus = 'fail';
  }
  
  // GPT-basierte Analyse des rationalen Verhaltens
  let rationalBehaviorGptAnalysis = null;
  if (enableDeepResearch && hasOpenAiApiKey()) {
    try {
      rationalBehaviorGptAnalysis = await analyzeRationalBehavior(
        companyProfile.companyName,
        companyProfile.industry || 'Unbekannt'
      );
    } catch (error) {
      console.error('Error analyzing rational behavior with GPT:', error);
      rationalBehaviorGptAnalysis = 'GPT-Analyse nicht verfügbar.';
    }
  }
  
  // Rational Behavior based on GPT analysis
  let rationalBehaviorScore = 5; // Default to midpoint (out of 10)
  const rationalBehaviorMaxScore = 10; // FIXED: Changed from 3 to 10
  let rationalBehaviorStatus: 'pass' | 'warning' | 'fail' = 'warning'; // Default to warning
  
  if (rationalBehaviorGptAnalysis) {
    if (rationalBehaviorGptAnalysis.toLowerCase().includes('rational') || 
        rationalBehaviorGptAnalysis.toLowerCase().includes('disziplinier') || 
        rationalBehaviorGptAnalysis.toLowerCase().includes('effizient')) {
      rationalBehaviorScore = 10;
      rationalBehaviorStatus = 'pass';
    } else if (rationalBehaviorGptAnalysis.toLowerCase().includes('irrational') || 
               rationalBehaviorGptAnalysis.toLowerCase().includes('risiko') || 
               rationalBehaviorGptAnalysis.toLowerCase().includes('fehler')) {
      rationalBehaviorScore = 0;
      rationalBehaviorStatus = 'fail';
    }
  }
  
  // GPT-basierte Analyse des antizyklischen Verhaltens
  let cyclicalBehaviorGptAnalysis = null;
  if (enableDeepResearch && hasOpenAiApiKey()) {
    try {
      cyclicalBehaviorGptAnalysis = await analyzeCyclicalBehavior(
        companyProfile.companyName,
        companyProfile.industry || 'Unbekannt'
      );
    } catch (error) {
      console.error('Error analyzing cyclical behavior with GPT:', error);
      cyclicalBehaviorGptAnalysis = 'GPT-Analyse nicht verfügbar.';
    }
  }
  
  // Cyclical Behavior based on GPT analysis
  let cyclicalBehaviorScore = 5; // Default to midpoint (out of 10)
  const cyclicalBehaviorMaxScore = 10; // FIXED: Changed from 3 to 10
  let cyclicalBehaviorStatus: 'pass' | 'warning' | 'fail' = 'warning'; // Default to warning
  
  if (cyclicalBehaviorGptAnalysis) {
    if (cyclicalBehaviorGptAnalysis.toLowerCase().includes('antizyklisch') || 
        cyclicalBehaviorGptAnalysis.toLowerCase().includes('nutzt schwäche') || 
        cyclicalBehaviorGptAnalysis.toLowerCase().includes('opportun')) {
      cyclicalBehaviorScore = 10;
      cyclicalBehaviorStatus = 'pass';
    } else if (cyclicalBehaviorGptAnalysis.toLowerCase().includes('trends folg') || 
               cyclicalBehaviorGptAnalysis.toLowerCase().includes('reaktiv') || 
               cyclicalBehaviorGptAnalysis.toLowerCase().includes('nicht antizyklisch')) {
      cyclicalBehaviorScore = 0;
      cyclicalBehaviorStatus = 'fail';
    }
  }
  
  // GPT-basierte Analyse der Einmaleffekte
  let oneTimeEffectsGptAnalysis = null;
  if (enableDeepResearch && hasOpenAiApiKey()) {
    try {
      oneTimeEffectsGptAnalysis = await analyzeOneTimeEffects(
        companyProfile.companyName,
        companyProfile.industry || 'Unbekannt'
      );
    } catch (error) {
      console.error('Error analyzing one-time effects with GPT:', error);
      oneTimeEffectsGptAnalysis = 'GPT-Analyse nicht verfügbar.';
    }
  }
  
  // One-Time Effects based on GPT analysis
  let oneTimeEffectsScore = 5; // Default to midpoint (out of 10)
  const oneTimeEffectsMaxScore = 10; // FIXED: Changed from 3 to 10
  let oneTimeEffectsStatus: 'pass' | 'warning' | 'fail' = 'warning'; // Default to warning
  
  if (oneTimeEffectsGptAnalysis) {
    if (oneTimeEffectsGptAnalysis.toLowerCase().includes('nachhaltig') || 
        oneTimeEffectsGptAnalysis.toLowerCase().includes('keine einmaleffekte') || 
        oneTimeEffectsGptAnalysis.toLowerCase().includes('kontinuierlich')) {
      oneTimeEffectsScore = 10;
      oneTimeEffectsStatus = 'pass';
    } else if (oneTimeEffectsGptAnalysis.toLowerCase().includes('einmaleffekt') || 
               oneTimeEffectsGptAnalysis.toLowerCase().includes('nicht nachhaltig') || 
               oneTimeEffectsGptAnalysis.toLowerCase().includes('problematisch')) {
      oneTimeEffectsScore = 0;
      oneTimeEffectsStatus = 'fail';
    }
  }
  
  // GPT-basierte Analyse, ob es sich um einen Turnaround-Fall handelt
  let turnaroundGptAnalysis = null;
  if (enableDeepResearch && hasOpenAiApiKey()) {
    try {
      turnaroundGptAnalysis = await analyzeTurnaround(
        companyProfile.companyName,
        companyProfile.industry || 'Unbekannt'
      );
    } catch (error) {
      console.error('Error analyzing turnaround with GPT:', error);
      turnaroundGptAnalysis = 'GPT-Analyse nicht verfügbar.';
    }
  }
  
  // Turnaround Analysis based on GPT analysis
  let turnaroundScore = 5; // Default to midpoint (out of 10)
  const turnaroundMaxScore = 10; // FIXED: Changed from 3 to 10
  let turnaroundStatus: 'pass' | 'warning' | 'fail' = 'warning'; // Default to warning
  
  if (turnaroundGptAnalysis) {
    // Check for turnaround indicators
    const turnaroundKeywords = ['turnaround', 'umstrukturierung', 'restrukturierung', 'sanierung', 'neuausrichtung'];
    const hasTurnaroundIndication = turnaroundKeywords.some(keyword => 
      turnaroundGptAnalysis.toLowerCase().includes(keyword)
    );
    
    // FIX: Corrected logic - no turnaround should be positive in Buffett's view
    if (hasTurnaroundIndication) {
      // This is negative in Buffett's view
      turnaroundScore = 0;
      turnaroundStatus = 'fail';
    } else if (turnaroundGptAnalysis.toLowerCase().includes('kein turnaround') || 
               turnaroundGptAnalysis.toLowerCase().includes('etabliert') || 
               turnaroundGptAnalysis.toLowerCase().includes('stabil')) {
      // This is positive in Buffett's view - giving full points for stable companies
      turnaroundScore = 10;
      turnaroundStatus = 'pass';
    }
  }
  
  // Erstellen des Analyseobjekts mit verbesserten Kennzahlen und Punktwerten
  return {
    businessModel: {
      status: businessModelStatus,
      title: '1. Verstehbares Geschäftsmodell',
      description: `${companyProfile.companyName} ist tätig im Bereich ${companyProfile.industry || 'Unbekannt'}.`,
      details: [
        `Hauptgeschäftsbereich: ${companyProfile.industry || 'Unbekannt'}`,
        `Sektor: ${companyProfile.sector || 'Unbekannt'}`,
        `Beschreibung: ${companyProfile.description ? companyProfile.description.substring(0, 200) + '...' : 'Keine Beschreibung verfügbar'}`
      ],
      gptAnalysis: businessModelGptAnalysis,
      score: businessModelScore,
      maxScore: businessModelMaxScore
    },
    economicMoat: {
      status: economicMoatStatus,
      title: '2. Wirtschaftlicher Burggraben (Moat)',
      description: `${companyProfile.companyName} zeigt ${economicMoatStatus === 'pass' ? 'starke' : economicMoatStatus === 'warning' ? 'moderate' : 'schwache'} Anzeichen eines wirtschaftlichen Burggrabens.`,
      details: [
        `Bruttomarge: ${grossMargin.toFixed(2)}% (Buffett bevorzugt >40%)`,
        `Operative Marge: ${operatingMargin.toFixed(2)}% (Buffett bevorzugt >20%)`,
        `ROIC: ${roic.toFixed(2)}% (Buffett bevorzugt >15%)`,
        `Marktposition: ${companyProfile.isActivelyTrading ? 'Aktiv am Markt' : 'Eingeschränkte Marktpräsenz'}`
      ],
      gptAnalysis: economicMoatGptAnalysis,
      score: economicMoatScore,
      maxScore: economicMoatMaxScore
    },
    financialMetrics: {
      status: financialMetricsStatus,
      title: '3. Finanzkennzahlen (10 Jahre Rückblick)',
      description: `Die Finanzkennzahlen von ${companyProfile.companyName} sind ${financialMetricsStatus === 'pass' ? 'stark' : financialMetricsStatus === 'warning' ? 'moderat' : 'schwach'}.`,
      details: [
        `Eigenkapitalrendite (ROE): ${roe.toFixed(2)}% (Buffett bevorzugt >15%)`,
        `Nettomarge: ${netMargin.toFixed(2)}% (Buffett bevorzugt >15%)`,
        `EPS-Wachstum (3 Jahre CAGR): ${epsGrowth.toFixed(2)}% (${epsGrowthDetails.pastYear}: ${epsGrowthDetails.pastEPS.toFixed(2)} → ${epsGrowthDetails.currentYear}: ${epsGrowthDetails.currentEPS.toFixed(2)} ${companyProfile.currency}) (Buffett bevorzugt >10%)`,
        `Gewinn pro Aktie (${epsGrowthDetails.currentYear}): ${latestIncomeStatement && latestIncomeStatement.eps ? Number(latestIncomeStatement.eps).toFixed(2) : 'N/A'} ${companyProfile.currency || 'USD'}`
      ],
      financialScore: financialMetricsScore, // FIXED: Use financialScore instead of score
      maxScore: financialMetricsMaxScore
    },
    financialStability: {
      status: financialStabilityStatus,
      title: '4. Finanzielle Stabilität & Verschuldung',
      description: `${companyProfile.companyName} zeigt ${financialStabilityStatus === 'pass' ? 'starke' : financialStabilityStatus === 'warning' ? 'moderate' : 'schwache'} finanzielle Stabilität.`,
      details: [
        `Schulden zu Vermögen: ${debtToAssets.toFixed(2)}% (Buffett bevorzugt <50%)`,
        `Zinsdeckungsgrad: ${interestCoverage.toFixed(2)} (Buffett bevorzugt >5)`,
        `Current Ratio: ${currentRatio.toFixed(2)} (Buffett bevorzugt >1.5)`,
        `Schulden zu EBITDA: ${debtToEBITDA.toFixed(2)} (niedriger ist besser)`
      ],
      financialScore: financialStabilityScore, // FIXED: Use financialScore instead of score
      maxScore: financialStabilityMaxScore
    },
    management: {
      status: managementStatus,
      title: '5. Qualität des Managements',
      description: `Die Qualität des Managements wird als ${managementStatus === 'pass' ? 'gut' : managementStatus === 'warning' ? 'moderat' : 'schwach'} eingestuft.`,
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie Insider-Beteiligungen, Kapitalallokation und Kommunikation',
        `CEO: ${companyProfile.ceo || 'Keine Informationen verfügbar'}`,
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: managementGptAnalysis,
      score: managementScore,
      maxScore: managementMaxScore
    },
    valuation: {
      status: valuationStatus,
      title: '6. Bewertung (nicht zu teuer kaufen)',
      description: `${companyProfile.companyName} ist aktuell ${valuationStatus === 'pass' ? 'angemessen' : valuationStatus === 'warning' ? 'moderat' : 'hoch'} bewertet.`,
      details: [
        `KGV (P/E): ${pe.toFixed(2)} (Buffett bevorzugt <15)`,
        `Dividendenrendite: ${dividendYield.toFixed(2)}% (Buffett bevorzugt >2%)`,
        `Kurs zu Buchwert (P/B): ${priceToBook.toFixed(2)} (Unter 1,5 gilt als günstig, 1,5-3,0 als akzeptabel bei starkem Moat)`,
        `Kurs zu Cashflow (P/CF): ${priceToCashFlow.toFixed(2)} (Unter 10 gilt als günstig, 10-20 als fair bewertet)`
      ],
      financialScore: valuationScore, // FIXED: Use financialScore instead of score
      maxScore: valuationMaxScore
    },
    longTermOutlook: {
      status: longTermStatus,
      title: '7. Langfristiger Horizont',
      description: `${companyProfile.companyName} operiert in einer Branche mit ${longTermStatus === 'pass' ? 'guten' : longTermStatus === 'warning' ? 'modernen' : 'unsicheren'} langfristigen Aussichten.`,
      details: [
        `Branche: ${companyProfile.industry || 'Unbekannt'}`,
        `Sektor: ${sector}`,
        `Börsennotiert seit: ${companyProfile.ipoDate ? new Date(companyProfile.ipoDate).toLocaleDateString() : 'N/A'}`,
        'Eine tiefere Analyse der langfristigen Branchentrends wird empfohlen'
      ],
      gptAnalysis: longTermGptAnalysis,
      score: longTermScore,
      maxScore: longTermMaxScore
    },
    rationalBehavior: {
      status: rationalBehaviorStatus,
      title: '8. Rationalität & Disziplin',
      description: `${companyProfile.companyName} zeigt ${rationalBehaviorStatus === 'pass' ? 'überwiegend rationales' : rationalBehaviorStatus === 'warning' ? 'teilweise rationales' : 'tendenziell irrationales'} Geschäftsverhalten.`,
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie Kapitalallokation, Akquisitionen und Ausgaben',
        'Analysieren Sie, ob das Management bewusst und diszipliniert handelt',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: rationalBehaviorGptAnalysis,
      score: rationalBehaviorScore,
      maxScore: rationalBehaviorMaxScore
    },
    cyclicalBehavior: {
      status: cyclicalBehaviorStatus,
      title: '9. Antizyklisches Verhalten',
      description: `${companyProfile.companyName} zeigt ${cyclicalBehaviorStatus === 'pass' ? 'klare Anzeichen antizyklischen' : cyclicalBehaviorStatus === 'warning' ? 'teilweise antizyklisches' : 'wenig antizyklisches'} Verhaltens.`,
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie das Verhalten in Marktkrisen',
        'Analysieren Sie, ob das Unternehmen kauft, wenn andere verkaufen',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: cyclicalBehaviorGptAnalysis,
      score: cyclicalBehaviorScore,
      maxScore: cyclicalBehaviorMaxScore
    },
    oneTimeEffects: {
      status: oneTimeEffectsStatus,
      title: '10. Vergangenheit ≠ Zukunft',
      description: `${companyProfile.companyName} zeigt ${oneTimeEffectsStatus === 'pass' ? 'nachhaltige Erfolge ohne wesentliche Einmaleffekte' : oneTimeEffectsStatus === 'warning' ? 'teilweise nachhaltige Ergebnisse' : 'mögliche Einflüsse von Einmaleffekten'}.`,
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie einmalige Ereignisse, die Ergebnisse beeinflusst haben',
        'Analysieren Sie, ob das Wachstum organisch oder durch Übernahmen getrieben ist',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: oneTimeEffectsGptAnalysis,
      score: oneTimeEffectsScore,
      maxScore: oneTimeEffectsMaxScore
    },
    turnaround: {
      status: turnaroundStatus,
      title: '11. Keine Turnarounds',
      description: `${companyProfile.companyName} ist ${turnaroundStatus === 'pass' ? 'kein Turnaround-Fall' : turnaroundStatus === 'warning' ? 'möglicherweise in einer Umstrukturierungsphase' : 'ein erkennbarer Turnaround-Fall'}.`,
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie Anzeichen für Restrukturierung oder Sanierung',
        'Analysieren Sie, ob das Unternehmen sich in einer Erholungsphase befindet',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: turnaroundGptAnalysis,
      score: turnaroundScore,
      maxScore: turnaroundMaxScore
    }
  };
};

// Funktion, um Finanzkennzahlen zu holen
export const getFinancialMetrics = async (ticker: string) => {
  console.log(`Getting financial metrics for ${ticker}`);
  
  // Standardisieren des Tickers für die API
  const standardizedTicker = ticker.trim().toUpperCase();
  
  try {
    // Finanzkennzahlen abrufen - erweiterte Datenquellen für präzisere EPS und andere Werte
    const [ratios, keyMetrics, incomeStatements, balanceSheets, cashFlows, quote] = await Promise.all([
      fetchFromFMP(`/ratios/${standardizedTicker}?limit=10`),
      fetchFromFMP(`/key-metrics/${standardizedTicker}?limit=10`),
      fetchFromFMP(`/income-statement/${standardizedTicker}?limit=10`),
      fetchFromFMP(`/balance-sheet-statement/${standardizedTicker}?limit=10`),
      fetchFromFMP(`/cash-flow-statement/${standardizedTicker}?limit=10`),
      fetchFromFMP(`/quote/${standardizedTicker}`)
    ]);
    
    // Daten validieren und überprüfen
    if (!ratios || ratios.length === 0 || !keyMetrics || keyMetrics.length === 0) {
      throw new Error(`Keine ausreichenden Finanzkennzahlen gefunden für ${standardizedTicker}`);
    }
    
    // Die neuesten Daten verwenden
    const latestIncomeStatement = incomeStatements && incomeStatements.length > 0 ? incomeStatements[0] : null;
    const quoteData = quote && quote.length > 0 ? quote[0] : null;
    
    console.log('📊 Zentrale Berechnungslogik wird verwendet');
    console.log('Verfügbare Datenjahre:', {
      ratios: ratios.length,
      incomeStatements: incomeStatements.length,
      balanceSheets: balanceSheets.length,
      cashFlows: cashFlows.length
    });
    
    // Sichere Wert-Extraktionshilfsfunktion
    const safeValue = (value: any) => {
      if (value === undefined || value === null) return null;
      const numValue = Number(value);
      return isNaN(numValue) ? null : numValue;
    };
    
    // ===================================================
    // ZENTRALE BERECHNUNGEN MIT CALCULATOR
    // ===================================================
    
    const data = {
      ratios,
      keyMetrics,
      incomeStatements,
      balanceSheets,
      cashFlowStatements: cashFlows,
      quote: quoteData
    };
    
    // Profitabilität & Wachstum
    console.log('📊 Berechne Profitabilitätskennzahlen...');
    const roeResult = MetricsCalculator.calculateROE_10Y_avg(data);
    const netMarginResult = MetricsCalculator.calculateNetMargin_10Y_avg(data);
    const epsResult = MetricsCalculator.calculateEPS_TTM_woNRI(data);
    const epsGrowthResult = MetricsCalculator.calculateEPS_CAGR(data);
    
    // Bewertung
    console.log('📊 Berechne Bewertungskennzahlen...');
    const peResult = MetricsCalculator.calculatePE_TTM(data);
    const pbResult = MetricsCalculator.calculatePB_TTM(data);
    const pcfResult = MetricsCalculator.calculatePCF_TTM(data);
    const dividendYieldResult = MetricsCalculator.calculateDividendYield_TTM(data);
    
    // Verschuldung & Stabilität
    console.log('📊 Berechne Verschuldungskennzahlen...');
    const dtoEResult = MetricsCalculator.calculateDtoE(data);
    const currentRatioResult = MetricsCalculator.calculateCurrentRatio_TTM(data);
    const quickRatioResult = MetricsCalculator.calculateQuickRatio_TTM(data);
    const interestCoverageResult = MetricsCalculator.calculateInterestCoverage_TTM(data);
    const netDebtToEBITDAResult = MetricsCalculator.calculateNetDebtToEBITDA_TTM(data);
    
    // Liquidität & Cashflow
    console.log('📊 Berechne Cashflow-Kennzahlen...');
    const capexQuoteResult = MetricsCalculator.calculateCapexQuote_10Y_avg(data);
    const ocfQualityResult = MetricsCalculator.calculateOCF_Quality_5Y(data);
    const fcfMarginResult = MetricsCalculator.calculateFCF_Margin_5Y(data);
    const fcfNeverNegativeResult = MetricsCalculator.calculateFCF_NeverNegative(data);
    
    // Backward compatibility Variablen
    const eps = epsResult.value;
    const roe = roeResult.value;
    const netMargin = netMarginResult.value ? netMarginResult.value / 100 : null; // Als Dezimalzahl für Backward Compatibility
    const roic = null; // ROIC entfernt gemäß Anforderung
    const debtToAssets = dtoEResult.value ? dtoEResult.value : null;
    const interestCoverage = interestCoverageResult.value;
    const interestCoverageDate = interestCoverageResult.rawData?.historicalDate || null;
    
    // Determine the reported currency from the income statement or quote data
    let reportedCurrency = 'USD'; // Default to USD if no currency info available
    
    if (latestIncomeStatement && latestIncomeStatement.reportedCurrency) {
      reportedCurrency = latestIncomeStatement.reportedCurrency;
    } else if (quoteData && quoteData.currency) {
      reportedCurrency = quoteData.currency;
    }
    
    console.log(`Reported currency identified as: ${reportedCurrency}`);
    
    // Prepare historical data
    const historicalData = {
      revenue: [],
      earnings: [],
      eps: [],
      operatingCashFlow: [],
      freeCashFlow: []
    };
    
    // Add historical data if income statements are available
    if (incomeStatements && incomeStatements.length > 1) {
      // Last 5 years of revenue data
      historicalData.revenue = incomeStatements
        .slice(0, Math.min(5, incomeStatements.length))
        .map(statement => ({
          year: new Date(statement.date).getFullYear(),
          value: statement.revenue || 0,
          originalCurrency: statement.reportedCurrency || reportedCurrency
        }));
      
      // Last 5 years of earnings data
      historicalData.earnings = incomeStatements
        .slice(0, Math.min(5, incomeStatements.length))
        .map(statement => ({
          year: new Date(statement.date).getFullYear(),
          value: statement.netIncome || 0,
          originalCurrency: statement.reportedCurrency || reportedCurrency
        }));
      
      // Last 5 years of EPS data
      historicalData.eps = incomeStatements
        .slice(0, Math.min(5, incomeStatements.length))
        .map(statement => ({
          year: new Date(statement.date).getFullYear(),
          value: statement.eps || 0,
          originalCurrency: statement.reportedCurrency || reportedCurrency
        }));
    }

    // Add historical cash flow data if available
    if (cashFlows && cashFlows.length > 1) {
      // Last 5 years of OCF data
      historicalData.operatingCashFlow = cashFlows
        .slice(0, Math.min(5, cashFlows.length))
        .map(statement => ({
          year: new Date(statement.date).getFullYear(),
          value: statement.operatingCashFlow || 0,
          originalCurrency: statement.reportedCurrency || reportedCurrency
        }));
      
      // Last 5 years of FCF data
      historicalData.freeCashFlow = cashFlows
        .slice(0, Math.min(5, cashFlows.length))
        .map(statement => ({
          year: new Date(statement.date).getFullYear(),
          value: statement.freeCashFlow || 0,
          originalCurrency: statement.reportedCurrency || reportedCurrency
        }));
    }

    // ===================================================
    // METRICS ARRAY - Gebaut aus zentralen Berechnungen
    // ===================================================
    const metrics: any[] = [];
    
    // Profitabilität & Wachstum - mit Zeitfenster-Badges
    
    // 1. EPS-Wachstum (mit Badge)
    if (epsGrowthResult.value !== null) {
      const displayCurrency = reportedCurrency || 'USD';
      const rawData = epsGrowthResult.rawData || {};
      
      metrics.push({
        name: `EPS-Wachstum (CAGR)`,
        value: epsGrowthResult.value,
        formula: 'CAGR = ((EPS aktuell ÷ EPS vergangen)^(1/Jahre) - 1) × 100',
        explanation: `Durchschnittliches jährliches Wachstum des Gewinns pro Aktie${rawData.currentYear ? ` (${rawData.pastYear} → ${rawData.currentYear})` : ''}. Aktueller EPS: ${eps?.toFixed(2) || 'N/A'} ${displayCurrency}`,
        threshold: 'Kontinuierliches Wachstum >10%',
        status: epsGrowthResult.status,
        timePeriodBadge: epsGrowthResult.timePeriodBadge,
        isPercentage: true,
        isMultiplier: false,
        isAlreadyPercent: true
      });
    }
    
    // 2. ROE (mit Badge)
    if (roeResult.value !== null) {
      metrics.push({
        name: 'ROE (Eigenkapitalrendite)',
        value: roeResult.value,
        formula: 'Jahresüberschuss ÷ Eigenkapital × 100',
        explanation: 'Rendite auf das eingesetzte Eigenkapital',
        threshold: 'Buffett bevorzugt > 15%',
        status: roeResult.status,
        timePeriodBadge: roeResult.timePeriodBadge,
        isPercentage: true,
        isMultiplier: false,
        isAlreadyPercent: true
      });
    }
    
    // 3. Nettomarge (mit Badge)
    if (netMarginResult.value !== null) {
      metrics.push({
        name: 'Nettomarge',
        value: netMarginResult.value / 100, // Als Dezimalzahl für Darstellung
        formula: 'Jahresüberschuss ÷ Umsatz × 100',
        explanation: 'Anteil des Umsatzes, der als Gewinn übrig bleibt',
        threshold: 'Buffett bevorzugt > 15%',
        status: netMarginResult.status,
        timePeriodBadge: netMarginResult.timePeriodBadge,
        isPercentage: true,
        isMultiplier: false,
        isAlreadyPercent: false
      });
    }
    
    // Bewertung - TTM
    
    // 4. P/E Ratio
    if (peResult.value !== null) {
      metrics.push({
        name: 'P/E-Verhältnis (KGV)',
        value: peResult.value,
        formula: 'Aktienkurs ÷ Gewinn pro Aktie',
        explanation: 'Verhältnis zwischen Aktienkurs und Gewinn pro Aktie',
        threshold: 'Buffett bevorzugt < 25',
        status: peResult.status,
        timePeriodBadge: peResult.timePeriodBadge,
        isPercentage: false,
        isMultiplier: true
      });
    }
    
    // 5. P/B Ratio
    if (pbResult.value !== null) {
      metrics.push({
        name: 'P/B-Verhältnis (KBV)',
        value: pbResult.value,
        formula: 'Aktienkurs ÷ Buchwert pro Aktie',
        explanation: 'Verhältnis zwischen Marktpreis und Buchwert der Aktie',
        threshold: 'Buffett bevorzugt < 3',
        status: pbResult.status,
        timePeriodBadge: pbResult.timePeriodBadge,
        isPercentage: false,
        isMultiplier: true
      });
    }
    
    // 6. P/CF Ratio (NEU)
    if (pcfResult.value !== null) {
      metrics.push({
        name: 'P/CF-Verhältnis',
        value: pcfResult.value,
        formula: 'Aktienkurs ÷ Operating Cash Flow pro Aktie',
        explanation: 'Verhältnis zwischen Aktienkurs und operativem Cashflow pro Aktie',
        threshold: 'Unter 15 ist gut, unter 20 akzeptabel',
        status: pcfResult.status,
        timePeriodBadge: pcfResult.timePeriodBadge,
        isPercentage: false,
        isMultiplier: true
      });
    }
    
    // 7. Dividendenrendite (NEU)
    if (dividendYieldResult.value !== null && dividendYieldResult.value > 0) {
      metrics.push({
        name: 'Dividendenrendite',
        value: dividendYieldResult.value,
        formula: 'Dividende pro Aktie ÷ Aktienkurs × 100',
        explanation: 'Jährliche Dividende im Verhältnis zum Aktienkurs',
        threshold: '2-4% ist solide',
        status: dividendYieldResult.status,
        timePeriodBadge: dividendYieldResult.timePeriodBadge,
        isPercentage: true,
        isMultiplier: false,
        isAlreadyPercent: true
      });
    }
    
    // Verschuldung & Stabilität - TTM
    
    // 8. Verschuldungsgrad (Debt-to-Equity)
    if (dtoEResult.value !== null) {
      metrics.push({
        name: 'Verschuldungsgrad',
        value: dtoEResult.value,
        formula: 'Gesamtschulden ÷ Eigenkapital',
        explanation: 'Verhältnis zwischen Fremd- und Eigenkapital',
        threshold: 'Buffett bevorzugt < 0.5',
        status: dtoEResult.status,
        timePeriodBadge: dtoEResult.timePeriodBadge,
        isPercentage: false,
        isMultiplier: true
      });
    }
    
    // 9. Current Ratio
    if (currentRatioResult.value !== null) {
      metrics.push({
        name: 'Current Ratio',
        value: currentRatioResult.value,
        formula: 'Umlaufvermögen ÷ kurzfristige Verbindlichkeiten',
        explanation: 'Zeigt die kurzfristige Zahlungsfähigkeit des Unternehmens',
        threshold: 'Buffett bevorzugt > 1.5',
        status: currentRatioResult.status,
        timePeriodBadge: currentRatioResult.timePeriodBadge,
        isPercentage: false,
        isMultiplier: true
      });
    }
    
    // 10. Zinsdeckungsgrad
    if (interestCoverageResult.value !== null) {
      let coverageDisplay: any = interestCoverageResult.value.toFixed(2);
      if (interestCoverageResult.rawData?.historicalDate) {
        coverageDisplay += ` (aus ${interestCoverageResult.rawData.historicalDate})`;
      }
      
      metrics.push({
        name: 'Zinsdeckungsgrad',
        value: coverageDisplay,
        formula: 'EBIT ÷ Zinsaufwand',
        explanation: 'Fähigkeit des Unternehmens, Zinsen aus dem operativen Ergebnis zu bedienen',
        threshold: 'Buffett bevorzugt > 5',
        status: interestCoverageResult.status,
        timePeriodBadge: interestCoverageResult.timePeriodBadge,
        isPercentage: false,
        isMultiplier: true
      });
    }
    
    // 11. Schulden zu EBITDA
    if (netDebtToEBITDAResult.value !== null) {
      metrics.push({
        name: 'Schulden zu EBITDA',
        value: netDebtToEBITDAResult.value,
        formula: 'Gesamtverschuldung ÷ EBITDA',
        explanation: 'Zeigt, wie viele Jahre das Unternehmen brauchen würde, um Schulden aus operativem Ergebnis zurückzuzahlen',
        threshold: 'Unter 1,0 ist hervorragend, 1,0-2,0 gut, 2,0-3,0 akzeptabel',
        status: netDebtToEBITDAResult.status,
        timePeriodBadge: netDebtToEBITDAResult.timePeriodBadge,
        isPercentage: false,
        isMultiplier: true
      });
    }
    
    // Liquidität & Cashflow
    
    // 12. OCF-Qualität (5 Jahre)
    if (ocfQualityResult.value !== null) {
      metrics.push({
        name: 'OCF-Qualität',
        value: ocfQualityResult.value * 100,
        formula: 'OCF ÷ Nettogewinn (5-Jahres-Ø)',
        explanation: `OCF/Nettogewinn: ${ocfQualityResult.value.toFixed(2)}. Zeigt, ob der Gewinn tatsächlich in Cash umgewandelt wird.`,
        threshold: 'OCF/Nettogewinn ≥ 1,0',
        status: ocfQualityResult.status,
        timePeriodBadge: ocfQualityResult.timePeriodBadge,
        isPercentage: true,
        isMultiplier: false,
        isAlreadyPercent: true
      });
    }
    
    // 13. FCF-Robustheit (5 Jahre)
    if (fcfMarginResult.value !== null) {
      const fcfNeverNeg = fcfNeverNegativeResult.value === 1;
      
      metrics.push({
        name: 'FCF-Robustheit',
        value: fcfMarginResult.value,
        formula: 'Freier CF ÷ Umsatz × 100 (5-Jahres-Ø)',
        explanation: `FCF-Marge (5J-Ø): ${fcfMarginResult.value.toFixed(1)}%. ${fcfNeverNeg ? 'Kein negativer FCF' : 'Negativer FCF in schwierigen Jahren'}`,
        threshold: 'FCF-Marge ≥ 7% und in keinem Jahr <0',
        status: fcfMarginResult.status,
        timePeriodBadge: fcfMarginResult.timePeriodBadge,
        isPercentage: true,
        isMultiplier: false,
        isAlreadyPercent: true
      });
    }
    
    // 14. Capex-Quote (10 Jahre)
    if (capexQuoteResult.value !== null) {
      metrics.push({
        name: 'Capex-Quote',
        value: capexQuoteResult.value,
        formula: 'Investitionsausgaben ÷ Umsatz × 100',
        explanation: 'Investitionsbedarf relativ zum Umsatz',
        threshold: 'Niedriger ist besser (< 5%)',
        status: capexQuoteResult.status,
        timePeriodBadge: capexQuoteResult.timePeriodBadge,
        isPercentage: true,
        isMultiplier: false,
        isAlreadyPercent: true
      });
    }

    return {
      // Rendite-Kennzahlen
      eps,
      roe,
      netMargin,
      roic,
      
      // Schulden-Kennzahlen
      debtToAssets,
      interestCoverage,
      interestCoverageDate,
      
      // Strukturierte Metriken für Frontend
      metrics,
      
      // Add the reported currency to the returned object
      reportedCurrency,
      
      // Historical data
      historicalData,
    };
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    throw error;
  }
};

// Hilfsfunktion zur Berechnung einer Gesamtbewertung
export const getOverallRating = async (ticker: string) => {
  try {
    const criteria = await analyzeBuffettCriteria(ticker);
    
    // Get stock quote information including the current price and currency
    const standardizedTicker = ticker.trim().toUpperCase();
    const quoteData = await fetchFromFMP(`/quote/${standardizedTicker}`);
    const stockQuote = quoteData && quoteData.length > 0 ? quoteData[0] : null;
    const currentPrice = stockQuote ? stockQuote.price : null;
    const currency = stockQuote && stockQuote.currency ? stockQuote.currency : '€';
    
    // Calculate detailed Buffett score if available
    let detailedTotalScore = 0;
    let detailedMaxScore = 0;
    let hasDetailedScores = false;
    
    // Calculate scores from detailed criteria scores
    const allCriteria = [
      criteria.businessModel,
      criteria.economicMoat,
      criteria.financialMetrics,
      criteria.financialStability,
      criteria.management,
      criteria.valuation,
      criteria.longTermOutlook,
      criteria.rationalBehavior,
      criteria.cyclicalBehavior,
      criteria.oneTimeEffects,
      criteria.turnaround
    ];
    
    for (const criterion of allCriteria) {
      // Fix the type error by checking if score and maxScore exist
      if ('score' in criterion && 'maxScore' in criterion && 
          criterion.score !== undefined && criterion.maxScore !== undefined) {
        detailedTotalScore += criterion.score;
        detailedMaxScore += criterion.maxScore;
        hasDetailedScores = true;
      }
    }
    
    const detailedBuffettScore = hasDetailedScores && detailedMaxScore > 0 ? 
      Math.round((detailedTotalScore / detailedMaxScore) * 100) : 0;
    
    // Standard score calculation as backup
    const totalPoints = allCriteria.reduce((acc, status) => {
      if (status.status === 'pass') return acc + 3;
      if (status.status === 'warning') return acc + 1;
      return acc;
    }, 0);
    
    const maxPoints = allCriteria.length * 3;
    const buffettScore = Math.round((totalPoints / maxPoints) * 100);
    
    // Use detailed score if available, otherwise use standard score
    const finalBuffettScore = hasDetailedScores ? detailedBuffettScore : buffettScore;
    
    const passCount = allCriteria.filter(status => status.status === 'pass').length;
    const warningCount = allCriteria.filter(status => status.status === 'warning').length;
    
    let overall;
    let summary;
    
    // Bewertung stärker von der Valuation abhängig machen
    const isOvervalued = criteria.valuation.status === 'fail';
    const hasGoodMoat = criteria.economicMoat.status === 'pass';
    const isFinanciallyStable = criteria.financialStability.status === 'pass';
    
    // Komplexes Geschäftsmodell könnte ein Problem sein
    const isBusinessModelComplex = criteria.businessModel.status === 'warning' || criteria.businessModel.status === 'fail';
    
    if (passCount >= 6 && criteria.valuation.status !== 'fail') {
      overall = 'buy';
      summary = 'Nach Warren Buffetts Kriterien eine vielversprechende Investition mit guter Bewertung.';
    } else if ((passCount >= 4 && criteria.valuation.status === 'warning') || 
               (hasGoodMoat && isFinanciallyStable && criteria.valuation.status !== 'fail')) {
      overall = 'watch';
      summary = 'Solides Unternehmen mit einigen Stärken, aber die aktuelle Bewertung rechtfertigt keinen sofortigen Kauf.';
    } else {
      overall = 'avoid';
      summary = 'Entspricht nicht ausreichend den Buffett-Kriterien oder ist deutlich überbewertet.';
    }
    
    // Stärken und Schwächen detaillierter identifizieren
    const strengths = [];
    const weaknesses = [];
    
    if (criteria.businessModel.status === 'pass') {
      strengths.push('Klares, verständliches Geschäftsmodell');
    } else if (criteria.businessModel.status === 'warning') {
      weaknesses.push('Moderat komplexes Geschäftsmodell, das tiefere Analyse erfordert');
    } else if (criteria.businessModel.status === 'fail') {
      weaknesses.push('Komplexes oder schwer verständliches Geschäftsmodell');
    }
    
    if (criteria.economicMoat.status === 'pass') {
      strengths.push('Starker wirtschaftlicher Burggraben (Moat) mit überlegenen Margen');
    } else if (criteria.economicMoat.status === 'warning') {
      strengths.push('Moderater wirtschaftlicher Burggraben vorhanden');
    } else if (criteria.economicMoat.status === 'fail') {
      weaknesses.push('Kein erkennbarer wirtschaftlicher Burggraben gegenüber Wettbewerbern');
    }
    
    if (criteria.financialMetrics.status === 'pass') {
      strengths.push('Hervorragende Finanzkennzahlen (ROE, Nettomarge)');
    } else if (criteria.financialMetrics.status === 'warning') {
      strengths.push('Solide, aber nicht herausragende Finanzkennzahlen');
    } else if (criteria.financialMetrics.status === 'fail') {
      weaknesses.push('Unterdurchschnittliche Finanzkennzahlen');
    }
    
    if (criteria.financialStability.status === 'pass') {
      strengths.push('Solide finanzielle Stabilität mit geringer Verschuldung');
    } else if (criteria.financialStability.status === 'warning') {
      weaknesses.push('Moderate Bedenken bezüglich der finanziellen Stabilität');
    } else if (criteria.financialStability.status === 'fail') {
      weaknesses.push('Erhebliche Bedenken hinsichtlich finanzieller Stabilität oder hoher Verschuldung');
    }
    
    if (criteria.valuation.status === 'pass') {
      strengths.push('Attraktive Bewertung (KGV, KBV, PCF und Dividendenrendite)');
    } else if (criteria.valuation.status === 'warning') {
      weaknesses.push('Faire, aber nicht besonders günstige Bewertung');
    } else if (criteria.valuation.status === 'fail') {
      weaknesses.push('Hohe Bewertung im Verhältnis zu den fundamentalen Daten');
    }
    
    if (criteria.longTermOutlook.status === 'pass') {
      strengths.push('Vielversprechende langfristige Perspektiven');
    } else if (criteria.longTermOutlook.status === 'warning' || criteria.longTermOutlook.status === 'fail') {
      weaknesses.push('Unsichere langfristige Perspektiven oder regulatorische Risiken');
    }
    
    if (criteria.management.status === 'pass') {
      strengths.push('Qualitativ hochwertiges und aktionärsfreundliches Management');
    } else if (criteria.management.status === 'fail') {
      weaknesses.push('Bedenken bezüglich der Qualität oder Aktionärsfreundlichkeit des Managements');
    }
    
    // Get financial metrics to determine the reported currency
    const financialMetrics = await getFinancialMetrics(ticker);
    const reportedCurrency = financialMetrics?.reportedCurrency || 'USD';
    console.log(`Stock price currency: ${currency}, Reported currency: ${reportedCurrency}`);

    // Die DCF-Werte und Margin of Safety werden in StockSearchService.ts basierend auf den API-Daten festgelegt
    // Hier werden keine eigenen Berechnungen für den intrinsischen Wert durchgeführt
    
    // Erstellen der Empfehlung basierend auf Buffett-Kriterien
    let recommendation;
    if (overall === 'buy') {
      recommendation = `${criteria.businessModel.description.split(' ist tätig')[0]} erfüllt zahlreiche Buffett-Kriterien mit einer Bewertung von ${finalBuffettScore}% auf dem Buffett-Score.
      
Stärken:
- ${strengths.slice(0, 3).join('\n- ')}

Das Unternehmen zeigt einen starken wirtschaftlichen Burggraben, solide Finanzen und eine angemessene Bewertung.

Fazit: ${isBusinessModelComplex ? 'Trotz des etwas komplexeren Geschäftsmodells' : 'Mit seinem verständlichen Geschäftsmodell'} stellt ${criteria.businessModel.description.split(' ist tätig')[0]} eine attraktive langfristige Investition dar, die Buffetts Prinzipien entspricht.`;
    } else if (overall === 'watch') {
      recommendation = `${criteria.businessModel.description.split(' ist tätig')[0]} erreicht ${finalBuffettScore}% auf dem Buffett-Score, was für eine Beobachtungsposition spricht.
      
${hasGoodMoat ? '✓ Überzeugender wirtschaftlicher Burggraben vorhanden' : '× Kein überzeugender wirtschaftlicher Burggraben'}
${isFinanciallyStable ? '✓ Solide finanzielle Situation' : '× Bedenken bezüglich der finanziellen Stabilität'}
${isOvervalued ? '× Aktuell überbewertet' : '× Nicht attraktiv genug bewertet'}

Fazit: Behalten Sie die Aktie auf Ihrer Beobachtungsliste und erwägen Sie einen Einstieg, wenn ein günstigerer Preis erreicht wird.`;
    } else {
      recommendation = `${criteria.businessModel.description.split(' ist tätig')[0]} erfüllt nicht ausreichend Buffetts Investitionskriterien (${finalBuffettScore}% Buffett-Score).
      
Hauptgründe:
${isOvervalued ? '- Die aktuelle Bewertung ist deutlich zu hoch' : ''}
${!hasGoodMoat ? '- Kein überzeugender wirtschaftlicher Burggraben erkennbar' : ''}
${!isFinanciallyStable ? '- Bedenken bezüglich der finanziellen Stabilität' : ''}
${isBusinessModelComplex ? '- Das Geschäftsmodell ist komplex und schwer verständlich' : ''}

Fazit: Es könnte besser sein, nach anderen Investitionsmöglichkeiten zu suchen, die mehr von Buffetts Prinzipien erfüllen.`;
    }
    
    return {
      overall,
      summary,
      strengths,
      weaknesses,
      recommendation,
      buffettScore: finalBuffettScore,
      currentPrice,
      currency,
      reportedCurrency,
      targetMarginOfSafety: 20 // Standardwert, wird in StockSearchService.ts verwendet
    };
  } catch (error) {
    console.error('Error generating overall rating:', error);
    throw error;
  }
};
