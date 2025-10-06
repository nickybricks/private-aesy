/**
 * Zentrale Schwellenwerte für Warren Buffett Investment-Kriterien
 * Diese Schwellenwerte werden konsistent in beiden Tabs verwendet:
 * - "Finanzkennzahlen" Tab
 * - "Deep-Research" Tab
 */

export const BUFFETT_THRESHOLDS = {
  // Profitabilität & Wachstum (10 Jahre Durchschnitt bevorzugt)
  ROE: {
    excellent: 15,  // Buffett bevorzugt ≥15%
    good: 10,
    acceptable: 7,
    weak: 5
  },
  
  NET_MARGIN: {
    excellent: 15,  // Buffett bevorzugt ≥15%
    good: 10,
    acceptable: 5,
    weak: 3
  },
  
  EPS_GROWTH: {
    excellent: 10,  // Buffett bevorzugt ≥10% CAGR
    good: 7,
    acceptable: 5,
    weak: 0
  },
  
  // Bewertung (TTM-basiert)
  PE: {
    undervalued: 15,
    fair: 20,
    acceptable: 25,
    expensive: 30
  },
  
  PB: {
    undervalued: 1.5,
    fair: 2,
    acceptable: 3,
    expensive: 5
  },
  
  PCF: {
    undervalued: 10,
    fair: 15,
    acceptable: 20,
    expensive: 25
  },
  
  DIVIDEND_YIELD: {
    high: 4,      // ≥4% = Hoch
    good: 2,      // 2-4% = Gut
    low: 1,       // 1-2% = Niedrig
    minimal: 0    // <1% oder keine Dividende
  },
  
  // Verschuldung & Stabilität
  DEBT_TO_EQUITY: {
    excellent: 0.3,   // <30% = Hervorragend
    good: 0.5,        // <50% = Gut
    acceptable: 1.0,  // <100% = Akzeptabel
    high: 2.0         // >200% = Hoch
  },
  
  NET_DEBT_TO_EBITDA: {
    excellent: 1,     // ≤1 = Hervorragend
    good: 2,          // <2 = Gut
    acceptable: 3,    // 2-3 = Akzeptabel
    high: 4           // >4 = Hoch
  },
  
  CURRENT_RATIO: {
    excellent: 2.0,   // ≥2.0 = Hervorragend
    good: 1.5,        // ≥1.5 = Gut
    acceptable: 1.0,  // ≥1.0 = Akzeptabel
    weak: 0.8         // <1.0 = Schwach
  },
  
  QUICK_RATIO: {
    excellent: 1.5,   // ≥1.5 = Hervorragend
    good: 1.0,        // ≥1.0 = Gut
    acceptable: 0.8,  // 0.8-1.0 = Akzeptabel
    weak: 0.5         // <0.8 = Schwach
  },
  
  INTEREST_COVERAGE: {
    excellent: 10,    // ≥10 = Hervorragend
    good: 5,          // ≥5 = Gut (Buffett-Mindestanforderung)
    acceptable: 3,    // 3-5 = Akzeptabel
    weak: 1.5         // <3 = Schwach
  },
  
  // Liquidität & Cashflow (5 Jahre Durchschnitt)
  CAPEX_QUOTE: {
    low: 5,           // <5% = Niedrig (Capital-light Business)
    moderate: 10,     // 5-10% = Moderat
    high: 15,         // 10-15% = Hoch
    veryHigh: 20      // >15% = Sehr hoch (Capital-intensive)
  },
  
  OCF_QUALITY: {
    excellent: 1.5,   // OCF/NetIncome ≥1.5 = Hervorragend
    good: 1.0,        // ≥1.0 = Gut (OCF ≥ NetIncome)
    acceptable: 0.8,  // 0.8-1.0 = Akzeptabel
    weak: 0.5         // <0.8 = Schwach
  },
  
  FCF_MARGIN: {
    excellent: 15,    // ≥15% = Hervorragend
    good: 10,         // ≥10% = Gut
    acceptable: 7,    // ≥7% = Akzeptabel
    weak: 3           // <7% = Schwach
  },
  
  // Moat Indikatoren
  GROSS_MARGIN: {
    excellent: 40,    // ≥40% = Starker Moat
    good: 30,         // 30-40% = Guter Moat
    acceptable: 20,   // 20-30% = Moderater Moat
    weak: 10          // <20% = Schwacher Moat
  },
  
  OPERATING_MARGIN: {
    excellent: 20,    // ≥20% = Hervorragend
    good: 15,         // 15-20% = Gut
    acceptable: 10,   // 10-15% = Akzeptabel
    weak: 5           // <10% = Schwach
  },
  
  ROIC: {
    excellent: 15,    // ≥15% = Starker Moat
    good: 12,         // 12-15% = Guter Moat
    acceptable: 10,   // 10-12% = Moderater Moat
    weak: 7           // <10% = Schwacher Moat
  }
} as const;

/**
 * Status-Klassifikation basierend auf Schwellenwerten
 */
export type MetricStatus = 'pass' | 'warning' | 'fail';

/**
 * Helper-Funktionen zur Status-Ermittlung
 */
export const getROEStatus = (roe: number): MetricStatus => {
  if (roe >= BUFFETT_THRESHOLDS.ROE.excellent) return 'pass';
  if (roe >= BUFFETT_THRESHOLDS.ROE.acceptable) return 'warning';
  return 'fail';
};

export const getNetMarginStatus = (margin: number): MetricStatus => {
  if (margin >= BUFFETT_THRESHOLDS.NET_MARGIN.excellent) return 'pass';
  if (margin >= BUFFETT_THRESHOLDS.NET_MARGIN.acceptable) return 'warning';
  return 'fail';
};

export const getEPSGrowthStatus = (growth: number): MetricStatus => {
  if (growth >= BUFFETT_THRESHOLDS.EPS_GROWTH.excellent) return 'pass';
  if (growth >= BUFFETT_THRESHOLDS.EPS_GROWTH.acceptable) return 'warning';
  return 'fail';
};

export const getCurrentRatioStatus = (ratio: number): MetricStatus => {
  if (ratio >= BUFFETT_THRESHOLDS.CURRENT_RATIO.good) return 'pass';
  if (ratio >= BUFFETT_THRESHOLDS.CURRENT_RATIO.acceptable) return 'warning';
  return 'fail';
};

export const getQuickRatioStatus = (ratio: number): MetricStatus => {
  if (ratio >= BUFFETT_THRESHOLDS.QUICK_RATIO.good) return 'pass';
  if (ratio >= BUFFETT_THRESHOLDS.QUICK_RATIO.acceptable) return 'warning';
  return 'fail';
};

export const getNetDebtToEBITDAStatus = (ratio: number): MetricStatus => {
  if (ratio <= BUFFETT_THRESHOLDS.NET_DEBT_TO_EBITDA.excellent) return 'pass';
  if (ratio <= BUFFETT_THRESHOLDS.NET_DEBT_TO_EBITDA.good) return 'warning';
  return 'fail';
};

export const getInterestCoverageStatus = (coverage: number): MetricStatus => {
  if (coverage >= BUFFETT_THRESHOLDS.INTEREST_COVERAGE.good) return 'pass';
  if (coverage >= BUFFETT_THRESHOLDS.INTEREST_COVERAGE.acceptable) return 'warning';
  return 'fail';
};

export const getDebtToEquityStatus = (ratio: number): MetricStatus => {
  if (ratio <= BUFFETT_THRESHOLDS.DEBT_TO_EQUITY.good) return 'pass';
  if (ratio <= BUFFETT_THRESHOLDS.DEBT_TO_EQUITY.acceptable) return 'warning';
  return 'fail';
};

export const getOCFQualityStatus = (quality: number): MetricStatus => {
  if (quality >= BUFFETT_THRESHOLDS.OCF_QUALITY.good) return 'pass';
  if (quality >= BUFFETT_THRESHOLDS.OCF_QUALITY.acceptable) return 'warning';
  return 'fail';
};

export const getFCFMarginStatus = (margin: number): MetricStatus => {
  if (margin >= BUFFETT_THRESHOLDS.FCF_MARGIN.acceptable) return 'pass';
  if (margin >= BUFFETT_THRESHOLDS.FCF_MARGIN.weak) return 'warning';
  return 'fail';
};
