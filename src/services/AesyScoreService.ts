/**
 * Aesy Score Service
 * Berechnet die 6 Säulen des Aesy Scores plus Gesamtscore
 */

interface AesyScoreResult {
  financialStrength: number;
  profitability: number;
  growth: number;
  value: number;
  momentum: number;
  qualitative: number | null;
  aesyScore: number;
  peterLynch: {
    fairValue: number | null;
    priceToLynch: number | null;
  };
  notes: {
    aiIncluded: boolean;
    hasDataGaps: boolean;
  };
  tooltips: {
    financialStrength: TooltipInfo;
    profitability: TooltipInfo;
    growth: TooltipInfo;
    value: TooltipInfo;
    momentum: TooltipInfo;
    qualitative: TooltipInfo;
  };
}

interface TooltipInfo {
  title: string;
  what: string;
  why: string;
  good: string;
}

interface StockData {
  stockInfo?: any;
  financialMetrics?: any;
  historicalData?: any;
  overallRating?: any;
  buffettCriteria?: any;
  gptAnalysis?: any;
}

/**
 * Berechnet Financial Strength (0-100)
 * Basiert auf: Verschuldung, Liquidität, Zinsdeckung
 */
function calculateFinancialStrength(data: StockData): number {
  const metrics = data.financialMetrics;
  if (!metrics) return 0;

  let score = 0;
  let factors = 0;

  // Verschuldungsgrad (D/E) - max 40 Punkte
  if (metrics.DtoE !== undefined && metrics.DtoE !== null) {
    factors++;
    if (metrics.DtoE <= 0.3) score += 40;
    else if (metrics.DtoE <= 0.5) score += 30;
    else if (metrics.DtoE <= 1.0) score += 20;
    else if (metrics.DtoE <= 2.0) score += 10;
  }

  // Current Ratio - max 30 Punkte
  if (metrics.CurrentRatio !== undefined && metrics.CurrentRatio !== null) {
    factors++;
    if (metrics.CurrentRatio >= 2.0) score += 30;
    else if (metrics.CurrentRatio >= 1.5) score += 25;
    else if (metrics.CurrentRatio >= 1.0) score += 15;
    else score += 5;
  }

  // Zinsdeckungsgrad - max 30 Punkte
  if (metrics.Zinsdeckungsgrad !== undefined && metrics.Zinsdeckungsgrad !== null) {
    factors++;
    if (metrics.Zinsdeckungsgrad >= 10) score += 30;
    else if (metrics.Zinsdeckungsgrad >= 5) score += 25;
    else if (metrics.Zinsdeckungsgrad >= 3) score += 15;
    else score += 5;
  }

  return factors > 0 ? Math.round(score / factors * 100 / 100) : 0;
}

/**
 * Berechnet Profitability (0-100)
 * Basiert auf: ROE, Nettomarge, OCF-Qualität
 */
function calculateProfitability(data: StockData): number {
  const metrics = data.financialMetrics;
  if (!metrics) return 0;

  let score = 0;
  let factors = 0;

  // ROE 10J Durchschnitt - max 40 Punkte
  if (metrics.ROE_10J_avg !== undefined && metrics.ROE_10J_avg !== null) {
    factors++;
    const roe = metrics.ROE_10J_avg * 100; // in Prozent
    if (roe >= 20) score += 40;
    else if (roe >= 15) score += 30;
    else if (roe >= 10) score += 20;
    else if (roe >= 5) score += 10;
  }

  // Nettomarge 10J Durchschnitt - max 30 Punkte
  if (metrics.Nettomarge_10J_avg !== undefined && metrics.Nettomarge_10J_avg !== null) {
    factors++;
    const margin = metrics.Nettomarge_10J_avg * 100;
    if (margin >= 20) score += 30;
    else if (margin >= 15) score += 25;
    else if (margin >= 10) score += 20;
    else if (margin >= 5) score += 10;
  }

  // OCF Qualität 5J - max 30 Punkte
  if (metrics.OCF_Qualität_5J !== undefined && metrics.OCF_Qualität_5J !== null) {
    factors++;
    if (metrics.OCF_Qualität_5J >= 1.2) score += 30;
    else if (metrics.OCF_Qualität_5J >= 1.0) score += 25;
    else if (metrics.OCF_Qualität_5J >= 0.8) score += 15;
    else score += 5;
  }

  return factors > 0 ? Math.round(score / factors * 100 / 100) : 0;
}

/**
 * Berechnet Growth (0-100)
 * Basiert auf: EPS-Wachstum, Umsatzwachstum, FCF-Entwicklung
 */
function calculateGrowth(data: StockData): number {
  const metrics = data.financialMetrics;
  if (!metrics) return 0;

  let score = 0;
  let factors = 0;

  // EPS CAGR - max 40 Punkte
  if (metrics.EPS_CAGR !== undefined && metrics.EPS_CAGR !== null) {
    factors++;
    const cagr = metrics.EPS_CAGR * 100;
    if (cagr >= 15) score += 40;
    else if (cagr >= 10) score += 30;
    else if (cagr >= 5) score += 20;
    else if (cagr >= 0) score += 10;
  }

  // Umsatzwachstum (falls vorhanden)
  if (metrics.RevenueCAGR !== undefined && metrics.RevenueCAGR !== null) {
    factors++;
    const revGrowth = metrics.RevenueCAGR * 100;
    if (revGrowth >= 15) score += 30;
    else if (revGrowth >= 10) score += 25;
    else if (revGrowth >= 5) score += 20;
    else if (revGrowth >= 0) score += 10;
  }

  // FCF Marge 5J - max 30 Punkte
  if (metrics.FCF_Marge_5J !== undefined && metrics.FCF_Marge_5J !== null) {
    factors++;
    const fcfMargin = metrics.FCF_Marge_5J * 100;
    if (fcfMargin >= 10) score += 30;
    else if (fcfMargin >= 7) score += 25;
    else if (fcfMargin >= 5) score += 20;
    else if (fcfMargin >= 0) score += 10;
  }

  return factors > 0 ? Math.round(score / factors * 100 / 100) : 0;
}

/**
 * Berechnet Value (0-100)
 * Basiert auf: P/E, P/B, Peter Lynch Fair Value
 */
function calculateValue(data: StockData): number {
  const metrics = data.financialMetrics;
  const stockInfo = data.stockInfo;
  if (!metrics) return 0;

  let score = 0;
  let factors = 0;

  // P/E Ratio - max 35 Punkte
  if (metrics.PE !== undefined && metrics.PE !== null && metrics.PE > 0) {
    factors++;
    if (metrics.PE <= 15) score += 35;
    else if (metrics.PE <= 20) score += 28;
    else if (metrics.PE <= 25) score += 20;
    else if (metrics.PE <= 35) score += 10;
    else score += 5;
  }

  // P/B Ratio - max 25 Punkte
  if (metrics.PB !== undefined && metrics.PB !== null && metrics.PB > 0) {
    factors++;
    if (metrics.PB <= 2) score += 25;
    else if (metrics.PB <= 3) score += 20;
    else if (metrics.PB <= 5) score += 15;
    else if (metrics.PB <= 8) score += 8;
    else score += 3;
  }

  // Peter Lynch Vergleich - max 40 Punkte
  const peterLynchData = calculatePeterLynchMetrics(data);
  if (peterLynchData.priceToLynch !== null) {
    factors++;
    const ratio = peterLynchData.priceToLynch;
    if (ratio <= 0.7) score += 40; // Deutlich unterbewertet
    else if (ratio <= 0.9) score += 35; // Unterbewertet
    else if (ratio <= 1.1) score += 28; // Fair bewertet
    else if (ratio <= 1.3) score += 20; // Leicht überbewertet
    else if (ratio <= 1.5) score += 10; // Überbewertet
    else score += 5; // Deutlich überbewertet
  }

  return factors > 0 ? Math.round(score / factors * 100 / 100) : 0;
}

/**
 * Berechnet Momentum (0-100)
 * Basiert auf: Kursentwicklung, relative Performance
 */
function calculateMomentum(data: StockData): number {
  const historicalData = data.historicalData;
  const stockInfo = data.stockInfo;
  
  if (!historicalData || !Array.isArray(historicalData) || historicalData.length < 20) {
    return 0;
  }

  let score = 0;
  let factors = 0;

  const currentPrice = stockInfo?.price || historicalData[0]?.close;
  if (!currentPrice) return 0;

  // 1-Monats-Performance - max 25 Punkte
  if (historicalData.length >= 20) {
    factors++;
    const monthAgoPrice = historicalData[19]?.close;
    if (monthAgoPrice) {
      const monthReturn = ((currentPrice - monthAgoPrice) / monthAgoPrice) * 100;
      if (monthReturn >= 10) score += 25;
      else if (monthReturn >= 5) score += 20;
      else if (monthReturn >= 0) score += 15;
      else if (monthReturn >= -5) score += 10;
      else score += 5;
    }
  }

  // 3-Monats-Performance - max 25 Punkte
  if (historicalData.length >= 60) {
    factors++;
    const threeMonthsAgoPrice = historicalData[59]?.close;
    if (threeMonthsAgoPrice) {
      const quarterReturn = ((currentPrice - threeMonthsAgoPrice) / threeMonthsAgoPrice) * 100;
      if (quarterReturn >= 20) score += 25;
      else if (quarterReturn >= 10) score += 20;
      else if (quarterReturn >= 0) score += 15;
      else if (quarterReturn >= -10) score += 10;
      else score += 5;
    }
  }

  // 6-Monats-Performance - max 25 Punkte
  if (historicalData.length >= 120) {
    factors++;
    const sixMonthsAgoPrice = historicalData[119]?.close;
    if (sixMonthsAgoPrice) {
      const halfYearReturn = ((currentPrice - sixMonthsAgoPrice) / sixMonthsAgoPrice) * 100;
      if (halfYearReturn >= 30) score += 25;
      else if (halfYearReturn >= 15) score += 20;
      else if (halfYearReturn >= 0) score += 15;
      else if (halfYearReturn >= -15) score += 10;
      else score += 5;
    }
  }

  // 12-Monats-Performance - max 25 Punkte
  if (historicalData.length >= 250) {
    factors++;
    const yearAgoPrice = historicalData[249]?.close;
    if (yearAgoPrice) {
      const yearReturn = ((currentPrice - yearAgoPrice) / yearAgoPrice) * 100;
      if (yearReturn >= 40) score += 25;
      else if (yearReturn >= 20) score += 20;
      else if (yearReturn >= 0) score += 15;
      else if (yearReturn >= -20) score += 10;
      else score += 5;
    }
  }

  return factors > 0 ? Math.round(score / factors * 100 / 100) : 0;
}

/**
 * Berechnet Qualitative Score (0-100)
 * Nur wenn KI-Analyse vorhanden
 */
function calculateQualitative(data: StockData): number | null {
  const buffettCriteria = data.buffettCriteria;
  const gptAnalysis = data.gptAnalysis;

  // Prüfen ob KI-Analyse vorhanden
  if (!gptAnalysis || !buffettCriteria) {
    return null;
  }

  let score = 0;
  let maxScore = 0;

  // Buffett Kriterien durchgehen (jeweils max 10 Punkte pro erfülltem Kriterium)
  if (buffettCriteria) {
    const criteria = buffettCriteria;
    
    // Wettbewerbsvorteil
    if (criteria.moat !== undefined) {
      maxScore += 15;
      if (criteria.moat.status === 'pass') score += 15;
      else if (criteria.moat.status === 'partial') score += 8;
    }

    // Management Qualität
    if (criteria.management !== undefined) {
      maxScore += 15;
      if (criteria.management.status === 'pass') score += 15;
      else if (criteria.management.status === 'partial') score += 8;
    }

    // Geschäftsmodell Verständlichkeit
    if (criteria.businessUnderstanding !== undefined) {
      maxScore += 15;
      if (criteria.businessUnderstanding.status === 'pass') score += 15;
      else if (criteria.businessUnderstanding.status === 'partial') score += 8;
    }

    // Vorhersagbarkeit
    if (criteria.predictability !== undefined) {
      maxScore += 15;
      if (criteria.predictability.status === 'pass') score += 15;
      else if (criteria.predictability.status === 'partial') score += 8;
    }

    // Langfristiges Potenzial
    if (criteria.longTermProspects !== undefined) {
      maxScore += 10;
      if (criteria.longTermProspects.status === 'pass') score += 10;
      else if (criteria.longTermProspects.status === 'partial') score += 5;
    }

    // Kapitaleffizienz
    if (criteria.capitalEfficiency !== undefined) {
      maxScore += 10;
      if (criteria.capitalEfficiency.status === 'pass') score += 10;
      else if (criteria.capitalEfficiency.status === 'partial') score += 5;
    }

    // Shareholderfreundlichkeit
    if (criteria.shareholderFriendly !== undefined) {
      maxScore += 10;
      if (criteria.shareholderFriendly.status === 'pass') score += 10;
      else if (criteria.shareholderFriendly.status === 'partial') score += 5;
    }

    // Risiken
    if (criteria.risks !== undefined) {
      maxScore += 10;
      if (criteria.risks.status === 'pass') score += 10;
      else if (criteria.risks.status === 'partial') score += 5;
    }
  }

  if (maxScore === 0) return null;
  
  return Math.round((score / maxScore) * 100);
}

/**
 * Berechnet Peter Lynch Metriken
 */
function calculatePeterLynchMetrics(data: StockData): {
  fairValue: number | null;
  priceToLynch: number | null;
} {
  const metrics = data.financialMetrics;
  const stockInfo = data.stockInfo;
  
  if (!metrics || !stockInfo?.price) {
    return { fairValue: null, priceToLynch: null };
  }

  const pe = metrics.PE;
  const epsGrowth = metrics.EPS_CAGR ? metrics.EPS_CAGR * 100 : null;
  const divYield = metrics.DivRendite ? metrics.DivRendite * 100 : 0;

  if (!pe || pe <= 0 || !epsGrowth || epsGrowth <= 0) {
    return { fairValue: null, priceToLynch: null };
  }

  // Peter Lynch Fair Value: Wachstum + Dividende sollte etwa gleich PE sein
  // Fair PE = Wachstum + Dividende
  const fairPE = epsGrowth + divYield;
  
  // Fair Value = EPS * Fair PE
  const eps = stockInfo.price / pe; // Rückrechnung EPS aus Preis und PE
  const fairValue = eps * fairPE;

  // Preis zu Fair Value Verhältnis
  const priceToLynch = stockInfo.price / fairValue;

  return {
    fairValue: Math.round(fairValue * 100) / 100,
    priceToLynch: Math.round(priceToLynch * 100) / 100
  };
}

/**
 * Prüft ob wesentliche Datenlücken vorhanden sind
 */
function hasDataGaps(data: StockData): boolean {
  const metrics = data.financialMetrics;
  if (!metrics) return true;

  // Kritische Kennzahlen prüfen
  const criticalMetrics = [
    'ROE_10J_avg',
    'Nettomarge_10J_avg',
    'EPS_CAGR',
    'PE',
    'DtoE',
    'CurrentRatio'
  ];

  let missingCount = 0;
  for (const metric of criticalMetrics) {
    if (metrics[metric] === undefined || metrics[metric] === null) {
      missingCount++;
    }
  }

  // Wenn mehr als 2 kritische Metriken fehlen
  return missingCount > 2;
}

/**
 * Tooltip-Definitionen
 */
const TOOLTIPS = {
  financialStrength: {
    title: "Finanzielle Stärke",
    what: "Misst die Stabilität der Bilanz: Verschuldung, Liquidität und Zinslast.",
    why: "Starke Finanzen schützen vor Krisen und ermöglichen Investitionen.",
    good: "Hoher Score = gesunde Bilanz, niedrige Schulden, hohe Liquidität."
  },
  profitability: {
    title: "Profitabilität",
    what: "Bewertet Gewinnmargen, Eigenkapitalrendite und Cash-Qualität.",
    why: "Profitable Unternehmen schaffen nachhaltig Wert für Aktionäre.",
    good: "Hoher Score = starke Margen, hohe Renditen, solider Cash Flow."
  },
  growth: {
    title: "Wachstum",
    what: "Analysiert EPS-Wachstum, Umsatzentwicklung und FCF-Trends.",
    why: "Wachstum treibt langfristige Kurssteigerungen.",
    good: "Hoher Score = konsistentes, nachhaltiges Wachstum über Jahre."
  },
  value: {
    title: "Bewertung",
    what: "Vergleicht Aktienkurs mit Buchwert, Gewinn und Fair Value.",
    why: "Günstig bewertete Aktien bieten mehr Sicherheitsmarge.",
    good: "Hoher Score = attraktive Bewertung, gutes Chance-Risiko-Verhältnis."
  },
  momentum: {
    title: "Momentum",
    what: "Misst Kursentwicklung über 1, 3, 6 und 12 Monate.",
    why: "Momentum zeigt Marktvertrauen und Trendstärke.",
    good: "Hoher Score = positive Kursdynamik, starker Aufwärtstrend."
  },
  qualitative: {
    title: "Qualitative Faktoren",
    what: "KI-Analyse zu Wettbewerbsvorteil, Management, Geschäftsmodell.",
    why: "Qualität unterscheidet langfristige Gewinner von Verlierern.",
    good: "Hoher Score = starker Burggraben, exzellentes Management, klares Geschäft."
  }
} as const;

/**
 * Hauptfunktion: Berechnet alle Aesy Score Komponenten
 */
export function calculateAesyScore(data: StockData): AesyScoreResult {
  const financialStrength = calculateFinancialStrength(data);
  const profitability = calculateProfitability(data);
  const growth = calculateGrowth(data);
  const value = calculateValue(data);
  const momentum = calculateMomentum(data);
  const qualitative = calculateQualitative(data);
  
  const peterLynchMetrics = calculatePeterLynchMetrics(data);
  
  // Gesamtscore berechnen
  const scores = [financialStrength, profitability, growth, value, momentum];
  if (qualitative !== null) {
    scores.push(qualitative);
  }
  
  const aesyScore = scores.length > 0 
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
    : 0;

  return {
    financialStrength,
    profitability,
    growth,
    value,
    momentum,
    qualitative,
    aesyScore,
    peterLynch: peterLynchMetrics,
    notes: {
      aiIncluded: qualitative !== null,
      hasDataGaps: hasDataGaps(data)
    },
    tooltips: TOOLTIPS
  };
}

/**
 * Hook für React-Komponenten
 */
export function useAesyScore(stockData: StockData) {
  return calculateAesyScore(stockData);
}
