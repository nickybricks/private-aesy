import axios from 'axios';

// Financial Modeling Prep API Key
// Sie müssen diesen API-Key durch Ihre eigene ersetzen
// Registrieren Sie sich unter https://financialmodelingprep.com/developer/docs/ für einen kostenlosen API-Key
const API_KEY = 'demo'; // Ersetzen Sie dies mit Ihrem eigenen API-Key
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Hilfsfunktion, um API-Anfragen zu machen
const fetchFromFMP = async (endpoint: string, params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      params: {
        apikey: API_KEY,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data from FMP:', error);
    throw error;
  }
};

// Funktion, um Aktieninformationen zu holen
export const fetchStockInfo = async (ticker: string) => {
  console.log(`Fetching stock info for ${ticker}`);
  
  try {
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
  } catch (error) {
    console.error(`Error fetching stock info for ${ticker}:`, error);
    
    // Bei API-Fehlern auf Beispieldaten zurückgreifen
    if (ticker.toUpperCase() === 'AAPL' || ticker.toUpperCase() === 'APPLE' || ticker.toUpperCase() === 'APPLE INC') {
      return {
        name: 'Apple Inc.',
        ticker: 'AAPL',
        price: 191.56,
        change: 1.78,
        changePercent: 0.94,
        currency: '$',
        marketCap: 2970000000000,
      };
    }
    
    // Für andere Fälle einen Fehler werfen
    throw new Error(`Fehler beim Abrufen der Aktieninformationen für ${ticker}`);
  }
};

// Funktion, um Buffett-Kriterien zu analysieren
export const analyzeBuffettCriteria = async (ticker: string) => {
  console.log(`Analyzing ${ticker} with Buffett criteria`);
  
  try {
    // Standardisieren des Tickers für die API
    const standardizedTicker = ticker.trim().toUpperCase();
    
    // Verschiedene Finanzdaten abrufen
    const [ratios, keyMetrics, profile] = await Promise.all([
      fetchFromFMP(`/ratios/${standardizedTicker}`),
      fetchFromFMP(`/key-metrics/${standardizedTicker}`),
      fetchFromFMP(`/profile/${standardizedTicker}`)
    ]);
    
    // Überprüfen, ob Daten zurückgegeben wurden
    if (!ratios || ratios.length === 0 || !keyMetrics || keyMetrics.length === 0) {
      throw new Error(`Keine Finanzkennzahlen gefunden für ${standardizedTicker}`);
    }
    
    // Die neuesten Daten verwenden
    const latestRatios = ratios[0];
    const latestMetrics = keyMetrics[0];
    const companyProfile = profile[0];
    
    // Business Model Analyse
    const businessModelStatus = companyProfile.description && companyProfile.description.length > 100 ? 'pass' : 'warning';
    
    // Economic Moat Analyse (vereinfacht)
    const grossMargin = latestRatios.grossProfitMargin * 100;
    const operatingMargin = latestRatios.operatingProfitMargin * 100;
    const roic = latestMetrics.roic * 100;
    
    let economicMoatStatus = 'fail';
    if (grossMargin > 40 && operatingMargin > 20 && roic > 15) {
      economicMoatStatus = 'pass';
    } else if (grossMargin > 30 && operatingMargin > 15 && roic > 10) {
      economicMoatStatus = 'warning';
    }
    
    // Finanzkennzahlen Analyse
    const roe = latestRatios.returnOnEquity * 100;
    const netMargin = latestRatios.netProfitMargin * 100;
    
    let financialMetricsStatus = 'fail';
    if (roe > 15 && netMargin > 10) {
      financialMetricsStatus = 'pass';
    } else if (roe > 10 && netMargin > 5) {
      financialMetricsStatus = 'warning';
    }
    
    // Finanzielle Stabilität
    const debtToAssets = latestRatios.debtToAssets * 100;
    const interestCoverage = latestRatios.interestCoverage;
    const currentRatio = latestRatios.currentRatio;
    
    let financialStabilityStatus = 'fail';
    if (debtToAssets < 50 && interestCoverage > 5 && currentRatio > 1.5) {
      financialStabilityStatus = 'pass';
    } else if (debtToAssets < 70 && interestCoverage > 3 && currentRatio > 1) {
      financialStabilityStatus = 'warning';
    }
    
    // Management Qualität (vereinfacht)
    // Hier bräuchten wir mehr Daten wie Insider Ownership, die in der kostenlosen API nicht enthalten sind
    const managementStatus = 'warning'; // Standardmäßig auf warning setzen, da wir nicht alle Daten haben
    
    // Bewertung
    const pe = latestRatios.priceEarningsRatio;
    const dividendYield = latestRatios.dividendYield * 100;
    
    let valuationStatus = 'fail';
    if (pe < 15 && dividendYield > 2) {
      valuationStatus = 'pass';
    } else if (pe < 25 && dividendYield > 1) {
      valuationStatus = 'warning';
    }
    
    // Langfristiger Horizont (vereinfacht)
    // Dies ist schwer automatisch zu bewerten, wir gehen von der Branche aus
    const sector = companyProfile.sector;
    const industry = companyProfile.industry;
    
    // Vereinfachte Bewertung basierend auf Branche
    const stableSectors = [
      'Consumer Defensive', 'Healthcare', 'Utilities', 
      'Financial Services', 'Technology', 'Communication Services'
    ];
    
    const longTermStatus = stableSectors.includes(sector) ? 'pass' : 'warning';
    
    // Erstellen des Analyseobjekts
    return {
      businessModel: {
        status: businessModelStatus,
        title: 'Geschäftsmodell verstehen',
        description: `${companyProfile.companyName} ist tätig im Bereich ${companyProfile.industry}.`,
        details: [
          `Hauptgeschäftsbereich: ${companyProfile.industry}`,
          `Sektor: ${companyProfile.sector}`,
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
          `Gewinn pro Aktie: ${latestMetrics.eps.toFixed(2)} ${companyProfile.currency}`,
          `Umsatz pro Aktie: ${latestMetrics.revenuePerShare.toFixed(2)} ${companyProfile.currency}`
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
          `Schulden zu EBITDA: ${latestRatios.debtToEBITDA.toFixed(2)} (niedriger ist besser)`
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
          `Kurs zu Buchwert: ${latestRatios.priceToBookRatio.toFixed(2)} (niedriger ist besser)`,
          `Kurs zu Cashflow: ${latestRatios.priceCashFlowRatio.toFixed(2)} (niedriger ist besser)`
        ]
      },
      longTermOutlook: {
        status: longTermStatus,
        title: 'Langfristiger Horizont',
        description: `${companyProfile.companyName} operiert in einer Branche mit ${longTermStatus === 'pass' ? 'guten' : 'moderaten'} langfristigen Aussichten.`,
        details: [
          `Branche: ${companyProfile.industry}`,
          `Sektor: ${companyProfile.sector}`,
          `Börsennotiert seit: ${companyProfile.ipoDate ? new Date(companyProfile.ipoDate).toLocaleDateString() : 'N/A'}`,
          'Eine tiefere Analyse der langfristigen Branchentrends wird empfohlen'
        ]
      }
    };
  } catch (error) {
    console.error(`Error analyzing ${ticker} with Buffett criteria:`, error);
    
    // Bei API-Fehlern, auf die vorhandenen Mock-Daten zurückgreifen
    // Hier verwendet die ursprüngliche Funktion für das spezifische Ticker oder eine generische Antwort
    const fallbackAnalyzeBuffettCriteria = async (ticker: string) => {
      // ... keep existing code (die ursprüngliche Fallback-Logik)
      
      // For Apple (AAPL), return detailed positive analysis as an example
      if (ticker.toUpperCase() === 'AAPL' || ticker.toUpperCase() === 'APPLE' || ticker.toUpperCase() === 'APPLE INC') {
        return {
          businessModel: {
            status: 'pass',
            title: 'Geschäftsmodell verstehen',
            description: 'Apple entwickelt, produziert und verkauft Premium-Hardware, Software und Services mit einem starken Ökosystem.',
            details: [
              'Klares, leicht verständliches Geschäftsmodell',
              'Starke Marke mit loyaler Kundenbasis',
              'Wiederkehrende Einnahmen durch Services (App Store, Apple Music, iCloud)',
              'Vertikale Integration von Hardware und Software'
            ]
          },
          // ... keep existing code (weiterhin die Apple-spezifischen Daten zurückgeben)
        };
      } else if (ticker.toUpperCase() === 'MSFT') {
        // ... keep existing code (MSFT Mock-Daten)
      } else if (ticker.toUpperCase() === 'AMZN') {
        // ... keep existing code (AMZN Mock-Daten)
      } else {
        // ... keep existing code (generische Daten für andere Ticker)
      }
    };
    
    // Zurückfallen auf die Mock-Daten
    return fallbackAnalyzeBuffettCriteria(ticker);
  }
};

// Funktion, um Finanzkennzahlen zu holen
export const getFinancialMetrics = async (ticker: string) => {
  console.log(`Getting financial metrics for ${ticker}`);
  
  try {
    // Standardisieren des Tickers für die API
    const standardizedTicker = ticker.trim().toUpperCase();
    
    // Finanzkennzahlen abrufen
    const [ratios, keyMetrics, financialGrowth, historicalData] = await Promise.all([
      fetchFromFMP(`/ratios/${standardizedTicker}`),
      fetchFromFMP(`/key-metrics/${standardizedTicker}`),
      fetchFromFMP(`/financial-growth/${standardizedTicker}`),
      Promise.all([
        fetchFromFMP(`/income-statement/${standardizedTicker}?limit=10`),
        fetchFromFMP(`/key-metrics/${standardizedTicker}?limit=10`)
      ])
    ]);
    
    // Überprüfen, ob Daten zurückgegeben wurden
    if (!ratios || ratios.length === 0 || !keyMetrics || keyMetrics.length === 0) {
      throw new Error(`Keine Finanzkennzahlen gefunden für ${standardizedTicker}`);
    }
    
    // Die neuesten Daten verwenden
    const latestRatios = ratios[0];
    const latestMetrics = keyMetrics[0];
    const latestGrowth = financialGrowth[0];
    
    // Historische Daten verarbeiten
    const incomeStatements = historicalData[0];
    const historicalMetrics = historicalData[1];
    
    // Metriken basierend auf den Daten erstellen
    const metrics = [
      {
        name: 'Return on Equity (ROE)',
        value: `${(latestRatios.returnOnEquity * 100).toFixed(2)}%`,
        formula: 'Jahresgewinn / Eigenkapital',
        explanation: 'Zeigt, wie effizient das Unternehmen das Eigenkapital einsetzt.',
        threshold: '>15%',
        status: latestRatios.returnOnEquity * 100 > 15 ? 'pass' : latestRatios.returnOnEquity * 100 > 10 ? 'warning' : 'fail'
      },
      {
        name: 'Nettomarge',
        value: `${(latestRatios.netProfitMargin * 100).toFixed(2)}%`,
        formula: 'Nettogewinn / Umsatz',
        explanation: 'Gibt an, wie viel vom Umsatz als Gewinn übrig bleibt.',
        threshold: '>10%',
        status: latestRatios.netProfitMargin * 100 > 10 ? 'pass' : latestRatios.netProfitMargin * 100 > 5 ? 'warning' : 'fail'
      },
      {
        name: 'ROIC',
        value: `${(latestMetrics.roic * 100).toFixed(2)}%`,
        formula: 'NOPAT / (Eigenkapital + langfristige Schulden)',
        explanation: 'Zeigt, wie effizient das investierte Kapital eingesetzt wird.',
        threshold: '>10%',
        status: latestMetrics.roic * 100 > 10 ? 'pass' : latestMetrics.roic * 100 > 7 ? 'warning' : 'fail'
      },
      {
        name: 'Schuldenquote',
        value: `${(latestRatios.debtToAssets * 100).toFixed(2)}%`,
        formula: 'Gesamtschulden / Gesamtvermögen',
        explanation: 'Gibt an, wie stark das Unternehmen fremdfinanziert ist.',
        threshold: '<70%',
        status: latestRatios.debtToAssets * 100 < 50 ? 'pass' : latestRatios.debtToAssets * 100 < 70 ? 'warning' : 'fail'
      },
      {
        name: 'Zinsdeckungsgrad',
        value: latestRatios.interestCoverage.toFixed(2),
        formula: 'EBIT / Zinsaufwand',
        explanation: 'Zeigt, wie oft die Zinsen aus dem Gewinn bezahlt werden können.',
        threshold: '>5',
        status: latestRatios.interestCoverage > 5 ? 'pass' : latestRatios.interestCoverage > 3 ? 'warning' : 'fail'
      },
      {
        name: 'Current Ratio',
        value: latestRatios.currentRatio.toFixed(2),
        formula: 'Umlaufvermögen / Kurzfristige Verbindlichkeiten',
        explanation: 'Misst die kurzfristige Liquidität des Unternehmens.',
        threshold: '>1',
        status: latestRatios.currentRatio > 1.5 ? 'pass' : latestRatios.currentRatio > 1 ? 'warning' : 'fail'
      },
      {
        name: 'KGV',
        value: latestRatios.priceEarningsRatio.toFixed(2),
        formula: 'Aktienkurs / Gewinn pro Aktie',
        explanation: 'Gibt an, wie hoch die Aktie im Verhältnis zum Gewinn bewertet ist.',
        threshold: '<25 (für Wachstumsunternehmen)',
        status: latestRatios.priceEarningsRatio < 15 ? 'pass' : latestRatios.priceEarningsRatio < 25 ? 'warning' : 'fail'
      },
      {
        name: 'Dividendenrendite',
        value: `${(latestRatios.dividendYield * 100).toFixed(2)}%`,
        formula: 'Jahresdividende / Aktienkurs',
        explanation: 'Zeigt, wie viel Dividendenertrag im Verhältnis zum Aktienkurs ausgezahlt wird.',
        threshold: '>2%',
        status: latestRatios.dividendYield * 100 > 2 ? 'pass' : latestRatios.dividendYield * 100 > 1 ? 'warning' : 'fail'
      },
      {
        name: 'Umsatzwachstum (5J)',
        value: `${(latestGrowth.fiveYRevenueGrowthPerShare * 100).toFixed(2)}%`,
        formula: '(Aktueller Umsatz / Umsatz vor 5 Jahren)^(1/5) - 1',
        explanation: 'Durchschnittliches jährliches Umsatzwachstum über die letzten 5 Jahre.',
        threshold: '>5%',
        status: latestGrowth.fiveYRevenueGrowthPerShare * 100 > 10 ? 'pass' : latestGrowth.fiveYRevenueGrowthPerShare * 100 > 5 ? 'warning' : 'fail'
      }
    ];
    
    // Historische Daten für Charts aufbereiten
    const historicalDataFormatted = {
      revenue: incomeStatements.map(statement => ({
        year: statement.date.substring(0, 4),
        value: statement.revenue / 1000000 // Umrechnung in Millionen
      })),
      earnings: incomeStatements.map(statement => ({
        year: statement.date.substring(0, 4),
        value: statement.netIncome / 1000000 // Umrechnung in Millionen
      })),
      eps: historicalMetrics.map(metric => ({
        year: metric.date.substring(0, 4),
        value: metric.eps
      }))
    };
    
    // Daten nach Jahr sortieren (älteste zuerst)
    historicalDataFormatted.revenue.reverse();
    historicalDataFormatted.earnings.reverse();
    historicalDataFormatted.eps.reverse();
    
    return {
      metrics,
      historicalData: historicalDataFormatted
    };
  } catch (error) {
    console.error(`Error getting financial metrics for ${ticker}:`, error);
    
    // Bei API-Fehlern auf die ursprünglichen Mock-Daten zurückgreifen
    const fallbackGetFinancialMetrics = async (ticker: string) => {
      // ... keep existing code (die ursprüngliche Fallback-Logik für getFinancialMetrics)
      
      // For Apple (AAPL), return detailed metrics as an example
      if (ticker.toUpperCase() === 'AAPL' || ticker.toUpperCase() === 'APPLE' || ticker.toUpperCase() === 'APPLE INC') {
        return {
          metrics: [
            {
              name: 'Return on Equity (ROE)',
              value: '131.8%',
              formula: 'Jahresgewinn / Eigenkapital',
              explanation: 'Zeigt, wie effizient das Unternehmen das Eigenkapital einsetzt.',
              threshold: '>15%',
              status: 'pass'
            },
            // ... keep existing code (restliche Apple-spezifische Kennzahlen)
          ],
          historicalData: {
            // ... keep existing code (historische Daten für Apple)
          }
        };
      } else {
        // ... keep existing code (generische Daten für andere Ticker)
      }
    };
    
    // Zurückfallen auf die Mock-Daten
    return fallbackGetFinancialMetrics(ticker);
  }
};

// Funktion, um Gesamtbewertung zu erstellen
export const getOverallRating = async (ticker: string) => {
  console.log(`Getting overall rating for ${ticker}`);
  
  try {
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
  } catch (error) {
    console.error(`Error getting overall rating for ${ticker}:`, error);
    
    // Bei API-Fehlern auf die ursprünglichen Mock-Daten zurückgreifen
    const fallbackGetOverallRating = async (ticker: string) => {
      // ... keep existing code (die ursprüngliche Fallback-Logik für getOverallRating)
      
      // For Apple (AAPL), return detailed rating as an example
      if (ticker.toUpperCase() === 'AAPL' || ticker.toUpperCase() === 'APPLE' || ticker.toUpperCase() === 'APPLE INC') {
        return {
          overall: 'watch',
          summary: 'Apple ist ein außergewöhnliches Unternehmen mit starkem Burggraben, aber die aktuelle Bewertung bietet nur begrenzten Spielraum für langfristige Überrenditen.',
          strengths: [
            'Hervorragendes Geschäftsmodell mit starkem Ökosystem und Kundenbindung',
            'Außergewöhnliche Finanzkennzahlen und finanzielle Stabilität',
            'Kompetentes Management mit nachgewiesener Innovationsfähigkeit',
            'Starker Burggraben durch Marke, Patente und Kundenloyalität',
            'Gute langfristige Wachstumsaussichten'
          ],
          weaknesses: [
            'Relativ hohe Bewertung mit KGV über dem historischen Durchschnitt',
            'Begrenzte Margin of Safety beim aktuellen Preis',
            'Geringe Dividendenrendite von unter 1%',
            'Abhängigkeit vom iPhone als Hauptumsatzquelle',
            'Zunehmender Wettbewerb in Kernmärkten'
          ],
          recommendation: 'Apple ist ein erstklassiges Unternehmen, das viele von Buffetts Kriterien erfüllt. Die aktuelle Bewertung ist jedoch etwas anspruchsvoll. Anleger sollten Apple auf ihre Beobachtungsliste setzen und bei Kursrückgängen kaufen, die eine größere Margin of Safety bieten.'
        };
      } else if (ticker.toUpperCase() === 'MSFT') {
        // ... keep existing code (MSFT Mock-Daten)
      } else if (ticker.toUpperCase() === 'AMZN') {
        // ... keep existing code (AMZN Mock-Daten)
      } else {
        // ... keep existing code (generische Daten für andere Ticker)
      }
    };
    
    // Zurückfallen auf die Mock-Daten
    return fallbackGetOverallRating(ticker);
  }
};
