import axios from 'axios';

// Financial Modeling Prep API Key - Fest eingebaut
const FMP_API_KEY = 'uxE1jVMvI8QQen0a4AEpLFTaqf3KQO0y';
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Hilfsfunktion für API-Anfragen
const fetchFromFMP = async (endpoint: string, params = {}) => {
  try {
    // Verwende den fest implementierten API-Key
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      params: {
        apikey: FMP_API_KEY,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data from FMP:', error);
    throw new Error(`Fehler beim Abrufen von Daten. Bitte versuchen Sie es später erneut.`);
  }
};

// Da wir keinen Zugriff auf den Inhalt der stockApi.ts haben, müssen wir hier
// die benötigten Funktionen exportieren, damit Index.tsx sie verwenden kann

// Funktion zum Abrufen von Aktieninformationen
export const fetchStockInfo = async (ticker: string) => {
  // Abrufen des Unternehmensprofils
  const profileData = await fetchFromFMP(`/profile/${ticker}`);
  
  if (!profileData || profileData.length === 0) {
    throw new Error(`Keine Daten gefunden für ${ticker}`);
  }
  
  // Abrufen des aktuellen Kurses
  const quoteData = await fetchFromFMP(`/quote/${ticker}`);
  
  return {
    ticker: profileData[0].symbol,
    name: profileData[0].companyName,
    industry: profileData[0].industry,
    sector: profileData[0].sector,
    country: profileData[0].country,
    currency: profileData[0].currency,
    exchange: profileData[0].exchangeShortName,
    description: profileData[0].description,
    website: profileData[0].website,
    ceo: profileData[0].ceo,
    employees: profileData[0].fullTimeEmployees,
    logo: profileData[0].image,
    price: quoteData[0]?.price || 0,
    change: quoteData[0]?.change || 0,
    changePercent: quoteData[0]?.changesPercentage || 0,
    marketCap: profileData[0].mktCap,
    ipoDate: profileData[0].ipoDate
  };
};

// Funktion zum Analysieren der Buffett-Kriterien
export const analyzeBuffettCriteria = async (ticker: string) => {
  // Abrufen der relevanten Finanzkennzahlen
  const [ratiosTTM, keyMetrics, profile, financialGrowth, income, balance] = await Promise.all([
    fetchFromFMP(`/ratios-ttm/${ticker}`),
    fetchFromFMP(`/key-metrics-ttm/${ticker}`),
    fetchFromFMP(`/profile/${ticker}`),
    fetchFromFMP(`/financial-growth/${ticker}?limit=5`),
    fetchFromFMP(`/income-statement/${ticker}?limit=5`),
    fetchFromFMP(`/balance-sheet-statement/${ticker}?limit=5`)
  ]);
  
  // Prüfen, ob Daten für koreanische Aktien vorhanden sind und entsprechend anpassen
  const isKoreanStock = profile && profile[0] && profile[0].country === "KR";
  const currencyConversion = isKoreanStock ? 0.00068 : 1; // KRW zu EUR ungefährer Kurs
  
  // Extrahieren der relevanten Kennzahlen
  const roe = ratiosTTM[0]?.returnOnEquityTTM * 100;
  const debt = balance[0]?.totalDebt;
  const equity = balance[0]?.totalStockholdersEquity;
  const debtToEquity = debt && equity ? (debt / equity) * 100 : null;
  
  return {
    profitability: {
      roe: roe,
      roic: keyMetrics[0]?.roicTTM * 100,
      grossMargin: ratiosTTM[0]?.grossProfitMarginTTM * 100,
      netMargin: ratiosTTM[0]?.netProfitMarginTTM * 100,
      fcfMargin: keyMetrics[0]?.freeCashFlowPerShareTTM * (isKoreanStock ? currencyConversion : 1),
      status: roe > 15 ? 'good' : roe > 10 ? 'warning' : 'bad'
    },
    growth: {
      revenueGrowth5Y: financialGrowth[0]?.growthRevenue5Y * 100,
      epsGrowth5Y: financialGrowth[0]?.growthEPS5Y * 100,
      fcfGrowth5Y: 12.5, // Beispielwert
      status: financialGrowth[0]?.growthEPS5Y > 0.10 ? 'good' : 'warning'
    },
    financial_health: {
      debtToEquity: debtToEquity,
      currentRatio: ratiosTTM[0]?.currentRatioTTM,
      interestCoverage: ratiosTTM[0]?.interestCoverageTTM,
      status: debtToEquity < 50 ? 'good' : debtToEquity < 80 ? 'warning' : 'bad'
    },
    valuation: {
      pe: ratiosTTM[0]?.priceEarningsRatioTTM,
      peg: ratiosTTM[0]?.pegRatioTTM,
      pb: ratiosTTM[0]?.priceToBookRatioTTM,
      ps: ratiosTTM[0]?.priceSalesRatioTTM,
      dividendYield: ratiosTTM[0]?.dividendYieldTTM * 100,
      status: ratiosTTM[0]?.priceEarningsRatioTTM < 15 ? 'good' : 'warning'
    }
  };
};

// Funktion zum Abrufen der Finanzkennzahlen
export const getFinancialMetrics = async (ticker: string) => {
  // Abrufen der relevanten Finanzkennzahlen
  const [metrics, income, cashflow] = await Promise.all([
    fetchFromFMP(`/key-metrics-ttm/${ticker}`),
    fetchFromFMP(`/income-statement/${ticker}?limit=5`),
    fetchFromFMP(`/cash-flow-statement/${ticker}?limit=5`)
  ]);
  
  // Historische Daten für Graphen
  const historicalData = {
    revenue: income.map(year => ({
      year: new Date(year.date).getFullYear(),
      value: year.revenue
    })).reverse(),
    earnings: income.map(year => ({
      year: new Date(year.date).getFullYear(),
      value: year.netIncome
    })).reverse(),
    freeCashFlow: cashflow.map(year => ({
      year: new Date(year.date).getFullYear(),
      value: year.freeCashFlow
    })).reverse()
  };
  
  return {
    metrics: {
      revenue: income[0]?.revenue,
      netIncome: income[0]?.netIncome,
      eps: income[0]?.eps,
      freeCashFlow: cashflow[0]?.freeCashFlow,
      freeCashFlowPerShare: metrics[0]?.freeCashFlowPerShareTTM,
      dividendPerShare: metrics[0]?.dividendPerShareTTM,
      bookValuePerShare: metrics[0]?.bookValuePerShareTTM,
      debtToEquity: metrics[0]?.debtToEquityTTM,
      currentRatio: metrics[0]?.currentRatioTTM,
      roe: metrics[0]?.roeTTM * 100,
      roic: metrics[0]?.roicTTM * 100
    },
    historicalData
  };
};

// Funktion zum Abrufen der Gesamtbewertung
export const getOverallRating = async (ticker: string) => {
  // Abrufen der relevanten Finanzkennzahlen für Bewertungsberechnung
  const [metrics, ratios, quote, profile, income, cashflow] = await Promise.all([
    fetchFromFMP(`/key-metrics-ttm/${ticker}`),
    fetchFromFMP(`/ratios-ttm/${ticker}`),
    fetchFromFMP(`/quote/${ticker}`),
    fetchFromFMP(`/profile/${ticker}`),
    fetchFromFMP(`/income-statement/${ticker}?limit=5`),
    fetchFromFMP(`/cash-flow-statement/${ticker}?limit=5`)
  ]);
  
  // Prüfen, ob Daten für koreanische Aktien vorhanden sind
  const isKoreanStock = profile && profile[0] && profile[0].country === "KR";
  const currencyConversion = isKoreanStock ? 0.00068 : 1; // KRW zu EUR ungefährer Kurs
  
  // Kennzahlen extrahieren
  const currentPrice = quote[0]?.price;
  const eps = income[0]?.eps * (isKoreanStock ? currencyConversion : 1);
  const fcf = cashflow[0]?.freeCashFlow;
  const sharesOutstanding = income[0]?.weightedAverageShsOut;
  const fcfPerShare = sharesOutstanding ? fcf / sharesOutstanding * (isKoreanStock ? currencyConversion : 1) : 0;
  
  // DCF Modell für intrinsischen Wert (vereinfacht)
  // Annahmen für DCF-Berechnung
  const growthRate = 0.10; // 10% Wachstum für 10 Jahre
  const terminalRate = 0.03; // 3% Wachstum danach
  const discountRate = 0.10; // 10% Abzinsungssatz
  
  // Berechnung des intrinsischen Werts basierend auf FCF
  let intrinsicValue = 0;
  if (fcfPerShare > 0) {
    let dcfValue = 0;
    let currentFcf = fcfPerShare;
    
    // 10 Jahre Prognose mit anfänglichem Wachstum
    for (let i = 1; i <= 10; i++) {
      currentFcf *= (1 + growthRate);
      dcfValue += currentFcf / Math.pow(1 + discountRate, i);
    }
    
    // Endwert (Terminal Value)
    const terminalValue = currentFcf * (1 + terminalRate) / (discountRate - terminalRate);
    const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate, 10);
    
    intrinsicValue = dcfValue + discountedTerminalValue;
  }
  
  // Sicherheitsmarge
  const marginOfSafety = intrinsicValue > 0 ? (intrinsicValue - currentPrice) / intrinsicValue * 100 : 0;
  
  // Kaufempfehlung basierend auf Sicherheitsmarge
  let recommendation = 'Halten';
  let recommendationColor = 'yellow';
  
  if (marginOfSafety >= 30) {
    recommendation = 'Starker Kauf';
    recommendationColor = 'green';
  } else if (marginOfSafety >= 15) {
    recommendation = 'Kauf';
    recommendationColor = 'lightgreen';
  } else if (marginOfSafety <= -15) {
    recommendation = 'Verkaufen';
    recommendationColor = 'red';
  } else if (marginOfSafety < 0) {
    recommendation = 'Halten';
    recommendationColor = 'yellow';
  }
  
  // Score-Berechnung
  const qualityScore = calculateQualityScore(ratios[0], metrics[0]);
  const valuationScore = calculateValuationScore(ratios[0], marginOfSafety);
  const momentumScore = calculateMomentumScore(quote[0]);
  
  const overallScore = (qualityScore * 0.5) + (valuationScore * 0.4) + (momentumScore * 0.1);
  
  return {
    qualityScore,
    valuationScore,
    momentumScore,
    overallScore,
    intrinsicValue,
    currentPrice,
    marginOfSafety,
    recommendation,
    recommendationColor,
    bestBuyPrice: intrinsicValue * 0.7, // 30% unter intrinsischem Wert
    peRatio: ratios[0]?.priceEarningsRatioTTM,
    pegRatio: ratios[0]?.pegRatioTTM,
    currency: profile[0]?.currency || 'EUR',  // Add currency to the output
    dcfAssumptions: {
      growthRate: growthRate * 100,
      terminalRate: terminalRate * 100,
      discountRate: discountRate * 100
    }
  };
};

// Hilfsfunktionen für Rating-Berechnung
const calculateQualityScore = (ratios: any, metrics: any) => {
  // Berechnung des Qualitätsscores (0-100)
  let score = 0;
  
  // ROE Bewertung (0-25 Punkte)
  const roe = metrics?.roeTTM * 100;
  if (roe > 20) score += 25;
  else if (roe > 15) score += 20;
  else if (roe > 10) score += 15;
  else if (roe > 5) score += 10;
  else score += 5;
  
  // Margen Bewertung (0-25 Punkte)
  const netMargin = ratios?.netProfitMarginTTM * 100;
  if (netMargin > 20) score += 25;
  else if (netMargin > 15) score += 20;
  else if (netMargin > 10) score += 15;
  else if (netMargin > 5) score += 10;
  else score += 5;
  
  // Schulden Bewertung (0-25 Punkte)
  const debtToEquity = metrics?.debtToEquityTTM;
  if (debtToEquity < 0.3) score += 25;
  else if (debtToEquity < 0.5) score += 20;
  else if (debtToEquity < 1) score += 15;
  else if (debtToEquity < 1.5) score += 10;
  else score += 5;
  
  // Effizienz Bewertung (0-25 Punkte)
  const roic = metrics?.roicTTM * 100;
  if (roic > 15) score += 25;
  else if (roic > 10) score += 20;
  else if (roic > 8) score += 15;
  else if (roic > 5) score += 10;
  else score += 5;
  
  return score;
};

const calculateValuationScore = (ratios: any, marginOfSafety: number) => {
  // Berechnung des Bewertungsscores (0-100)
  let score = 0;
  
  // PE Bewertung (0-25 Punkte)
  const pe = ratios?.priceEarningsRatioTTM;
  if (pe < 10) score += 25;
  else if (pe < 15) score += 20;
  else if (pe < 20) score += 15;
  else if (pe < 25) score += 10;
  else score += 5;
  
  // PB Bewertung (0-25 Punkte)
  const pb = ratios?.priceToBookRatioTTM;
  if (pb < 1) score += 25;
  else if (pb < 2) score += 20;
  else if (pb < 3) score += 15;
  else if (pb < 4) score += 10;
  else score += 5;
  
  // Dividendenrendite Bewertung (0-25 Punkte)
  const divYield = ratios?.dividendYieldTTM * 100;
  if (divYield > 4) score += 25;
  else if (divYield > 3) score += 20;
  else if (divYield > 2) score += 15;
  else if (divYield > 1) score += 10;
  else score += 5;
  
  // Sicherheitsmarge Bewertung (0-25 Punkte)
  if (marginOfSafety > 30) score += 25;
  else if (marginOfSafety > 20) score += 20;
  else if (marginOfSafety > 10) score += 15;
  else if (marginOfSafety > 0) score += 10;
  else score += 5;
  
  return score;
};

const calculateMomentumScore = (quote: any) => {
  // Einfache Momentum-Score-Berechnung (0-100)
  let score = 50; // Neutraler Ausgangspunkt
  
  const changePercent = quote?.changesPercentage;
  
  if (changePercent > 15) score = 100;
  else if (changePercent > 10) score = 90;
  else if (changePercent > 5) score = 80;
  else if (changePercent > 2) score = 70;
  else if (changePercent > 0) score = 60;
  else if (changePercent > -2) score = 40;
  else if (changePercent > -5) score = 30;
  else if (changePercent > -10) score = 20;
  else if (changePercent > -15) score = 10;
  else score = 0;
  
  return score;
};
