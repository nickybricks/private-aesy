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
import { calculateEpsWithoutNri } from '@/services/EpsWithoutNriService';

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
  
  // Build full address
  const addressParts = [
    profile.address,
    profile.city,
    profile.state,
    profile.zip,
    profile.country
  ].filter(Boolean);
  const fullAddress = addressParts.join(', ');
  
  return {
    name: profile.companyName,
    ticker: profile.symbol,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changesPercentage,
    currency: profile.currency,
    marketCap: profile.mktCap,
    image: profile.image,
    // Additional company information
    ceo: profile.ceo,
    employees: profile.fullTimeEmployees,
    foundedYear: profile.ipoDate ? new Date(profile.ipoDate).getFullYear().toString() : undefined,
    website: profile.website,
    sector: profile.sector,
    industry: profile.industry,
    country: profile.country,
    address: fullAddress || undefined,
    city: profile.city,
    state: profile.state,
    zip: profile.zip,
    ipoDate: profile.ipoDate,
    isin: profile.isin,
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
    fetchFromFMP(`/income-statement/${standardizedTicker}?period=annual&limit=30`),
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

// Helper function to fetch from FMP stable endpoint
const fetchFromFMPStable = async (endpoint: string, params: Record<string, string> = {}) => {
  const baseUrl = 'https://financialmodelingprep.com/stable';
  const queryParams = new URLSearchParams({ ...params, apikey: DEFAULT_FMP_API_KEY });
  const url = `${baseUrl}${endpoint}?${queryParams}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`FMP Stable API error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from FMP Stable ${endpoint}:`, error);
    throw error;
  }
};

// Helper function to fetch industry P/E data
const fetchIndustryPE = async (industry: string): Promise<Array<{ date: string; value: number }>> => {
  try {
    // Calculate date range: 30 years back from today
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setFullYear(fromDate.getFullYear() - 30);
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    // Try stable endpoint with date range
    const data = await fetchFromFMPStable(
      `/historical-industry-pe`,
      { 
        industry: industry,
        from: formatDate(fromDate),
        to: formatDate(toDate)
      }
    );
    
    console.log(`📊 Raw industry P/E response for "${industry}":`, data?.length || 0, 'items');
    
    if (data && Array.isArray(data) && data.length > 0) {
      const processed = data
        .filter((item: any) => item.pe && item.pe > 0)
        .map((item: any) => ({
          date: item.date,
          value: item.pe
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log(`✓ Processed ${processed.length} industry P/E data points`);
      if (processed.length > 0) {
        console.log(`✓ Date range: ${processed[0].date} to ${processed[processed.length - 1].date}`);
        console.log(`✓ Sample (first 3):`, processed.slice(0, 3));
        console.log(`✓ Sample (last 3):`, processed.slice(-3));
      }
      return processed;
    }
  } catch (error) {
    console.error('Error fetching industry P/E from stable endpoint:', error);
  }
  
  console.warn(`⚠️ No industry P/E data found for "${industry}"`);
  return [];
};

// Helper function to calculate weekly stock P/E
const calculateWeeklyStockPE = (
  historicalPrices: any[],
  quarterlyIncomeStatements: any[]
): Array<{ date: string; stockPE: number }> => {
  if (!historicalPrices || !quarterlyIncomeStatements) return [];
  
  const weeklyPE: Array<{ date: string; stockPE: number }> = [];
  
  // Sort prices chronologically (newest first)
  const sortedPrices = [...historicalPrices].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Prepare quarterly EPS data
  const quarterlyEPS = quarterlyIncomeStatements
    .filter((s: any) => s.epsdiluted || s.eps)
    .map((s: any) => ({
      date: new Date(s.date),
      eps: s.epsdiluted || s.eps
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  
  // Sample weekly (every 7 days)
  for (let i = 0; i < sortedPrices.length; i += 7) {
    const priceData = sortedPrices[i];
    const priceDate = new Date(priceData.date);
    
    // Calculate TTM EPS at this date (sum of last 4 quarters before this date)
    const relevantQuarters = quarterlyEPS
      .filter(q => q.date <= priceDate)
      .slice(0, 4);
    
    if (relevantQuarters.length === 4) {
      const ttmEPS = relevantQuarters.reduce((sum, q) => sum + q.eps, 0);
      if (ttmEPS > 0 && priceData.close > 0) {
        weeklyPE.push({
          date: priceData.date,
          stockPE: priceData.close / ttmEPS
        });
      }
    }
  }
  
  return weeklyPE.reverse(); // Return in chronological order (oldest first)
};

// Funktion, um Finanzkennzahlen zu holen
export const getFinancialMetrics = async (ticker: string) => {
  console.log(`Getting financial metrics for ${ticker}`);
  
  // Standardisieren des Tickers für die API
  const standardizedTicker = ticker.trim().toUpperCase();
  
  try {
    // Finanzkennzahlen abrufen - erweiterte Datenquellen für präzisere EPS und andere Werte
    // Erhöhe Limits auf 30 Jahre für historische Daten (Premium Plan unterstützt bis zu 30 Jahre)
    const [ratios, keyMetrics, incomeStatements, balanceSheets, cashFlows, quote] = await Promise.all([
      fetchFromFMP(`/ratios/${standardizedTicker}?limit=30`),
      fetchFromFMP(`/key-metrics/${standardizedTicker}?limit=30`),
      fetchFromFMP(`/income-statement/${standardizedTicker}?limit=30`),
      fetchFromFMP(`/balance-sheet-statement/${standardizedTicker}?limit=30`),
      fetchFromFMP(`/cash-flow-statement/${standardizedTicker}?limit=30`),
      fetchFromFMP(`/quote/${standardizedTicker}`)
    ]);
    
    // Daten validieren und überprüfen
    if (!ratios || ratios.length === 0 || !keyMetrics || keyMetrics.length === 0) {
      throw new Error(`Keine ausreichenden Finanzkennzahlen gefunden für ${standardizedTicker}`);
    }
    
    // Die neuesten Daten verwenden
    const latestRatios = ratios[0];
    const latestMetrics = keyMetrics[0];
    const latestIncomeStatement = incomeStatements && incomeStatements.length > 0 ? incomeStatements[0] : null;
    const latestBalanceSheet = balanceSheets && balanceSheets.length > 0 ? balanceSheets[0] : null;
    const latestCashFlow = cashFlows && cashFlows.length > 0 ? cashFlows[0] : null;
    const quoteData = quote && quote.length > 0 ? quote[0] : null;
    
    console.log('Neueste Income Statement Daten:', JSON.stringify(latestIncomeStatement, null, 2));
    console.log('Neueste Balance Sheet Daten:', JSON.stringify(latestBalanceSheet, null, 2));
    console.log('Neueste Key Metrics Daten:', JSON.stringify(latestMetrics, null, 2));
    console.log('Neueste Ratios Daten:', JSON.stringify(latestRatios, null, 2));
    console.log('Quote Daten:', JSON.stringify(quoteData, null, 2));
    
    // Sichere Wert-Extraktionshilfsfunktion
    const safeValue = (value: any) => {
      if (value === undefined || value === null) return null;
      const numValue = Number(value);
      return isNaN(numValue) ? null : numValue;
    };
    
    // EPS (Earnings Per Share) Extraktion - verbessert
    let eps = null;
    
    // 1. Direkt aus Income Statement (beste Quelle)
    if (latestIncomeStatement && latestIncomeStatement.eps !== undefined) {
      eps = safeValue(latestIncomeStatement.eps);
      console.log('EPS aus Income Statement:', eps);
    }
    
    // 2. Aus Quote Daten (tagesaktuelle Daten)
    if (eps === null && quoteData && quoteData.eps !== undefined) {
      eps = safeValue(quoteData.eps);
      console.log('EPS aus Quote Daten:', eps);
    }
    
    // 3. Aus Key Metrics (aggregierte Daten)
    if (eps === null && latestMetrics && latestMetrics.eps !== undefined) {
      eps = safeValue(latestMetrics.eps);
      console.log('EPS aus Key Metrics:', eps);
    }
    
    // 4. Berechnung aus Nettogewinn und Aktienanzahl
    if (eps === null && latestIncomeStatement && 
        latestIncomeStatement.netIncome !== undefined && 
        latestIncomeStatement.weightedAverageShsOut !== undefined && 
        latestIncomeStatement.weightedAverageShsOut > 0) {
      eps = safeValue(latestIncomeStatement.netIncome / latestIncomeStatement.weightedAverageShsOut);
      console.log('EPS berechnet aus Nettogewinn/Aktien:', eps);
    }
    
    // Suche in früheren Berichten, falls aktueller fehlt
    if (eps === null && incomeStatements && incomeStatements.length > 3) {
      for (let i = 1; i < Math.min(incomeStatements.length, 4); i++) {
        if (incomeStatements[i].eps !== undefined) {
          eps = safeValue(incomeStatements[i].eps);
          console.log(`EPS aus älterem Income Statement (${i}):`, eps);
          if (eps !== null) break;
        }
      }
    }
    
    // ROE (Return on Equity) Berechnung - verbessert
    let roe = null;
    
    // 1. Direkt aus Ratios (vorberechneter Wert)
    if (latestRatios && latestRatios.returnOnEquity !== undefined) {
      roe = safeValue(latestRatios.returnOnEquity) * 100;
      console.log('ROE aus Ratios:', roe);
    }
    
    // 2. Eigene Berechnung aus Nettogewinn und Eigenkapital
    if ((roe === null || roe === 0) && latestIncomeStatement && latestBalanceSheet &&
        latestIncomeStatement.netIncome !== undefined && 
        latestBalanceSheet.totalStockholdersEquity !== undefined && 
        latestBalanceSheet.totalStockholdersEquity > 0) {
      roe = safeValue(latestIncomeStatement.netIncome / latestBalanceSheet.totalStockholdersEquity) * 100;
      console.log('ROE berechnet aus Nettogewinn/Eigenkapital:', roe);
    }
    
    // Nettomarge Berechnung - verbessert
    let netMargin = null;
    
    // 1. Direkt aus Ratios (vorberechneter Wert)
    if (latestRatios && latestRatios.netProfitMargin !== undefined) {
      netMargin = safeValue(latestRatios.netProfitMargin);
      console.log('Nettomarge aus Ratios:', netMargin);
    }
    
    // 2. Eigene Berechnung aus Nettogewinn und Umsatz
    if ((netMargin === null || netMargin === 0) && latestIncomeStatement &&
        latestIncomeStatement.netIncome !== undefined && 
        latestIncomeStatement.revenue !== undefined && 
        latestIncomeStatement.revenue > 0) {
      netMargin = safeValue(latestIncomeStatement.netIncome / latestIncomeStatement.revenue);
      console.log('Nettomarge berechnet aus Nettogewinn/Umsatz:', netMargin);
    }
    
    // Operating Margin (EBIT-Marge) Berechnung
    let operatingMargin = null;
    
    if (latestIncomeStatement && latestIncomeStatement.revenue && latestIncomeStatement.revenue > 0) {
      // Calculate EBIT = EBITDA - D&A or use operatingIncome directly
      const ebit = latestIncomeStatement.ebitda !== undefined && latestIncomeStatement.depreciationAndAmortization !== undefined
        ? safeValue(latestIncomeStatement.ebitda) - Math.abs(safeValue(latestIncomeStatement.depreciationAndAmortization))
        : safeValue(latestIncomeStatement.operatingIncome);
      
      const revenue = safeValue(latestIncomeStatement.revenue);
      
      if (ebit !== null && revenue !== null && revenue > 0) {
        operatingMargin = (ebit / revenue) * 100;
        console.log('Operating Margin berechnet aus EBIT/Umsatz:', operatingMargin);
      }
    }
    
    // ROA (Return on Assets) Berechnung
    let roa = null;
    
    if (latestIncomeStatement && latestBalanceSheet) {
      const netIncome = safeValue(latestIncomeStatement.netIncome);
      const totalAssets = safeValue(latestBalanceSheet.totalAssets);
      
      if (netIncome !== null && totalAssets !== null && totalAssets > 0) {
        roa = (netIncome / totalAssets) * 100;
        console.log('ROA berechnet aus Nettogewinn/Gesamtvermögen:', roa);
      }
    }
    
    
    // ROIC (Return on Invested Capital) Berechnung - verbessert
    let roic = null;
    
    // 1. Direkt aus Metrics (vorberechneter Wert)
    if (latestMetrics && latestMetrics.roic !== undefined) {
      roic = safeValue(latestMetrics.roic) * 100;
      console.log('ROIC aus Key Metrics:', roic);
    }
    
    // 2. Eigene Berechnung aus NOPAT und investiertem Kapital
    if ((roic === null || roic === 0) && latestIncomeStatement && latestBalanceSheet) {
      const ebit = latestIncomeStatement.ebitda !== undefined && latestIncomeStatement.depreciationAndAmortization !== undefined ?
                  latestIncomeStatement.ebitda - latestIncomeStatement.depreciationAndAmortization : null;
      
      if (ebit !== null) {
        const taxRate = latestIncomeStatement.incomeTaxExpense !== undefined && latestIncomeStatement.incomeBeforeTax !== undefined && 
                      latestIncomeStatement.incomeBeforeTax !== 0 ?
                      latestIncomeStatement.incomeTaxExpense / latestIncomeStatement.incomeBeforeTax : 0.25; // Fallback Steuersatz
        
        const nopat = ebit * (1 - taxRate);
        
        const investedCapital = (latestBalanceSheet.totalStockholdersEquity || 0) + 
                               (latestBalanceSheet.longTermDebt || 0) + 
                               (latestBalanceSheet.shortTermDebt || 0);
        
        if (investedCapital > 0) {
          roic = (nopat / investedCapital) * 100;
          console.log('ROIC berechnet aus NOPAT/Investiertes Kapital:', roic);
        }
      }
    }
    
    // Schuldenquote Berechnung - verbessert
    let debtToAssets = null;
    
    // 1. Direkt aus Ratios (vorberechneter Wert)
    if (latestRatios && latestRatios.debtToAssets !== undefined) {
      debtToAssets = safeValue(latestRatios.debtToAssets);
      console.log('Schuldenquote aus Ratios:', debtToAssets);
    }
    
    // 2. Eigene Berechnung aus Gesamtschulden und Gesamtvermögen
    if ((debtToAssets === null || debtToAssets === 0) && latestBalanceSheet) {
      const totalAssets = latestBalanceSheet.totalAssets;
      let totalDebt = 0;
      
      // Verschiedene Möglichkeiten, Gesamtschulden zu berechnen
      if (latestBalanceSheet.totalDebt !== undefined) {
        totalDebt = latestBalanceSheet.totalDebt;
      } else if (latestBalanceSheet.shortTermDebt !== undefined || latestBalanceSheet.longTermDebt !== undefined) {
        totalDebt = (latestBalanceSheet.shortTermDebt || 0) + (latestBalanceSheet.longTermDebt || 0);
      } else if (latestBalanceSheet.totalLiabilities !== undefined) {
        totalDebt = latestBalanceSheet.totalLiabilities;
      }
      
      if (totalAssets !== undefined && totalAssets > 0 && totalDebt > 0) {
        debtToAssets = totalDebt / totalAssets;
        console.log('Schuldenquote berechnet aus Schulden/Vermögen:', debtToAssets);
      }
    }
    
    // Zinsdeckungsgrad Berechnung - verbessert mit historischer Datensuche
    let interestCoverage = null;
    let interestCoverageDate = null;
    
    // 1. Direkt aus Ratios (vorberechneter Wert)
    if (latestRatios && latestRatios.interestCoverage !== undefined) {
      interestCoverage = safeValue(latestRatios.interestCoverage);
      console.log('Zinsdeckungsgrad aus Ratios:', interestCoverage);
    }
    
    // 2. Eigene Berechnung aus EBIT und Zinsaufwand
    if ((interestCoverage === null || interestCoverage === 0) && latestIncomeStatement) {
      const ebit = latestIncomeStatement.ebitda !== undefined && latestIncomeStatement.depreciationAndAmortization !== undefined ?
                  latestIncomeStatement.ebitda - latestIncomeStatement.depreciationAndAmortization : null;
      
      const interestExpense = safeValue(latestIncomeStatement.interestExpense);
      
      if (ebit !== null && interestExpense !== null && interestExpense !== 0) {
        interestCoverage = ebit / Math.abs(interestExpense);
        console.log('Zinsdeckungsgrad berechnet aus EBIT/Zinsaufwand:', interestCoverage);
      }
    }
    
    // 3. Falls Zinsdeckungsgrad 0 ist, suche in historischen Daten nach dem letzten verfügbaren Wert
    if ((interestCoverage === null || interestCoverage === 0) && incomeStatements && incomeStatements.length > 1) {
      for (let i = 1; i < Math.min(incomeStatements.length, 10); i++) {
        const statement = incomeStatements[i];
        let historicalCoverage = null;
        
        // Prüfe ob Zinsdeckungsgrad direkt verfügbar ist (aus entsprechenden Ratios)
        if (ratios && ratios[i] && ratios[i].interestCoverage !== undefined) {
          historicalCoverage = safeValue(ratios[i].interestCoverage);
        }
        
        // Berechne aus historischen EBIT und Zinsaufwand
        if ((historicalCoverage === null || historicalCoverage === 0) && statement) {
          const historicalEbit = statement.ebitda !== undefined && statement.depreciationAndAmortization !== undefined ?
                                statement.ebitda - statement.depreciationAndAmortization : null;
          const historicalInterestExpense = safeValue(statement.interestExpense);
          
          if (historicalEbit !== null && historicalInterestExpense !== null && historicalInterestExpense !== 0) {
            historicalCoverage = historicalEbit / Math.abs(historicalInterestExpense);
          }
        }
        
        if (historicalCoverage !== null && historicalCoverage > 0) {
          interestCoverage = historicalCoverage;
          const statementDate = new Date(statement.date);
          interestCoverageDate = `${statementDate.getFullYear()}-${String(statementDate.getMonth() + 1).padStart(2, '0')}`;
          console.log(`Zinsdeckungsgrad aus historischen Daten (${interestCoverageDate}):`, interestCoverage);
          break;
        }
      }
    }

    // Determine the reported currency from the income statement or quote data
    let reportedCurrency = 'USD'; // Default to USD if no currency info available
    
    if (latestIncomeStatement && latestIncomeStatement.reportedCurrency) {
      reportedCurrency = latestIncomeStatement.reportedCurrency;
    } else if (quoteData && quoteData.currency) {
      reportedCurrency = quoteData.currency;
    }
    
    console.log(`Reported currency identified as: ${reportedCurrency}`);
    
    // Calculate WACC using actual company data from FMP API
    let wacc = 10; // Default 10% as fallback
    try {
      const { calculateWACC } = await import('@/utils/waccCalculator');
      wacc = await calculateWACC(standardizedTicker);
      console.log(`Using calculated WACC: ${wacc}%`);
    } catch (error) {
      console.error('Error calculating WACC, using default 10%:', error);
      wacc = 10;
    }
    
    // Prepare historical data
    const historicalData: any = {
      revenue: [],
      earnings: [],
      eps: [],
      peRatio: [],
      peRatioWeekly: [],      // NEW
      industryPE: [],         // NEW
      roe: [],
      roic: [],
      operatingMargin: [],
      netMargin: [],
      roa: [],
      operatingCashFlow: [],
      freeCashFlow: [],
      netIncome: [],
      debtToAssets: [],
      interestCoverage: [],
      currentRatio: [],
      netDebtToEbitda: []
    };
    
    // Fetch P/E ratio data from FMP API with up to 30 years of historical data
    let peRatioData = [];
    try {

// Helper function to get year-end price from historical data
const getYearEndPrice = (historicalData: any[], year: number): number | null => {
        if (!historicalData || !Array.isArray(historicalData)) return null;
        
        // Find the last trading day of the year
        const yearData = historicalData.filter((d: any) => {
          const date = new Date(d.date);
          return date.getFullYear() === year;
        });
        
        if (yearData.length === 0) return null;
        
        // Sort by date (newest first)
        yearData.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return yearData[0].close || null;
      };
      
      // Helper function to calculate TTM EPS from quarterly data
      const calculateTTM_EPS = (quarterlyStatements: any[]): number | null => {
        if (!quarterlyStatements || quarterlyStatements.length < 4) return null;
        
        // Sum EPS of last 4 quarters
        const ttmEPS = quarterlyStatements
          .slice(0, 4)
          .reduce((sum: number, q: any) => sum + (q.epsdiluted || q.eps || 0), 0);
        
        return ttmEPS > 0 ? ttmEPS : null;
      };
      
      // Fetch annual ratios (up to 30 years with Premium plan)
      const annualRatios = await fetchFromFMP(`/ratios/${standardizedTicker}?limit=30`);
      
      // Fetch historical prices (for fallback calculation) - get at least 10 years
      const historicalPrices = await fetchFromFMP(`/historical-price-full/${standardizedTicker}?from=1995-01-01`);
      
      // Fetch quarterly income statements (for TTM EPS calculation)
      const quarterlyIncomeStatements = await fetchFromFMP(`/income-statement/${standardizedTicker}?period=quarter&limit=120`);
      
      // Fetch TTM ratios
      const ttmRatios = await fetchFromFMP(`/ratios-ttm/${standardizedTicker}`);
      
      console.log('Annual ratios data (up to 30 years):', annualRatios?.length, 'records');
      console.log('Historical prices data:', historicalPrices?.historical?.length, 'records');
      console.log('Quarterly income statements:', quarterlyIncomeStatements?.length, 'records');
      console.log('TTM ratios data:', ttmRatios);
      
      // 1. Try to use FMP ratios first
      if (annualRatios && annualRatios.length > 0) {
        peRatioData = annualRatios
          .filter(ratio => ratio.priceToEarningsRatio != null && ratio.priceToEarningsRatio > 0)
          .map(ratio => ({
            year: ratio.calendarYear || new Date(ratio.date).getFullYear().toString(),
            value: safeValue(ratio.priceToEarningsRatio)
          }))
          .filter(item => item.value !== null);
      }
      
      console.log('Annual ratios with P/E:', annualRatios?.filter(r => r.priceToEarningsRatio > 0).length, 'records');
      console.log('Years with P/E from FMP:', annualRatios?.filter(r => r.priceToEarningsRatio > 0).map(r => r.calendarYear).join(', '));
      
      // 2. Fallback: Calculate P/E ratio for years without FMP data
      // Ensure we calculate for at least 10 years (or as many as available)
      if (incomeStatements && incomeStatements.length > 0 && historicalPrices?.historical) {
        const existingYears = new Set(peRatioData.map(d => d.year));
        const currentYear = new Date().getFullYear();
        const targetYears = Array.from({ length: 10 }, (_, i) => currentYear - i);
        
        console.log('Target years for P/E calculation:', targetYears.join(', '));
        
        targetYears.forEach(targetYear => {
          const yearStr = targetYear.toString();
          
          // Only calculate if not already present
          if (!existingYears.has(yearStr)) {
            // Find income statement for this year
            const statement = incomeStatements.find((s: any) => 
              new Date(s.date).getFullYear() === targetYear
            );
            
            if (statement) {
              const eps = statement.epsdiluted || statement.eps;
              const yearEndPrice = getYearEndPrice(historicalPrices.historical, targetYear);
              
              if (eps && eps > 0 && yearEndPrice && yearEndPrice > 0) {
                const calculatedPE = yearEndPrice / eps;
                peRatioData.push({
                  year: yearStr,
                  value: calculatedPE
                });
                console.log(`✓ Calculated P/E for ${targetYear}: ${calculatedPE.toFixed(2)} (Price: ${yearEndPrice}, EPS: ${eps})`);
              } else {
                console.log(`✗ Cannot calculate P/E for ${targetYear}: EPS=${eps}, Price=${yearEndPrice}`);
              }
            } else {
              console.log(`✗ No income statement found for ${targetYear}`);
            }
          }
        });
        
        // Sort chronologically (oldest first)
        peRatioData.sort((a, b) => {
          const yearA = a.year === 'TTM 2025' ? 9999 : parseInt(a.year);
          const yearB = b.year === 'TTM 2025' ? 9999 : parseInt(b.year);
          return yearA - yearB;
        });
      }
      
      console.log('Years after fallback calculation:', peRatioData.map(d => d.year).join(', '));
      
      // === NEW: Fetch industry P/E and calculate weekly stock P/E ===
      // First, fetch the profile to get the industry
      const profileData = await fetchFromFMP(`/profile/${standardizedTicker}`);
      const industryName = profileData && profileData[0]?.industry ? profileData[0].industry : null;
      
      console.log(`📊 Industry Name: ${industryName}`);
      console.log(`📊 Historical Prices: ${historicalPrices?.historical?.length || 0} points`);
      console.log(`📊 Quarterly Statements: ${quarterlyIncomeStatements?.length || 0} quarters`);
      
      if (industryName && historicalPrices?.historical && quarterlyIncomeStatements) {
        console.log(`📊 Fetching industry P/E for: ${industryName}`);
        
        // Fetch industry P/E data
        const industryPEData = await fetchIndustryPE(industryName);
        historicalData.industryPE = industryPEData;
        console.log(`✓ Industry P/E data points: ${industryPEData.length}`);
        if (industryPEData.length > 0) {
          console.log(`✓ Industry P/E sample (first 3):`, industryPEData.slice(0, 3));
        }
        
        // Calculate weekly stock P/E
        const weeklyStockPE = calculateWeeklyStockPE(
          historicalPrices.historical,
          quarterlyIncomeStatements
        );
        console.log(`✓ Weekly stock P/E data points: ${weeklyStockPE.length}`);
        if (weeklyStockPE.length > 0) {
          console.log(`✓ Weekly stock P/E sample (first 3):`, weeklyStockPE.slice(0, 3));
        }
        
        // Merge stock P/E with industry P/E using robust matching
        const mergedWeeklyPE = weeklyStockPE.map(stockPE => {
          const stockDate = new Date(stockPE.date).getTime();
          
          // Find the last industry P/E on or before this date (within 5 trading days tolerance)
          let matchingIndustryPE = null;
          const toleranceDays = 5 * 24 * 60 * 60 * 1000; // 5 days in ms
          
          for (let i = industryPEData.length - 1; i >= 0; i--) {
            const indDate = new Date(industryPEData[i].date).getTime();
            if (indDate <= stockDate && (stockDate - indDate) <= toleranceDays) {
              matchingIndustryPE = industryPEData[i];
              break;
            }
          }
          
          return {
            date: stockPE.date,
            stockPE: stockPE.stockPE,
            industryPE: matchingIndustryPE?.value
          };
        });
        
        const matchedCount = mergedWeeklyPE.filter(d => typeof d.industryPE === 'number').length;
        const matchRate = mergedWeeklyPE.length > 0 
          ? ((matchedCount / mergedWeeklyPE.length) * 100).toFixed(1)
          : '0';
        
        historicalData.peRatioWeekly = mergedWeeklyPE;
        console.log(`✓ Merged weekly P/E data: ${mergedWeeklyPE.length} points`);
        console.log(`✓ Matched industry PE for ${matchedCount}/${mergedWeeklyPE.length} points (${matchRate}%)`);
        if (mergedWeeklyPE.length > 0) {
          console.log(`✓ Merged data sample (last 3):`, mergedWeeklyPE.slice(-3));
        }
        
        // Set current industry P/E from latest matched data
        if (matchedCount > 0) {
          const latestWithIndustry = [...mergedWeeklyPE]
            .reverse()
            .find(d => typeof d.industryPE === 'number');
          if (latestWithIndustry) {
            historicalData.currentIndustryPE = latestWithIndustry.industryPE;
            console.log(`✓ Current industry P/E: ${latestWithIndustry.industryPE.toFixed(2)}`);
          }
        }
      } else {
        console.warn('⚠️ Missing data for industry P/E calculation:', {
          hasIndustryName: !!industryName,
          hasPrices: !!historicalPrices?.historical,
          hasStatements: !!quarterlyIncomeStatements
        });
      }
      
      // 3. Add TTM 2025
      // First try FMP TTM ratio
      if (ttmRatios && ttmRatios[0]?.priceToEarningsRatioTTM) {
        const ttmPE = safeValue(ttmRatios[0].priceToEarningsRatioTTM);
        if (ttmPE && ttmPE > 0) {
          peRatioData.push({ year: 'TTM 2025', value: ttmPE });
          console.log(`Added TTM 2025 P/E from FMP: ${ttmPE.toFixed(2)}`);
        }
      } else if (quarterlyIncomeStatements && quoteData?.price) {
        // Fallback: Calculate TTM P/E ourselves
        const ttmEPS = calculateTTM_EPS(quarterlyIncomeStatements);
        const currentPrice = safeValue(quoteData.price);
        
        if (ttmEPS && ttmEPS > 0 && currentPrice && currentPrice > 0) {
          const calculatedTTM_PE = currentPrice / ttmEPS;
          peRatioData.push({ year: 'TTM 2025', value: calculatedTTM_PE });
          console.log(`Calculated TTM 2025 P/E: ${calculatedTTM_PE.toFixed(2)} (Price: ${currentPrice}, TTM EPS: ${ttmEPS})`);
        }
      }
      
      console.log('Final P/E ratio data:', peRatioData.length, 'records');
      historicalData.peRatio = peRatioData;
    } catch (error) {
      console.error('Error fetching P/E ratio data:', error);
      historicalData.peRatio = [];
    }
    
    // Add historical data if income statements are available
    if (incomeStatements && incomeStatements.length > 1) {
      // Last 30 years of revenue data
      historicalData.revenue = incomeStatements
        .slice(0, Math.min(30, incomeStatements.length))
        .map(statement => ({
          year: new Date(statement.date).getFullYear(),
          value: statement.revenue || 0,
          originalCurrency: statement.reportedCurrency || reportedCurrency
        }));
      
      // Last 30 years of earnings data
      historicalData.earnings = incomeStatements
        .slice(0, Math.min(30, incomeStatements.length))
        .map(statement => ({
          year: new Date(statement.date).getFullYear(),
          value: statement.netIncome || 0,
          originalCurrency: statement.reportedCurrency || reportedCurrency
        }));
      
      // Last 30 years of EPS data
      historicalData.eps = incomeStatements
        .slice(0, Math.min(30, incomeStatements.length))
        .map(statement => ({
          year: new Date(statement.date).getFullYear(),
          value: statement.eps || 0,
          originalCurrency: statement.reportedCurrency || reportedCurrency
        }));
      
      // Last 30 years of EBITDA data
      historicalData.ebitda = incomeStatements
        .slice(0, Math.min(30, incomeStatements.length))
        .map(statement => ({
          year: new Date(statement.date).getFullYear(),
          value: statement.ebitda || 0,
          originalCurrency: statement.reportedCurrency || reportedCurrency
        }));
      
      // EPS w/o NRI (Earnings Per Share without Non-Recurring Items)
      try {
        const epsWoNriResult = await calculateEpsWithoutNri(standardizedTicker, quote.price);
        if (epsWoNriResult && epsWoNriResult.annual && epsWoNriResult.annual.length > 0) {
          historicalData.epsWoNri = epsWoNriResult.annual.map(annual => ({
            year: annual.year.toString(),
            value: annual.epsWoNri,
            originalCurrency: reportedCurrency
          }));
          console.log(`✅ EPS w/o NRI data loaded: ${historicalData.epsWoNri.length} years`);
        }
      } catch (error) {
        console.warn('Could not calculate EPS w/o NRI:', error);
        historicalData.epsWoNri = [];
      }
    }

    // Add historical ROE data (last 10 years)
    if (ratios && ratios.length > 1 && incomeStatements && balanceSheets) {
      const roeData = [];
      
      // Sammle zuerst alle jährlichen Daten
      for (let i = 0; i < Math.min(10, ratios.length); i++) {
        let roeValue = null;
        const year = ratios[i].date ? new Date(ratios[i].date).getFullYear() : null;
        
        if (!year) continue;
        
        // Option A: Verwende vorberechneten ROE aus ratios
        if (ratios[i].returnOnEquity !== undefined && ratios[i].returnOnEquity !== null) {
          roeValue = safeValue(ratios[i].returnOnEquity) * 100; // Konvertiere zu Prozent
        }
        
        // Option B: Berechne ROE manuell aus netIncome und totalStockholdersEquity
        if ((roeValue === null || roeValue === 0) && 
            incomeStatements[i] && balanceSheets[i] &&
            incomeStatements[i].netIncome !== undefined && 
            balanceSheets[i].totalStockholdersEquity !== undefined && 
            balanceSheets[i].totalStockholdersEquity > 0) {
          const netIncome = safeValue(incomeStatements[i].netIncome);
          const equity = safeValue(balanceSheets[i].totalStockholdersEquity);
          if (netIncome !== null && equity !== null && equity > 0) {
            roeValue = (netIncome / equity) * 100;
          }
        }
        
        if (roeValue !== null) {
          roeData.push({
            year: year,
            value: Math.round(roeValue * 10) / 10,
            originalCurrency: incomeStatements[i]?.reportedCurrency || reportedCurrency
          });
        }
      }
      
      // Sortiere chronologisch (ältestes zuerst)
      historicalData.roe = roeData.reverse();
      
      // Berechne TTM aus den letzten 4 Quartalen und füge hinzu
      try {
        const quarterlyIncomeData = await fetchFromFMP(`/income-statement/${standardizedTicker}?period=quarter&limit=20`);
        const quarterlyBalanceData = await fetchFromFMP(`/balance-sheet-statement/${standardizedTicker}?period=quarter&limit=20`);
        
        if (quarterlyIncomeData && quarterlyIncomeData.length >= 4 && 
            quarterlyBalanceData && quarterlyBalanceData.length >= 4) {
          
          // Berechne TTM aus den letzten 4 Quartalen
          let ttmNetIncome = 0;
          let ttmEquity = null;
          let quarterCount = 0;
          const latestQuarterDate = quarterlyIncomeData[0].date ? new Date(quarterlyIncomeData[0].date) : new Date();
          
          console.log('Calculating TTM from quarters:', quarterlyIncomeData.slice(0, 4).map((q: any) => ({
            date: q.date,
            netIncome: q.netIncome
          })));
          
          for (let i = 0; i < Math.min(4, quarterlyIncomeData.length); i++) {
            const qIncome = safeValue(quarterlyIncomeData[i].netIncome);
            if (qIncome !== null) {
              ttmNetIncome += qIncome;
              quarterCount++;
            }
          }
          
          // Verwende das aktuellste Eigenkapital
          ttmEquity = safeValue(quarterlyBalanceData[0].totalStockholdersEquity);
          
          if (quarterCount === 4 && ttmEquity !== null && ttmEquity > 0) {
            const ttmRoe = (ttmNetIncome / ttmEquity) * 100;
            
            // Erstelle dynamisches Label basierend auf dem letzten Quartals-Datum
            const ttmYear = latestQuarterDate.getFullYear();
            const ttmLabel = `TTM ${ttmYear}`;
            
            // Prüfe, ob bereits ein Eintrag für dieses Jahr existiert
            const existingYearIndex = historicalData.roe.findIndex((entry: any) => entry.year === ttmYear);
            
            if (existingYearIndex >= 0) {
              // Ersetze das Jahresende-Datum durch TTM
              historicalData.roe[existingYearIndex] = {
                year: ttmLabel,
                value: Math.round(ttmRoe * 10) / 10,
                originalCurrency: quarterlyIncomeData[0]?.reportedCurrency || reportedCurrency
              };
              console.log(`Replaced year ${ttmYear} with ${ttmLabel} ROE:`, ttmRoe);
            } else {
              // Füge TTM hinzu
              historicalData.roe.push({
                year: ttmLabel,
                value: Math.round(ttmRoe * 10) / 10,
                originalCurrency: quarterlyIncomeData[0]?.reportedCurrency || reportedCurrency
              });
              console.log(`Added ${ttmLabel} ROE:`, ttmRoe);
            }
          }
        }
      } catch (error) {
        console.warn('Could not calculate TTM ROE:', error);
      }
    }

    // Add historical ROIC data (last 10 years)
    if (ratios && ratios.length > 1) {
      const roicData = [];
      
      for (let i = 0; i < Math.min(10, ratios.length); i++) {
        let roicValue = null;
        const year = ratios[i].date ? new Date(ratios[i].date).getFullYear() : null;
        
        if (!year) continue;
        
        // Use pre-calculated ROIC from ratios (returnOnCapitalEmployed is closest to ROIC)
        if (ratios[i].returnOnCapitalEmployed !== undefined && ratios[i].returnOnCapitalEmployed !== null) {
          roicValue = safeValue(ratios[i].returnOnCapitalEmployed) * 100; // Convert to percent
        }
        
        if (roicValue !== null) {
          roicData.push({
            year: year,
            value: Math.round(roicValue * 10) / 10,
            originalCurrency: incomeStatements[i]?.reportedCurrency || reportedCurrency
          });
        }
      }
      
      // Sort chronologically (oldest first for chart)
      historicalData.roic = roicData.reverse();
      
      // Add TTM calculation from quarterly data (approximation using operating income)
      try {
        const quarterlyIncomeData = await fetchFromFMP(`/income-statement/${standardizedTicker}?period=quarter&limit=20`);
        const quarterlyBalanceData = await fetchFromFMP(`/balance-sheet-statement/${standardizedTicker}?period=quarter&limit=20`);
        
        if (quarterlyIncomeData && quarterlyIncomeData.length >= 4 &&
            quarterlyBalanceData && quarterlyBalanceData.length >= 4) {
          let ttmOperatingIncome = 0;
          let quarterCount = 0;
          const latestQuarterDate = quarterlyIncomeData[0].date ? new Date(quarterlyIncomeData[0].date) : new Date();
          
          // Calculate TTM Operating Income (approximation for NOPAT)
          for (let i = 0; i < Math.min(4, quarterlyIncomeData.length); i++) {
            const qOpIncome = safeValue(quarterlyIncomeData[i].operatingIncome);
            if (qOpIncome !== null) {
              ttmOperatingIncome += qOpIncome;
              quarterCount++;
            }
          }
          
          // Calculate Invested Capital from latest balance sheet
          const latestBalance = quarterlyBalanceData[0];
          const equity = safeValue(latestBalance.totalStockholdersEquity) || 0;
          const longTermDebt = safeValue(latestBalance.longTermDebt) || 0;
          const shortTermDebt = safeValue(latestBalance.shortTermDebt) || 0;
          const investedCapital = equity + longTermDebt + shortTermDebt;
          
          if (quarterCount === 4 && investedCapital > 0) {
            // Approximate ROIC = Operating Income / Invested Capital * 100
            const ttmRoic = (ttmOperatingIncome / investedCapital) * 100;
            const ttmYear = latestQuarterDate.getFullYear();
            const ttmLabel = `TTM ${ttmYear}`;
            
            const existingYearIndex = historicalData.roic.findIndex((entry: any) => entry.year === ttmYear);
            
            if (existingYearIndex >= 0) {
              historicalData.roic[existingYearIndex] = {
                year: ttmLabel,
                value: Math.round(ttmRoic * 10) / 10,
                originalCurrency: quarterlyIncomeData[0]?.reportedCurrency || reportedCurrency
              };
            } else {
              historicalData.roic.push({
                year: ttmLabel,
                value: Math.round(ttmRoic * 10) / 10,
                originalCurrency: quarterlyIncomeData[0]?.reportedCurrency || reportedCurrency
              });
            }
          }
        }
      } catch (error) {
        console.warn('Could not calculate TTM ROIC:', error);
      }
    }

    // Add historical Operating Margin data (last 10 years)
    if (incomeStatements && incomeStatements.length > 1) {
      const operatingMarginData = [];
      
      for (let i = 0; i < Math.min(10, incomeStatements.length); i++) {
        let marginValue = null;
        const year = incomeStatements[i].date ? new Date(incomeStatements[i].date).getFullYear() : null;
        
        if (!year) continue;
        
        // Calculate Operating Margin = EBIT / Revenue * 100
        const ebit = incomeStatements[i].ebitda !== undefined && incomeStatements[i].depreciationAndAmortization !== undefined
          ? safeValue(incomeStatements[i].ebitda) - Math.abs(safeValue(incomeStatements[i].depreciationAndAmortization))
          : safeValue(incomeStatements[i].operatingIncome);
        const revenue = safeValue(incomeStatements[i].revenue);
        
        if (ebit !== null && revenue !== null && revenue > 0) {
          marginValue = (ebit / revenue) * 100;
        }
        
        if (marginValue !== null) {
          operatingMarginData.push({
            year: year,
            value: Math.round(marginValue * 10) / 10,
            originalCurrency: incomeStatements[i]?.reportedCurrency || reportedCurrency
          });
        }
      }
      
      // Sort chronologically (oldest first for chart)
      historicalData.operatingMargin = operatingMarginData.reverse();
      
      // Add TTM calculation from quarterly data
      try {
        const quarterlyIncomeData = await fetchFromFMP(`/income-statement/${standardizedTicker}?period=quarter&limit=20`);
        
        if (quarterlyIncomeData && quarterlyIncomeData.length >= 4) {
          let ttmEbit = 0;
          let ttmRevenue = 0;
          let quarterCount = 0;
          const latestQuarterDate = quarterlyIncomeData[0].date ? new Date(quarterlyIncomeData[0].date) : new Date();
          
          for (let i = 0; i < Math.min(4, quarterlyIncomeData.length); i++) {
            const qEbit = quarterlyIncomeData[i].ebitda !== undefined && quarterlyIncomeData[i].depreciationAndAmortization !== undefined
              ? safeValue(quarterlyIncomeData[i].ebitda) - Math.abs(safeValue(quarterlyIncomeData[i].depreciationAndAmortization))
              : safeValue(quarterlyIncomeData[i].operatingIncome);
            const qRevenue = safeValue(quarterlyIncomeData[i].revenue);
            
            if (qEbit !== null && qRevenue !== null) {
              ttmEbit += qEbit;
              ttmRevenue += qRevenue;
              quarterCount++;
            }
          }
          
          if (quarterCount === 4 && ttmRevenue > 0) {
            const ttmMargin = (ttmEbit / ttmRevenue) * 100;
            const ttmYear = latestQuarterDate.getFullYear();
            const ttmLabel = `TTM ${ttmYear}`;
            
            const existingYearIndex = historicalData.operatingMargin.findIndex((entry: any) => entry.year === ttmYear);
            
            if (existingYearIndex >= 0) {
              historicalData.operatingMargin[existingYearIndex] = {
                year: ttmLabel,
                value: Math.round(ttmMargin * 10) / 10,
                originalCurrency: quarterlyIncomeData[0]?.reportedCurrency || reportedCurrency
              };
            } else {
              historicalData.operatingMargin.push({
                year: ttmLabel,
                value: Math.round(ttmMargin * 10) / 10,
                originalCurrency: quarterlyIncomeData[0]?.reportedCurrency || reportedCurrency
              });
            }
          }
        }
      } catch (error) {
        console.warn('Could not calculate TTM Operating Margin:', error);
      }
    }

    // Add historical Net Margin data (last 10 years)
    if (incomeStatements && incomeStatements.length > 1) {
      const netMarginData = [];
      
      for (let i = 0; i < Math.min(10, incomeStatements.length); i++) {
        let marginValue = null;
        const year = incomeStatements[i].date ? new Date(incomeStatements[i].date).getFullYear() : null;
        
        if (!year) continue;
        
        // Calculate Net Margin = Net Income / Revenue * 100
        const netIncome = safeValue(incomeStatements[i].netIncome);
        const revenue = safeValue(incomeStatements[i].revenue);
        
        if (netIncome !== null && revenue !== null && revenue > 0) {
          marginValue = (netIncome / revenue) * 100;
        }
        
        if (marginValue !== null) {
          netMarginData.push({
            year: year,
            value: Math.round(marginValue * 10) / 10,
            originalCurrency: incomeStatements[i]?.reportedCurrency || reportedCurrency
          });
        }
      }
      
      // Sort chronologically (oldest first for chart)
      historicalData.netMargin = netMarginData.reverse();
      
      // Add TTM calculation from quarterly data
      try {
        const quarterlyIncomeData = await fetchFromFMP(`/income-statement/${standardizedTicker}?period=quarter&limit=20`);
        
        if (quarterlyIncomeData && quarterlyIncomeData.length >= 4) {
          let ttmNetIncome = 0;
          let ttmRevenue = 0;
          let quarterCount = 0;
          const latestQuarterDate = quarterlyIncomeData[0].date ? new Date(quarterlyIncomeData[0].date) : new Date();
          
          for (let i = 0; i < Math.min(4, quarterlyIncomeData.length); i++) {
            const qNetIncome = safeValue(quarterlyIncomeData[i].netIncome);
            const qRevenue = safeValue(quarterlyIncomeData[i].revenue);
            
            if (qNetIncome !== null && qRevenue !== null) {
              ttmNetIncome += qNetIncome;
              ttmRevenue += qRevenue;
              quarterCount++;
            }
          }
          
          if (quarterCount === 4 && ttmRevenue > 0) {
            const ttmMargin = (ttmNetIncome / ttmRevenue) * 100;
            const ttmYear = latestQuarterDate.getFullYear();
            const ttmLabel = `TTM ${ttmYear}`;
            
            const existingYearIndex = historicalData.netMargin.findIndex((entry: any) => entry.year === ttmYear);
            
            if (existingYearIndex >= 0) {
              historicalData.netMargin[existingYearIndex] = {
                year: ttmLabel,
                value: Math.round(ttmMargin * 10) / 10,
                originalCurrency: quarterlyIncomeData[0]?.reportedCurrency || reportedCurrency
              };
            } else {
              historicalData.netMargin.push({
                year: ttmLabel,
                value: Math.round(ttmMargin * 10) / 10,
                originalCurrency: quarterlyIncomeData[0]?.reportedCurrency || reportedCurrency
              });
            }
          }
        }
      } catch (error) {
        console.warn('Could not calculate TTM Net Margin:', error);
      }
    }

    // Add historical ROA data (last 10 years)
    if (incomeStatements && balanceSheets && incomeStatements.length > 1 && balanceSheets.length > 1) {
      const roaData = [];
      
      for (let i = 0; i < Math.min(10, Math.min(incomeStatements.length, balanceSheets.length)); i++) {
        let roaValue = null;
        const year = incomeStatements[i].date ? new Date(incomeStatements[i].date).getFullYear() : null;
        
        if (!year) continue;
        
        // Calculate ROA = Net Income / Total Assets * 100
        const netIncome = safeValue(incomeStatements[i].netIncome);
        const totalAssets = safeValue(balanceSheets[i].totalAssets);
        
        if (netIncome !== null && totalAssets !== null && totalAssets > 0) {
          roaValue = (netIncome / totalAssets) * 100;
        }
        
        if (roaValue !== null) {
          roaData.push({
            year: year,
            value: Math.round(roaValue * 10) / 10,
            originalCurrency: incomeStatements[i]?.reportedCurrency || reportedCurrency
          });
        }
      }
      
      // Sort chronologically (oldest first for chart)
      historicalData.roa = roaData.reverse();
      
      // Add TTM calculation from quarterly data
      try {
        const quarterlyIncomeData = await fetchFromFMP(`/income-statement/${standardizedTicker}?period=quarter&limit=20`);
        const quarterlyBalanceData = await fetchFromFMP(`/balance-sheet-statement/${standardizedTicker}?period=quarter&limit=20`);
        
        if (quarterlyIncomeData && quarterlyIncomeData.length >= 4 &&
            quarterlyBalanceData && quarterlyBalanceData.length >= 4) {
          let ttmNetIncome = 0;
          let quarterCount = 0;
          const latestQuarterDate = quarterlyIncomeData[0].date ? new Date(quarterlyIncomeData[0].date) : new Date();
          
          for (let i = 0; i < Math.min(4, quarterlyIncomeData.length); i++) {
            const qNetIncome = safeValue(quarterlyIncomeData[i].netIncome);
            if (qNetIncome !== null) {
              ttmNetIncome += qNetIncome;
              quarterCount++;
            }
          }
          
          const ttmAssets = safeValue(quarterlyBalanceData[0].totalAssets);
          
          if (quarterCount === 4 && ttmAssets !== null && ttmAssets > 0) {
            const ttmRoa = (ttmNetIncome / ttmAssets) * 100;
            const ttmYear = latestQuarterDate.getFullYear();
            const ttmLabel = `TTM ${ttmYear}`;
            
            const existingYearIndex = historicalData.roa.findIndex((entry: any) => entry.year === ttmYear);
            
            if (existingYearIndex >= 0) {
              historicalData.roa[existingYearIndex] = {
                year: ttmLabel,
                value: Math.round(ttmRoa * 10) / 10,
                originalCurrency: quarterlyIncomeData[0]?.reportedCurrency || reportedCurrency
              };
            } else {
              historicalData.roa.push({
                year: ttmLabel,
                value: Math.round(ttmRoa * 10) / 10,
                originalCurrency: quarterlyIncomeData[0]?.reportedCurrency || reportedCurrency
              });
            }
          }
        }
      } catch (error) {
        console.warn('Could not calculate TTM ROA:', error);
      }
    }

    // Add historical Net Income data (last 10 years) for Years of Profitability
    if (incomeStatements && incomeStatements.length > 1) {
      const netIncomeData = [];
      
      for (let i = 0; i < Math.min(10, incomeStatements.length); i++) {
        const netIncomeValue = safeValue(incomeStatements[i].netIncome);
        const year = incomeStatements[i].date ? new Date(incomeStatements[i].date).getFullYear() : null;
        
        if (!year) continue;
        
        netIncomeData.push({
          year: year,
          value: netIncomeValue !== null ? netIncomeValue : 0,
          isProfitable: netIncomeValue !== null && netIncomeValue > 0,
          originalCurrency: incomeStatements[i]?.reportedCurrency || reportedCurrency
        });
      }
      
      // Sort chronologically (oldest first for display)
      historicalData.netIncome = netIncomeData.reverse();
    }

    // Add historical Debt/Assets data (last 10 years)
    if (balanceSheets && balanceSheets.length > 1) {
      const debtToAssetsData = [];
      
      for (let i = 0; i < Math.min(10, balanceSheets.length); i++) {
        let debtToAssetsValue = null;
        const year = balanceSheets[i].date ? new Date(balanceSheets[i].date).getFullYear() : null;
        
        if (!year) continue;
        
        // Calculate Debt/Assets = Total Debt / Total Assets * 100
        const totalDebt = safeValue(balanceSheets[i].totalDebt) || 
                         (safeValue(balanceSheets[i].shortTermDebt) + safeValue(balanceSheets[i].longTermDebt));
        const totalAssets = safeValue(balanceSheets[i].totalAssets);
        
        if (totalAssets !== null && totalAssets > 0) {
          debtToAssetsValue = (totalDebt / totalAssets) * 100;
        }
        
        if (debtToAssetsValue !== null) {
          debtToAssetsData.push({
            year: year,
            value: Math.round(debtToAssetsValue * 10) / 10,
            originalCurrency: balanceSheets[i]?.reportedCurrency || reportedCurrency
          });
        }
      }
      
      // Sort chronologically (oldest first for chart)
      historicalData.debtToAssets = debtToAssetsData.reverse();
      
      // Add TTM calculation from quarterly data
      try {
        const quarterlyBalanceData = await fetchFromFMP(`/balance-sheet-statement/${standardizedTicker}?period=quarter&limit=20`);
        
        if (quarterlyBalanceData && quarterlyBalanceData.length >= 1) {
          const latestQuarterDate = quarterlyBalanceData[0].date ? new Date(quarterlyBalanceData[0].date) : new Date();
          
          // Use the most recent quarter's balance sheet
          const totalDebt = safeValue(quarterlyBalanceData[0].totalDebt) || 
                           (safeValue(quarterlyBalanceData[0].shortTermDebt) + safeValue(quarterlyBalanceData[0].longTermDebt));
          const totalAssets = safeValue(quarterlyBalanceData[0].totalAssets);
          
          if (totalAssets !== null && totalAssets > 0) {
            const ttmDebtToAssets = (totalDebt / totalAssets) * 100;
            const ttmYear = latestQuarterDate.getFullYear();
            const ttmLabel = `TTM ${ttmYear}`;
            
            const existingYearIndex = historicalData.debtToAssets.findIndex((entry: any) => entry.year === ttmYear);
            
            if (existingYearIndex >= 0) {
              historicalData.debtToAssets[existingYearIndex] = {
                year: ttmLabel,
                value: Math.round(ttmDebtToAssets * 10) / 10,
                originalCurrency: quarterlyBalanceData[0]?.reportedCurrency || reportedCurrency
              };
            } else {
              historicalData.debtToAssets.push({
                year: ttmLabel,
                value: Math.round(ttmDebtToAssets * 10) / 10,
                originalCurrency: quarterlyBalanceData[0]?.reportedCurrency || reportedCurrency
              });
            }
          }
        }
      } catch (error) {
        console.warn('Could not calculate TTM Debt/Assets:', error);
      }
    }

    // Add historical Interest Coverage data (last 10 years)
    if (incomeStatements && incomeStatements.length > 1) {
      const interestCoverageData = [];
      
      for (let i = 0; i < Math.min(10, incomeStatements.length); i++) {
        let coverageValue = null;
        const year = incomeStatements[i].date ? new Date(incomeStatements[i].date).getFullYear() : null;
        
        if (!year) continue;
        
        // Calculate EBIT = EBITDA - Depreciation & Amortization (or use operatingIncome)
        const ebit = incomeStatements[i].ebitda !== undefined && incomeStatements[i].depreciationAndAmortization !== undefined
          ? safeValue(incomeStatements[i].ebitda) - Math.abs(safeValue(incomeStatements[i].depreciationAndAmortization))
          : safeValue(incomeStatements[i].operatingIncome);
        const interestExpense = safeValue(incomeStatements[i].interestExpense);
        
        // Calculate Interest Coverage = EBIT / |Interest Expense|
        if (ebit !== null && interestExpense !== null && interestExpense !== 0) {
          coverageValue = ebit / Math.abs(interestExpense);
        }
        
        if (coverageValue !== null) {
          interestCoverageData.push({
            year: year,
            value: Math.round(coverageValue * 10) / 10,
            originalCurrency: incomeStatements[i]?.reportedCurrency || reportedCurrency
          });
        }
      }
      
      // Sort chronologically (oldest first for chart)
      historicalData.interestCoverage = interestCoverageData.reverse();
      
      // Add TTM calculation from quarterly data
      try {
        const quarterlyIncomeData = await fetchFromFMP(`/income-statement/${standardizedTicker}?period=quarter&limit=20`);
        
        if (quarterlyIncomeData && quarterlyIncomeData.length >= 4) {
          let ttmEbit = 0;
          let ttmInterestExpense = 0;
          let quarterCount = 0;
          const latestQuarterDate = quarterlyIncomeData[0].date ? new Date(quarterlyIncomeData[0].date) : new Date();
          
          for (let i = 0; i < Math.min(4, quarterlyIncomeData.length); i++) {
            const qEbit = quarterlyIncomeData[i].ebitda !== undefined && quarterlyIncomeData[i].depreciationAndAmortization !== undefined
              ? safeValue(quarterlyIncomeData[i].ebitda) - Math.abs(safeValue(quarterlyIncomeData[i].depreciationAndAmortization))
              : safeValue(quarterlyIncomeData[i].operatingIncome);
            const qInterestExpense = safeValue(quarterlyIncomeData[i].interestExpense);
            
            if (qEbit !== null && qInterestExpense !== null) {
              ttmEbit += qEbit;
              ttmInterestExpense += qInterestExpense;
              quarterCount++;
            }
          }
          
          if (quarterCount === 4 && ttmInterestExpense !== 0) {
            const ttmCoverage = ttmEbit / Math.abs(ttmInterestExpense);
            const ttmYear = latestQuarterDate.getFullYear();
            const ttmLabel = `TTM ${ttmYear}`;
            
            const existingYearIndex = historicalData.interestCoverage.findIndex((entry: any) => entry.year === ttmYear);
            
            if (existingYearIndex >= 0) {
              historicalData.interestCoverage[existingYearIndex] = {
                year: ttmLabel,
                value: Math.round(ttmCoverage * 10) / 10,
                originalCurrency: quarterlyIncomeData[0]?.reportedCurrency || reportedCurrency
              };
            } else {
              historicalData.interestCoverage.push({
                year: ttmLabel,
                value: Math.round(ttmCoverage * 10) / 10,
                originalCurrency: quarterlyIncomeData[0]?.reportedCurrency || reportedCurrency
              });
            }
          }
        }
      } catch (error) {
        console.warn('Could not calculate TTM Interest Coverage:', error);
      }
    }

    // Add historical Current Ratio data (last 10 years)
    if (balanceSheets && balanceSheets.length > 1) {
      const currentRatioData = [];
      
      for (let i = 0; i < Math.min(10, balanceSheets.length); i++) {
        let ratioValue = null;
        const year = balanceSheets[i].date ? new Date(balanceSheets[i].date).getFullYear() : null;
        
        if (!year) continue;
        
        // Calculate Current Ratio = Total Current Assets / Total Current Liabilities
        const currentAssets = safeValue(balanceSheets[i].totalCurrentAssets);
        const currentLiabilities = safeValue(balanceSheets[i].totalCurrentLiabilities);
        
        if (currentAssets !== null && currentLiabilities !== null && currentLiabilities > 0) {
          ratioValue = currentAssets / currentLiabilities;
        }
        
        if (ratioValue !== null) {
          currentRatioData.push({
            year: year,
            value: Math.round(ratioValue * 100) / 100, // 2 decimal places
            originalCurrency: balanceSheets[i]?.reportedCurrency || reportedCurrency
          });
        }
      }
      
      // Sort chronologically (oldest first for chart)
      historicalData.currentRatio = currentRatioData.reverse();
      
      // Add TTM calculation from quarterly data
      try {
        const quarterlyBalanceData = await fetchFromFMP(`/balance-sheet-statement/${standardizedTicker}?period=quarter&limit=20`);
        
        if (quarterlyBalanceData && quarterlyBalanceData.length >= 1) {
          const latestQuarterDate = quarterlyBalanceData[0].date ? new Date(quarterlyBalanceData[0].date) : new Date();
          
          // Use the most recent quarter's balance sheet
          const currentAssets = safeValue(quarterlyBalanceData[0].totalCurrentAssets);
          const currentLiabilities = safeValue(quarterlyBalanceData[0].totalCurrentLiabilities);
          
          if (currentAssets !== null && currentLiabilities !== null && currentLiabilities > 0) {
            const ttmCurrentRatio = currentAssets / currentLiabilities;
            const ttmYear = latestQuarterDate.getFullYear();
            const ttmLabel = `TTM ${ttmYear}`;
            
            const existingYearIndex = historicalData.currentRatio.findIndex((entry: any) => entry.year === ttmYear);
            
            if (existingYearIndex >= 0) {
              historicalData.currentRatio[existingYearIndex] = {
                year: ttmLabel,
                value: Math.round(ttmCurrentRatio * 100) / 100,
                originalCurrency: quarterlyBalanceData[0]?.reportedCurrency || reportedCurrency
              };
            } else {
              historicalData.currentRatio.push({
                year: ttmLabel,
                value: Math.round(ttmCurrentRatio * 100) / 100,
                originalCurrency: quarterlyBalanceData[0]?.reportedCurrency || reportedCurrency
              });
            }
          }
        }
      } catch (error) {
        console.warn('Could not calculate TTM Current Ratio:', error);
      }
    }

    // Add historical Net Debt/EBITDA data (last 10 years)
    if (incomeStatements && balanceSheets && incomeStatements.length > 1 && balanceSheets.length > 1) {
      const netDebtToEbitdaData = [];
      
      for (let i = 0; i < Math.min(10, Math.min(incomeStatements.length, balanceSheets.length)); i++) {
        let ratioValue = null;
        const year = incomeStatements[i].date ? new Date(incomeStatements[i].date).getFullYear() : null;
        
        if (!year) continue;
        
        // Calculate Net Debt = Total Debt - Cash
        const totalDebt = safeValue(balanceSheets[i].totalDebt) || 
                         (safeValue(balanceSheets[i].shortTermDebt) + safeValue(balanceSheets[i].longTermDebt));
        const cash = safeValue(balanceSheets[i].cashAndCashEquivalents) || 0;
        const netDebt = totalDebt - cash;
        
        // Get EBITDA from income statement
        const ebitda = safeValue(incomeStatements[i].ebitda);
        
        // Calculate Net Debt/EBITDA
        if (ebitda !== null && ebitda !== 0) {
          ratioValue = netDebt / ebitda;
        }
        
        if (ratioValue !== null) {
          netDebtToEbitdaData.push({
            year: year,
            value: Math.round(ratioValue * 100) / 100, // 2 decimal places
            originalCurrency: incomeStatements[i]?.reportedCurrency || reportedCurrency
          });
        }
      }
      
      // Sort chronologically (oldest first for chart)
      historicalData.netDebtToEbitda = netDebtToEbitdaData.reverse();
      
      // Add TTM calculation from quarterly data
      try {
        const quarterlyIncomeData = await fetchFromFMP(`/income-statement/${standardizedTicker}?period=quarter&limit=20`);
        const quarterlyBalanceData = await fetchFromFMP(`/balance-sheet-statement/${standardizedTicker}?period=quarter&limit=20`);
        
        if (quarterlyIncomeData && quarterlyIncomeData.length >= 4 &&
            quarterlyBalanceData && quarterlyBalanceData.length >= 1) {
          // Sum last 4 quarters of EBITDA for TTM
          let ttmEbitda = 0;
          let quarterCount = 0;
          const latestQuarterDate = quarterlyIncomeData[0].date ? new Date(quarterlyIncomeData[0].date) : new Date();
          
          for (let i = 0; i < Math.min(4, quarterlyIncomeData.length); i++) {
            const qEbitda = safeValue(quarterlyIncomeData[i].ebitda);
            if (qEbitda !== null) {
              ttmEbitda += qEbitda;
              quarterCount++;
            }
          }
          
          // Use most recent quarter's net debt
          const totalDebt = safeValue(quarterlyBalanceData[0].totalDebt) || 
                           (safeValue(quarterlyBalanceData[0].shortTermDebt) + safeValue(quarterlyBalanceData[0].longTermDebt));
          const cash = safeValue(quarterlyBalanceData[0].cashAndCashEquivalents) || 0;
          const netDebt = totalDebt - cash;
          
          if (quarterCount === 4 && ttmEbitda !== 0) {
            const ttmNetDebtToEbitda = netDebt / ttmEbitda;
            const ttmYear = latestQuarterDate.getFullYear();
            const ttmLabel = `TTM ${ttmYear}`;
            
            const existingYearIndex = historicalData.netDebtToEbitda.findIndex((entry: any) => entry.year === ttmYear);
            
            if (existingYearIndex >= 0) {
              historicalData.netDebtToEbitda[existingYearIndex] = {
                year: ttmLabel,
                value: Math.round(ttmNetDebtToEbitda * 100) / 100,
                originalCurrency: quarterlyIncomeData[0]?.reportedCurrency || reportedCurrency
              };
            } else {
              historicalData.netDebtToEbitda.push({
                year: ttmLabel,
                value: Math.round(ttmNetDebtToEbitda * 100) / 100,
                originalCurrency: quarterlyIncomeData[0]?.reportedCurrency || reportedCurrency
              });
            }
          }
        }
      } catch (error) {
        console.warn('Could not calculate TTM Net Debt/EBITDA:', error);
      }
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
      
      // Last 30 years of FCF data
      historicalData.freeCashFlow = cashFlows
        .slice(0, Math.min(30, cashFlows.length))
        .map(statement => ({
          year: new Date(statement.date).getFullYear(),
          value: statement.freeCashFlow || 0,
          originalCurrency: statement.reportedCurrency || reportedCurrency
        }));
    }

    // EPS Growth (3-year CAGR calculation) - muss VOR Metriken-Erstellung erfolgen
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
      
      // Store details for display
      epsGrowthDetails = {
        currentYear: currentStatement.calendarYear || currentStatement.date?.substring(0, 4) || 'Aktuell',
        pastYear: pastStatement.calendarYear || pastStatement.date?.substring(0, 4) || 'Vor 3 Jahren',
        currentEPS: currentEPS,
        pastEPS: pastEPS
      };
      
      console.log(`[getFinancialMetrics - EPS Growth Debug]:`, {
        currentYear: epsGrowthDetails.currentYear,
        currentEPS: currentEPS,
        pastYear: epsGrowthDetails.pastYear,
        pastEPS: pastEPS
      });
      
      if (pastEPS > 0 && currentEPS > 0) {
        // Calculate 3-year CAGR
        const years = 3;
        epsGrowth = (Math.pow(currentEPS / pastEPS, 1 / years) - 1) * 100;
        console.log(`[getFinancialMetrics - EPS Growth]: ${epsGrowth.toFixed(2)}% CAGR over ${years} years`);
      } else if (pastEPS !== 0) {
        // Fallback to simple growth if one value is negative
        epsGrowth = ((currentEPS - pastEPS) / Math.abs(pastEPS)) * 100;
        console.log(`[getFinancialMetrics - EPS Growth]: ${epsGrowth.toFixed(2)}% (simple growth, negative EPS detected)`);
      } else {
        console.log(`[getFinancialMetrics - EPS Growth]: Cannot calculate (past EPS is zero)`);
      }
    } else {
      console.log(`[getFinancialMetrics - EPS Growth]: Insufficient data (${incomeStatements?.length || 0} statements available, need 4)`);
    }

    // Erstelle strukturierte Metriken für das Frontend
    const metrics = [];

    // EPS-Wachstum Metrik - zeige prozentuales Wachstum als Hauptwert
    if (eps !== null && incomeStatements && incomeStatements.length >= 4) {
      // Berechne EPS-Status basierend auf dem tatsächlichen Wachstum
      let epsStatus: 'pass' | 'warning' | 'fail' = 'fail';
      if (epsGrowth >= 10) {
        epsStatus = 'pass'; // Buffett bevorzugt >10%
      } else if (epsGrowth >= 5) {
        epsStatus = 'warning'; // Akzeptabel, aber nicht ideal
      }
      // else: < 5% Wachstum = 'fail'
      
      // Determine the currency to display
      const displayCurrency = reportedCurrency || 'USD';
      
      metrics.push({
        name: 'EPS-Wachstum (3 Jahre CAGR)',
        value: epsGrowth, // Zeige das Wachstum in Prozent als Hauptwert
        formula: 'Jahresüberschuss ÷ Anzahl ausstehender Aktien',
        explanation: `Durchschnittliches jährliches Wachstum des Gewinns pro Aktie über 3 Jahre. Aktueller EPS: ${eps.toFixed(2)} ${displayCurrency} (${epsGrowthDetails.pastYear}: ${epsGrowthDetails.pastEPS.toFixed(2)} → ${epsGrowthDetails.currentYear}: ${epsGrowthDetails.currentEPS.toFixed(2)} ${displayCurrency})`,
        threshold: 'Kontinuierliches Wachstum >10%',
        status: epsStatus,
        isPercentage: true,
        isMultiplier: false,
        isAlreadyPercent: true // Flag, dass der Wert bereits in Prozent ist
      });
    }

    // ROE Metrik  
    if (roe !== null) {
      console.log(`DEBUG: Raw ROE from API: ${roe}`);
      metrics.push({
        name: 'ROE (Eigenkapitalrendite)',
        value: roe,
        formula: 'Jahresüberschuss ÷ Eigenkapital × 100',
        explanation: 'Rendite auf das eingesetzte Eigenkapital',
        threshold: 'Buffett bevorzugt > 15%',
        status: roe > 15 ? 'pass' : roe > 10 ? 'warning' : 'fail' as const,
        isPercentage: true,
        isMultiplier: false,
        isAlreadyPercent: true // ROE comes already as percentage from API
      });
    }

    // Nettomarge Metrik
    if (netMargin !== null) {
      const netMarginPercent = netMargin * 100; // Convert decimal to percentage
      console.log(`DEBUG: Raw netMargin from API: ${netMargin}, as percentage: ${netMarginPercent}%`);
      metrics.push({
        name: 'Nettomarge',
        value: netMargin,
        formula: 'Jahresüberschuss ÷ Umsatz × 100',
        explanation: 'Anteil des Umsatzes, der als Gewinn übrig bleibt',
        threshold: 'Buffett bevorzugt > 10%',
        status: netMarginPercent > 10 ? 'pass' : netMarginPercent > 5 ? 'warning' : 'fail' as const,
        isPercentage: true,
        isMultiplier: false,
        isAlreadyPercent: false // Net margin comes as decimal from API
      });
    }

    // ROIC Metrik
    if (roic !== null) {
      console.log(`DEBUG: Raw ROIC from API: ${roic}`);
      metrics.push({
        name: 'ROIC (Kapitalrendite)',
        value: roic,
        formula: 'NOPAT ÷ (Eigenkapital + Finanzverbindlichkeiten)',
        explanation: 'Rendite auf das gesamte investierte Kapital',
        threshold: 'Buffett bevorzugt > 12%',
        status: roic > 12 ? 'pass' : roic > 8 ? 'warning' : 'fail' as const,
        isPercentage: true,
        isMultiplier: false,
        isAlreadyPercent: true // ROIC comes already as percentage from API
      });
    }

    // Schuldenquote Metrik
    if (debtToAssets !== null) {
      console.log(`DEBUG: Raw debtToAssets from API: ${debtToAssets}`);
      metrics.push({
        name: 'Schulden zu Vermögen',
        value: debtToAssets,
        formula: 'Gesamtschulden ÷ Gesamtvermögen × 100',
        explanation: 'Anteil der Schulden am Gesamtvermögen',
        threshold: 'Buffett bevorzugt < 50%',
        status: debtToAssets < 50 ? 'pass' : debtToAssets < 70 ? 'warning' : 'fail' as const,
        isPercentage: true,
        isMultiplier: false,
        isAlreadyPercent: false // Debt to assets comes as decimal from API
      });
    }

    // Zinsdeckungsgrad Metrik
    if (interestCoverage !== null) {
      let coverageDisplay = interestCoverage.toFixed(2);
      if (interestCoverageDate) {
        coverageDisplay += ` (aus ${interestCoverageDate})`;
      }
      
      metrics.push({
        name: 'Zinsdeckungsgrad',
        value: coverageDisplay,
        formula: 'EBIT ÷ Zinsaufwand',
        explanation: 'Fähigkeit des Unternehmens, Zinsen aus dem operativen Ergebnis zu bedienen',
        threshold: 'Buffett bevorzugt > 5',
        status: interestCoverage > 5 ? 'pass' : interestCoverage > 3 ? 'warning' : 'fail' as const,
        isPercentage: false,
        isMultiplier: true
      });
    }

    // P/E Ratio (KGV) Metrik
    const pe = safeValue(latestRatios?.priceEarningsRatio);
    if (pe !== null && pe > 0) {
      metrics.push({
        name: 'P/E-Verhältnis (KGV)',
        value: pe,
        formula: 'Aktienkurs ÷ Gewinn pro Aktie',
        explanation: 'Verhältnis zwischen Aktienkurs und Gewinn pro Aktie',
        threshold: 'Buffett bevorzugt < 25',
        status: pe < 15 ? 'pass' : pe < 25 ? 'warning' : 'fail' as const,
        isPercentage: false,
        isMultiplier: true
      });
    }

    // P/B Ratio (KBV) Metrik
    const pb = safeValue(latestRatios?.priceToBookRatio);
    if (pb !== null && pb > 0) {
      metrics.push({
        name: 'P/B-Verhältnis (KBV)',
        value: pb,
        formula: 'Aktienkurs ÷ Buchwert pro Aktie',
        explanation: 'Verhältnis zwischen Marktpreis und Buchwert der Aktie',
        threshold: 'Buffett bevorzugt < 3',
        status: pb < 1.5 ? 'pass' : pb < 3 ? 'warning' : 'fail' as const,
        isPercentage: false,
        isMultiplier: true
      });
    }

    // Current Ratio Metrik
    const currentRatio = safeValue(latestRatios?.currentRatio);
    if (currentRatio !== null) {
      metrics.push({
        name: 'Current Ratio',
        value: currentRatio,
        formula: 'Umlaufvermögen ÷ kurzfristige Verbindlichkeiten',
        explanation: 'Zeigt die kurzfristige Zahlungsfähigkeit des Unternehmens',
        threshold: 'Buffett bevorzugt > 1.5',
        status: currentRatio > 2 ? 'pass' : currentRatio > 1.5 ? 'warning' : 'fail' as const,
        isPercentage: false,
        isMultiplier: true
      });
    }

    // Schulden zu EBITDA Metrik
    if (latestIncomeStatement && latestBalanceSheet) {
      const totalDebt = safeValue(latestBalanceSheet.totalDebt) || 
                       (safeValue(latestBalanceSheet.shortTermDebt) + safeValue(latestBalanceSheet.longTermDebt));
      const ebitda = safeValue(latestIncomeStatement.ebitda);
      
      if (totalDebt !== null && ebitda !== null && ebitda > 0) {
        const debtToEBITDA = totalDebt / ebitda;
        metrics.push({
          name: 'Schulden zu EBITDA',
          value: debtToEBITDA,
          formula: 'Gesamtverschuldung ÷ EBITDA',
          explanation: 'Zeigt, wie viele Jahre das Unternehmen brauchen würde, um Schulden aus operativem Ergebnis zurückzuzahlen',
          threshold: 'Unter 1,0 ist hervorragend, 1,0-2,0 gut, 2,0-3,0 akzeptabel',
          status: debtToEBITDA < 1.5 ? 'pass' : debtToEBITDA < 3 ? 'warning' : 'fail' as const,
          isPercentage: false,
          isMultiplier: true
        });
      }
    }

    // Helper functions for statistical calculations
    const calculateAverage = (values: number[]) => {
      if (values.length === 0) return 0;
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    };
    
    const calculateStdDev = (values: number[]) => {
      if (values.length === 0) return 0;
      const avg = calculateAverage(values);
      const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
      const variance = calculateAverage(squaredDiffs);
      return Math.sqrt(variance);
    };

    // OCF-Qualität Metrik
    if (cashFlows && cashFlows.length >= 3 && incomeStatements && incomeStatements.length >= 3) {
      const ocfToNIRatios: number[] = [];
      
      // Calculate OCF/Net Income ratios for up to 5 years
      for (let i = 0; i < Math.min(5, cashFlows.length, incomeStatements.length); i++) {
        const ocf = safeValue(cashFlows[i]?.operatingCashFlow);
        const netIncome = safeValue(incomeStatements[i]?.netIncome);
        
        if (ocf !== null && netIncome !== null && netIncome > 0) {
          ocfToNIRatios.push(ocf / netIncome);
        }
      }
      
      if (ocfToNIRatios.length >= 3) {
        const avgOcfToNI = calculateAverage(ocfToNIRatios);
        
        // Calculate standard deviations for robustness check
        const ocfValues = cashFlows.slice(0, Math.min(5, cashFlows.length))
          .map(cf => safeValue(cf?.operatingCashFlow))
          .filter((v): v is number => v !== null);
        
        const revenueValues = incomeStatements.slice(0, Math.min(5, incomeStatements.length))
          .map(is => safeValue(is?.revenue))
          .filter((v): v is number => v !== null);
        
        const ocfStdDev = calculateStdDev(ocfValues);
        const revenueStdDev = calculateStdDev(revenueValues);
        
        const isRobust = ocfStdDev < revenueStdDev;
        const meetsThreshold = avgOcfToNI >= 1.0;
        
        let status: 'pass' | 'warning' | 'fail' = 'fail';
        if (meetsThreshold && isRobust) {
          status = 'pass';
        } else if (meetsThreshold || isRobust) {
          status = 'warning';
        }
        
        metrics.push({
          name: 'OCF-Qualität',
          value: avgOcfToNI * 100,
          formula: 'OCF ÷ Nettogewinn (5-Jahres-Ø)',
          explanation: `OCF/Nettogewinn: ${avgOcfToNI.toFixed(2)}. ${isRobust ? 'OCF robuster als Umsatz' : 'OCF volatiler als Umsatz'}.`,
          threshold: 'OCF/Nettogewinn ≥ 1,0 und Standardabw. OCF < Standardabw. Umsatz',
          status: status,
          isPercentage: true,
          isMultiplier: false,
          isAlreadyPercent: true
        });
      }
    }

    // FCF-Robustheit Metrik
    if (cashFlows && cashFlows.length >= 3 && incomeStatements && incomeStatements.length >= 3) {
      const fcfMargins: number[] = [];
      let hasNegativeFcfInRecession = false;
      
      // Calculate FCF margins for up to 5 years
      for (let i = 0; i < Math.min(5, cashFlows.length, incomeStatements.length); i++) {
        const fcf = safeValue(cashFlows[i]?.freeCashFlow);
        const revenue = safeValue(incomeStatements[i]?.revenue);
        
        if (fcf !== null && revenue !== null && revenue > 0) {
          const margin = (fcf / revenue) * 100;
          fcfMargins.push(margin);
          
          // Check for negative FCF (simplified recession check - look at any year)
          if (fcf < 0) {
            hasNegativeFcfInRecession = true;
          }
        }
      }
      
      if (fcfMargins.length >= 3) {
        const avgFcfMargin = calculateAverage(fcfMargins);
        
        let status: 'pass' | 'warning' | 'fail' = 'fail';
        if (avgFcfMargin >= 7 && !hasNegativeFcfInRecession) {
          status = 'pass';
        } else if (avgFcfMargin >= 5 && !hasNegativeFcfInRecession) {
          status = 'warning';
        }
        
        metrics.push({
          name: 'FCF-Robustheit',
          value: avgFcfMargin,
          formula: 'Freier CF ÷ Umsatz × 100 (5-Jahres-Ø)',
          explanation: `FCF-Marge (5J-Ø): ${avgFcfMargin.toFixed(1)}%. ${hasNegativeFcfInRecession ? 'Negativer FCF in schwierigen Jahren' : 'Kein negativer FCF'}`,
          threshold: 'FCF-Marge ≥ 7% und in keinem Jahr <0',
          status: status,
          isPercentage: true,
          isMultiplier: false,
          isAlreadyPercent: true
        });
      }
    }

    // Cash Conversion Rate (FCF/Net Income)
    const freeCashFlow = safeValue(latestCashFlow?.freeCashFlow);
    if (freeCashFlow !== null && latestIncomeStatement?.netIncome && latestIncomeStatement.netIncome > 0) {
      const cashConversion = (freeCashFlow / latestIncomeStatement.netIncome) * 100;
      metrics.push({
        name: 'Cash Conversion Rate',
        value: cashConversion,
        formula: 'Freier CF ÷ Nettogewinn × 100',
        explanation: 'Zeigt, wie viel vom Gewinn tatsächlich als Geld verfügbar ist',
        threshold: 'Buffett bevorzugt > 80%',
        status: cashConversion > 80 ? 'pass' : cashConversion > 50 ? 'warning' : 'fail',
        isPercentage: true,
        isMultiplier: false,
        isAlreadyPercent: true
      });
    }

    // Capex Ratio
    const capex = safeValue(latestCashFlow?.capitalExpenditure);
    if (capex !== null && latestIncomeStatement?.revenue) {
      const capexRatio = Math.abs(capex / latestIncomeStatement.revenue) * 100;
      metrics.push({
        name: 'Capex-Quote',
        value: capexRatio,
        formula: 'Investitionsausgaben ÷ Umsatz × 100',
        explanation: 'Investitionsbedarf relativ zum Umsatz',
        threshold: 'Niedriger ist besser (< 5%)',
        status: capexRatio < 5 ? 'pass' : capexRatio < 10 ? 'warning' : 'fail',
        isPercentage: true,
        isMultiplier: false,
        isAlreadyPercent: true
      });
    }

    // Fetch and process dividend data
    let dividendMetrics = undefined;
    try {
      console.log(`Fetching dividend history for ${standardizedTicker}`);
      const dividendData = await fetchFromFMP(`/historical-price-full/stock_dividend/${standardizedTicker}`);
      
      if (dividendData?.historical && Array.isArray(dividendData.historical) && dividendData.historical.length > 0) {
        // Aggregate dividends by year (sum all payments in a year)
        const yearlyDividends = new Map<number, number>();
        dividendData.historical.forEach((item: any) => {
          if (item.dividend && item.dividend > 0) {
            const year = new Date(item.date).getFullYear();
            yearlyDividends.set(year, (yearlyDividends.get(year) || 0) + item.dividend);
          }
        });
        
        // Convert to array and sort chronologically
        const dividendHistory = Array.from(yearlyDividends.entries())
          .map(([year, value]) => ({ year: year.toString(), value }))
          .sort((a, b) => parseInt(a.year) - parseInt(b.year));
        
        if (dividendHistory.length > 0) {
          historicalData.dividend = dividendHistory;
          
          // Calculate payout ratio (Dividends Paid / FCF) - Historical + TTM
          let currentPayoutRatio = 0;
          if (cashFlows && cashFlows.length > 0) {
            const payoutRatioData = [];
            
            // Historical payout ratios (up to 30 years)
            for (let i = 0; i < Math.min(30, cashFlows.length); i++) {
              const year = new Date(cashFlows[i].date).getFullYear();
              const fcf = safeValue(cashFlows[i].freeCashFlow);
              const dividendsPaid = safeValue(cashFlows[i].dividendsPaid);
              
              if (fcf && fcf > 0 && dividendsPaid) {
                // dividendsPaid is negative in FMP, represents total cash paid
                const totalDividendsPaid = Math.abs(dividendsPaid);
                const payoutRatio = (totalDividendsPaid / fcf) * 100;
                
                payoutRatioData.push({
                  year: year.toString(),
                  value: Math.round(payoutRatio * 10) / 10
                });
              }
            }
            
            historicalData.payoutRatio = payoutRatioData.sort((a, b) => parseInt(a.year) - parseInt(b.year));
            
            // Calculate TTM-based current payout ratio
            const ttmFCF = safeValue(cashFlows[0].freeCashFlow);
            const dividendsPaid = safeValue(cashFlows[0].dividendsPaid);
            
            if (ttmFCF && ttmFCF > 0 && dividendsPaid) {
              const totalDividendsPaid = Math.abs(dividendsPaid);
              currentPayoutRatio = Math.round((totalDividendsPaid / ttmFCF) * 1000) / 10;
              
              console.log('TTM Payout Ratio:', {
                ttmFCF: ttmFCF.toLocaleString(),
                dividendsPaid: totalDividendsPaid.toLocaleString(),
                ratio: currentPayoutRatio + '%'
              });
            }
          }
          
          // Calculate dividend streak (years without cuts)
          let dividendStreak = 0;
          const sortedDesc = [...dividendHistory].reverse(); // [2024, 2023, 2022, ...]
          
          // Compare newer year (i-1) with older year (i)
          for (let i = 1; i < sortedDesc.length; i++) {
            const newerYear = sortedDesc[i-1];  // e.g., 2024
            const olderYear = sortedDesc[i];    // e.g., 2023
            
            // Check if newer dividend >= older dividend (with 5% tolerance)
            if (newerYear.value >= olderYear.value * 0.95) {
              dividendStreak++;
            } else {
              break; // Streak broken
            }
          }
          
          // Calculate CAGRs
          const calculateDividendCAGR = (years: number): number | null => {
            if (dividendHistory.length < years + 1) return null;
            const current = dividendHistory[dividendHistory.length - 1].value;
            const past = dividendHistory[dividendHistory.length - 1 - years].value;
            if (past <= 0) return null;
            return (Math.pow(current / past, 1 / years) - 1) * 100;
          };
          
          // Store dividend metrics
          dividendMetrics = {
            currentDividendPerShare: dividendHistory[dividendHistory.length - 1]?.value || 0,
            currentPayoutRatio, // Use TTM-based calculation
            dividendStreak,
            dividendCAGR3Y: calculateDividendCAGR(3),
            dividendCAGR5Y: calculateDividendCAGR(5),
            dividendCAGR10Y: calculateDividendCAGR(10)
          };
          
          console.log(`✅ Dividend data fetched for ${standardizedTicker}:`, {
            years: dividendHistory.length,
            currentDPS: dividendMetrics.currentDividendPerShare,
            streak: dividendStreak,
            cagr3y: dividendMetrics.dividendCAGR3Y,
            cagr5y: dividendMetrics.dividendCAGR5Y,
            cagr10y: dividendMetrics.dividendCAGR10Y
          });
        }
      } else {
        console.log(`No dividend data available for ${standardizedTicker}`);
      }
    } catch (error) {
      console.warn('Error fetching dividend data:', error);
    }

    return {
      // Rendite-Kennzahlen
      eps,
      roe,
      netMargin,
      operatingMargin,
      roa,
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
      
      // Dividend metrics
      dividendMetrics,
      
      // WACC for ROIC analysis (already in percentage from calculateWACC)
      wacc: wacc
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
