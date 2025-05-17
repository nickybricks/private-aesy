import { convertCurrency, shouldConvertCurrency } from '@/utils/currencyConverter';
import { FinancialMetricsData, OverallRatingData, DCFData } from './StockContextTypes';

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

export const generateMockDCFData = (rating: OverallRatingData, priceCurrency: string): DCFData | undefined => {
  if (!rating || !rating.intrinsicValue) {
    return undefined;
  }
  
  // Real DCF calculation based on Buffett principles
  // These would typically come from the API, but for now we're creating realistic values
  
  // 1. Input parameters
  const wacc = 8.5; // Example WACC (%)
  const netDebt = rating.intrinsicValue * 0.2; // Example net debt (20% of intrinsic)
  const dilutedSharesOutstanding = 1000000; // Example outstanding shares
  const currency = rating.currency || priceCurrency;
  
  // 2. Generate realistic free cash flows (growing at 15% yearly)
  const baseUfcf = rating.intrinsicValue * dilutedSharesOutstanding * 0.04; // Base unlevered free cash flow
  const ufcf = [
    baseUfcf * 1.15,  // Year 1
    baseUfcf * 1.15 * 1.15,  // Year 2
    baseUfcf * 1.15 * 1.15 * 1.15,  // Year 3
    baseUfcf * 1.15 * 1.15 * 1.15 * 1.15,  // Year 4
    baseUfcf * 1.15 * 1.15 * 1.15 * 1.15 * 1.15  // Year 5
  ];
  
  // 3. Calculate present value of each cash flow
  const pvUfcfs = ufcf.map((cashflow, index) => 
    cashflow / Math.pow(1 + wacc / 100, index + 1)
  );
  
  // 4. Sum of present values
  const sumPvUfcfs = pvUfcfs.reduce((sum, pv) => sum + pv, 0);
  
  // 5. Terminal value (present value)
  // Assuming terminal value is 75% of total value (common in DCF models)
  const presentTerminalValue = rating.intrinsicValue * dilutedSharesOutstanding * 0.75;
  
  // 6. Enterprise value
  const enterpriseValue = sumPvUfcfs + presentTerminalValue;
  
  // 7. Equity value
  const equityValue = enterpriseValue - netDebt;
  
  // 8. Intrinsic value per share
  const calculatedIntrinsicValue = equityValue / dilutedSharesOutstanding;
  
  // Return complete DCF data
  return {
    ufcf,
    wacc,
    presentTerminalValue,
    netDebt,
    dilutedSharesOutstanding,
    currency,
    intrinsicValue: calculatedIntrinsicValue,
    pvUfcfs,
    sumPvUfcfs,
    enterpriseValue,
    equityValue
  };
};
