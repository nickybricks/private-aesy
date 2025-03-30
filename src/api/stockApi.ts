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
import { mockStockInfo, mockBuffettCriteria, mockFinancialMetrics, mockOverallRating } from './mockData';

// Konfigurationsoption für Mock-Daten
const USE_MOCK_DATA = true; // Auf false setzen, um wieder echte API-Aufrufe zu verwenden

// Financial Modeling Prep API Key
// Sie müssen diesen API-Key durch Ihre eigene ersetzen
// Registrieren Sie sich unter https://financialmodelingprep.com/developer/docs/ für einen kostenlosen API-Key
const getApiKey = () => {
  // Zuerst aus localStorage versuchen zu laden
  const savedApiKey = localStorage.getItem('fmp_api_key');
  if (savedApiKey) {
    return savedApiKey;
  }
  // Fallback auf einen Beispiel-Key (wird wahrscheinlich nicht funktionieren)
  return 'demo';
};

const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Hilfsfunktion, um API-Anfragen zu machen
const fetchFromFMP = async (endpoint: string, params = {}) => {
  if (USE_MOCK_DATA) {
    console.log(`Using mock data for endpoint: ${endpoint}`);
    return Promise.resolve([]); // Dummy return - wird nicht wirklich verwendet, wenn Mock-Daten aktiv sind
  }
  
  try {
    const apiKey = getApiKey();
    
    // Überprüfen, ob ein API-Schlüssel gesetzt ist
    if (!apiKey || apiKey === 'demo') {
      throw new Error('API-Key ist nicht konfiguriert. Bitte geben Sie Ihren Financial Modeling Prep API-Key ein.');
    }
    
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
      throw new Error(`API-Key ist ungültig. Bitte registrieren Sie sich für einen kostenlosen Schlüssel unter financialmodelingprep.com.`);
    }
    throw new Error(`Fehler beim Abrufen von Daten. Bitte überprüfen Sie Ihren API-Key oder versuchen Sie es später erneut.`);
  }
};

// Funktion, um Aktieninformationen zu holen
export const fetchStockInfo = async (ticker: string) => {
  console.log(`Fetching stock info for ${ticker}`);
  
  // Standardisieren des Tickers für die API
  const standardizedTicker = ticker.trim().toUpperCase();
  
  // Mock-Daten verwenden, wenn aktiviert
  if (USE_MOCK_DATA) {
    console.log('Using mock stock info data');
    
    // Überprüfen, ob wir Mock-Daten für diesen Ticker haben
    if (mockStockInfo[standardizedTicker]) {
      return mockStockInfo[standardizedTicker];
    } else {
      // Fallback auf Apple-Daten, wenn der angeforderte Ticker nicht in den Mock-Daten vorhanden ist
      console.log(`No mock data for ${standardizedTicker}, using AAPL data instead`);
      return {
        ...mockStockInfo['AAPL'],
        name: `Mock ${standardizedTicker}`,
        ticker: standardizedTicker
      };
    }
  }
  
  // Echter API-Aufruf, wenn Mock-Daten deaktiviert sind
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
  
  // Mock-Daten verwenden, wenn aktiviert
  if (USE_MOCK_DATA) {
    console.log('Using mock Buffett criteria data');
    
    // Überprüfen, ob wir Mock-Daten für diesen Ticker haben
    if (mockBuffettCriteria[standardizedTicker]) {
      return mockBuffettCriteria[standardizedTicker];
    } else {
      // Fallback auf Apple-Daten, wenn der angeforderte Ticker nicht in den Mock-Daten vorhanden ist
      console.log(`No mock data for ${standardizedTicker}, using AAPL data instead`);
      const appleCriteria = mockBuffettCriteria['AAPL'];
      
      // Kopie erstellen und Unternehmensnamen anpassen
      const mockCriteria = JSON.parse(JSON.stringify(appleCriteria));
      const mockCompanyName = `Mock ${standardizedTicker}`;
      
      // Firmenname in allen relevanten Feldern ersetzen
      for (const criterion of Object.values(mockCriteria)) {
        if (criterion.description) {
          criterion.description = criterion.description.replace('Apple Inc.', mockCompanyName);
        }
      }
      
      return mockCriteria;
    }
  }
  
  // Echter API-Aufruf, wenn Mock-Daten deaktiviert sind
  // ... keep existing code (from the original analyzeBuffettCriteria function) ...
};

// Funktion, um Finanzkennzahlen zu holen
export const getFinancialMetrics = async (ticker: string) => {
  console.log(`Getting financial metrics for ${ticker}`);
  
  // Standardisieren des Tickers für die API
  const standardizedTicker = ticker.trim().toUpperCase();
  
  // Mock-Daten verwenden, wenn aktiviert
  if (USE_MOCK_DATA) {
    console.log('Using mock financial metrics data');
    
    // Überprüfen, ob wir Mock-Daten für diesen Ticker haben
    if (mockFinancialMetrics[standardizedTicker]) {
      return mockFinancialMetrics[standardizedTicker];
    } else {
      // Fallback auf Apple-Daten, wenn der angeforderte Ticker nicht in den Mock-Daten vorhanden ist
      console.log(`No mock data for ${standardizedTicker}, using AAPL data instead`);
      return mockFinancialMetrics['AAPL'];
    }
  }
  
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
  
  // Standardisieren des Tickers für die API
  const standardizedTicker = ticker.trim().toUpperCase();
  
  // Mock-Daten verwenden, wenn aktiviert
  if (USE_MOCK_DATA) {
    console.log('Using mock overall rating data');
    
    // Überprüfen, ob wir Mock-Daten für diesen Ticker haben
    if (mockOverallRating[standardizedTicker]) {
      return mockOverallRating[standardizedTicker];
    } else {
      // Fallback auf Apple-Daten, wenn der angeforderte Ticker nicht in den Mock-Daten vorhanden ist
      console.log(`No mock data for ${standardizedTicker}, using AAPL data instead`);
      const appleRating = mockOverallRating['AAPL'];
      
      // Kopie erstellen und anpassen, wenn nötig
      return JSON.parse(JSON.stringify(appleRating));
    }
  }
  
  try {
    const criteria = await analyzeBuffettCriteria(ticker);
    
    // Zählen, wie viele Kriterien erfüllt sind
    const criteriaStatuses = [
      criteria.businessModel.status,
      criteria.economicMoat.status,
      criteria.financialMetrics.status,
      criteria.financialStability.status,
      criteria.management.status,
      criteria.valuation.status,
      criteria.longTermOutlook.status
    ];
    
    const passCount = criteriaStatuses.filter(status => status === 'pass').length;
    const warningCount = criteriaStatuses.filter(status => status === 'warning').length;
    
    let overall;
    let summary;
    
    if (passCount >= 5) {
      overall = 'buy';
      summary = 'Nach Warren Buffetts Kriterien eine vielversprechende Investition.';
    } else if (passCount >= 3 || (passCount >= 2 && warningCount >= 3)) {
      overall = 'watch';
      summary = 'Einige Buffett-Kriterien erfüllt, aber weitere Recherche nötig.';
    } else {
      overall = 'avoid';
      summary = 'Entspricht nicht ausreichend den Buffett-Kriterien für eine Investition.';
    }
    
    // Stärken und Schwächen identifizieren
    const strengths = [];
    const weaknesses = [];
    
    if (criteria.businessModel.status === 'pass') {
      strengths.push('Klares, verständliches Geschäftsmodell');
    } else if (criteria.businessModel.status === 'fail') {
      weaknesses.push('Komplexes oder schwer verständliches Geschäftsmodell');
    }
    
    if (criteria.economicMoat.status === 'pass') {
      strengths.push('Starker wirtschaftlicher Burggraben (Moat)');
    } else if (criteria.economicMoat.status === 'fail') {
      weaknesses.push('Kein erkennbarer wirtschaftlicher Burggraben');
    }
    
    if (criteria.financialMetrics.status === 'pass') {
      strengths.push('Hervorragende Finanzkennzahlen (ROE, Nettomarge)');
    } else if (criteria.financialMetrics.status === 'fail') {
      weaknesses.push('Schwache Finanzkennzahlen');
    }
    
    if (criteria.financialStability.status === 'pass') {
      strengths.push('Solide finanzielle Stabilität mit geringer Verschuldung');
    } else if (criteria.financialStability.status === 'fail') {
      weaknesses.push('Bedenken hinsichtlich finanzieller Stabilität oder hoher Verschuldung');
    }
    
    if (criteria.valuation.status === 'pass') {
      strengths.push('Attraktive Bewertung (KGV und Dividendenrendite)');
    } else if (criteria.valuation.status === 'fail') {
      weaknesses.push('Hohe Bewertung im Verhältnis zu den fundamentalen Daten');
    }
    
    if (criteria.longTermOutlook.status === 'pass') {
      strengths.push('Vielversprechende langfristige Perspektiven');
    }
    
    // Allgemeine Empfehlung basierend auf der Gesamtbewertung
    let recommendation;
    if (overall === 'buy') {
      recommendation = 'Diese Aktie erfüllt viele von Buffetts Kriterien und könnte eine gute langfristige Investition sein. Wie immer sollten Sie Ihre eigene Due Diligence durchführen und Ihr Portfolio diversifizieren.';
    } else if (overall === 'watch') {
      recommendation = 'Behalten Sie diese Aktie auf Ihrer Beobachtungsliste. Die Aktie erfüllt einige, aber nicht alle Buffett-Kriterien. Warten Sie möglicherweise auf einen besseren Einstiegspunkt oder vertiefen Sie Ihre Recherche.';
    } else {
      recommendation = 'Diese Aktie entspricht nicht ausreichend Buffetts Investitionskriterien. Es könnte besser sein, nach anderen Investitionsmöglichkeiten zu suchen, die mehr von Buffetts Prinzipien erfüllen.';
    }
    
    return {
      overall,
      summary,
      strengths,
      weaknesses,
      recommendation
    };
  } catch (error) {
    console.error('Error generating overall rating:', error);
    throw error;
  }
};
