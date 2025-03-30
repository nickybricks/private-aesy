import axios from 'axios';

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
  
  let financialStabilityStatus = 'fail';
  if (debtToAssets < 50 && interestCoverage > 5 && currentRatio > 1.5) {
    financialStabilityStatus = 'pass';
  } else if (debtToAssets < 70 && interestCoverage > 3 && currentRatio > 1) {
    financialStabilityStatus = 'warning';
  }
  
  // Management Qualität (vereinfacht)
  const managementStatus = 'warning';
  
  // Verbesserte KGV Berechnung
  let pe = safeValue(latestRatios.priceEarningsRatio);
  
  // Verbesserte Dividendenrendite Berechnung
  let dividendYield = safeValue(latestRatios.dividendYield) * 100;
  
  let valuationStatus = 'fail';
  if (pe < 15 && dividendYield > 2) {
    valuationStatus = 'pass';
  } else if (pe < 25 && dividendYield > 1) {
    valuationStatus = 'warning';
  }
  
  // Langfristiger Horizont
  const sector = companyProfile.sector || 'Unbekannt';
  
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
      title: 'Geschäftsmodell verstehen',
      description: `${companyProfile.companyName} ist tätig im Bereich ${companyProfile.industry || 'Unbekannt'}.`,
      details: [
        `Hauptgeschäftsbereich: ${companyProfile.industry || 'Unbekannt'}`,
        `Sektor: ${sector}`,
        `Gründungsjahr: ${companyProfile.ipoDate ? new Date(companyProfile.ipoDate).getFullYear() : 'N/A'}`,
        `Beschreibung: ${companyProfile.description ? companyProfile.description.substring(0, 200) + '...' : 'Keine Beschreibung verfügbar'}`
      ]
    },
    economicMoat: {
      status: economicMoatStatus,
      title: 'Wirtschaftlicher Burggraben (Moat)',
      description: `${companyProfile.companyName} zeigt ${economicMoatStatus === 'pass' ? 'starke' : economicMoatStatus === 'warning' ? 'moderate' : 'schwache'} Anzeichen eines wirtschaftlichen Burggrabens.`,
      details: [
        `Bruttomarge: ${grossMargin.toFixed(2)}% (Buffett bevorzugt >40%)`,
        `Operative Marge: ${operatingMargin.toFixed(2)}% (Buffett bevorzugt >20%)`,
        `ROIC: ${roic.toFixed(2)}% (Buffett bevorzugt >15%)`,
        `Marktposition: ${companyProfile.isActivelyTrading ? 'Aktiv am Markt' : 'Eingeschränkte Marktpräsenz'}`
      ]
    },
    financialMetrics: {
      status: financialMetricsStatus,
      title: 'Finanzkennzahlen',
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
      title: 'Finanzielle Stabilität',
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
      title: 'Qualität des Managements',
      description: 'Die Qualität des Managements erfordert weitere Recherche.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie Insider-Beteiligungen, Kapitalallokation und Kommunikation',
        `CEO: ${companyProfile.ceo || 'Keine Informationen verfügbar'}`,
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ]
    },
    valuation: {
      status: valuationStatus,
      title: 'Bewertung',
      description: `${companyProfile.companyName} ist aktuell ${valuationStatus === 'pass' ? 'angemessen' : valuationStatus === 'warning' ? 'moderat' : 'hoch'} bewertet.`,
      details: [
        `KGV (P/E): ${pe.toFixed(2)} (Buffett bevorzugt <15)`,
        `Dividendenrendite: ${dividendYield.toFixed(2)}% (Buffett bevorzugt >2%)`,
        `Kurs zu Buchwert: ${safeValue(latestRatios.priceToBookRatio).toFixed(2)} (niedriger ist besser)`,
        `Kurs zu Cashflow: ${safeValue(latestRatios.priceCashFlowRatio).toFixed(2)} (niedriger ist besser)`
      ]
    },
    longTermOutlook: {
      status: longTermStatus,
      title: 'Langfristiger Horizont',
      description: `${companyProfile.companyName} operiert in einer Branche mit ${longTermStatus === 'pass' ? 'guten' : 'moderaten'} langfristigen Aussichten.`,
      details: [
        `Branche: ${companyProfile.industry || 'Unbekannt'}`,
        `Sektor: ${sector}`,
        `Börsennotiert seit: ${companyProfile.ipoDate ? new Date(companyProfile.ipoDate).toLocaleDateString() : 'N/A'}`,
        'Eine tiefere Analyse der langfristigen Branchentrends wird empfohlen'
      ]
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
      
      const interestExpense = latestIncomeStatement.interestExpense !== undefined ?
                            Math.abs(latestIncomeStatement.interestExpense) : null;
      
      if (ebit !== null && interestExpense !== null && interestExpense > 0) {
        interestCoverage = ebit / interestExpense;
        console.log('Zinsdeckungsgrad berechnet aus EBIT/Zinsaufwand:', interestCoverage);
      }
    }
    
    // Current Ratio Berechnung - verbessert
    let currentRatio = null;
    
    // 1. Direkt aus Ratios (vorberechneter Wert)
    if (latestRatios && latestRatios.currentRatio !== undefined) {
      currentRatio = safeValue(latestRatios.currentRatio);
      console.log('Current Ratio aus Ratios:', currentRatio);
    }
    
    // 2. Eigene Berechnung aus Umlaufvermögen und kurzfristigen Verbindlichkeiten
    if ((currentRatio === null || currentRatio === 0) && latestBalanceSheet) {
      const currentAssets = latestBalanceSheet.totalCurrentAssets;
      const currentLiabilities = latestBalanceSheet.totalCurrentLiabilities;
      
      if (currentAssets !== undefined && currentLiabilities !== undefined && currentLiabilities > 0) {
        currentRatio = currentAssets / currentLiabilities;
        console.log('Current Ratio berechnet aus Umlaufvermögen/Kurzfristige Verbindlichkeiten:', currentRatio);
      }
    }
    
    // P/E Ratio (KGV) Berechnung - verbessert
    let pe = null;
    
    // 1. Direkt aus Ratios (vorberechneter Wert)
    if (latestRatios && latestRatios.priceEarningsRatio !== undefined) {
      pe = safeValue(latestRatios.priceEarningsRatio);
      console.log('KGV aus Ratios:', pe);
    }
    
    // 2. Berechnung aus aktuellem Kurs und EPS
    if ((pe === null || pe === 0) && quoteData && quoteData.price !== undefined && eps !== null && eps > 0) {
      pe = quoteData.price / eps;
      console.log('KGV berechnet aus Preis/EPS:', pe);
    }
    
    // Dividendenrendite Berechnung - verbessert
    let dividendYield = null;
    
    // 1. Direkt aus Ratios (vorberechneter Wert)
    if (latestRatios && latestRatios.dividendYield !== undefined) {
      dividendYield = safeValue(latestRatios.dividendYield);
      console.log('Dividendenrendite aus Ratios:', dividendYield);
    }
    
    // 2. Berechnung aus aktueller Dividende und Kurs
    if ((dividendYield === null || dividendYield === 0) && quoteData) {
      if (quoteData.lastAnnualDividend !== undefined && quoteData.price !== undefined && quoteData.price > 0) {
        dividendYield = quoteData.lastAnnualDividend / quoteData.price;
        console.log('Dividendenrendite berechnet aus Dividende/Preis:', dividendYield);
      }
    }
    
    // Umsatzwachstum 5J Berechnung - verbessert
    let revenueGrowth5Y = null;
    
    // 1. Direkt aus Metrics (vorberechneter Wert)
    if (latestMetrics && latestMetrics.revenueGrowth5Y !== undefined) {
      revenueGrowth5Y = safeValue(latestMetrics.revenueGrowth5Y);
      console.log('Umsatzwachstum 5J aus Key Metrics:', revenueGrowth5Y);
    }
    
    // 2. Eigene Berechnung aus historischen Umsatzdaten (wenn genügend Daten vorhanden sind)
    if ((revenueGrowth5Y === null || revenueGrowth5Y === 0) && incomeStatements && incomeStatements.length >= 5) {
      const currentRevenue = incomeStatements[0].revenue;
      const fiveYearsAgoRevenue = incomeStatements[4].revenue;
      
      if (currentRevenue !== undefined && fiveYearsAgoRevenue !== undefined && fiveYearsAgoRevenue > 0) {
        // CAGR Formel: (Endwert/Anfangswert)^(1/Jahre) - 1
        revenueGrowth5Y = Math.pow(currentRevenue / fiveYearsAgoRevenue, 1/5) - 1;
        console.log('Umsatzwachstum 5J berechnet aus historischen Daten:', revenueGrowth5Y);
      }
    }
    
    // Hilfsfunktion zum Formatieren und Bewerten der Metriken
    const formatMetric = (value: any, isPercentage = false) => {
      if (value === null) return 'N/A';
      
      if (isPercentage) {
        return `${(value * 100).toFixed(2)}%`;
      } else {
        return value.toFixed(2);
      }
    };
    
    // Metriken basierend auf den verbesserten Berechnungen erstellen
    const metrics = [
      {
        name: 'Return on Equity (ROE)',
        value: formatMetric(roe, true),
        formula: 'Jahresgewinn / Eigenkapital',
        explanation: 'Zeigt, wie effizient das Unternehmen das Eigenkapital einsetzt.',
        threshold: '>15%',
        status: roe !== null ? (roe > 0.15 ? 'pass' : roe > 0.10 ? 'warning' : 'fail') : 'fail'
      },
      {
        name: 'Nettomarge',
        value: formatMetric(netMargin, true),
        formula: 'Nettogewinn / Umsatz',
        explanation: 'Gibt an, wie viel vom Umsatz als Gewinn übrig bleibt.',
        threshold: '>10%',
        status: netMargin !== null ? (netMargin > 0.10 ? 'pass' : netMargin > 0.05 ? 'warning' : 'fail') : 'fail'
      },
      {
        name: 'ROIC',
        value: formatMetric(roic, true),
        formula: 'NOPAT / (Eigenkapital + langfristige Schulden)',
        explanation: 'Zeigt, wie effizient das investierte Kapital eingesetzt wird.',
        threshold: '>10%',
        status: roic !== null ? (roic > 0.10 ? 'pass' : roic > 0.07 ? 'warning' : 'fail') : 'fail'
      },
      {
        name: 'Schuldenquote',
        value: formatMetric(debtToAssets, true),
        formula: 'Gesamtschulden / Gesamtvermögen',
        explanation: 'Gibt an, wie stark das Unternehmen fremdfinanziert ist.',
        threshold: '<70%',
        status: debtToAssets !== null ? (debtToAssets < 0.50 ? 'pass' : debtToAssets < 0.70 ? 'warning' : 'fail') : 'fail'
      },
      {
        name: 'Zinsdeckungsgrad',
        value: formatMetric(interestCoverage),
        formula: 'EBIT / Zinsaufwand',
        explanation: 'Zeigt, wie oft die Zinsen aus dem Gewinn bezahlt werden können.',
        threshold: '>5',
        status: interestCoverage !== null ? (interestCoverage > 5 ? 'pass' : interestCoverage > 3 ? 'warning' : 'fail') : 'fail'
      },
      {
        name: 'Current Ratio',
        value: formatMetric(currentRatio),
        formula: 'Umlaufvermögen / Kurzfristige Verbindlichkeiten',
        explanation: 'Misst die kurzfristige Liquidität des Unternehmens.',
        threshold: '>1',
        status: currentRatio !== null ? (currentRatio > 1.5 ? 'pass' : currentRatio > 1 ? 'warning' : 'fail') : 'fail'
      },
      {
        name: 'KGV',
        value: formatMetric(pe),
        formula: 'Aktienkurs / Gewinn pro Aktie',
        explanation: 'Gibt an, wie hoch die Aktie im Verhältnis zum Gewinn bewertet ist.',
        threshold: '<25 (für Wachstumsunternehmen)',
        status: pe !== null ? (pe < 15 ? 'pass' : pe < 25 ? 'warning' : 'fail') : 'fail'
      },
      {
        name: 'Dividendenrendite',
        value: formatMetric(dividendYield, true),
        formula: 'Jahresdividende / Aktienkurs',
        explanation: 'Zeigt, wie viel Dividendenertrag im Verhältnis zum Aktienkurs ausgezahlt wird.',
        threshold: '>2%',
        status: dividendYield !== null ? (dividendYield > 0.02 ? 'pass' : dividendYield > 0.01 ? 'warning' : 'fail') : 'fail'
      },
      {
        name: 'Gewinn pro Aktie',
        value: eps !== null ? `${eps.toFixed(2)} USD` : 'N/A',
        formula: 'Nettogewinn / Anzahl ausstehender Aktien',
        explanation: 'Zeigt den Gewinn, der pro Aktie erwirtschaftet wurde.',
        threshold: '>0 (steigend)',
        status: eps !== null ? (eps > 2 ? 'pass' : eps > 0 ? 'warning' : 'fail') : 'fail'
      },
      {
        name: 'Umsatzwachstum (5J)',
        value: formatMetric(revenueGrowth5Y, true),
        formula: '(Aktueller Umsatz / Umsatz vor 5 Jahren)^(1/5) - 1',
        explanation: 'Durchschnittliches jährliches Umsatzwachstum über die letzten 5 Jahre.',
        threshold: '>5%',
        status: revenueGrowth5Y !== null ? (revenueGrowth5Y > 0.10 ? 'pass' : revenueGrowth5Y > 0.05 ? 'warning' : 'fail') : 'fail'
      }
    ];
    
    // Historische Einkommensdaten für Chart abrufen (10 Jahre)
    const historicalIncomeStatements = incomeStatements || [];
    
    // Historische EPS-Daten direkt aus den Einkommensberichten extrahieren
    const processHistoricalData = () => {
      // Arrays für die verschiedenen Datenreihen initialisieren
      const revenue = [];
      const earnings = [];
      const epsData = [];
      
      // Durch die Einkommensberichte iterieren und Daten extrahieren
      for (const statement of historicalIncomeStatements) {
        if (statement) {
          const year = statement.date ? statement.date.substring(0, 4) : 'N/A';
          
          // Umsatzdaten
          if (statement.revenue !== undefined && statement.revenue !== null) {
            revenue.push({
              year,
              value: Number(statement.revenue) / 1000000 // In Millionen umrechnen
            });
          }
          
          // Gewinn-Daten
          if (statement.netIncome !== undefined && statement.netIncome !== null) {
            earnings.push({
              year,
              value: Number(statement.netIncome) / 1000000 // In Millionen umrechnen
            });
          }
          
          // EPS-Daten - direkt aus dem Income Statement
          if (statement.eps !== undefined && statement.eps !== null && Number(statement.eps) !== 0) {
            epsData.push({
              year,
              value: Number(statement.eps)
            });
          } 
          // Alternativ EPS berechnen, wenn NetIncome und SharesOutstanding verfügbar sind
          else if (statement.netIncome !== undefined && statement.netIncome !== null && 
                  statement.weightedAverageShsOut !== undefined && statement.weightedAverageShsOut !== null && 
                  statement.weightedAverageShsOut > 0) {
            epsData.push({
              year,
              value: Number(statement.netIncome) / Number(statement.weightedAverageShsOut)
            });
          }
        }
      }
      
      return {
        revenue,
        earnings,
        eps: epsData
      };
    };
    
    // Historische Daten verarbeiten
    const historicalDataFormatted = processHistoricalData();
    
    // Daten nach Jahr sortieren (neueste zuletzt)
    const sortByYear = (a, b) => a.year.localeCompare(b.year);
    historicalDataFormatted.revenue.sort(sortByYear);
    historicalDataFormatted.earnings.sort(sortByYear);
    historicalDataFormatted.eps.sort(sortByYear);

    return {
      metrics,
      historicalData: historicalDataFormatted
    };
  } catch (error) {
    console.error('Error getting financial metrics:', error);
    throw error;
  }
};

// Funktion, um Gesamtbewertung zu erstellen
export const getOverallRating = async (ticker: string) => {
  console.log(`Getting overall rating for ${ticker}`);
  
  // Standardisieren des Tickers für die API
  const standardizedTicker = ticker.trim().toUpperCase();
  
  // Wir benötigen bereits analysierte Buffett-Kriterien
  const buffettCriteria = await analyzeBuffettCriteria(standardizedTicker);
  
  // Zählen der verschiedenen Status
  let passCount = 0;
  let warningCount = 0;
  let failCount = 0;
  
  Object.values(buffettCriteria).forEach((criterion: any) => {
    if (criterion.status === 'pass') passCount++;
    else if (criterion.status === 'warning') warningCount++;
    else if (criterion.status === 'fail') failCount++;
  });
  
  // Bestimmen der Gesamtbewertung
  let overall;
  if (passCount >= 5 && failCount === 0) {
    overall = 'buy';
  } else if (passCount >= 3 && failCount <= 1) {
    overall = 'watch';
  } else {
    overall = 'avoid';
  }
  
  // Extrahieren von Stärken und Schwächen
  const strengths = [];
  const weaknesses = [];
  
  Object.entries(buffettCriteria).forEach(([key, criterion]: [string, any]) => {
    const criterionName = criterion.title;
    
    if (criterion.status === 'pass') {
      strengths.push(`${criterionName}: ${criterion.description}`);
    } else if (criterion.status === 'fail') {
      weaknesses.push(`${criterionName}: ${criterion.description}`);
    } else if (key === 'valuation' && criterion.status === 'warning') {
      // Bewertung ist oft ein wichtiger Schwachpunkt bei sonst guten Unternehmen
      weaknesses.push(`${criterionName}: ${criterion.description}`);
    }
  });
  
  // Spezifische Empfehlung basierend auf Gesamtbewertung
  let recommendation;
  let summary;
  
  if (overall === 'buy') {
    summary = `${standardizedTicker} erfüllt die meisten von Buffetts Kriterien und ist zu einem angemessenen Preis bewertet.`;
    recommendation = `${standardizedTicker} erscheint nach Buffetts Kriterien als solide Investition mit guter Qualität und angemessener Bewertung. Langfristig orientierte Anleger können einen Kauf in Betracht ziehen.`;
  } else if (overall === 'watch') {
    summary = `${standardizedTicker} zeigt einige positive Eigenschaften, aber entweder die Bewertung oder bestimmte fundamentale Aspekte entsprechen nicht vollständig Buffetts Kriterien.`;
    recommendation = `${standardizedTicker} sollte auf die Beobachtungsliste gesetzt werden. Ein Kauf könnte bei einer besseren Bewertung oder verbesserten Fundamentaldaten in Betracht gezogen werden.`;
  } else {
    summary = `${standardizedTicker} entspricht nicht ausreichend Buffetts Investitionskriterien, insbesondere in Bezug auf Qualität oder Bewertung.`;
    recommendation = `Nach Buffetts konservativen Anlagekriterien erscheint ${standardizedTicker} nicht als attraktive Investition. Anleger sollten nach Alternativen mit besserem Qualitäts-Preis-Verhältnis suchen.`;
  }
  
  return {
    overall,
    summary,
    strengths: strengths.length > 0 ? strengths : [`${standardizedTicker} zeigt einige positive Aspekte, die jedoch nicht stark genug für eine Buffett-Investition sind.`],
    weaknesses: weaknesses.length > 0 ? weaknesses : [`${standardizedTicker} hat mehrere Schwächen nach Buffetts Kriterien, besonders in Bezug auf Qualität und Bewertung.`],
    recommendation
  };
};
