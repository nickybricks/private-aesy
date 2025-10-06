/**
 * Central threshold definitions for all Buffett metrics
 * These thresholds are used consistently across the entire app
 */

export const BUFFETT_THRESHOLDS = {
  // Profitability & Growth Metrics
  ROE: {
    excellent: 15,    // >= 15% is excellent
    good: 10,        // >= 10% is acceptable
    weak: 5,         // >= 5% is weak
  },
  ROIC: {
    excellent: 12,   // >= 12% is excellent
    good: 8,         // >= 8% is acceptable
    weak: 4,         // >= 4% is weak
  },
  NET_MARGIN: {
    excellent: 15,   // >= 15% is excellent
    good: 10,        // >= 10% is acceptable
    weak: 5,         // >= 5% is weak
  },
  EPS_GROWTH: {
    excellent: 10,   // >= 10% CAGR is excellent
    good: 5,         // >= 5% CAGR is acceptable
    weak: 0,         // >= 0% is weak (no negative growth)
  },
  
  // Valuation Metrics
  PE_RATIO: {
    cheap: 12,       // < 12 is cheap
    fair: 20,        // < 20 is fair
    expensive: 20,   // >= 20 is expensive
  },
  PB_RATIO: {
    cheap: 1.0,      // < 1.0 is cheap
    fair: 3.0,       // < 3.0 is fair
    expensive: 3.0,  // >= 3.0 is expensive
  },
  PCF_RATIO: {
    cheap: 10,       // < 10 is cheap
    fair: 15,        // < 15 is fair
    expensive: 15,   // >= 15 is expensive
  },
  DIVIDEND_YIELD: {
    excellent: 4,    // >= 4% is excellent
    good: 2,         // >= 2% is good
    low: 2,          // < 2% is low
  },
  
  // Debt & Stability Metrics
  DEBT_TO_EBITDA: {
    excellent: 1.0,  // < 1.0 is excellent
    good: 2.0,       // < 2.0 is good
    acceptable: 3.0, // < 3.0 is acceptable
    risky: 3.0,      // >= 3.0 is risky
  },
  DEBT_TO_ASSETS: {
    excellent: 0.3,  // < 30% is excellent
    good: 0.5,       // < 50% is good
    risky: 0.5,      // >= 50% is risky
  },
  INTEREST_COVERAGE: {
    excellent: 7,    // >= 7 is excellent
    good: 5,         // >= 5 is good
    acceptable: 3,   // >= 3 is acceptable
    risky: 3,        // < 3 is risky
  },
  
  // Liquidity & Cashflow Metrics
  CURRENT_RATIO: {
    excellent: 2.0,  // >= 2.0 is excellent
    good: 1.5,       // >= 1.5 is good
    acceptable: 1.0, // >= 1.0 is acceptable
    risky: 1.0,      // < 1.0 is risky
  },
  QUICK_RATIO: {
    excellent: 1.0,  // >= 1.0 is excellent
    acceptable: 0.8, // >= 0.8 is acceptable
    risky: 0.8,      // < 0.8 is risky
  },
  OCF_TO_NET_INCOME: {
    excellent: 1.0,  // >= 1.0 is excellent (OCF >= net income)
    good: 0.8,       // >= 0.8 is good
    weak: 0.8,       // < 0.8 is weak
  },
  FCF_MARGIN: {
    excellent: 7,    // >= 7% is excellent
    good: 5,         // >= 5% is good
    weak: 0,         // < 5% but positive is weak
  },
} as const;

export type BuffettThresholds = typeof BUFFETT_THRESHOLDS;
