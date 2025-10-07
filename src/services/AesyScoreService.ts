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
  attention?: string;
}

interface StockData {
  stockInfo?: any;
  financialMetrics?: any;
  historicalData?: any;
  overallRating?: any;
  buffettCriteria?: any;
  gptAnalysis?: any;
  companyProfile?: {
    sector?: string;
    industry?: string;
  };
}

/**
 * Sektor-Kategorien für spezifische Bewertungslogik
 */
enum SectorType {
  BANK = 'BANK',
  INSURANCE = 'INSURANCE',
  REIT = 'REIT',
  UTILITY = 'UTILITY',
  STANDARD = 'STANDARD'
}

/**
 * Erkennt den Sektor-Typ basierend auf Sektor/Branche
 */
function detectSectorType(data: StockData): SectorType {
  const sector = data.companyProfile?.sector?.toLowerCase() || '';
  const industry = data.companyProfile?.industry?.toLowerCase() || '';
  
  // Banken & Finanzdienstleister
  if (sector.includes('financial') || industry.includes('bank') || 
      industry.includes('financial services') || industry.includes('capital markets')) {
    return SectorType.BANK;
  }
  
  // Versicherungen
  if (industry.includes('insurance') || industry.includes('versicherung')) {
    return SectorType.INSURANCE;
  }
  
  // REITs (Real Estate Investment Trusts)
  if (industry.includes('reit') || industry.includes('real estate investment')) {
    return SectorType.REIT;
  }
  
  // Versorger (Utilities)
  if (sector.includes('utilities') || sector.includes('utility') || 
      industry.includes('electric') || industry.includes('gas') || industry.includes('water')) {
    return SectorType.UTILITY;
  }
  
  return SectorType.STANDARD;
}

/**
 * Berechnet Financial Strength (0-100)
 * Basiert auf: Verschuldung, Liquidität, Zinsdeckung
 * Sektor-spezifische Anpassungen für Banken, Versicherer, REITs
 */
function calculateFinancialStrength(data: StockData): number {
  const metrics = data.financialMetrics;
  if (!metrics) return 0;

  const sectorType = detectSectorType(data);
  let score = 0;
  let factors = 0;

  // Verschuldungsgrad (D/E) - max 40 Punkte
  // Banken, Versicherungen & REITs arbeiten mit mehr Leverage - angepasste Schwellen
  if (metrics.DtoE !== undefined && metrics.DtoE !== null) {
    factors++;
    
    if (sectorType === SectorType.BANK || sectorType === SectorType.INSURANCE) {
      // Banken/Versicherungen: Höhere Verschuldung ist normal
      if (metrics.DtoE <= 5.0) score += 40;
      else if (metrics.DtoE <= 8.0) score += 30;
      else if (metrics.DtoE <= 12.0) score += 20;
      else if (metrics.DtoE <= 15.0) score += 10;
    } else if (sectorType === SectorType.REIT) {
      // REITs: Mittlere Verschuldung akzeptabel
      if (metrics.DtoE <= 0.8) score += 40;
      else if (metrics.DtoE <= 1.5) score += 30;
      else if (metrics.DtoE <= 2.5) score += 20;
      else if (metrics.DtoE <= 3.5) score += 10;
    } else if (sectorType === SectorType.UTILITY) {
      // Versorger: Höhere Verschuldung normal (kapitalintensiv)
      if (metrics.DtoE <= 1.0) score += 40;
      else if (metrics.DtoE <= 1.5) score += 30;
      else if (metrics.DtoE <= 2.5) score += 20;
      else if (metrics.DtoE <= 3.5) score += 10;
    } else {
      // Standard-Unternehmen
      if (metrics.DtoE <= 0.3) score += 40;
      else if (metrics.DtoE <= 0.5) score += 30;
      else if (metrics.DtoE <= 1.0) score += 20;
      else if (metrics.DtoE <= 2.0) score += 10;
    }
  }

  // Current Ratio - max 30 Punkte
  // Für Banken/Versicherungen weniger relevant
  if (metrics.CurrentRatio !== undefined && metrics.CurrentRatio !== null) {
    if (sectorType !== SectorType.BANK && sectorType !== SectorType.INSURANCE) {
      factors++;
      if (metrics.CurrentRatio >= 2.0) score += 30;
      else if (metrics.CurrentRatio >= 1.5) score += 25;
      else if (metrics.CurrentRatio >= 1.0) score += 15;
      else score += 5;
    }
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
 * Sektor-spezifische Erwartungen
 */
function calculateProfitability(data: StockData): number {
  const metrics = data.financialMetrics;
  if (!metrics) return 0;

  const sectorType = detectSectorType(data);
  let score = 0;
  let factors = 0;

  // ROE 10J Durchschnitt - max 40 Punkte
  // Banken haben typischerweise niedrigere ROE als Tech-Unternehmen
  if (metrics.ROE_10J_avg !== undefined && metrics.ROE_10J_avg !== null) {
    factors++;
    const roe = metrics.ROE_10J_avg * 100; // in Prozent
    
    if (sectorType === SectorType.BANK || sectorType === SectorType.INSURANCE) {
      // Finanzsektor: 10-15% ROE ist gut
      if (roe >= 15) score += 40;
      else if (roe >= 12) score += 35;
      else if (roe >= 10) score += 30;
      else if (roe >= 8) score += 20;
      else if (roe >= 5) score += 10;
    } else if (sectorType === SectorType.REIT) {
      // REITs: ROE weniger aussagekräftig, aber 8-12% ist gut
      if (roe >= 12) score += 40;
      else if (roe >= 10) score += 35;
      else if (roe >= 8) score += 30;
      else if (roe >= 6) score += 20;
      else if (roe >= 4) score += 10;
    } else if (sectorType === SectorType.UTILITY) {
      // Versorger: 8-12% ROE ist gut (reguliertes Geschäft)
      if (roe >= 12) score += 40;
      else if (roe >= 10) score += 35;
      else if (roe >= 8) score += 30;
      else if (roe >= 6) score += 20;
      else if (roe >= 4) score += 10;
    } else {
      // Standard: höhere Erwartungen
      if (roe >= 20) score += 40;
      else if (roe >= 15) score += 30;
      else if (roe >= 10) score += 20;
      else if (roe >= 5) score += 10;
    }
  }

  // Nettomarge 10J Durchschnitt - max 30 Punkte
  // Sektor-spezifische Margen-Erwartungen
  if (metrics.Nettomarge_10J_avg !== undefined && metrics.Nettomarge_10J_avg !== null) {
    factors++;
    const margin = metrics.Nettomarge_10J_avg * 100;
    
    if (sectorType === SectorType.BANK || sectorType === SectorType.INSURANCE) {
      // Finanzsektor: 15-25% Marge ist gut
      if (margin >= 25) score += 30;
      else if (margin >= 20) score += 28;
      else if (margin >= 15) score += 25;
      else if (margin >= 10) score += 15;
      else if (margin >= 5) score += 10;
    } else if (sectorType === SectorType.UTILITY) {
      // Versorger: 5-15% Marge ist normal
      if (margin >= 15) score += 30;
      else if (margin >= 12) score += 28;
      else if (margin >= 10) score += 25;
      else if (margin >= 7) score += 20;
      else if (margin >= 5) score += 15;
    } else {
      // Standard & REITs
      if (margin >= 20) score += 30;
      else if (margin >= 15) score += 25;
      else if (margin >= 10) score += 20;
      else if (margin >= 5) score += 10;
    }
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
 * Sektor-spezifische Wachstumserwartungen
 */
function calculateGrowth(data: StockData): number {
  const metrics = data.financialMetrics;
  if (!metrics) return 0;

  const sectorType = detectSectorType(data);
  let score = 0;
  let factors = 0;

  // EPS CAGR - max 40 Punkte
  // Versorger & REITs: niedrigere Wachstumserwartungen
  if (metrics.EPS_CAGR !== undefined && metrics.EPS_CAGR !== null) {
    factors++;
    const cagr = metrics.EPS_CAGR * 100;
    
    if (sectorType === SectorType.UTILITY || sectorType === SectorType.REIT) {
      // Versorger/REITs: 3-7% Wachstum ist gut (stabile, dividendenstarke Geschäfte)
      if (cagr >= 7) score += 40;
      else if (cagr >= 5) score += 35;
      else if (cagr >= 3) score += 30;
      else if (cagr >= 1) score += 20;
      else if (cagr >= 0) score += 15;
    } else if (sectorType === SectorType.BANK || sectorType === SectorType.INSURANCE) {
      // Finanzsektor: 5-10% Wachstum ist gut
      if (cagr >= 12) score += 40;
      else if (cagr >= 10) score += 35;
      else if (cagr >= 7) score += 30;
      else if (cagr >= 5) score += 25;
      else if (cagr >= 3) score += 15;
      else if (cagr >= 0) score += 10;
    } else {
      // Standard: höhere Wachstumserwartungen
      if (cagr >= 15) score += 40;
      else if (cagr >= 10) score += 30;
      else if (cagr >= 5) score += 20;
      else if (cagr >= 0) score += 10;
    }
  }

  // Umsatzwachstum (falls vorhanden)
  if (metrics.RevenueCAGR !== undefined && metrics.RevenueCAGR !== null) {
    factors++;
    const revGrowth = metrics.RevenueCAGR * 100;
    
    if (sectorType === SectorType.UTILITY || sectorType === SectorType.REIT) {
      // Versorger/REITs: 2-5% Umsatzwachstum ist gut
      if (revGrowth >= 5) score += 30;
      else if (revGrowth >= 3) score += 25;
      else if (revGrowth >= 1) score += 20;
      else if (revGrowth >= 0) score += 15;
    } else {
      // Standard & Finanzsektor
      if (revGrowth >= 15) score += 30;
      else if (revGrowth >= 10) score += 25;
      else if (revGrowth >= 5) score += 20;
      else if (revGrowth >= 0) score += 10;
    }
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
 * Sektor-spezifische Bewertungs-Maßstäbe
 */
function calculateValue(data: StockData): number {
  const metrics = data.financialMetrics;
  const stockInfo = data.stockInfo;
  if (!metrics) return 0;

  const sectorType = detectSectorType(data);
  let score = 0;
  let factors = 0;

  // P/E Ratio - max 35 Punkte
  // Sektor-spezifische P/E Erwartungen
  if (metrics.PE !== undefined && metrics.PE !== null && metrics.PE > 0) {
    factors++;
    
    if (sectorType === SectorType.BANK || sectorType === SectorType.INSURANCE) {
      // Finanzsektor: P/E 8-12 ist normal
      if (metrics.PE <= 10) score += 35;
      else if (metrics.PE <= 12) score += 30;
      else if (metrics.PE <= 15) score += 25;
      else if (metrics.PE <= 20) score += 15;
      else score += 5;
    } else if (sectorType === SectorType.REIT) {
      // REITs: P/E 10-18 ist typisch (aber FFO wichtiger)
      if (metrics.PE <= 15) score += 35;
      else if (metrics.PE <= 18) score += 30;
      else if (metrics.PE <= 22) score += 25;
      else if (metrics.PE <= 28) score += 15;
      else score += 5;
    } else if (sectorType === SectorType.UTILITY) {
      // Versorger: P/E 12-18 ist normal (stabile Erträge)
      if (metrics.PE <= 15) score += 35;
      else if (metrics.PE <= 18) score += 30;
      else if (metrics.PE <= 22) score += 25;
      else if (metrics.PE <= 28) score += 15;
      else score += 5;
    } else {
      // Standard: P/E 15-25 je nach Wachstum
      if (metrics.PE <= 15) score += 35;
      else if (metrics.PE <= 20) score += 28;
      else if (metrics.PE <= 25) score += 20;
      else if (metrics.PE <= 35) score += 10;
      else score += 5;
    }
  }

  // P/B Ratio - max 25 Punkte
  // Für Banken/Versicherungen ist P/B sehr wichtig
  if (metrics.PB !== undefined && metrics.PB !== null && metrics.PB > 0) {
    factors++;
    
    if (sectorType === SectorType.BANK || sectorType === SectorType.INSURANCE) {
      // Finanzsektor: P/B ist Schlüsselkennzahl (0.8-1.2 ist gut)
      if (metrics.PB <= 1.0) score += 25;
      else if (metrics.PB <= 1.3) score += 22;
      else if (metrics.PB <= 1.6) score += 18;
      else if (metrics.PB <= 2.0) score += 12;
      else score += 5;
    } else {
      // Standard, REITs, Versorger
      if (metrics.PB <= 2) score += 25;
      else if (metrics.PB <= 3) score += 20;
      else if (metrics.PB <= 5) score += 15;
      else if (metrics.PB <= 8) score += 8;
      else score += 3;
    }
  }

  // Peter Lynch Vergleich - max 40 Punkte
  // Für Versorger/REITs weniger relevant (Dividendenrendite wichtiger)
  const peterLynchData = calculatePeterLynchMetrics(data);
  if (peterLynchData.priceToLynch !== null) {
    factors++;
    const ratio = peterLynchData.priceToLynch;
    
    if (sectorType === SectorType.UTILITY || sectorType === SectorType.REIT) {
      // Etwas großzügigere Bewertung für Versorger/REITs
      if (ratio <= 0.8) score += 40;
      else if (ratio <= 1.0) score += 35;
      else if (ratio <= 1.2) score += 30;
      else if (ratio <= 1.4) score += 20;
      else if (ratio <= 1.6) score += 10;
      else score += 5;
    } else {
      // Standard & Finanzsektor
      if (ratio <= 0.7) score += 40;
      else if (ratio <= 0.9) score += 35;
      else if (ratio <= 1.1) score += 28;
      else if (ratio <= 1.3) score += 20;
      else if (ratio <= 1.5) score += 10;
      else score += 5;
    }
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
 * Tooltip-Definitionen in Alltagssprache
 */
const TOOLTIPS = {
  financialStrength: {
    title: "Finanzielle Stärke",
    what: "Wie gesund sind die Finanzen des Unternehmens? Hier schauen wir auf Schulden, verfügbares Geld und ob die Firma ihre Zinsen locker zahlen kann.",
    why: "Unternehmen mit starken Finanzen überstehen Krisen besser und können auch in schwierigen Zeiten investieren und wachsen. Weniger Schulden bedeuten weniger Risiko für Aktionäre.",
    good: "Ein hoher Score bedeutet: Das Unternehmen hat wenig Schulden, viel Geld auf dem Konto und kann seine Zinsen problemlos bezahlen.",
    attention: "Achtung: Manche Branchen (z.B. Banken, Versorger) arbeiten naturgemäß mit mehr Schulden – das ist dort normal."
  },
  profitability: {
    title: "Profitabilität",
    what: "Wie profitabel arbeitet das Unternehmen? Wir prüfen, wie viel Gewinn aus dem Umsatz übrig bleibt und wie gut das eingesetzte Kapital verzinst wird.",
    why: "Nur profitable Firmen schaffen dauerhaft Wert. Hohe Margen zeigen, dass das Unternehmen seine Produkte zu guten Preisen verkaufen kann und nicht im Preiskampf feststeckt.",
    good: "Ein hoher Score heißt: Das Unternehmen verdient gut, der Gewinn ist stabil und der Cash Flow ist stark (nicht nur Buchgewinne).",
    attention: "Achtung: Einmalige Sondereffekte (Verkäufe, Abschreibungen) können die Zahlen verzerren."
  },
  growth: {
    title: "Wachstum",
    what: "Wächst das Unternehmen? Hier schauen wir, ob Umsatz, Gewinn und freier Cashflow über die Jahre gestiegen sind.",
    why: "Wachsende Unternehmen können ihre Gewinne steigern – und das treibt langfristig den Aktienkurs. Stillstand oder Schrumpfung sind meist Warnsignale.",
    good: "Ein hoher Score bedeutet: Das Unternehmen ist in den letzten Jahren konstant und nachhaltig gewachsen – nicht nur durch Zukäufe, sondern aus eigener Kraft.",
    attention: "Achtung: Künstliches Wachstum durch teure Übernahmen oder aggressive Bilanzierung ist kritisch zu sehen."
  },
  value: {
    title: "Bewertung",
    what: "Ist die Aktie günstig oder teuer? Wir vergleichen den aktuellen Kurs mit dem Buchwert, dem Gewinn und dem fairen Wert nach Peter Lynch.",
    why: "Selbst das beste Unternehmen kann eine schlechte Investition sein, wenn man zu viel bezahlt. Eine günstige Bewertung bietet eine Sicherheitsmarge.",
    good: "Ein hoher Score heißt: Die Aktie ist attraktiv bewertet – der Preis liegt unter oder nahe am fairen Wert. Gutes Chance-Risiko-Verhältnis.",
    attention: "Achtung: Manchmal sind Aktien aus gutem Grund billig (schlechte Aussichten). Immer die Gesamtsituation prüfen!"
  },
  momentum: {
    title: "Momentum",
    what: "Wie hat sich der Aktienkurs in letzter Zeit entwickelt? Wir schauen auf 1, 3, 6 und 12 Monate zurück.",
    why: "Momentum zeigt, ob die Börse dem Unternehmen gerade vertraut oder nicht. Starkes Momentum kann auf positive Entwicklungen hindeuten.",
    good: "Ein hoher Score bedeutet: Die Aktie hat in letzter Zeit gut performt – der Trend zeigt nach oben und das Marktvertrauen ist da.",
    attention: "Achtung: Momentum ist kurzfristig und kann schnell drehen. Nicht das wichtigste Kriterium für langfristige Investoren."
  },
  qualitative: {
    title: "Qualitative Faktoren",
    what: "Was macht das Unternehmen besonders? Eine KI analysiert Wettbewerbsvorteile (\"Burggraben\"), Managementqualität und Geschäftsmodell.",
    why: "Die besten Zahlen nützen nichts, wenn die Firma keinen dauerhaften Vorteil hat. Starke Marken, Patente oder Netzwerkeffekte schützen vor Konkurrenz.",
    good: "Ein hoher Score heißt: Das Unternehmen hat einen echten Burggraben, ein Top-Management und ein verständliches, zukunftsfähiges Geschäftsmodell.",
    attention: "Achtung: Diese Säule basiert auf KI-Analyse und ist nur verfügbar, wenn Deep Research durchgeführt wurde."
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
  // Ohne Qualitative: Durchschnitt der 5 Säulen
  // Mit Qualitative: Qualitative 10%, andere Säulen je 18%
  let aesyScore: number;
  
  if (qualitative !== null) {
    aesyScore = Math.round(
      0.18 * financialStrength + 
      0.18 * profitability + 
      0.18 * growth + 
      0.18 * value + 
      0.18 * momentum + 
      0.10 * qualitative
    );
  } else {
    aesyScore = Math.round(
      (financialStrength + profitability + growth + value + momentum) / 5
    );
  }

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
