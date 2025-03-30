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
    
    // EPS aus verschiedenen Quellen ermitteln, um sicherzustellen, dass wir einen Wert haben
    let eps = null;
    
    // Versuch 1: Aus dem neuesten Einkommensbericht (die direkteste Quelle)
    if (latestIncomeStatement && latestIncomeStatement.eps !== undefined && latestIncomeStatement.eps !== null) {
      eps = Number(latestIncomeStatement.eps);
    } 
    // Versuch 2: Aus den Kennzahlen
    else if (latestMetrics && latestMetrics.eps !== undefined && latestMetrics.eps !== null) {
      eps = Number(latestMetrics.eps);
    }
    // Versuch 3: Aus dem Quote (aktuelle Marktdaten)
    else if (quoteData && quoteData.eps !== undefined && quoteData.eps !== null) {
      eps = Number(quoteData.eps);
    }
    // Versuch 4: Berechnen aus Nettogewinn und Aktienanzahl
    else if (latestIncomeStatement && latestIncomeStatement.netIncome !== undefined && 
             latestIncomeStatement.netIncome !== null && latestIncomeStatement.weightedAverageShsOut !== undefined && 
             latestIncomeStatement.weightedAverageShsOut !== null && latestIncomeStatement.weightedAverageShsOut > 0) {
      eps = latestIncomeStatement.netIncome / latestIncomeStatement.weightedAverageShsOut;
    }
    // Versuch 5: Aus den Verhältnissen
    else if (latestRatios && latestRatios.earningYield !== undefined && latestRatios.earningYield !== null && 
             quoteData && quoteData.price !== undefined && quoteData.price !== null) {
      // EPS = Preis * Ertragsrendite
      eps = quoteData.price * latestRatios.earningYield;
    }
    
    // Wenn immer noch kein EPS gefunden wurde, nach weiteren EPS-Quellen suchen
    if ((eps === null || eps === 0) && ratios.length > 1) {
      // Versuchen, EPS aus früheren Berichten zu bekommen
      for (let i = 1; i < Math.min(ratios.length, 3); i++) {
        if (ratios[i].earningsPerShare && ratios[i].earningsPerShare !== 0) {
          eps = Number(ratios[i].earningsPerShare);
          break;
        }
      }
    }
    
    if ((eps === null || eps === 0) && incomeStatements && incomeStatements.length > 1) {
      // Versuchen, EPS aus früheren Einkommensberichten zu bekommen
      for (let i = 1; i < Math.min(incomeStatements.length, 5); i++) {
        if (incomeStatements[i].eps && incomeStatements[i].eps !== 0) {
          eps = Number(incomeStatements[i].eps);
          break;
        }
      }
    }
    
    // Wenn immer noch kein EPS gefunden wurde, TTM (Trailing Twelve Months) berechnen
    if (eps === null || eps === 0) {
      let ttmNetIncome = 0;
      let hasValidQuarters = false;
      
      // Summiere Nettoeinnahmen der letzten 4 verfügbaren Quartale
      for (let i = 0; i < Math.min(incomeStatements ? incomeStatements.length : 0, 4); i++) {
        if (incomeStatements[i].netIncome !== undefined && incomeStatements[i].netIncome !== null) {
          ttmNetIncome += Number(incomeStatements[i].netIncome);
          hasValidQuarters = true;
        }
      }
      
      // Wenn gültige Quartale gefunden wurden und Aktienanzahl verfügbar ist
      if (hasValidQuarters && latestIncomeStatement && 
          latestIncomeStatement.weightedAverageShsOut !== undefined && 
          latestIncomeStatement.weightedAverageShsOut !== null && 
          latestIncomeStatement.weightedAverageShsOut > 0) {
        eps = ttmNetIncome / latestIncomeStatement.weightedAverageShsOut;
      }
    }
    
    // Verbesserte ROE-Berechnung
    const netIncome = latestIncomeStatement ? latestIncomeStatement.netIncome : 0;
    const shareholderEquity = latestBalanceSheet ? latestBalanceSheet.totalStockholdersEquity : 0;
    let calculatedROE = 0;
    
    if (shareholderEquity && shareholderEquity !== 0 && netIncome) {
      calculatedROE = netIncome / shareholderEquity;
    } else if (latestRatios && latestRatios.returnOnEquity) {
      calculatedROE = latestRatios.returnOnEquity;
    }
    
    // Verbesserte Nettomarge-Berechnung
    const revenue = latestIncomeStatement ? latestIncomeStatement.revenue : 0;
    let calculatedNetMargin = 0;
    
    if (revenue && revenue !== 0 && netIncome) {
      calculatedNetMargin = netIncome / revenue;
    } else if (latestRatios && latestRatios.netProfitMargin) {
      calculatedNetMargin = latestRatios.netProfitMargin;
    }
    
    // Schuldenquote berechnen
    let debtToAssets = 0;
    if (latestRatios && latestRatios.debtToAssets !== undefined && latestRatios.debtToAssets !== null) {
      debtToAssets = latestRatios.debtToAssets;
    } else if (latestBalanceSheet) {
      const totalDebt = (latestBalanceSheet.shortTermDebt || 0) + (latestBalanceSheet.longTermDebt || 0);
      const totalAssets = latestBalanceSheet.totalAssets || 0;
      if (totalAssets && totalAssets > 0) {
        debtToAssets = totalDebt / totalAssets;
      }
    }
    
    // ROIC berechnen
    let roic = 0;
    if (latestMetrics && latestMetrics.roic !== undefined && latestMetrics.roic !== null) {
      roic = latestMetrics.roic;
    } else if (latestIncomeStatement && latestBalanceSheet) {
      const ebit = latestIncomeStatement.ebitda - (latestIncomeStatement.depreciationAndAmortization || 0);
      const investedCapital = (latestBalanceSheet.totalStockholdersEquity || 0) + (latestBalanceSheet.longTermDebt || 0);
      if (investedCapital && investedCapital > 0) {
        roic = (ebit * (1 - 0.25)) / investedCapital; // Annahme: 25% Steuersatz
      }
    }
    
    // Sicherstellen, dass alle erforderlichen Werte existieren
    const safeValue = (value: any) => {
      if (value === undefined || value === null) return 0;
      const numValue = Number(value);
      return isNaN(numValue) ? 0 : numValue;
    };
    
    // Metriken basierend auf den Daten erstellen - mit verbesserten Berechnungen
    const metrics = [
      {
        name: 'Return on Equity (ROE)',
        value: `${(safeValue(calculatedROE) * 100).toFixed(2)}%`,
        formula: 'Jahresgewinn / Eigenkapital',
        explanation: 'Zeigt, wie effizient das Unternehmen das Eigenkapital einsetzt.',
        threshold: '>15%',
        status: safeValue(calculatedROE) * 100 > 15 ? 'pass' : safeValue(calculatedROE) * 100 > 10 ? 'warning' : 'fail'
      },
      {
        name: 'Nettomarge',
        value: `${(safeValue(calculatedNetMargin) * 100).toFixed(2)}%`,
        formula: 'Nettogewinn / Umsatz',
        explanation: 'Gibt an, wie viel vom Umsatz als Gewinn übrig bleibt.',
        threshold: '>10%',
        status: safeValue(calculatedNetMargin) * 100 > 10 ? 'pass' : safeValue(calculatedNetMargin) * 100 > 5 ? 'warning' : 'fail'
      },
      {
        name: 'ROIC',
        value: `${(safeValue(roic) * 100).toFixed(2)}%`,
        formula: 'NOPAT / (Eigenkapital + langfristige Schulden)',
        explanation: 'Zeigt, wie effizient das investierte Kapital eingesetzt wird.',
        threshold: '>10%',
        status: safeValue(roic) * 100 > 10 ? 'pass' : safeValue(roic) * 100 > 7 ? 'warning' : 'fail'
      },
      {
        name: 'Schuldenquote',
        value: `${(safeValue(debtToAssets) * 100).toFixed(2)}%`,
        formula: 'Gesamtschulden / Gesamtvermögen',
        explanation: 'Gibt an, wie stark das Unternehmen fremdfinanziert ist.',
        threshold: '<70%',
        status: safeValue(debtToAssets) * 100 < 50 ? 'pass' : safeValue(debtToAssets) * 100 < 70 ? 'warning' : 'fail'
      },
      {
        name: 'Zinsdeckungsgrad',
        value: safeValue(latestRatios.interestCoverage).toFixed(2),
        formula: 'EBIT / Zinsaufwand',
        explanation: 'Zeigt, wie oft die Zinsen aus dem Gewinn bezahlt werden können.',
        threshold: '>5',
        status: safeValue(latestRatios.interestCoverage) > 5 ? 'pass' : safeValue(latestRatios.interestCoverage) > 3 ? 'warning' : 'fail'
      },
      {
        name: 'Current Ratio',
        value: safeValue(latestRatios.currentRatio).toFixed(2),
        formula: 'Umlaufvermögen / Kurzfristige Verbindlichkeiten',
        explanation: 'Misst die kurzfristige Liquidität des Unternehmens.',
        threshold: '>1',
        status: safeValue(latestRatios.currentRatio) > 1.5 ? 'pass' : safeValue(latestRatios.currentRatio) > 1 ? 'warning' : 'fail'
      },
      {
        name: 'KGV',
        value: safeValue(latestRatios.priceEarningsRatio).toFixed(2),
        formula: 'Aktienkurs / Gewinn pro Aktie',
        explanation: 'Gibt an, wie hoch die Aktie im Verhältnis zum Gewinn bewertet ist.',
        threshold: '<25 (für Wachstumsunternehmen)',
        status: safeValue(latestRatios.priceEarningsRatio) < 15 ? 'pass' : safeValue(latestRatios.priceEarningsRatio) < 25 ? 'warning' : 'fail'
      },
      {
        name: 'Dividendenrendite',
        value: `${(safeValue(latestRatios.dividendYield) * 100).toFixed(2)}%`,
        formula: 'Jahresdividende / Aktienkurs',
        explanation: 'Zeigt, wie viel Dividendenertrag im Verhältnis zum Aktienkurs ausgezahlt wird.',
        threshold: '>2%',
        status: safeValue(latestRatios.dividendYield) * 100 > 2 ? 'pass' : safeValue(latestRatios.dividendYield) * 100 > 1 ? 'warning' : 'fail'
      },
      {
        name: 'Gewinn pro Aktie',
        value: eps !== null && eps !== 0 ? `${eps.toFixed(2)} USD` : 'N/A',
        formula: 'Nettogewinn / Anzahl ausstehender Aktien',
        explanation: 'Zeigt den Gewinn, der pro Aktie erwirtschaftet wurde.',
        threshold: '>0 (steigend)',
        status: safeValue(eps) > 2 ? 'pass' : safeValue(eps) > 0 ? 'warning' : 'fail'
      },
      {
        name: 'Umsatzwachstum (5J)',
        value: latestMetrics && latestMetrics.revenueGrowth5Y ? 
               `${(safeValue(latestMetrics.revenueGrowth5Y) * 100).toFixed(2)}%` : 'N/A',
        formula: '(Aktueller Umsatz / Umsatz vor 5 Jahren)^(1/5) - 1',
        explanation: 'Durchschnittliches jährliches Umsatzwachstum über die letzten 5 Jahre.',
        threshold: '>5%',
        status: latestMetrics && safeValue(latestMetrics.revenueGrowth5Y) * 100 > 10 ? 'pass' : 
                latestMetrics && safeValue(latestMetrics.revenueGrowth5Y) * 100 > 5 ? 'warning' : 'fail'
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
