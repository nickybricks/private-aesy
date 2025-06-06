
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
      eps: []
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

    // Calculate additional metrics needed for analysis
    let epsGrowth = null;
    let debtToEbitda = null;
    let currentRatio = null;
    let quickRatio = null;
    let marginOfSafety = null;

    // EPS Growth calculation from historical data
    if (historicalData.eps.length >= 2) {
      const currentEps = historicalData.eps[0].value;
      const previousEps = historicalData.eps[1].value;
      if (currentEps && previousEps && previousEps !== 0) {
        epsGrowth = ((currentEps - previousEps) / Math.abs(previousEps)) * 100;
      }
    }

    // Debt to EBITDA calculation
    if (latestIncomeStatement && latestBalanceSheet) {
      const ebitda = latestIncomeStatement.ebitda;
      let totalDebt = 0;
      
      if (latestBalanceSheet.totalDebt !== undefined) {
        totalDebt = latestBalanceSheet.totalDebt;
      } else {
        totalDebt = (latestBalanceSheet.shortTermDebt || 0) + (latestBalanceSheet.longTermDebt || 0);
      }
      
      if (ebitda && ebitda > 0 && totalDebt > 0) {
        debtToEbitda = totalDebt / ebitda;
      }
    }

    // Current Ratio calculation
    if (latestBalanceSheet && latestBalanceSheet.totalCurrentAssets && latestBalanceSheet.totalCurrentLiabilities) {
      if (latestBalanceSheet.totalCurrentLiabilities > 0) {
        currentRatio = latestBalanceSheet.totalCurrentAssets / latestBalanceSheet.totalCurrentLiabilities;
      }
    }

    // Quick Ratio calculation
    if (latestBalanceSheet) {
      const quickAssets = (latestBalanceSheet.cashAndCashEquivalents || 0) + 
                         (latestBalanceSheet.shortTermInvestments || 0) + 
                         (latestBalanceSheet.netReceivables || 0);
      const currentLiabilities = latestBalanceSheet.totalCurrentLiabilities;
      
      if (currentLiabilities && currentLiabilities > 0) {
        quickRatio = quickAssets / currentLiabilities;
      }
    }

    // Margin of Safety placeholder - would need DCF calculation
    marginOfSafety = 0; // Default value, should be calculated with DCF

    return {
      // Rendite-Kennzahlen
      eps,
      roe,
      netMargin,
      roic,
      
      // Schulden-Kennzahlen
      debtToAssets,
      interestCoverage,
      
      // Additional metrics for Buffett analysis
      epsGrowth,
      debtToEbitda,
      currentRatio,
      quickRatio,
      marginOfSafety,
      
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
      if ('financialScore' in criterion && 'maxScore' in criterion && 
          criterion.financialScore !== undefined && criterion.maxScore !== undefined) {
        detailedTotalScore += criterion.financialScore;
        detailedMaxScore += criterion.maxScore;
        hasDetailedScores = true;
      } else if ('score' in criterion && 'maxScore' in criterion && 
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

export const analyzeBuffettCriteria = async (ticker: string) => {
  try {
    const metrics = await getFinancialMetrics(ticker);

    console.log('=== BUFFETT CRITERIA ANALYSIS START ===');
    console.log('Ticker:', ticker);
    console.log('Raw metrics:', metrics);

    // Calculate financial metrics scores for criteria 3, 4, 6
    let financialMetricsScore: number = 0;
    let financialStabilityScore: number = 0;
    let valuationScore: number = 0;

    // CRITERION 3: Financial Metrics (10 Jahre Rückblick)
    // KORRIGIERT: Verwende 3.33 + 3.33 + 3.34 = 10.00 Punkteverteilung
    console.log('=== KRITERIUM 3: FINANZKENNZAHLEN BERECHNUNG ===');
    
    if (metrics?.roe !== undefined && metrics?.roe !== null) {
      const roeValue = Number(metrics.roe);
      if (!isNaN(roeValue)) {
        console.log(`ROE: ${roeValue}%`);
        if (roeValue >= 15) {
          financialMetricsScore += 3.33; // Exzellent
          console.log('ROE >= 15%: +3.33 Punkte');
        } else if (roeValue >= 10) {
          financialMetricsScore += 2; // Akzeptabel
          console.log('ROE >= 10%: +2 Punkte');
        } else if (roeValue >= 5) {
          financialMetricsScore += 1; // Schwach
          console.log('ROE >= 5%: +1 Punkt');
        }
      }
    }

    // Use netMargin instead of netProfitMargin
    if (metrics?.netMargin !== undefined && metrics?.netMargin !== null) {
      const netMarginValue = Number(metrics.netMargin);
      if (!isNaN(netMarginValue)) {
        console.log(`Nettomarge: ${netMarginValue}%`);
        if (netMarginValue >= 15) {
          financialMetricsScore += 3.33; // Exzellent
          console.log('Nettomarge >= 15%: +3.33 Punkte');
        } else if (netMarginValue >= 10) {
          financialMetricsScore += 2; // Akzeptabel
          console.log('Nettomarge >= 10%: +2 Punkte');
        } else if (netMarginValue >= 5) {
          financialMetricsScore += 1; // Schwach
          console.log('Nettomarge >= 5%: +1 Punkt');
        }
      }
    }

    if (metrics?.epsGrowth !== undefined && metrics?.epsGrowth !== null) {
      const epsGrowthValue = Number(metrics.epsGrowth);
      if (!isNaN(epsGrowthValue)) {
        console.log(`EPS-Wachstum: ${epsGrowthValue}%`);
        if (epsGrowthValue >= 10) {
          financialMetricsScore += 3.34; // Exzellent (3.34 um auf 10 zu kommen)
          console.log('EPS-Wachstum >= 10%: +3.34 Punkte');
        } else if (epsGrowthValue >= 5) {
          financialMetricsScore += 2; // Akzeptabel
          console.log('EPS-Wachstum >= 5%: +2 Punkte');
        } else if (epsGrowthValue >= 0) {
          financialMetricsScore += 1; // Schwaches Wachstum
          console.log('EPS-Wachstum >= 0%: +1 Punkt');
        }
      }
    }

    // Runde auf 2 Dezimalstellen für saubere Anzeige
    financialMetricsScore = Math.round(financialMetricsScore * 100) / 100;
    console.log(`KRITERIUM 3 FINALSCORE: ${financialMetricsScore}/10`);

    // CRITERION 4: Financial Stability
    console.log('=== KRITERIUM 4: FINANZIELLE STABILITÄT BERECHNUNG ===');
    
    if (metrics?.debtToEbitda !== undefined && metrics?.debtToEbitda !== null) {
      const debtToEbitdaValue = Number(metrics.debtToEbitda);
      if (!isNaN(debtToEbitdaValue)) {
        console.log(`Debt-to-EBITDA: ${debtToEbitdaValue}`);
        if (debtToEbitdaValue < 2) {
          financialStabilityScore += 3.33; // Sehr gut
          console.log('Debt-to-EBITDA < 2: +3.33 Punkte');
        } else if (debtToEbitdaValue <= 3) {
          financialStabilityScore += 1.67; // Okay
          console.log('Debt-to-EBITDA <= 3: +1.67 Punkte');
        }
      }
    }

    if (metrics?.currentRatio !== undefined && metrics?.currentRatio !== null) {
      const currentRatioValue = Number(metrics.currentRatio);
      if (!isNaN(currentRatioValue)) {
        console.log(`Current Ratio: ${currentRatioValue}`);
        if (currentRatioValue > 1.5) {
          financialStabilityScore += 3.33; // Gut
          console.log('Current Ratio > 1.5: +3.33 Punkte');
        } else if (currentRatioValue >= 1) {
          financialStabilityScore += 1.67; // Okay
          console.log('Current Ratio >= 1: +1.67 Punkte');
        }
      }
    }

    if (metrics?.quickRatio !== undefined && metrics?.quickRatio !== null) {
      const quickRatioValue = Number(metrics.quickRatio);
      if (!isNaN(quickRatioValue)) {
        console.log(`Quick Ratio: ${quickRatioValue}`);
        if (quickRatioValue > 1) {
          financialStabilityScore += 3.34; // Gut (3.34 um auf 10 zu kommen)
          console.log('Quick Ratio > 1: +3.34 Punkte');
        } else if (quickRatioValue >= 0.8) {
          financialStabilityScore += 1.67; // Okay
          console.log('Quick Ratio >= 0.8: +1.67 Punkte');
        }
      }
    }

    financialStabilityScore = Math.round(financialStabilityScore * 100) / 100;
    console.log(`KRITERIUM 4 FINALSCORE: ${financialStabilityScore}/10`);

    // CRITERION 6: Valuation (from DCF/Margin of Safety)
    console.log('=== KRITERIUM 6: BEWERTUNG BERECHNUNG ===');
    
    if (metrics?.marginOfSafety !== undefined && metrics?.marginOfSafety !== null) {
      const marginOfSafetyValue = Number(metrics.marginOfSafety);
      if (!isNaN(marginOfSafetyValue)) {
        console.log(`Margin of Safety: ${marginOfSafetyValue}%`);
        if (marginOfSafetyValue >= 30) {
          valuationScore = 10; // Exzellent
          console.log('Margin of Safety >= 30%: 10 Punkte');
        } else if (marginOfSafetyValue >= 20) {
          valuationScore = 8; // Sehr gut
          console.log('Margin of Safety >= 20%: 8 Punkte');
        } else if (marginOfSafetyValue >= 10) {
          valuationScore = 6; // Gut
          console.log('Margin of Safety >= 10%: 6 Punkte');
        } else if (marginOfSafetyValue >= 0) {
          valuationScore = 4; // Akzeptabel
          console.log('Margin of Safety >= 0%: 4 Punkte');
        } else {
          valuationScore = 0; // Überbewertet
          console.log('Margin of Safety < 0%: 0 Punkte');
        }
      }
    }

    console.log(`KRITERIUM 6 FINALSCORE: ${valuationScore}/10`);

    // Set maxScore always to 10 for all criteria
    const financialMetricsMaxScore = 10;
    const financialStabilityMaxScore = 10;
    const valuationMaxScore = 10;

    console.log('=== FINAL SCORES SUMMARY ===');
    console.log(`Kriterium 3 (Finanzkennzahlen): ${financialMetricsScore}/${financialMetricsMaxScore}`);
    console.log(`Kriterium 4 (Finanzielle Stabilität): ${financialStabilityScore}/${financialStabilityMaxScore}`);
    console.log(`Kriterium 6 (Bewertung): ${valuationScore}/${valuationMaxScore}`);

    // Generate descriptions and details for financial criteria
    const financialMetricsDetails = [
      metrics?.roe ? `ROE: ${metrics.roe.toFixed(1)}%` : 'ROE: Nicht verfügbar',
      metrics?.netMargin ? `Nettomarge: ${metrics.netMargin.toFixed(1)}%` : 'Nettomarge: Nicht verfügbar',
      metrics?.epsGrowth ? `EPS-Wachstum: ${metrics.epsGrowth.toFixed(1)}%` : 'EPS-Wachstum: Nicht verfügbar',
      metrics?.eps ? `EPS: ${metrics.eps.toFixed(2)} ${metrics.reportedCurrency || 'USD'}` : 'EPS: Nicht verfügbar'
    ];

    const financialStabilityDetails = [
      metrics?.debtToEbitda ? `Verschuldung/EBITDA: ${metrics.debtToEbitda.toFixed(1)}` : 'Verschuldung/EBITDA: Nicht verfügbar',
      metrics?.currentRatio ? `Current Ratio: ${metrics.currentRatio.toFixed(2)}` : 'Current Ratio: Nicht verfügbar',
      metrics?.quickRatio ? `Quick Ratio: ${metrics.quickRatio.toFixed(2)}` : 'Quick Ratio: Nicht verfügbar'
    ];

    const valuationDetails = [
      metrics?.marginOfSafety ? `Sicherheitsmarge: ${metrics.marginOfSafety.toFixed(1)}%` : 'Sicherheitsmarge: Nicht verfügbar',
      'Intrinsischer Wert: Nicht verfügbar'
    ];

    // Status calculation based on scores
    const getStatus = (score: number): 'pass' | 'warning' | 'fail' => {
      if (score >= 8) return 'pass';
      if (score >= 5) return 'warning';
      return 'fail';
    };

    return {
      businessModel: {
        title: "1. Verständliches Geschäftsmodell",
        status: "warning" as const,
        description: "Das Geschäftsmodell sollte einfach und verständlich sein",
        details: [
          "Klares und nachhaltiges Geschäftsmodell",
          "Vorhersagbare Einnahmequellen",
          "Verständliche Produkte und Dienstleistungen"
        ],
        maxScore: 10
      },
      economicMoat: {
        title: "2. Wirtschaftlicher Burggraben (Moat)",
        status: "warning" as const,
        description: "Nachhaltige Wettbewerbsvorteile des Unternehmens",
        details: [
          "Markenbekanntheit und Kundentreue",
          "Hohe Wechselkosten für Kunden", 
          "Netzwerkeffekte oder Skalenvorteile"
        ],
        maxScore: 10
      },
      financialMetrics: {
        title: "3. Finanzkennzahlen (10 Jahre)",
        status: getStatus(financialMetricsScore),
        description: "Konsistent starke finanzielle Performance über 10 Jahre",
        details: financialMetricsDetails,
        financialScore: financialMetricsScore,
        maxScore: financialMetricsMaxScore
      },
      financialStability: {
        title: "4. Finanzielle Stabilität & Verschuldung",
        status: getStatus(financialStabilityScore),
        description: "Solide Bilanz mit angemessener Verschuldung",
        details: financialStabilityDetails,
        financialScore: financialStabilityScore,
        maxScore: financialStabilityMaxScore
      },
      management: {
        title: "5. Qualität des Managements",
        status: "warning" as const,
        description: "Kompetente und vertrauenswürdige Unternehmensführung",
        details: [
          "Langfristige Denkweise des Managements",
          "Transparente Kommunikation mit Aktionären",
          "Vernünftige Vergütungsstrukturen"
        ],
        maxScore: 10
      },
      valuation: {
        title: "6. Bewertung (nicht zu teuer kaufen)",
        status: getStatus(valuationScore),
        description: "Attraktive Bewertung mit ausreichender Sicherheitsmarge",
        details: valuationDetails,
        financialScore: valuationScore,
        maxScore: valuationMaxScore
      },
      longTermOutlook: {
        title: "7. Langfristiger Horizont",
        status: "warning" as const,
        description: "Fokus auf langfristige Wertsteigerung",
        details: [
          "Nachhaltiges Geschäftsmodell",
          "Reinvestition in das Geschäft",
          "Langfristige Wachstumsperspektiven"
        ],
        maxScore: 10
      },
      rationalBehavior: {
        title: "8. Rationalität & Disziplin",
        status: "warning" as const,
        description: "Rationale Entscheidungsfindung ohne Emotionen",
        details: [
          "Disziplinierte Kapitalallokation",
          "Keine impulsiven Entscheidungen",
          "Fokus auf fundamentale Bewertung"
        ],
        maxScore: 10
      },
      cyclicalBehavior: {
        title: "9. Antizyklisches Verhalten",
        status: "warning" as const,
        description: "Kaufen wenn andere verkaufen",
        details: [
          "Investieren bei niedrigen Bewertungen",
          "Geduld bei Marktvolatilität",
          "Langfristige Perspektive beibehalten"
        ],
        maxScore: 10
      },
      oneTimeEffects: {
        title: "10. Vergangenheit ≠ Zukunft",
        status: "warning" as const,
        description: "Fokus auf zukünftige Ertragskraft",
        details: [
          "Nachhaltige vs. einmalige Erträge unterscheiden",
          "Zukünftige Wachstumschancen bewerten",
          "Risiken und Unsicherheiten berücksichtigen"
        ],
        maxScore: 10
      },
      turnaround: {
        title: "11. Keine Turnarounds",
        status: "warning" as const,
        description: "Investition in bereits erfolgreiche Unternehmen",
        details: [
          "Keine spekulativen Sanierungsfälle",
          "Bewährte Geschäftsmodelle bevorzugen",
          "Stabile Marktposition"
        ],
        maxScore: 10
      }
    };

  } catch (error) {
    console.error('Error analyzing Buffett criteria:', error);
    throw error;
  }
};
