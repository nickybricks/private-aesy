
import { convertCurrency, shouldConvertCurrency } from '@/utils/currencyConverter';
import { FinancialMetricsData, OverallRatingData } from './StockContextTypes';

export const processFinancialMetrics = (
  rawMetricsData: any, 
  reportedCurrency: string,
  stockPriceCurrency: string
): FinancialMetricsData => {
  const metricsData: FinancialMetricsData = {
    ...rawMetricsData,
    metrics: [
      { 
        name: 'Gewinn pro Aktie (EPS)', 
        value: rawMetricsData.eps, 
        formula: 'Nettogewinn / Anzahl Aktien', 
        explanation: 'Zeigt den Unternehmensgewinn pro Aktie', 
        threshold: '> 0, wachsend', 
        status: rawMetricsData.eps > 0 ? 'pass' : 'fail',
        isPercentage: false,
        isMultiplier: false
      },
      { 
        name: 'Eigenkapitalrendite (ROE)', 
        value: rawMetricsData.roe * 100, 
        formula: 'Nettogewinn / Eigenkapital', 
        explanation: 'Zeigt die Effizienz des eingesetzten Kapitals', 
        threshold: '> 15%', 
        status: rawMetricsData.roe * 100 > 15 ? 'pass' : 'warning',
        isPercentage: true,
        isMultiplier: false
      },
      { 
        name: 'Nettomarge', 
        value: rawMetricsData.netMargin * 100, 
        formula: 'Nettogewinn / Umsatz', 
        explanation: 'Zeigt die Profitabilität', 
        threshold: '> 10%', 
        status: rawMetricsData.netMargin * 100 > 10 ? 'pass' : 'warning',
        isPercentage: true,
        isMultiplier: false
      },
      { 
        name: 'Kapitalrendite (ROIC)', 
        value: rawMetricsData.roic * 100, 
        formula: 'NOPAT / Investiertes Kapital', 
        explanation: 'Zeigt die Effizienz aller Investments', 
        threshold: '> 10%', 
        status: rawMetricsData.roic * 100 > 10 ? 'pass' : 'warning',
        isPercentage: true,
        isMultiplier: false
      },
      { 
        name: 'Schulden zu Vermögen', 
        value: rawMetricsData.debtToAssets * 100, 
        formula: 'Gesamtschulden / Gesamtvermögen', 
        explanation: 'Zeigt die Verschuldungsquote', 
        threshold: '< 50%', 
        status: rawMetricsData.debtToAssets * 100 < 50 ? 'pass' : 'warning',
        isPercentage: true,
        isMultiplier: false
      },
      { 
        name: 'Zinsdeckungsgrad', 
        value: rawMetricsData.interestCoverage, 
        formula: 'EBIT / Zinsaufwand', 
        explanation: 'Zeigt die Fähigkeit, Zinsen zu decken', 
        threshold: '> 5', 
        status: rawMetricsData.interestCoverage > 5 ? 'pass' : 'warning',
        isPercentage: false,
        isMultiplier: true
      },
    ],
    historicalData: rawMetricsData.historicalData || {
      revenue: [],
      earnings: [],
      eps: []
    },
    reportedCurrency: reportedCurrency
  };
  
  return metricsData;
};

export const generateMockDCFData = (rating: OverallRatingData, priceCurrency: string): any => {
  if (rating && rating.intrinsicValue) {
    return {
      ufcf: [
        rating.intrinsicValue * 0.04 * 1.15, // Year 1 FCF with growth
        rating.intrinsicValue * 0.04 * 1.15 * 1.15, // Year 2
        rating.intrinsicValue * 0.04 * 1.15 * 1.15 * 1.15, // Year 3
        rating.intrinsicValue * 0.04 * 1.15 * 1.15 * 1.15 * 1.15, // Year 4
        rating.intrinsicValue * 0.04 * 1.15 * 1.15 * 1.15 * 1.15 * 1.15, // Year 5
      ],
      wacc: 8.5, // Example WACC
      presentTerminalValue: rating.intrinsicValue * 0.75, // Example terminal value (75% of intrinsic)
      netDebt: rating.intrinsicValue * 0.2, // Example net debt (20% of intrinsic)
      dilutedSharesOutstanding: 1000000, // Example outstanding shares
      currency: rating.currency || priceCurrency,
      intrinsicValue: rating.intrinsicValue
    };
  }
  return undefined;
};
