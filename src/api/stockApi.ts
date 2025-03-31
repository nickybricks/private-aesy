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

// Financial Modeling Prep API Key - Fest im Code eingebaut
const FMP_API_KEY = 'uxE1jVMvI8QQen0a4AEpLFTaqf3KQO0y';

// Funktion, um den API-Key zu erhalten
const getApiKey = () => {
  return FMP_API_KEY;
};

const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Hilfsfunktion, um API-Anfragen zu machen
const fetchFromFMP = async (endpoint: string, params = {}) => {
  try {
    const apiKey = getApiKey();
    
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      params: {
        apikey: apiKey,
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
export const analyzeBuffettCriteria = async (ticker: string) => {
  console.log(`Analyzing ${ticker} with Buffett criteria`);
  
  // Standardisieren des Tickers für die API
  const standardizedTicker = ticker.trim().toUpperCase();
  
  // Verschiedene Finanzdaten abrufen
  const [ratios, keyMetrics, profile, incomeStatements, balanceSheets] = await Promise.all([
    fetchFromFMP(`/ratios/${standardizedTicker}`),
    fetchFromFMP(`/key-metrics/${standardizedTicker}`),
    fetchFromFMP(`/profile/${standardizedTicker}`),
    fetchFromFMP(`/income-statement/${standardizedTicker}`),
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
  const businessModelMaxScore = 3;
  
  // GPT-basierte Analyse des Geschäftsmodells
  let businessModelGptAnalysis = null;
  if (hasOpenAiApiKey()) {
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
          businessModelScore = 3; // Full score for simple business models
        } else if (businessModelGptAnalysis.toLowerCase().includes('moderat') || 
                  businessModelGptAnalysis.toLowerCase().includes('teilweise')) {
          businessModelStatus = 'warning';
          businessModelScore = 2; // Moderate score for moderately complex models
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
  
  // Economic Moat scoring
  let economicMoatScore = 0;
  const economicMoatMaxScore = 9; // 3 points each for gross margin, operating margin, ROIC
  
  // Gross Margin scoring (0-3 points)
  if (grossMargin > 40) economicMoatScore += 3;
  else if (grossMargin > 30) economicMoatScore += 2;
  else if (grossMargin > 20) economicMoatScore += 1;
  
  // Operating Margin scoring (0-3 points)
  if (operatingMargin > 20) economicMoatScore += 3;
  else if (operatingMargin > 15) economicMoatScore += 2;
  else if (operatingMargin > 10) economicMoatScore += 1;
  
  // ROIC scoring (0-3 points)
  if (roic > 15) economicMoatScore += 3;
  else if (roic > 10) economicMoatScore += 2;
  else if (roic > 7) economicMoatScore += 1;
  
  // Economic Moat status based on score
  let economicMoatStatus = 'fail';
  if (economicMoatScore >= 7) {
    economicMoatStatus = 'pass';
  } else if (economicMoatScore >= 4) {
    economicMoatStatus = 'warning';
  }
  
  // GPT-basierte Analyse des wirtschaftlichen Burggrabens
  let economicMoatGptAnalysis = null;
  if (hasOpenAiApiKey()) {
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
  
  // Financial Metrics scoring
  let financialMetricsScore = 0;
  const financialMetricsMaxScore = 9; // 3 points each for ROE, net margin, EPS growth
  
  // ROE scoring (0-3 points)
  if (roe > 15) financialMetricsScore += 3;
  else if (roe > 10) financialMetricsScore += 2;
  else if (roe > 7) financialMetricsScore += 1;
  
  // Net Margin scoring (0-3 points)
  if (netMargin > 10) financialMetricsScore += 3;
  else if (netMargin > 5) financialMetricsScore += 2;
  else if (netMargin > 3) financialMetricsScore += 1;
  
  // EPS Growth (simplified calculation)
  let epsGrowth = 0;
  if (incomeStatements && incomeStatements.length > 3) {
    const current = safeValue(incomeStatements[0].eps) || 0;
    const past = safeValue(incomeStatements[3].eps) || 0;
    
    if (past > 0) {
      epsGrowth = ((current - past) / past) * 100;
    }
  }
  
  // EPS Growth scoring (0-3 points)
  if (epsGrowth > 15) financialMetricsScore += 3;
  else if (epsGrowth > 10) financialMetricsScore += 2;
  else if (epsGrowth > 5) financialMetricsScore += 1;
  
  // Financial Metrics status based on score
  let financialMetricsStatus = 'fail';
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
  
  // Financial Stability scoring
  let financialStabilityScore = 0;
  const financialStabilityMaxScore = 9; // 3 points each for debt-to-assets, interest coverage, current ratio
  
  // Debt to Assets scoring (0-3 points)
  if (debtToAssets < 30) financialStabilityScore += 3;
  else if (debtToAssets < 50) financialStabilityScore += 2;
  else if (debtToAssets < 70) financialStabilityScore += 1;
  
  // Interest Coverage scoring (0-3 points)
  if (interestCoverage > 7) financialStabilityScore += 3;
  else if (interestCoverage > 5) financialStabilityScore += 2;
  else if (interestCoverage > 3) financialStabilityScore += 1;
  
  // Current Ratio scoring (0-3 points)
  if (currentRatio > 2) financialStabilityScore += 3;
  else if (currentRatio > 1.5) financialStabilityScore += 2;
  else if (currentRatio > 1) financialStabilityScore += 1;
  
  // Financial Stability status based on score
  let financialStabilityStatus = 'fail';
  if (financialStabilityScore >= 7) {
    financialStabilityStatus = 'pass';
  } else if (financialStabilityScore >= 4) {
    financialStabilityStatus = 'warning';
  }
  
  // Management Qualität - FIXED LOGIC
  let managementStatus = 'warning'; // Default is warning until proven otherwise
  let managementScore = 1; // Default moderate score
  const managementMaxScore = 3;
  
  // GPT-basierte Analyse der Managementqualität
  let managementGptAnalysis = null;
  if (hasOpenAiApiKey()) {
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
          managementScore = 3;
        } else if (managementGptAnalysis.toLowerCase().includes('gut') || 
                  managementGptAnalysis.toLowerCase().includes('solide') || 
                  managementGptAnalysis.toLowerCase().includes('effektiv')) {
          managementStatus = 'warning';
          managementScore = 2;
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
  
  // Kurs zu Buchwert Berechnung
  let priceToBook = safeValue(latestRatios.priceToBookRatio);
  
  // Kurs zu Cashflow Berechnung
  let priceToCashFlow = safeValue(latestRatios.priceCashFlowRatio);
  
  // Valuation scoring
  let valuationScore = 0;
  const valuationMaxScore = 12; // 3 points each for PE, dividend yield, P/B, P/CF
  
  // Adjust the thresholds based on moat status
  const hasStrongMoat = economicMoatStatus === 'pass';
  
  // PE scoring (0-3 points)
  if (pe < 15) valuationScore += 3;
  else if (pe < 20 || (hasStrongMoat && pe < 25)) valuationScore += 2;
  else if (pe < 25 || (hasStrongMoat && pe < 30)) valuationScore += 1;
  
  // Dividend Yield scoring (0-3 points)
  if (dividendYield > 3) valuationScore += 3;
  else if (dividendYield > 2) valuationScore += 2;
  else if (dividendYield > 1) valuationScore += 1;
  
  // P/B scoring (0-3 points) with explanations
  if (priceToBook < 1.5) valuationScore += 3; // Unter 1,5 gilt als günstig
  else if (priceToBook < 3 || (hasStrongMoat && priceToBook < 4)) valuationScore += 2; // 1,5-3,0 als akzeptabel bei starkem Moat
  else if (priceToBook < 5 && hasStrongMoat) valuationScore += 1; // Höhere Werte nur mit starkem Moat akzeptabel
  
  // P/CF scoring (0-3 points) with explanations
  if (priceToCashFlow < 10) valuationScore += 3; // Unter 10 gilt als günstig
  else if (priceToCashFlow < 15 || (hasStrongMoat && priceToCashFlow < 20)) valuationScore += 2; // 10-20 als fair bewertet
  else if (priceToCashFlow < 25 && hasStrongMoat) valuationScore += 1; // Höhere Werte nur mit starkem Moat akzeptabel
  
  // Valuation status based on score
  let valuationStatus = 'fail';
  if (valuationScore >= 9) {
    valuationStatus = 'pass';
  } else if (valuationScore >= 5) {
    valuationStatus = 'warning';
  }
  
  // Langfristiger Horizont
  const sector = companyProfile.sector || 'Unbekannt';
  
  // Long-term Outlook scoring
  let longTermScore = 0;
  const longTermMaxScore = 3;
  
  // Sector-based initial scoring
  const stableSectors = [
    'Consumer Defensive', 'Healthcare', 'Utilities', 
    'Financial Services', 'Technology', 'Communication Services'
  ];
  
  if (stableSectors.includes(sector)) {
    longTermScore = 2; // Start with 2 points for stable sectors
  } else {
    longTermScore = 1; // Start with 1 point for other sectors
  }
  
  // GPT-basierte Analyse der langfristigen Perspektiven
  let longTermGptAnalysis = null;
  if (hasOpenAiApiKey()) {
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
      longTermScore = Math.min(longTermScore + 1, 3);
    } else if (longTermGptAnalysis.toLowerCase().includes('risik') || 
               longTermGptAnalysis.toLowerCase().includes('bedenken') || 
               longTermGptAnalysis.toLowerCase().includes('problem')) {
      longTermScore = Math.max(longTermScore - 1, 0);
    }
    
    // Check for regulatory risks
    if (longTermGptAnalysis.toLowerCase().includes('regulat') || 
        longTermGptAnalysis.toLowerCase().includes('politik') || 
        longTermGptAnalysis.toLowerCase().includes('gesetz')) {
      longTermScore = Math.max(longTermScore - 1, 0);
    }
  }
  
  let longTermStatus = 'warning';
  if (longTermScore >= 2) {
    longTermStatus = 'pass';
  } else if (longTermScore <= 0) {
    longTermStatus = 'fail';
  }
  
  // GPT-basierte Analyse des rationalen Verhaltens
  let rationalBehaviorGptAnalysis = null;
  if (hasOpenAiApiKey()) {
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
  let rationalBehaviorScore = 1; // Default to midpoint
  const rationalBehaviorMaxScore = 3;
  let rationalBehaviorStatus = 'warning'; // Default to warning
  
  if (rationalBehaviorGptAnalysis) {
    if (rationalBehaviorGptAnalysis.toLowerCase().includes('rational') || 
        rationalBehaviorGptAnalysis.toLowerCase().includes('disziplinier') || 
        rationalBehaviorGptAnalysis.toLowerCase().includes('effizient')) {
      rationalBehaviorScore = 3;
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
  if (hasOpenAiApiKey()) {
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
  let cyclicalBehaviorScore = 1; // Default to midpoint
  const cyclicalBehaviorMaxScore = 3;
  let cyclicalBehaviorStatus = 'warning'; // Default to warning
  
  if (cyclicalBehaviorGptAnalysis) {
    if (cyclicalBehaviorGptAnalysis.toLowerCase().includes('antizyklisch') || 
        cyclicalBehaviorGptAnalysis.toLowerCase().includes('nutzt schwäche') || 
        cyclicalBehaviorGptAnalysis.toLowerCase().includes('opportun')) {
      cyclicalBehaviorScore = 3;
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
  if (hasOpenAiApiKey()) {
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
  let oneTimeEffectsScore = 1; // Default to midpoint
  const oneTimeEffectsMaxScore = 3;
  let oneTimeEffectsStatus = 'warning'; // Default to warning
  
  if (oneTimeEffectsGptAnalysis) {
    if (oneTimeEffectsGptAnalysis.toLowerCase().includes('nachhaltig') || 
        oneTimeEffectsGptAnalysis.toLowerCase().includes('keine einmaleffekte') || 
        oneTimeEffectsGptAnalysis.toLowerCase().includes('kontinuierlich')) {
      oneTimeEffectsScore = 3;
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
  if (hasOpenAiApiKey()) {
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
  let turnaroundScore = 1; // Default to midpoint
  const turnaroundMaxScore = 3;
  let turnaroundStatus = 'warning'; // Default to warning
  
  if (turnaroundGptAnalysis) {
    // Check for turnaround indicators
    const turnaroundKeywords = ['turnaround', 'umstrukturierung', 'restrukturierung', 'sanierung', 'neuausrichtung'];
    const hasTurnaroundIndication = turnaroundKeywords.some(keyword => 
      turnaroundGptAnalysis.toLowerCase().includes(keyword)
    );
    
    // FIXED: Reversed logic - no turnaround should be positive in Buffett's view
    if (hasTurnaroundIndication) {
      // This is negative in Buffett's view
      turnaroundScore = 0;
      turnaroundStatus = 'fail';
    } else if (turnaroundGptAnalysis.toLowerCase().includes('kein turnaround') || 
               turnaroundGptAnalysis.toLowerCase().includes('etabliert') || 
               turnaroundGptAnalysis.toLowerCase().includes('stabil')) {
      // This is positive in Buffett's view - giving full points for stable companies
      turnaroundScore = 3;
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
        `Gründungsjahr: ${companyProfile.ipoDate ? new Date(companyProfile.ipoDate).getFullYear() : 'N/A'}`,
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
        `Nettomarge: ${netMargin.toFixed(2)}% (Buffett bevorzugt >10%)`,
        `EPS-Wachstum (3 Jahre): ${epsGrowth.toFixed(2)}% (Buffett bevorzugt >10%)`,
        `Gewinn pro Aktie: ${latestIncomeStatement && latestIncomeStatement.eps ? Number(latestIncomeStatement.eps).toFixed(2) + ' ' + companyProfile.currency : 'N/A'} ${companyProfile.currency || 'USD'}`
      ],
      score: financialMetricsScore,
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
      score: financialStabilityScore,
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
      score: valuationScore,
      maxScore: valuationMaxScore
    },
    longTermOutlook: {
      status: longTermStatus,
      title: '7. Langfristiger Horizont',
      description: `${companyProfile.companyName} operiert in einer Branche mit ${longTermStatus === 'pass' ? 'guten' : longTermStatus === 'warning' ? 'moderaten' : 'unsicheren'} langfristigen Aussichten.`,
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
      fetchFromFMP(`/ratios/${standardizedTicker}?limit=5`),
      fetchFromFMP(`/key-metrics/${standardizedTicker}?limit=5`),
      fetchFromFMP(`/income-statement/${standardizedTicker}?limit=10`),
      fetchFromFMP(`/balance-sheet-statement/${standardizedTicker}?limit=5`),
      fetchFromFMP(`/cash-flow-statement/${standardizedTicker}?limit=5`),
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
    const quoteData = quote && quote.length > 0 ? quote[0] : null;
    
    console.log('Neueste Income Statement Daten:', JSON.stringify(latestIncomeStatement, null, 2));
    console.log('Neueste Balance Sheet Daten:', JSON.stringify(latestBalanceSheet, null, 2));
    console.log('Neueste Key Metrics Daten:', JSON.stringify(latestMetrics, null, 2));
    console.log('Neueste Ratios Daten:', JSON.stringify(latestRatios, null, 2));
    
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
      roe = safeValue(latestRatios.returnOnEquity);
      console.log('ROE aus Ratios:', roe);
    }
    
    // 2. Eigene Berechnung aus Nettogewinn und Eigenkapital
    if ((roe === null || roe === 0) && latestIncomeStatement && latestBalanceSheet &&
        latestIncomeStatement.netIncome !== undefined && 
        latestBalanceSheet.totalStockholdersEquity !== undefined && 
        latestBalanceSheet.totalStockholdersEquity > 0) {
      roe = safeValue(latestIncomeStatement.netIncome / latestBalanceSheet.totalStockholdersEquity);
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
    
    // ROIC (Return on Invested Capital) Berechnung - verbessert
    let roic = null;
    
    // 1. Direkt aus Metrics (vorberechneter Wert)
    if (latestMetrics && latestMetrics.roic !== undefined) {
      roic = safeValue(latestMetrics.roic);
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
          roic = nopat / investedCapital;
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
    
    // Zinsdeckungsgrad Berechnung - verbessert
    let interestCoverage = null;
    
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

    // Weitere Finanzkennzahlen könnten hier berechnet werden

    return {
      // Rendite-Kennzahlen
      eps,
      roe,
      netMargin,
      roic,
      
      // Schulden-Kennzahlen
      debtToAssets,
      interestCoverage,
      
      // Weitere Kennzahlen können hinzugefügt werden...
    };
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    throw error;
  }
};

// Hilfsfunktion zur Berechnung einer Gesamtbewertung
export const getOverallRating = async (ticker: string) => {
  // Diese Funktion soll eine Gesamtbewertung der Aktie liefern
  // Basierend auf den Ergebnissen der analyzeBuffettCriteria-Funktion
  
  try {
    const criteria = await analyzeBuffettCriteria(ticker);
    
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
    
    // Enhanced Margin of Safety calculation with "Best Buy Price"
    let marginOfSafety = {
      value: 0,
      status: 'fail' as 'pass' | 'warning' | 'fail'
    };
    
    let bestBuyPrice = 0;
    const currentPrice = criteria.valuation && criteria.valuation.details && criteria.valuation.details.length > 0 ? 
      parseFloat(criteria.valuation.details[0].split(":")[1]) : 0;
    
    if (criteria.valuation.status === 'pass') {
      marginOfSafety = {
        value: 25,
        status: 'pass'
      };
      bestBuyPrice = currentPrice * 1.1; // Can pay 10% more
    } else if (criteria.valuation.status === 'warning') {
      marginOfSafety = {
        value: 10,
        status: 'warning'
      };
      // Current price is acceptable
      bestBuyPrice = currentPrice;
    } else {
      // If clearly overvalued (fail), recommend a 20% discount
      marginOfSafety = {
        value: -15,
        status: 'fail'
      };
      bestBuyPrice = currentPrice * 0.8; // Need 20% discount
    }
    
    // Make a more concrete recommendation
    let recommendation;
    if (overall === 'buy') {
      recommendation = `${criteria.businessModel.description.split(' ist tätig')[0]} erfüllt zahlreiche Buffett-Kriterien mit einer Bewertung von ${finalBuffettScore}% auf dem Buffett-Score.
      
Stärken:
- ${strengths.slice(0, 3).join('\n- ')}

Das Unternehmen zeigt einen starken wirtschaftlichen Burggraben, solide Finanzen und eine angemessene Bewertung. Die aktuelle Margin of Safety beträgt ${marginOfSafety.value.toFixed(1)}%.

Fazit: ${isBusinessModelComplex ? 'Trotz des etwas komplexeren Geschäftsmodells' : 'Mit seinem verständlichen Geschäftsmodell'} stellt ${criteria.businessModel.description.split(' ist tätig')[0]} eine attraktive langfristige Investition dar, die Buffetts Prinzipien entspricht.`;
    } else if (overall === 'watch') {
      recommendation = `${criteria.businessModel.description.split(' ist tätig')[0]} erreicht ${finalBuffettScore}% auf dem Buffett-Score, was für eine Beobachtungsposition spricht.
      
${hasGoodMoat ? '✓ Überzeugender wirtschaftlicher Burggraben vorhanden' : '× Kein überzeugender wirtschaftlicher Burggraben'}
${isFinanciallyStable ? '✓ Solide finanzielle Situation' : '× Bedenken bezüglich der finanziellen Stabilität'}
${isOvervalued ? '× Aktuell überbewertet' : '× Nicht attraktiv genug bewertet'}

Empfohlener Kaufpreis: ${bestBuyPrice.toFixed(2)} € (aktuell: Margin of Safety ${marginOfSafety.value.toFixed(1)}%)

Fazit: Behalten Sie die Aktie auf Ihrer Beobachtungsliste und erwägen Sie einen Einstieg bei günstigeren Kursen.`;
    } else {
      recommendation = `${criteria.businessModel.description.split(' ist tätig')[0]} erfüllt nicht ausreichend Buffetts Investitionskriterien (${finalBuffettScore}% Buffett-Score).
      
Hauptgründe:
${isOvervalued ? '- Die aktuelle Bewertung ist deutlich zu hoch (Margin of Safety: ' + marginOfSafety.value.toFixed(1) + '%)' : ''}
${!hasGoodMoat ? '- Kein überzeugender wirtschaftlicher Burggraben erkennbar' : ''}
${!isFinanciallyStable ? '- Bedenken bezüglich der finanziellen Stabilität' : ''}
${isBusinessModelComplex ? '- Das Geschäftsmodell ist komplex und schwer verständlich' : ''}

Fazit: Es könnte besser sein, nach anderen Investitionsmöglichkeiten zu suchen, die mehr von Buffetts Prinzipien erfüllen. Wenn Sie dennoch investieren möchten, wäre ein Einstiegspreis von ${bestBuyPrice.toFixed(2)} € angemessener (aktuell: ${currentPrice} €).`;
    }
    
    return {
      overall,
      summary,
      strengths,
      weaknesses,
      recommendation,
      buffettScore: finalBuffettScore,
      marginOfSafety,
      bestBuyPrice: overall !== 'buy' ? bestBuyPrice : undefined
    };
  } catch (error) {
    console.error('Error generating overall rating:', error);
    throw error;
  }
};
