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
  
  // Business Model Analyse
  const businessModelStatus = companyProfile.description && companyProfile.description.length > 100 ? 'pass' : 'warning';
  
  // GPT-basierte Analyse des Geschäftsmodells
  let businessModelGptAnalysis = null;
  if (hasOpenAiApiKey()) {
    try {
      businessModelGptAnalysis = await analyzeBusinessModel(
        companyProfile.companyName, 
        companyProfile.industry || 'Unbekannt', 
        companyProfile.description || 'Keine Beschreibung verfügbar'
      );
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
  
  let economicMoatStatus = 'fail';
  if (grossMargin > 40 && operatingMargin > 20 && roic > 15) {
    economicMoatStatus = 'pass';
  } else if (grossMargin > 30 && operatingMargin > 15 && roic > 10) {
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
  
  let financialMetricsStatus = 'fail';
  if (roe > 15 && netMargin > 10) {
    financialMetricsStatus = 'pass';
  } else if (roe > 10 && netMargin > 5) {
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
  
  // Finanzielle Stabilität bewerten
  let financialStabilityStatus = 'fail';
  if (debtToAssets < 50 && interestCoverage > 5 && currentRatio > 1.5) {
    financialStabilityStatus = 'pass';
  } else if (debtToAssets < 70 && interestCoverage > 3 && currentRatio > 1) {
    financialStabilityStatus = 'warning';
  }
  
  // Management Qualität (vereinfacht)
  const managementStatus = 'warning';
  
  // GPT-basierte Analyse der Managementqualität
  let managementGptAnalysis = null;
  if (hasOpenAiApiKey()) {
    try {
      managementGptAnalysis = await analyzeManagementQuality(
        companyProfile.companyName,
        companyProfile.ceo || 'Unbekannt'
      );
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
  
  // Bewertung basierend auf KGV und Dividendenrendite
  let valuationStatus = 'fail';
  
  // Wenn ein starker wirtschaftlicher Burggraben vorliegt, können höhere Bewertungen akzeptiert werden
  const hasStrongMoat = economicMoatStatus === 'pass';
  
  if (pe < 15 && dividendYield > 2 && priceToBook < 1.5 && priceToCashFlow < 10) {
    valuationStatus = 'pass';
  } else if ((pe < 25 && dividendYield > 1) || 
            (hasStrongMoat && pe < 30 && (priceToBook < 3 || priceToCashFlow < 20))) {
    valuationStatus = 'warning';
  }
  
  // Langfristiger Horizont
  const sector = companyProfile.sector || 'Unbekannt';
  
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
  
  // Vereinfachte Bewertung basierend auf Branche
  const stableSectors = [
    'Consumer Defensive', 'Healthcare', 'Utilities', 
    'Financial Services', 'Technology', 'Communication Services'
  ];
  
  const longTermStatus = stableSectors.includes(sector) ? 'pass' : 'warning';
  
  // Erstellen des Analyseobjekts mit verbesserten Kennzahlen
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
      gptAnalysis: businessModelGptAnalysis
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
      gptAnalysis: economicMoatGptAnalysis
    },
    financialMetrics: {
      status: financialMetricsStatus,
      title: '3. Finanzkennzahlen (10 Jahre Rückblick)',
      description: `Die Finanzkennzahlen von ${companyProfile.companyName} sind ${financialMetricsStatus === 'pass' ? 'stark' : financialMetricsStatus === 'warning' ? 'moderat' : 'schwach'}.`,
      details: [
        `Eigenkapitalrendite (ROE): ${roe.toFixed(2)}% (Buffett bevorzugt >15%)`,
        `Nettomarge: ${netMargin.toFixed(2)}% (Buffett bevorzugt >10%)`,
        `Gewinn pro Aktie: ${latestIncomeStatement && latestIncomeStatement.eps ? Number(latestIncomeStatement.eps).toFixed(2) + ' ' + companyProfile.currency : 'N/A'} ${companyProfile.currency || 'USD'}`,
        `Umsatz pro Aktie: ${safeValue(latestMetrics.revenuePerShare).toFixed(2)} ${companyProfile.currency || 'USD'}`
      ]
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
      ]
    },
    management: {
      status: managementStatus,
      title: '5. Qualität des Managements',
      description: 'Die Qualität des Managements erfordert weitere Recherche.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie Insider-Beteiligungen, Kapitalallokation und Kommunikation',
        `CEO: ${companyProfile.ceo || 'Keine Informationen verfügbar'}`,
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: managementGptAnalysis
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
      ]
    },
    longTermOutlook: {
      status: longTermStatus,
      title: '7. Langfristiger Horizont',
      description: `${companyProfile.companyName} operiert in einer Branche mit ${longTermStatus === 'pass' ? 'guten' : 'moderaten'} langfristigen Aussichten.`,
      details: [
        `Branche: ${companyProfile.industry || 'Unbekannt'}`,
        `Sektor: ${sector}`,
        `Börsennotiert seit: ${companyProfile.ipoDate ? new Date(companyProfile.ipoDate).toLocaleDateString() : 'N/A'}`,
        'Eine tiefere Analyse der langfristigen Branchentrends wird empfohlen'
      ],
      gptAnalysis: longTermGptAnalysis
    },
    rationalBehavior: {
      status: 'warning', // Vereinfachte Standardbewertung
      title: '8. Rationalität & Disziplin',
      description: 'Rationalität und Disziplin erfordern tiefere Analyse.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie Kapitalallokation, Akquisitionen und Ausgaben',
        'Analysieren Sie, ob das Management bewusst und diszipliniert handelt',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: rationalBehaviorGptAnalysis
    },
    cyclicalBehavior: {
      status: 'warning', // Vereinfachte Standardbewertung
      title: '9. Antizyklisches Verhalten',
      description: 'Antizyklisches Verhalten erfordert tiefere Analyse.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie das Verhalten in Marktkrisen',
        'Analysieren Sie, ob das Unternehmen kauft, wenn andere verkaufen',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: cyclicalBehaviorGptAnalysis
    },
    oneTimeEffects: {
      status: 'warning', // Vereinfachte Standardbewertung
      title: '10. Vergangenheit ≠ Zukunft',
      description: 'Die Nachhaltigkeit des Erfolgs erfordert tiefere Analyse.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie einmalige Ereignisse, die Ergebnisse beeinflusst haben',
        'Analysieren Sie, ob das Wachstum organisch oder durch Übernahmen getrieben ist',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: oneTimeEffectsGptAnalysis
    },
    turnaround: {
      status: 'warning', // Vereinfachte Standardbewertung
      title: '11. Keine Turnarounds',
      description: 'Turnaround-Status erfordert tiefere Analyse.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie Anzeichen für Restrukturierung oder Sanierung',
        'Analysieren Sie, ob das Unternehmen sich in einer Erholungsphase befindet',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: turnaroundGptAnalysis
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
    if (eps === null && incomeStatements && incomeStatements.length > 1) {
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
    
    // Zählen, wie viele Kriterien erfüllt sind und berechnen der Buffett-Kompatibilität
    const allCriteria = [
      criteria.businessModel.status,
      criteria.economicMoat.status,
      criteria.financialMetrics.status,
      criteria.financialStability.status,
      criteria.management.status,
      criteria.valuation.status,
      criteria.longTermOutlook.status,
      criteria.rationalBehavior.status,
      criteria.cyclicalBehavior.status,
      criteria.oneTimeEffects.status,
      criteria.turnaround.status
    ];
    
    // Punkte nach Gewichtung vergeben
    const totalPoints = allCriteria.reduce((acc, status) => {
      if (status === 'pass') return acc + 3;
      if (status === 'warning') return acc + 1;
      return acc;
    }, 0);
    
    const maxPoints = allCriteria.length * 3;
    const buffettScore = Math.round((totalPoints / maxPoints) * 100);
    
    const passCount = allCriteria.filter(status => status === 'pass').length;
    const warningCount = allCriteria.filter(status => status === 'warning').length;
    
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
    
    // Berechnung einer theoretischen Margin of Safety (vereinfacht)
    // Dies ist ein Platzhalter - in der realen Implementierung würde man hier FMP's DCF API verwenden
    let marginOfSafety = {
      value: 0,
      status: 'fail' as 'pass' | 'warning' | 'fail'
    };
    
    if (criteria.valuation.status === 'pass') {
      marginOfSafety = {
        value: 25,
        status: 'pass'
      };
    } else if (criteria.valuation.status === 'warning') {
      marginOfSafety = {
        value: 10,
        status: 'warning'
      };
    } else {
      marginOfSafety = {
        value: -15,
        status: 'fail'
      };
    }
    
    // Allgemeine Empfehlung basierend auf der Gesamtbewertung
    let recommendation;
    if (overall === 'buy') {
      recommendation = `Dieses Unternehmen zeigt einen starken wirtschaftlichen Burggraben, solide Finanzen und eine angemessene Bewertung. Es erfüllt viele von Buffetts Kriterien und könnte eine gute langfristige Investition sein. ${isBusinessModelComplex ? 'Eine tiefere Analyse des Geschäftsmodells wird empfohlen.' : 'Das Geschäftsmodell ist klar verständlich und nachvollziehbar.'}`;
    } else if (overall === 'watch') {
      recommendation = `Dieses Unternehmen zeigt einige Stärken ${hasGoodMoat ? 'wie einen überzeugenden wirtschaftlichen Burggraben' : ''}${isFinanciallyStable ? ' und solide Finanzen' : ''}, ist aber aktuell ${isOvervalued ? 'überbewertet' : 'nicht attraktiv genug bewertet'}. Behalten Sie die Aktie auf Ihrer Beobachtungsliste und warten Sie auf einen besseren Einstiegspunkt.`;
    } else {
      recommendation = `Dieses Unternehmen entspricht nicht ausreichend Buffetts Investitionskriterien${isOvervalued ? ', insbesondere aufgrund der hohen Bewertung' : ''}${!hasGoodMoat ? ', da kein überzeugender wirtschaftlicher Burggraben erkennbar ist' : ''}${!isFinanciallyStable ? ' und es Bedenken bezüglich der finanziellen Stabilität gibt' : ''}. Es könnte besser sein, nach anderen Investitionsmöglichkeiten zu suchen, die mehr von Buffetts Prinzipien erfüllen.`;
    }
    
    return {
      overall,
      summary,
      strengths,
      weaknesses,
      recommendation,
      buffettScore,
      marginOfSafety
    };
  } catch (error) {
    console.error('Error generating overall rating:', error);
    throw error;
  }
};
