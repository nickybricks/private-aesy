/**
 * Zentrale Berechnungslogik für ALLE Finanzkennzahlen
 * Single Source of Truth für "Finanzkennzahlen" und "Deep-Research" Tabs
 * 
 * WICHTIG: Alle Berechnungen erfolgen mit 10J/5J/3J Rolling-Fallback
 * Bei fehlenden Daten wird automatisch auf kürzere Zeitfenster zurückgegriffen
 */

import {
  BUFFETT_THRESHOLDS,
  getROEStatus,
  getNetMarginStatus,
  getEPSGrowthStatus,
  getCurrentRatioStatus,
  getQuickRatioStatus,
  getNetDebtToEBITDAStatus,
  getInterestCoverageStatus,
  getDebtToEquityStatus,
  getOCFQualityStatus,
  getFCFMarginStatus,
  type MetricStatus
} from '@/constants/BuffettThresholds';

/**
 * Zeitfenster-Badge für Rolling-Fallback
 */
export type TimePeriodBadge = '10J' | '5J' | '3J' | 'TTM' | 'Datenlücke';

/**
 * Ergebnis einer Metrik-Berechnung
 */
export interface MetricResult {
  value: number | null;
  status: MetricStatus;
  timePeriodBadge: TimePeriodBadge;
  rawData?: any;
  dataGaps?: string[];
}

/**
 * Hilfsfunktion: Sicherer Zahlenwert
 */
const safeValue = (value: any): number | null => {
  if (value === undefined || value === null) return null;
  const numValue = Number(value);
  return isNaN(numValue) ? null : numValue;
};

/**
 * Rolling-Fallback Helper: Beste verfügbare Zeitperiode ermitteln
 * @param data Array von historischen Datenpunkten
 * @param preferredYears Bevorzugte Anzahl Jahre (Standard: 10)
 * @returns Objekt mit Jahren, Badge und Datenpunkten
 */
export const getBestAvailablePeriod = (
  data: any[],
  preferredYears: number = 10
): { years: number; badge: TimePeriodBadge; dataPoints: any[] } => {
  const availableYears = data?.length || 0;
  
  if (availableYears >= preferredYears) {
    return {
      years: preferredYears,
      badge: '10J',
      dataPoints: data.slice(0, preferredYears)
    };
  } else if (availableYears >= 5) {
    return {
      years: 5,
      badge: '5J',
      dataPoints: data.slice(0, 5)
    };
  } else if (availableYears >= 3) {
    return {
      years: 3,
      badge: '3J',
      dataPoints: data.slice(0, 3)
    };
  } else if (availableYears > 0) {
    return {
      years: availableYears,
      badge: 'Datenlücke',
      dataPoints: data
    };
  } else {
    return {
      years: 0,
      badge: 'Datenlücke',
      dataPoints: []
    };
  }
};

/**
 * CAGR (Compound Annual Growth Rate) berechnen
 */
const calculateCAGR = (startValue: number, endValue: number, years: number): number | null => {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return null;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

// ==========================================
// PROFITABILITÄT & WACHSTUM (10 Jahre)
// ==========================================

/**
 * ROE (Return on Equity) - 10 Jahre Durchschnitt
 * Ziel: ≥15% (Buffett-Kriterium)
 */
export const calculateROE_10Y_avg = (data: {
  ratios?: any[];
  incomeStatements?: any[];
  balanceSheets?: any[];
}): MetricResult => {
  const { ratios, incomeStatements, balanceSheets } = data;
  
  // Prüfe welche Datenquelle verfügbar ist
  if (ratios && ratios.length > 0) {
    const { years, badge, dataPoints } = getBestAvailablePeriod(ratios, 10);
    
    if (years === 0) {
      return {
        value: null,
        status: 'fail',
        timePeriodBadge: 'Datenlücke',
        dataGaps: ['Keine ROE-Daten verfügbar']
      };
    }
    
    // Berechne Durchschnitt aus verfügbaren Datenpunkten
    const roeValues = dataPoints
      .map(r => safeValue(r.returnOnEquity))
      .filter(v => v !== null) as number[];
    
    if (roeValues.length === 0) {
      return {
        value: null,
        status: 'fail',
        timePeriodBadge: badge,
        dataGaps: ['ROE-Werte konnten nicht extrahiert werden']
      };
    }
    
    const avgROE = (roeValues.reduce((sum, v) => sum + v, 0) / roeValues.length) * 100;
    
    return {
      value: Math.round(avgROE * 100) / 100,
      status: getROEStatus(avgROE),
      timePeriodBadge: badge,
      rawData: { roeValues, years }
    };
  }
  
  // Fallback: Eigene Berechnung aus Income Statements und Balance Sheets
  if (incomeStatements && balanceSheets && incomeStatements.length > 0 && balanceSheets.length > 0) {
    const { years, badge, dataPoints: incomeDataPoints } = getBestAvailablePeriod(incomeStatements, 10);
    
    if (years === 0) {
      return {
        value: null,
        status: 'fail',
        timePeriodBadge: 'Datenlücke',
        dataGaps: ['Keine Income Statement Daten verfügbar']
      };
    }
    
    const roeValues: number[] = [];
    
    incomeDataPoints.forEach((income, index) => {
      const balanceSheet = balanceSheets[index];
      if (!balanceSheet) return;
      
      const netIncome = safeValue(income.netIncome);
      const equity = safeValue(balanceSheet.totalStockholdersEquity);
      
      if (netIncome !== null && equity !== null && equity > 0) {
        const roe = (netIncome / equity) * 100;
        roeValues.push(roe);
      }
    });
    
    if (roeValues.length === 0) {
      return {
        value: null,
        status: 'fail',
        timePeriodBadge: badge,
        dataGaps: ['ROE konnte nicht berechnet werden']
      };
    }
    
    const avgROE = roeValues.reduce((sum, v) => sum + v, 0) / roeValues.length;
    
    return {
      value: Math.round(avgROE * 100) / 100,
      status: getROEStatus(avgROE),
      timePeriodBadge: badge,
      rawData: { roeValues, years }
    };
  }
  
  return {
    value: null,
    status: 'fail',
    timePeriodBadge: 'Datenlücke',
    dataGaps: ['Keine ausreichenden Daten für ROE-Berechnung']
  };
};

/**
 * Nettomarge - 10 Jahre Durchschnitt
 * Ziel: ≥15% (Buffett-Kriterium)
 */
export const calculateNetMargin_10Y_avg = (data: {
  ratios?: any[];
  incomeStatements?: any[];
}): MetricResult => {
  const { ratios, incomeStatements } = data;
  
  // Prüfe welche Datenquelle verfügbar ist
  if (ratios && ratios.length > 0) {
    const { years, badge, dataPoints } = getBestAvailablePeriod(ratios, 10);
    
    if (years === 0) {
      return {
        value: null,
        status: 'fail',
        timePeriodBadge: 'Datenlücke',
        dataGaps: ['Keine Nettomarge-Daten verfügbar']
      };
    }
    
    const marginValues = dataPoints
      .map(r => safeValue(r.netProfitMargin))
      .filter(v => v !== null) as number[];
    
    if (marginValues.length === 0) {
      return {
        value: null,
        status: 'fail',
        timePeriodBadge: badge,
        dataGaps: ['Nettomarge-Werte konnten nicht extrahiert werden']
      };
    }
    
    const avgMargin = (marginValues.reduce((sum, v) => sum + v, 0) / marginValues.length) * 100;
    
    return {
      value: Math.round(avgMargin * 100) / 100,
      status: getNetMarginStatus(avgMargin),
      timePeriodBadge: badge,
      rawData: { marginValues, years }
    };
  }
  
  // Fallback: Eigene Berechnung aus Income Statements
  if (incomeStatements && incomeStatements.length > 0) {
    const { years, badge, dataPoints } = getBestAvailablePeriod(incomeStatements, 10);
    
    if (years === 0) {
      return {
        value: null,
        status: 'fail',
        timePeriodBadge: 'Datenlücke',
        dataGaps: ['Keine Income Statement Daten verfügbar']
      };
    }
    
    const marginValues: number[] = [];
    
    dataPoints.forEach(income => {
      const netIncome = safeValue(income.netIncome);
      const revenue = safeValue(income.revenue);
      
      if (netIncome !== null && revenue !== null && revenue > 0) {
        const margin = (netIncome / revenue) * 100;
        marginValues.push(margin);
      }
    });
    
    if (marginValues.length === 0) {
      return {
        value: null,
        status: 'fail',
        timePeriodBadge: badge,
        dataGaps: ['Nettomarge konnte nicht berechnet werden']
      };
    }
    
    const avgMargin = marginValues.reduce((sum, v) => sum + v, 0) / marginValues.length;
    
    return {
      value: Math.round(avgMargin * 100) / 100,
      status: getNetMarginStatus(avgMargin),
      timePeriodBadge: badge,
      rawData: { marginValues, years }
    };
  }
  
  return {
    value: null,
    status: 'fail',
    timePeriodBadge: 'Datenlücke',
    dataGaps: ['Keine ausreichenden Daten für Nettomarge-Berechnung']
  };
};

/**
 * EPS ohne NRI (Non-Recurring Items) - TTM
 * TTM = Trailing Twelve Months (letzten 12 Monate)
 */
export const calculateEPS_TTM_woNRI = (data: {
  incomeStatements?: any[];
  keyMetrics?: any[];
  quote?: any;
}): MetricResult => {
  const { incomeStatements, keyMetrics, quote } = data;
  
  // 1. Versuche aus Income Statement (beste Quelle)
  if (incomeStatements && incomeStatements.length > 0) {
    const latest = incomeStatements[0];
    const eps = safeValue(latest.eps) || safeValue(latest.epsdiluted);
    
    if (eps !== null) {
      return {
        value: Math.round(eps * 100) / 100,
        status: eps > 0 ? 'pass' : 'fail',
        timePeriodBadge: 'TTM',
        rawData: { source: 'incomeStatement' }
      };
    }
  }
  
  // 2. Versuche aus Quote (tagesaktuelle Daten)
  if (quote && quote.eps !== undefined) {
    const eps = safeValue(quote.eps);
    
    if (eps !== null) {
      return {
        value: Math.round(eps * 100) / 100,
        status: eps > 0 ? 'pass' : 'fail',
        timePeriodBadge: 'TTM',
        rawData: { source: 'quote' }
      };
    }
  }
  
  // 3. Versuche aus Key Metrics
  if (keyMetrics && keyMetrics.length > 0) {
    const eps = safeValue(keyMetrics[0].eps);
    
    if (eps !== null) {
      return {
        value: Math.round(eps * 100) / 100,
        status: eps > 0 ? 'pass' : 'fail',
        timePeriodBadge: 'TTM',
        rawData: { source: 'keyMetrics' }
      };
    }
  }
  
  // 4. Eigene Berechnung aus Nettogewinn und Aktienanzahl
  if (incomeStatements && incomeStatements.length > 0) {
    const latest = incomeStatements[0];
    const netIncome = safeValue(latest.netIncome);
    const sharesOut = safeValue(latest.weightedAverageShsOut);
    
    if (netIncome !== null && sharesOut !== null && sharesOut > 0) {
      const eps = netIncome / sharesOut;
      return {
        value: Math.round(eps * 100) / 100,
        status: eps > 0 ? 'pass' : 'fail',
        timePeriodBadge: 'TTM',
        rawData: { source: 'calculated', netIncome, sharesOut }
      };
    }
  }
  
  return {
    value: null,
    status: 'fail',
    timePeriodBadge: 'Datenlücke',
    dataGaps: ['Keine EPS-Daten verfügbar']
  };
};

/**
 * EPS-Wachstum (CAGR) - bevorzugt 10 Jahre, Fallback 5J/3J
 * Ziel: ≥10% (Buffett-Kriterium)
 */
export const calculateEPS_CAGR = (data: {
  incomeStatements?: any[];
}): MetricResult => {
  const { incomeStatements } = data;
  
  if (!incomeStatements || incomeStatements.length < 2) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'Datenlücke',
      dataGaps: ['Nicht genügend historische EPS-Daten für CAGR-Berechnung']
    };
  }
  
  // Versuche 10J, 5J, 3J in dieser Reihenfolge
  const periods = [
    { years: 10, badge: '10J' as TimePeriodBadge },
    { years: 5, badge: '5J' as TimePeriodBadge },
    { years: 3, badge: '3J' as TimePeriodBadge }
  ];
  
  for (const period of periods) {
    if (incomeStatements.length < period.years + 1) continue;
    
    const currentStatement = incomeStatements[0];
    const pastStatement = incomeStatements[period.years];
    
    const currentEPS = safeValue(currentStatement.eps) || safeValue(currentStatement.epsdiluted);
    const pastEPS = safeValue(pastStatement.eps) || safeValue(pastStatement.epsdiluted);
    
    if (currentEPS !== null && pastEPS !== null && pastEPS > 0 && currentEPS > 0) {
      const cagr = calculateCAGR(pastEPS, currentEPS, period.years);
      
      if (cagr !== null) {
        return {
          value: Math.round(cagr * 100) / 100,
          status: getEPSGrowthStatus(cagr),
          timePeriodBadge: period.badge,
          rawData: {
            currentEPS,
            pastEPS,
            years: period.years,
            currentYear: currentStatement.calendarYear || new Date(currentStatement.date).getFullYear(),
            pastYear: pastStatement.calendarYear || new Date(pastStatement.date).getFullYear()
          }
        };
      }
    }
    
    // Fallback für negative EPS-Werte: Simple Growth Rate
    if (currentEPS !== null && pastEPS !== null && pastEPS !== 0) {
      const simpleGrowth = ((currentEPS - pastEPS) / Math.abs(pastEPS)) * 100;
      return {
        value: Math.round(simpleGrowth * 100) / 100,
        status: getEPSGrowthStatus(simpleGrowth),
        timePeriodBadge: period.badge,
        rawData: {
          currentEPS,
          pastEPS,
          years: period.years,
          method: 'simple',
          note: 'Simple Growth verwendet (negative EPS)'
        }
      };
    }
  }
  
  return {
    value: null,
    status: 'fail',
    timePeriodBadge: 'Datenlücke',
    dataGaps: ['EPS-CAGR konnte nicht berechnet werden']
  };
};

// ==========================================
// BEWERTUNG (TTM-basiert)
// ==========================================

/**
 * P/E Ratio (Price-to-Earnings) - TTM
 */
export const calculatePE_TTM = (data: {
  quote?: any;
  incomeStatements?: any[];
  keyMetrics?: any[];
}): MetricResult => {
  const { quote, incomeStatements, keyMetrics } = data;
  
  const currentPrice = quote?.price ? safeValue(quote.price) : null;
  
  // Hole EPS
  const epsResult = calculateEPS_TTM_woNRI({ incomeStatements, keyMetrics, quote });
  const eps = epsResult.value;
  
  if (currentPrice === null || eps === null || eps <= 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'TTM',
      dataGaps: ['Kurs oder EPS nicht verfügbar']
    };
  }
  
  const pe = currentPrice / eps;
  
  // Status basierend auf Buffett-Schwellenwerten
  let status: MetricStatus = 'fail';
  if (pe < BUFFETT_THRESHOLDS.PE.acceptable) {
    status = 'pass';
  } else if (pe < BUFFETT_THRESHOLDS.PE.expensive) {
    status = 'warning';
  }
  
  return {
    value: Math.round(pe * 100) / 100,
    status,
    timePeriodBadge: 'TTM',
    rawData: { currentPrice, eps }
  };
};

/**
 * P/B Ratio (Price-to-Book) - TTM
 */
export const calculatePB_TTM = (data: {
  quote?: any;
  balanceSheets?: any[];
  keyMetrics?: any[];
}): MetricResult => {
  const { quote, balanceSheets, keyMetrics } = data;
  
  const currentPrice = quote?.price ? safeValue(quote.price) : null;
  
  // Versuche Buchwert pro Aktie zu holen
  let bookValuePerShare: number | null = null;
  
  // 1. Aus Key Metrics
  if (keyMetrics && keyMetrics.length > 0) {
    bookValuePerShare = safeValue(keyMetrics[0].bookValuePerShare);
  }
  
  // 2. Eigene Berechnung aus Balance Sheet
  if (bookValuePerShare === null && balanceSheets && balanceSheets.length > 0) {
    const latest = balanceSheets[0];
    const equity = safeValue(latest.totalStockholdersEquity);
    const sharesOut = safeValue(latest.commonStock) || safeValue(quote?.sharesOutstanding);
    
    if (equity !== null && sharesOut !== null && sharesOut > 0) {
      bookValuePerShare = equity / sharesOut;
    }
  }
  
  if (currentPrice === null || bookValuePerShare === null || bookValuePerShare <= 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'TTM',
      dataGaps: ['Kurs oder Buchwert nicht verfügbar']
    };
  }
  
  const pb = currentPrice / bookValuePerShare;
  
  // Status basierend auf Buffett-Schwellenwerten
  let status: MetricStatus = 'fail';
  if (pb < BUFFETT_THRESHOLDS.PB.acceptable) {
    status = 'pass';
  } else if (pb < BUFFETT_THRESHOLDS.PB.expensive) {
    status = 'warning';
  }
  
  return {
    value: Math.round(pb * 100) / 100,
    status,
    timePeriodBadge: 'TTM',
    rawData: { currentPrice, bookValuePerShare }
  };
};

/**
 * P/CF Ratio (Price-to-Cash Flow) - TTM
 */
export const calculatePCF_TTM = (data: {
  quote?: any;
  cashFlowStatements?: any[];
}): MetricResult => {
  const { quote, cashFlowStatements } = data;
  
  const currentPrice = quote?.price ? safeValue(quote.price) : null;
  const sharesOut = quote?.sharesOutstanding ? safeValue(quote.sharesOutstanding) : null;
  
  if (!cashFlowStatements || cashFlowStatements.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'TTM',
      dataGaps: ['Keine Cash Flow Daten verfügbar']
    };
  }
  
  const latest = cashFlowStatements[0];
  const ocf = safeValue(latest.operatingCashFlow);
  
  if (currentPrice === null || ocf === null || sharesOut === null || sharesOut <= 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'TTM',
      dataGaps: ['Kurs, OCF oder Aktienanzahl nicht verfügbar']
    };
  }
  
  const ocfPerShare = ocf / sharesOut;
  const pcf = currentPrice / ocfPerShare;
  
  // Status basierend auf Buffett-Schwellenwerten
  let status: MetricStatus = 'fail';
  if (pcf < BUFFETT_THRESHOLDS.PCF.fair) {
    status = 'pass';
  } else if (pcf < BUFFETT_THRESHOLDS.PCF.acceptable) {
    status = 'warning';
  }
  
  return {
    value: Math.round(pcf * 100) / 100,
    status,
    timePeriodBadge: 'TTM',
    rawData: { currentPrice, ocfPerShare, ocf, sharesOut }
  };
};

/**
 * Dividendenrendite - TTM
 */
export const calculateDividendYield_TTM = (data: {
  quote?: any;
  keyMetrics?: any[];
}): MetricResult => {
  const { quote, keyMetrics } = data;
  
  const currentPrice = quote?.price ? safeValue(quote.price) : null;
  
  // Versuche Dividende pro Aktie zu holen
  let dividendPerShare: number | null = null;
  
  if (keyMetrics && keyMetrics.length > 0) {
    dividendPerShare = safeValue(keyMetrics[0].dividendPerShare);
  }
  
  if (currentPrice === null || currentPrice <= 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'TTM',
      dataGaps: ['Kurs nicht verfügbar']
    };
  }
  
  if (dividendPerShare === null || dividendPerShare <= 0) {
    return {
      value: 0,
      status: 'warning',
      timePeriodBadge: 'TTM',
      rawData: { note: 'Keine Dividende' }
    };
  }
  
  const dividendYield = (dividendPerShare / currentPrice) * 100;
  
  // Status basierend auf Dividendenrendite
  let status: MetricStatus = 'warning';
  if (dividendYield >= BUFFETT_THRESHOLDS.DIVIDEND_YIELD.good) {
    status = 'pass';
  } else if (dividendYield < BUFFETT_THRESHOLDS.DIVIDEND_YIELD.low) {
    status = 'fail';
  }
  
  return {
    value: Math.round(dividendYield * 100) / 100,
    status,
    timePeriodBadge: 'TTM',
    rawData: { currentPrice, dividendPerShare }
  };
};

// ==========================================
// VERSCHULDUNG & STABILITÄT
// ==========================================

/**
 * Debt-to-Equity (Verschuldungsgrad) - TTM
 * Ziel: <0.5 (50%)
 */
export const calculateDtoE = (data: {
  ratios?: any[];
  balanceSheets?: any[];
}): MetricResult => {
  const { ratios, balanceSheets } = data;
  
  // 1. Versuche aus Ratios
  if (ratios && ratios.length > 0) {
    const debtToEquity = safeValue(ratios[0].debtToEquity);
    
    if (debtToEquity !== null) {
      return {
        value: Math.round(debtToEquity * 100) / 100,
        status: getDebtToEquityStatus(debtToEquity),
        timePeriodBadge: 'TTM',
        rawData: { source: 'ratios' }
      };
    }
  }
  
  // 2. Eigene Berechnung aus Balance Sheet
  if (balanceSheets && balanceSheets.length > 0) {
    const latest = balanceSheets[0];
    const totalDebt = safeValue(latest.totalDebt) ||
      (safeValue(latest.shortTermDebt) || 0) + (safeValue(latest.longTermDebt) || 0);
    const equity = safeValue(latest.totalStockholdersEquity);
    
    if (totalDebt !== null && equity !== null && equity > 0) {
      const debtToEquity = totalDebt / equity;
      return {
        value: Math.round(debtToEquity * 100) / 100,
        status: getDebtToEquityStatus(debtToEquity),
        timePeriodBadge: 'TTM',
        rawData: { source: 'calculated', totalDebt, equity }
      };
    }
  }
  
  return {
    value: null,
    status: 'fail',
    timePeriodBadge: 'TTM',
    dataGaps: ['Verschuldungsgrad nicht berechenbar']
  };
};

/**
 * Net Debt - TTM
 */
export const calculateNetDebt = (data: {
  balanceSheets?: any[];
}): MetricResult => {
  const { balanceSheets } = data;
  
  if (!balanceSheets || balanceSheets.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'TTM',
      dataGaps: ['Keine Balance Sheet Daten verfügbar']
    };
  }
  
  const latest = balanceSheets[0];
  const totalDebt = safeValue(latest.totalDebt) ||
    (safeValue(latest.shortTermDebt) || 0) + (safeValue(latest.longTermDebt) || 0);
  const cash = safeValue(latest.cashAndCashEquivalents) || 0;
  
  if (totalDebt === null) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'TTM',
      dataGaps: ['Schulden nicht verfügbar']
    };
  }
  
  const netDebt = totalDebt - cash;
  
  return {
    value: Math.round(netDebt),
    status: netDebt < 0 ? 'pass' : 'warning',
    timePeriodBadge: 'TTM',
    rawData: { totalDebt, cash }
  };
};

/**
 * Net Debt to EBITDA - TTM
 * Ziel: <2 (≤1 hervorragend)
 */
export const calculateNetDebtToEBITDA_TTM = (data: {
  balanceSheets?: any[];
  incomeStatements?: any[];
}): MetricResult => {
  const { balanceSheets, incomeStatements } = data;
  
  const netDebtResult = calculateNetDebt({ balanceSheets });
  const netDebt = netDebtResult.value;
  
  if (!incomeStatements || incomeStatements.length === 0 || netDebt === null) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'TTM',
      dataGaps: ['Net Debt oder EBITDA nicht verfügbar']
    };
  }
  
  const latest = incomeStatements[0];
  const ebitda = safeValue(latest.ebitda);
  
  if (ebitda === null || ebitda <= 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'TTM',
      dataGaps: ['EBITDA nicht verfügbar oder ≤0']
    };
  }
  
  const ratio = netDebt / ebitda;
  
  return {
    value: Math.round(ratio * 100) / 100,
    status: getNetDebtToEBITDAStatus(ratio),
    timePeriodBadge: 'TTM',
    rawData: { netDebt, ebitda }
  };
};

/**
 * Current Ratio - TTM
 * Ziel: >1.5
 */
export const calculateCurrentRatio_TTM = (data: {
  ratios?: any[];
  balanceSheets?: any[];
}): MetricResult => {
  const { ratios, balanceSheets } = data;
  
  // 1. Versuche aus Ratios
  if (ratios && ratios.length > 0) {
    const currentRatio = safeValue(ratios[0].currentRatio);
    
    if (currentRatio !== null) {
      return {
        value: Math.round(currentRatio * 100) / 100,
        status: getCurrentRatioStatus(currentRatio),
        timePeriodBadge: 'TTM',
        rawData: { source: 'ratios' }
      };
    }
  }
  
  // 2. Eigene Berechnung aus Balance Sheet
  if (balanceSheets && balanceSheets.length > 0) {
    const latest = balanceSheets[0];
    const currentAssets = safeValue(latest.totalCurrentAssets);
    const currentLiabilities = safeValue(latest.totalCurrentLiabilities);
    
    if (currentAssets !== null && currentLiabilities !== null && currentLiabilities > 0) {
      const currentRatio = currentAssets / currentLiabilities;
      return {
        value: Math.round(currentRatio * 100) / 100,
        status: getCurrentRatioStatus(currentRatio),
        timePeriodBadge: 'TTM',
        rawData: { source: 'calculated', currentAssets, currentLiabilities }
      };
    }
  }
  
  return {
    value: null,
    status: 'fail',
    timePeriodBadge: 'TTM',
    dataGaps: ['Current Ratio nicht berechenbar']
  };
};

/**
 * Quick Ratio - TTM
 * Ziel: >1.0
 */
export const calculateQuickRatio_TTM = (data: {
  ratios?: any[];
  balanceSheets?: any[];
}): MetricResult => {
  const { ratios, balanceSheets } = data;
  
  // 1. Versuche aus Ratios
  if (ratios && ratios.length > 0) {
    const quickRatio = safeValue(ratios[0].quickRatio);
    
    if (quickRatio !== null) {
      return {
        value: Math.round(quickRatio * 100) / 100,
        status: getQuickRatioStatus(quickRatio),
        timePeriodBadge: 'TTM',
        rawData: { source: 'ratios' }
      };
    }
  }
  
  // 2. Eigene Berechnung aus Balance Sheet
  if (balanceSheets && balanceSheets.length > 0) {
    const latest = balanceSheets[0];
    const currentAssets = safeValue(latest.totalCurrentAssets);
    const inventory = safeValue(latest.inventory) || 0;
    const currentLiabilities = safeValue(latest.totalCurrentLiabilities);
    
    if (currentAssets !== null && currentLiabilities !== null && currentLiabilities > 0) {
      const quickRatio = (currentAssets - inventory) / currentLiabilities;
      return {
        value: Math.round(quickRatio * 100) / 100,
        status: getQuickRatioStatus(quickRatio),
        timePeriodBadge: 'TTM',
        rawData: { source: 'calculated', currentAssets, inventory, currentLiabilities }
      };
    }
  }
  
  return {
    value: null,
    status: 'fail',
    timePeriodBadge: 'TTM',
    dataGaps: ['Quick Ratio nicht berechenbar']
  };
};

/**
 * Zinsdeckungsgrad (Interest Coverage) - TTM
 * Ziel: >5 (Buffett-Kriterium)
 */
export const calculateInterestCoverage_TTM = (data: {
  ratios?: any[];
  incomeStatements?: any[];
}): MetricResult => {
  const { ratios, incomeStatements } = data;
  
  // 1. Versuche aus Ratios
  if (ratios && ratios.length > 0) {
    const interestCoverage = safeValue(ratios[0].interestCoverage);
    
    if (interestCoverage !== null && interestCoverage > 0) {
      return {
        value: Math.round(interestCoverage * 100) / 100,
        status: getInterestCoverageStatus(interestCoverage),
        timePeriodBadge: 'TTM',
        rawData: { source: 'ratios' }
      };
    }
  }
  
  // 2. Eigene Berechnung aus Income Statement
  if (incomeStatements && incomeStatements.length > 0) {
    const latest = incomeStatements[0];
    const ebitda = safeValue(latest.ebitda);
    const depreciation = safeValue(latest.depreciationAndAmortization) || 0;
    const ebit = ebitda !== null ? ebitda - depreciation : null;
    const interestExpense = safeValue(latest.interestExpense);
    
    if (ebit !== null && interestExpense !== null && interestExpense !== 0) {
      const interestCoverage = ebit / Math.abs(interestExpense);
      
      if (interestCoverage > 0) {
        return {
          value: Math.round(interestCoverage * 100) / 100,
          status: getInterestCoverageStatus(interestCoverage),
          timePeriodBadge: 'TTM',
          rawData: { source: 'calculated', ebit, interestExpense }
        };
      }
    }
  }
  
  // 3. Suche in historischen Daten
  if (incomeStatements && incomeStatements.length > 1) {
    for (let i = 1; i < Math.min(incomeStatements.length, 5); i++) {
      const statement = incomeStatements[i];
      const ebitda = safeValue(statement.ebitda);
      const depreciation = safeValue(statement.depreciationAndAmortization) || 0;
      const ebit = ebitda !== null ? ebitda - depreciation : null;
      const interestExpense = safeValue(statement.interestExpense);
      
      if (ebit !== null && interestExpense !== null && interestExpense !== 0) {
        const interestCoverage = ebit / Math.abs(interestExpense);
        
        if (interestCoverage > 0) {
          const date = new Date(statement.date);
          return {
            value: Math.round(interestCoverage * 100) / 100,
            status: getInterestCoverageStatus(interestCoverage),
            timePeriodBadge: 'TTM',
            rawData: {
              source: 'historical',
              historicalDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
              ebit,
              interestExpense
            }
          };
        }
      }
    }
  }
  
  return {
    value: null,
    status: 'fail',
    timePeriodBadge: 'TTM',
    dataGaps: ['Zinsdeckungsgrad nicht berechenbar']
  };
};

// ==========================================
// LIQUIDITÄT & CASHFLOW (5 Jahre)
// ==========================================

/**
 * Capex-Quote - 10 Jahre Durchschnitt
 * (Capex / Umsatz) als positiver Wert ausgegeben
 */
export const calculateCapexQuote_10Y_avg = (data: {
  cashFlowStatements?: any[];
  incomeStatements?: any[];
}): MetricResult => {
  const { cashFlowStatements, incomeStatements } = data;
  
  if (!cashFlowStatements || !incomeStatements || cashFlowStatements.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'Datenlücke',
      dataGaps: ['Keine Cash Flow oder Income Statement Daten verfügbar']
    };
  }
  
  const { years, badge, dataPoints: cfDataPoints } = getBestAvailablePeriod(cashFlowStatements, 10);
  
  if (years === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'Datenlücke',
      dataGaps: ['Keine ausreichenden Cash Flow Daten']
    };
  }
  
  const capexQuotes: number[] = [];
  
  cfDataPoints.forEach((cf, index) => {
    const income = incomeStatements[index];
    if (!income) return;
    
    const capex = safeValue(cf.capitalExpenditure);
    const revenue = safeValue(income.revenue);
    
    if (capex !== null && revenue !== null && revenue > 0) {
      // Capex ist normalerweise negativ, daher |capex|
      const quote = (Math.abs(capex) / revenue) * 100;
      capexQuotes.push(quote);
    }
  });
  
  if (capexQuotes.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: badge,
      dataGaps: ['Capex-Quote konnte nicht berechnet werden']
    };
  }
  
  const avgCapexQuote = capexQuotes.reduce((sum, v) => sum + v, 0) / capexQuotes.length;
  
  // Status: Niedriger = besser (Capital-light bevorzugt)
  let status: MetricStatus = 'pass';
  if (avgCapexQuote > BUFFETT_THRESHOLDS.CAPEX_QUOTE.high) {
    status = 'warning';
  }
  if (avgCapexQuote > BUFFETT_THRESHOLDS.CAPEX_QUOTE.veryHigh) {
    status = 'fail';
  }
  
  return {
    value: Math.round(avgCapexQuote * 100) / 100,
    status,
    timePeriodBadge: badge,
    rawData: { capexQuotes, years }
  };
};

/**
 * OCF-Qualität - 5 Jahre Durchschnitt
 * (OCF / Nettogewinn) - Ziel: ≥1.0
 */
export const calculateOCF_Quality_5Y = (data: {
  cashFlowStatements?: any[];
  incomeStatements?: any[];
}): MetricResult => {
  const { cashFlowStatements, incomeStatements } = data;
  
  if (!cashFlowStatements || !incomeStatements || cashFlowStatements.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'Datenlücke',
      dataGaps: ['Keine Cash Flow oder Income Statement Daten verfügbar']
    };
  }
  
  const { years, badge, dataPoints: cfDataPoints } = getBestAvailablePeriod(cashFlowStatements, 5);
  
  if (years === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'Datenlücke',
      dataGaps: ['Keine ausreichenden Cash Flow Daten']
    };
  }
  
  const qualityRatios: number[] = [];
  
  cfDataPoints.forEach((cf, index) => {
    const income = incomeStatements[index];
    if (!income) return;
    
    const ocf = safeValue(cf.operatingCashFlow);
    const netIncome = safeValue(income.netIncome);
    
    if (ocf !== null && netIncome !== null && netIncome !== 0) {
      const quality = ocf / Math.abs(netIncome);
      qualityRatios.push(quality);
    }
  });
  
  if (qualityRatios.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: badge,
      dataGaps: ['OCF-Qualität konnte nicht berechnet werden']
    };
  }
  
  const avgQuality = qualityRatios.reduce((sum, v) => sum + v, 0) / qualityRatios.length;
  
  return {
    value: Math.round(avgQuality * 100) / 100,
    status: getOCFQualityStatus(avgQuality),
    timePeriodBadge: badge,
    rawData: { qualityRatios, years }
  };
};

/**
 * FCF-Marge - 5 Jahre Durchschnitt
 * (FCF / Umsatz) - Ziel: ≥7%
 */
export const calculateFCF_Margin_5Y = (data: {
  cashFlowStatements?: any[];
  incomeStatements?: any[];
}): MetricResult => {
  const { cashFlowStatements, incomeStatements } = data;
  
  if (!cashFlowStatements || !incomeStatements || cashFlowStatements.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'Datenlücke',
      dataGaps: ['Keine Cash Flow oder Income Statement Daten verfügbar']
    };
  }
  
  const { years, badge, dataPoints: cfDataPoints } = getBestAvailablePeriod(cashFlowStatements, 5);
  
  if (years === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'Datenlücke',
      dataGaps: ['Keine ausreichenden Cash Flow Daten']
    };
  }
  
  const fcfMargins: number[] = [];
  
  cfDataPoints.forEach((cf, index) => {
    const income = incomeStatements[index];
    if (!income) return;
    
    const fcf = safeValue(cf.freeCashFlow);
    const revenue = safeValue(income.revenue);
    
    if (fcf !== null && revenue !== null && revenue > 0) {
      const margin = (fcf / revenue) * 100;
      fcfMargins.push(margin);
    }
  });
  
  if (fcfMargins.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: badge,
      dataGaps: ['FCF-Marge konnte nicht berechnet werden']
    };
  }
  
  const avgMargin = fcfMargins.reduce((sum, v) => sum + v, 0) / fcfMargins.length;
  
  return {
    value: Math.round(avgMargin * 100) / 100,
    status: getFCFMarginStatus(avgMargin),
    timePeriodBadge: badge,
    rawData: { fcfMargins, years }
  };
};

/**
 * FCF nie negativ - Check der letzten 5 Jahre
 * TRUE wenn FCF in allen Jahren ≥0, sonst FALSE
 */
export const calculateFCF_NeverNegative = (data: {
  cashFlowStatements?: any[];
}): MetricResult => {
  const { cashFlowStatements } = data;
  
  if (!cashFlowStatements || cashFlowStatements.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'Datenlücke',
      dataGaps: ['Keine Cash Flow Daten verfügbar']
    };
  }
  
  const { years, badge, dataPoints } = getBestAvailablePeriod(cashFlowStatements, 5);
  
  if (years === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: 'Datenlücke',
      dataGaps: ['Keine ausreichenden Cash Flow Daten']
    };
  }
  
  const fcfValues: number[] = [];
  let hasNegative = false;
  
  dataPoints.forEach(cf => {
    const fcf = safeValue(cf.freeCashFlow);
    if (fcf !== null) {
      fcfValues.push(fcf);
      if (fcf < 0) {
        hasNegative = true;
      }
    }
  });
  
  if (fcfValues.length === 0) {
    return {
      value: null,
      status: 'fail',
      timePeriodBadge: badge,
      dataGaps: ['FCF-Werte konnten nicht extrahiert werden']
    };
  }
  
  const neverNegative = !hasNegative;
  
  return {
    value: neverNegative ? 1 : 0,
    status: neverNegative ? 'pass' : 'fail',
    timePeriodBadge: badge,
    rawData: {
      fcfValues,
      years,
      neverNegative,
      negativeCount: fcfValues.filter(v => v < 0).length
    }
  };
};
