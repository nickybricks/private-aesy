/**
 * Central calculation service for all financial metrics
 * Provides consistent metric calculations with rolling-fallback logic (10J → 5J → 3J → TTM)
 */

import { BUFFETT_THRESHOLDS } from '@/constants/BuffettThresholds';

export type TimePeriodBadge = '10J' | '5J' | '3J' | 'TTM' | 'Datenlücke';
export type MetricStatus = 'pass' | 'warning' | 'fail';

export interface MetricResult {
  value: number | null;
  status: MetricStatus;
  timePeriod: TimePeriodBadge;
  explanation: string;
}

/**
 * Helper: Select best available period with rolling fallback
 * Priority: 10Y > 5Y > 3Y > TTM
 */
export const getBestAvailablePeriod = (
  data: any[],
  preferredYears: number
): { data: any[]; timePeriod: TimePeriodBadge } => {
  if (!data || data.length === 0) {
    return { data: [], timePeriod: 'Datenlücke' };
  }

  // Try 10 years
  if (preferredYears === 10 && data.length >= 10) {
    return { data: data.slice(0, 10), timePeriod: '10J' };
  }
  
  // Fallback to 5 years
  if (data.length >= 5) {
    return { data: data.slice(0, 5), timePeriod: '5J' };
  }
  
  // Fallback to 3 years
  if (data.length >= 3) {
    return { data: data.slice(0, 3), timePeriod: '3J' };
  }
  
  // Fallback to TTM (latest available)
  if (data.length >= 1) {
    return { data: [data[0]], timePeriod: 'TTM' };
  }
  
  return { data: [], timePeriod: 'Datenlücke' };
};

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 */
const calculateCAGR = (startValue: number, endValue: number, years: number): number => {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

/**
 * ===================
 * PROFITABILITY & GROWTH METRICS
 * ===================
 */

/**
 * ROE (Return on Equity) - 10-year average
 */
export const calculateROE = (
  incomeStatements: any[],
  balanceSheets: any[],
  ratios: any[]
): MetricResult => {
  const { data: selectedData, timePeriod } = getBestAvailablePeriod(ratios, 10);
  
  if (selectedData.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'Datenlücke',
      explanation: 'Keine Daten verfügbar'
    };
  }

  // Calculate average ROE over available period
  const roeValues = selectedData
    .map(r => r.returnOnEquity)
    .filter(v => v !== undefined && v !== null && !isNaN(v));
  
  if (roeValues.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod,
      explanation: 'Keine ROE-Daten verfügbar'
    };
  }

  const avgROE = (roeValues.reduce((sum, val) => sum + val, 0) / roeValues.length) * 100;

  let status: MetricStatus = 'fail';
  if (avgROE >= BUFFETT_THRESHOLDS.ROE.excellent) {
    status = 'pass';
  } else if (avgROE >= BUFFETT_THRESHOLDS.ROE.good) {
    status = 'warning';
  }

  return {
    value: avgROE,
    status,
    timePeriod,
    explanation: `Durchschnittliche ROE über ${timePeriod}: ${avgROE.toFixed(1)}%`
  };
};

/**
 * ROIC (Return on Invested Capital) - 10-year average
 */
export const calculateROIC = (
  incomeStatements: any[],
  balanceSheets: any[],
  keyMetrics: any[]
): MetricResult => {
  const { data: selectedData, timePeriod } = getBestAvailablePeriod(keyMetrics, 10);
  
  if (selectedData.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'Datenlücke',
      explanation: 'Keine Daten verfügbar'
    };
  }

  const roicValues = selectedData
    .map(m => m.roic)
    .filter(v => v !== undefined && v !== null && !isNaN(v));
  
  if (roicValues.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod,
      explanation: 'Keine ROIC-Daten verfügbar'
    };
  }

  const avgROIC = (roicValues.reduce((sum, val) => sum + val, 0) / roicValues.length) * 100;

  let status: MetricStatus = 'fail';
  if (avgROIC >= BUFFETT_THRESHOLDS.ROIC.excellent) {
    status = 'pass';
  } else if (avgROIC >= BUFFETT_THRESHOLDS.ROIC.good) {
    status = 'warning';
  }

  return {
    value: avgROIC,
    status,
    timePeriod,
    explanation: `Durchschnittliche ROIC über ${timePeriod}: ${avgROIC.toFixed(1)}%`
  };
};

/**
 * Net Profit Margin - 10-year average
 */
export const calculateNetMargin = (
  incomeStatements: any[],
  ratios: any[]
): MetricResult => {
  const { data: selectedData, timePeriod } = getBestAvailablePeriod(ratios, 10);
  
  if (selectedData.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'Datenlücke',
      explanation: 'Keine Daten verfügbar'
    };
  }

  const marginValues = selectedData
    .map(r => r.netProfitMargin)
    .filter(v => v !== undefined && v !== null && !isNaN(v));
  
  if (marginValues.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod,
      explanation: 'Keine Nettomargen-Daten verfügbar'
    };
  }

  const avgMargin = (marginValues.reduce((sum, val) => sum + val, 0) / marginValues.length) * 100;

  let status: MetricStatus = 'fail';
  if (avgMargin >= BUFFETT_THRESHOLDS.NET_MARGIN.excellent) {
    status = 'pass';
  } else if (avgMargin >= BUFFETT_THRESHOLDS.NET_MARGIN.good) {
    status = 'warning';
  }

  return {
    value: avgMargin,
    status,
    timePeriod,
    explanation: `Durchschnittliche Nettomarge über ${timePeriod}: ${avgMargin.toFixed(1)}%`
  };
};

/**
 * EPS (Earnings Per Share) - Latest available
 */
export const calculateEPS = (
  incomeStatements: any[],
  keyMetrics: any[],
  quoteData: any
): MetricResult => {
  // Try multiple sources for EPS
  let eps: number | null = null;
  let timePeriod: TimePeriodBadge = 'TTM';

  // 1. From latest income statement
  if (incomeStatements?.[0]?.eps !== undefined) {
    eps = incomeStatements[0].eps;
  }
  // 2. From quote data
  else if (quoteData?.eps !== undefined) {
    eps = quoteData.eps;
  }
  // 3. From key metrics
  else if (keyMetrics?.[0]?.eps !== undefined) {
    eps = keyMetrics[0].eps;
  }
  // 4. Calculate from net income and shares outstanding
  else if (
    incomeStatements?.[0]?.netIncome !== undefined &&
    incomeStatements?.[0]?.weightedAverageShsOut !== undefined &&
    incomeStatements[0].weightedAverageShsOut > 0
  ) {
    eps = incomeStatements[0].netIncome / incomeStatements[0].weightedAverageShsOut;
  }

  if (eps === null) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'Datenlücke',
      explanation: 'Keine EPS-Daten verfügbar'
    };
  }

  // EPS itself doesn't have pass/fail status - it's just informational
  return {
    value: eps,
    status: eps > 0 ? 'pass' : 'fail',
    timePeriod,
    explanation: `Aktueller Gewinn pro Aktie`
  };
};

/**
 * EPS Growth (3-year CAGR)
 */
export const calculateEPSGrowth = (
  incomeStatements: any[],
  keyMetrics: any[]
): MetricResult => {
  const { data: selectedData, timePeriod } = getBestAvailablePeriod(keyMetrics, 3);
  
  if (selectedData.length < 2) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'Datenlücke',
      explanation: 'Nicht genug Daten für Wachstumsberechnung'
    };
  }

  const latestEPS = selectedData[0]?.eps;
  const oldestEPS = selectedData[selectedData.length - 1]?.eps;

  if (!latestEPS || !oldestEPS || oldestEPS <= 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod,
      explanation: 'EPS-Wachstum konnte nicht berechnet werden'
    };
  }

  const years = selectedData.length - 1;
  const cagr = calculateCAGR(oldestEPS, latestEPS, years);

  let status: MetricStatus = 'fail';
  if (cagr >= BUFFETT_THRESHOLDS.EPS_GROWTH.excellent) {
    status = 'pass';
  } else if (cagr >= BUFFETT_THRESHOLDS.EPS_GROWTH.good) {
    status = 'warning';
  }

  return {
    value: cagr,
    status,
    timePeriod: years >= 3 ? '3J' : 'TTM',
    explanation: `EPS-Wachstum (CAGR) über ${years} Jahre`
  };
};

/**
 * ===================
 * VALUATION METRICS
 * ===================
 */

/**
 * P/E Ratio (Price to Earnings)
 */
export const calculatePERatio = (
  quoteData: any,
  keyMetrics: any[]
): MetricResult => {
  let pe: number | null = null;
  
  if (quoteData?.pe !== undefined) {
    pe = quoteData.pe;
  } else if (keyMetrics?.[0]?.peRatio !== undefined) {
    pe = keyMetrics[0].peRatio;
  }

  if (pe === null || pe <= 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'TTM',
      explanation: 'Kein KGV verfügbar'
    };
  }

  let status: MetricStatus = 'fail';
  if (pe < BUFFETT_THRESHOLDS.PE_RATIO.cheap) {
    status = 'pass';
  } else if (pe < BUFFETT_THRESHOLDS.PE_RATIO.fair) {
    status = 'warning';
  }

  return {
    value: pe,
    status,
    timePeriod: 'TTM',
    explanation: `Aktuelles Kurs-Gewinn-Verhältnis`
  };
};

/**
 * P/B Ratio (Price to Book)
 */
export const calculatePBRatio = (
  quoteData: any,
  keyMetrics: any[]
): MetricResult => {
  let pb: number | null = null;
  
  if (quoteData?.priceToBook !== undefined) {
    pb = quoteData.priceToBook;
  } else if (keyMetrics?.[0]?.priceToBook !== undefined) {
    pb = keyMetrics[0].priceToBook;
  }

  if (pb === null || pb <= 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'TTM',
      explanation: 'Kein P/B verfügbar'
    };
  }

  let status: MetricStatus = 'fail';
  if (pb < BUFFETT_THRESHOLDS.PB_RATIO.cheap) {
    status = 'pass';
  } else if (pb < BUFFETT_THRESHOLDS.PB_RATIO.fair) {
    status = 'warning';
  }

  return {
    value: pb,
    status,
    timePeriod: 'TTM',
    explanation: `Aktuelles Kurs-Buchwert-Verhältnis`
  };
};

/**
 * P/CF Ratio (Price to Cash Flow)
 */
export const calculatePCFRatio = (
  quoteData: any,
  cashFlowStatements: any[]
): MetricResult => {
  const price = quoteData?.price;
  const sharesOutstanding = quoteData?.sharesOutstanding;
  const latestOCF = cashFlowStatements?.[0]?.operatingCashFlow;

  if (!price || !sharesOutstanding || !latestOCF || latestOCF <= 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'TTM',
      explanation: 'P/CF konnte nicht berechnet werden'
    };
  }

  const marketCap = price * sharesOutstanding;
  const pcf = marketCap / latestOCF;

  let status: MetricStatus = 'fail';
  if (pcf < BUFFETT_THRESHOLDS.PCF_RATIO.cheap) {
    status = 'pass';
  } else if (pcf < BUFFETT_THRESHOLDS.PCF_RATIO.fair) {
    status = 'warning';
  }

  return {
    value: pcf,
    status,
    timePeriod: 'TTM',
    explanation: `Kurs-Cashflow-Verhältnis`
  };
};

/**
 * Dividend Yield
 */
export const calculateDividendYield = (
  quoteData: any,
  keyMetrics: any[]
): MetricResult => {
  const price = quoteData?.price;
  const dividend = keyMetrics?.[0]?.dividendYield;

  if (!dividend || !price || price <= 0) {
    return {
      value: 0,
      status: 'warning',
      timePeriod: 'TTM',
      explanation: 'Keine Dividende oder Dividende = 0'
    };
  }

  const yieldPercent = dividend * 100;

  let status: MetricStatus = 'warning';
  if (yieldPercent >= BUFFETT_THRESHOLDS.DIVIDEND_YIELD.excellent) {
    status = 'pass';
  } else if (yieldPercent >= BUFFETT_THRESHOLDS.DIVIDEND_YIELD.good) {
    status = 'warning';
  }

  return {
    value: yieldPercent,
    status,
    timePeriod: 'TTM',
    explanation: `Aktuelle Dividendenrendite`
  };
};

/**
 * ===================
 * DEBT & STABILITY METRICS
 * ===================
 */

/**
 * Debt to EBITDA
 */
export const calculateDebtToEBITDA = (
  balanceSheets: any[],
  incomeStatements: any[]
): MetricResult => {
  const latestBalance = balanceSheets?.[0];
  const latestIncome = incomeStatements?.[0];

  if (!latestBalance || !latestIncome) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'TTM',
      explanation: 'Keine Bilanzdaten verfügbar'
    };
  }

  const totalDebt = latestBalance.totalDebt || 0;
  const ebitda = latestIncome.ebitda;

  if (!ebitda || ebitda <= 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'TTM',
      explanation: 'EBITDA nicht verfügbar oder negativ'
    };
  }

  const ratio = totalDebt / ebitda;

  let status: MetricStatus = 'fail';
  if (ratio < BUFFETT_THRESHOLDS.DEBT_TO_EBITDA.excellent) {
    status = 'pass';
  } else if (ratio < BUFFETT_THRESHOLDS.DEBT_TO_EBITDA.good) {
    status = 'warning';
  }

  return {
    value: ratio,
    status,
    timePeriod: 'TTM',
    explanation: `Verschuldung zu EBITDA`
  };
};

/**
 * Debt to Assets
 */
export const calculateDebtToAssets = (
  balanceSheets: any[]
): MetricResult => {
  const latestBalance = balanceSheets?.[0];

  if (!latestBalance) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'TTM',
      explanation: 'Keine Bilanzdaten verfügbar'
    };
  }

  const totalDebt = latestBalance.totalDebt || 0;
  const totalAssets = latestBalance.totalAssets;

  if (!totalAssets || totalAssets <= 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'TTM',
      explanation: 'Vermögenswerte nicht verfügbar'
    };
  }

  const ratio = totalDebt / totalAssets;

  let status: MetricStatus = 'fail';
  if (ratio < BUFFETT_THRESHOLDS.DEBT_TO_ASSETS.excellent) {
    status = 'pass';
  } else if (ratio < BUFFETT_THRESHOLDS.DEBT_TO_ASSETS.good) {
    status = 'warning';
  }

  return {
    value: ratio,
    status,
    timePeriod: 'TTM',
    explanation: `Verschuldungsgrad (Debt/Assets)`
  };
};

/**
 * Interest Coverage Ratio
 */
export const calculateInterestCoverage = (
  incomeStatements: any[]
): MetricResult => {
  const latestIncome = incomeStatements?.[0];

  if (!latestIncome) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'TTM',
      explanation: 'Keine Einkommensdaten verfügbar'
    };
  }

  const ebit = latestIncome.operatingIncome || latestIncome.ebit;
  const interestExpense = latestIncome.interestExpense;

  if (!ebit || !interestExpense || interestExpense <= 0) {
    return {
      value: null,
      status: 'pass', // No debt is good
      timePeriod: 'TTM',
      explanation: 'Keine Zinsausgaben (schuldenfrei)'
    };
  }

  const coverage = ebit / interestExpense;

  let status: MetricStatus = 'fail';
  if (coverage >= BUFFETT_THRESHOLDS.INTEREST_COVERAGE.excellent) {
    status = 'pass';
  } else if (coverage >= BUFFETT_THRESHOLDS.INTEREST_COVERAGE.good) {
    status = 'warning';
  }

  return {
    value: coverage,
    status,
    timePeriod: 'TTM',
    explanation: `Zinsdeckungsgrad`
  };
};

/**
 * ===================
 * LIQUIDITY & CASHFLOW METRICS
 * ===================
 */

/**
 * Current Ratio
 */
export const calculateCurrentRatio = (
  balanceSheets: any[]
): MetricResult => {
  const latestBalance = balanceSheets?.[0];

  if (!latestBalance) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'TTM',
      explanation: 'Keine Bilanzdaten verfügbar'
    };
  }

  const currentAssets = latestBalance.totalCurrentAssets;
  const currentLiabilities = latestBalance.totalCurrentLiabilities;

  if (!currentAssets || !currentLiabilities || currentLiabilities <= 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'TTM',
      explanation: 'Current Ratio konnte nicht berechnet werden'
    };
  }

  const ratio = currentAssets / currentLiabilities;

  let status: MetricStatus = 'fail';
  if (ratio >= BUFFETT_THRESHOLDS.CURRENT_RATIO.excellent) {
    status = 'pass';
  } else if (ratio >= BUFFETT_THRESHOLDS.CURRENT_RATIO.good) {
    status = 'warning';
  }

  return {
    value: ratio,
    status,
    timePeriod: 'TTM',
    explanation: `Liquidität 2. Grades`
  };
};

/**
 * Quick Ratio
 */
export const calculateQuickRatio = (
  balanceSheets: any[]
): MetricResult => {
  const latestBalance = balanceSheets?.[0];

  if (!latestBalance) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'TTM',
      explanation: 'Keine Bilanzdaten verfügbar'
    };
  }

  const currentAssets = latestBalance.totalCurrentAssets || 0;
  const inventory = latestBalance.inventory || 0;
  const currentLiabilities = latestBalance.totalCurrentLiabilities;

  if (!currentLiabilities || currentLiabilities <= 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'TTM',
      explanation: 'Quick Ratio konnte nicht berechnet werden'
    };
  }

  const quickAssets = currentAssets - inventory;
  const ratio = quickAssets / currentLiabilities;

  let status: MetricStatus = 'fail';
  if (ratio >= BUFFETT_THRESHOLDS.QUICK_RATIO.excellent) {
    status = 'pass';
  } else if (ratio >= BUFFETT_THRESHOLDS.QUICK_RATIO.acceptable) {
    status = 'warning';
  }

  return {
    value: ratio,
    status,
    timePeriod: 'TTM',
    explanation: `Liquidität 3. Grades (ohne Vorräte)`
  };
};

/**
 * Free Cash Flow
 */
export const calculateFreeCashFlow = (
  cashFlowStatements: any[]
): MetricResult => {
  const latestCF = cashFlowStatements?.[0];

  if (!latestCF) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'TTM',
      explanation: 'Keine Cashflow-Daten verfügbar'
    };
  }

  const ocf = latestCF.operatingCashFlow;
  const capex = Math.abs(latestCF.capitalExpenditure || 0);

  if (ocf === undefined || ocf === null) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'TTM',
      explanation: 'OCF nicht verfügbar'
    };
  }

  const fcf = ocf - capex;

  return {
    value: fcf,
    status: fcf > 0 ? 'pass' : 'fail',
    timePeriod: 'TTM',
    explanation: `Freier Cashflow`
  };
};

/**
 * OCF Quality (OCF / Net Income ratio over 5 years)
 */
export const calculateOCFQuality = (
  cashFlowStatements: any[],
  incomeStatements: any[]
): MetricResult => {
  const { data: cfData, timePeriod } = getBestAvailablePeriod(cashFlowStatements, 5);
  const { data: incomeData } = getBestAvailablePeriod(incomeStatements, 5);

  if (cfData.length < 3 || incomeData.length < 3) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'Datenlücke',
      explanation: 'Nicht genug Daten für OCF-Qualität'
    };
  }

  const ocfValues = cfData.map(cf => cf.operatingCashFlow).filter(v => v !== undefined);
  const netIncomeValues = incomeData.map(inc => inc.netIncome).filter(v => v !== undefined);

  if (ocfValues.length === 0 || netIncomeValues.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod,
      explanation: 'OCF oder Nettogewinn nicht verfügbar'
    };
  }

  const avgOCF = ocfValues.reduce((sum, val) => sum + val, 0) / ocfValues.length;
  const avgNetIncome = netIncomeValues.reduce((sum, val) => sum + val, 0) / netIncomeValues.length;

  if (avgNetIncome <= 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod,
      explanation: 'Durchschnittlicher Nettogewinn ist negativ'
    };
  }

  const ratio = avgOCF / avgNetIncome;

  let status: MetricStatus = 'fail';
  if (ratio >= BUFFETT_THRESHOLDS.OCF_TO_NET_INCOME.excellent) {
    status = 'pass';
  } else if (ratio >= BUFFETT_THRESHOLDS.OCF_TO_NET_INCOME.good) {
    status = 'warning';
  }

  return {
    value: ratio,
    status,
    timePeriod,
    explanation: `OCF/Nettogewinn-Verhältnis über ${timePeriod}`
  };
};

/**
 * FCF Robustness (FCF margin over 5 years, check for negative years)
 */
export const calculateFCFRobustness = (
  cashFlowStatements: any[],
  incomeStatements: any[]
): MetricResult => {
  const { data: cfData, timePeriod } = getBestAvailablePeriod(cashFlowStatements, 5);
  const { data: incomeData } = getBestAvailablePeriod(incomeStatements, 5);

  if (cfData.length < 3 || incomeData.length < 3) {
    return {
      value: null,
      status: 'fail',
      timePeriod: 'Datenlücke',
      explanation: 'Nicht genug Daten für FCF-Robustheit'
    };
  }

  const fcfMargins: number[] = [];
  let hasNegativeFCF = false;

  for (let i = 0; i < Math.min(cfData.length, incomeData.length); i++) {
    const ocf = cfData[i]?.operatingCashFlow;
    const capex = Math.abs(cfData[i]?.capitalExpenditure || 0);
    const revenue = incomeData[i]?.revenue;

    if (ocf !== undefined && revenue && revenue > 0) {
      const fcf = ocf - capex;
      const margin = (fcf / revenue) * 100;
      fcfMargins.push(margin);

      if (fcf < 0) hasNegativeFCF = true;
    }
  }

  if (fcfMargins.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriod,
      explanation: 'FCF-Marge konnte nicht berechnet werden'
    };
  }

  const avgMargin = fcfMargins.reduce((sum, val) => sum + val, 0) / fcfMargins.length;

  let status: MetricStatus = 'fail';
  if (avgMargin >= BUFFETT_THRESHOLDS.FCF_MARGIN.excellent && !hasNegativeFCF) {
    status = 'pass';
  } else if (avgMargin >= BUFFETT_THRESHOLDS.FCF_MARGIN.good) {
    status = 'warning';
  }

  return {
    value: avgMargin,
    status,
    timePeriod,
    explanation: `Durchschnittliche FCF-Marge über ${timePeriod}`
  };
};
