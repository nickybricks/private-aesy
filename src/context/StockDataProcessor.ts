/**
 * Processes financial metrics data and adds additional information
 */
export const processFinancialMetrics = (rawData: any, reportedCurrency: string, priceCurrency: string) => {
  if (!rawData || !rawData.metrics) {
    console.log('No financial metrics data available');
    return null;
  }

  console.log('Processing financial metrics with currencies:', { reportedCurrency, priceCurrency });
  
  // KORRIGIERT: Verbesserte Währungsbereinigung - verhindert alle doppelten Währungszeichen
  const cleanCurrencyValue = (value: number, currency: string): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    
    // Stelle sicher, dass die Währung nur einmal erscheint und richtig formatiert ist
    const cleanCurrency = currency?.toUpperCase()?.trim() || 'USD';
    const formattedValue = `${value} ${cleanCurrency}`;
    
    console.log(`cleanCurrencyValue: input=${value}, currency=${currency}, output=${formattedValue}`);
    
    return formattedValue;
  };

  // Verarbeite die strukturierten Metriken (neu) oder die alten Eigenschaften
  let processedMetrics;
  
  if (rawData.metrics && Array.isArray(rawData.metrics)) {
    // Neue strukturierte Metriken - behalte sie bei
    console.log('Using structured metrics from API:', rawData.metrics.length, 'metrics found');
    processedMetrics = rawData.metrics;
  } else {
    // Alte Struktur - konvertiere zu strukturierten Metriken
    console.log('Converting old metrics structure to new format');
    processedMetrics = {
      ...rawData.metrics,
      // WICHTIG: EPS wird speziell behandelt - nur zur Information, nicht zur Bewertung
      eps: rawData.metrics.eps !== null && rawData.metrics.eps !== undefined 
        ? cleanCurrencyValue(rawData.metrics.eps, priceCurrency)
        : 'N/A'
    };
  }

  console.log('Processed metrics structure:', Array.isArray(processedMetrics) ? 'Array with ' + processedMetrics.length + ' items' : 'Object');

  return {
    metrics: processedMetrics,
    historicalData: rawData.historicalData || [],
    reportedCurrency,
    priceCurrency
  };
};

/**
 * This function RETURNS THE VALUE AS IS with no modifications.
 * The intrinsic value per share is already calculated correctly from the API.
 */
export const normalizeIntrinsicValuePerShare = (intrinsicValue: number | null, sharesOutstanding: number | null): number | null => {
  // IMPORTANT: Return the intrinsic value exactly as provided, with NO modifications!
  console.log(`normalizeIntrinsicValuePerShare called with intrinsicValue: ${intrinsicValue}, returning it unchanged`);
  return intrinsicValue;
};

/**
 * Calculate margin of safety based on current price and intrinsic value
 * using Buffett's standard: MoS = (Intrinsic Value - Market Price) / Market Price
 */
export const calculateMarginOfSafety = (
  intrinsicValue: number | null, 
  currentPrice: number | null
): { value: number; status: 'pass' | 'warning' | 'fail' } => {
  // Default values
  const defaultValue = { value: 0, status: 'fail' as const };
  
  // Validate inputs
  if (intrinsicValue === null || intrinsicValue === undefined || 
      currentPrice === null || currentPrice === undefined || 
      isNaN(Number(intrinsicValue)) || isNaN(Number(currentPrice)) ||
      Number(intrinsicValue) <= 0 || Number(currentPrice) <= 0) {
    return defaultValue;
  }
  
  // Calculate margin of safety percentage using Buffett's formula:
  // MoS = (Intrinsic Value - Market Price) / Market Price
  const mos = ((Number(intrinsicValue) - Number(currentPrice)) / Number(currentPrice)) * 100;
  
  // Determine status based on margin of safety value
  let status: 'pass' | 'warning' | 'fail';
  if (mos >= 30) {
    status = 'pass';      // Strong buy (significantly undervalued)
  } else if (mos >= 10) {
    status = 'warning';   // Potentially good buy (moderately undervalued)
  } else if (mos >= 0) {
    status = 'warning';   // Fair value (slightly undervalued)
  } else {
    status = 'fail';      // Overvalued
  }
  
  console.log(`calculateMarginOfSafety: intrinsicValue=${intrinsicValue}, currentPrice=${currentPrice}, mos=${mos.toFixed(2)}`);
  
  return {
    value: parseFloat(mos.toFixed(2)),
    status
  };
};

/**
 * Calculate the recommended buy price with the given margin of safety
 */
export const calculateBuffettBuyPrice = (
  intrinsicValue: number | null, 
  targetMarginOfSafety: number = 20
): number | null => {
  if (intrinsicValue === null || intrinsicValue === undefined || isNaN(Number(intrinsicValue)) || Number(intrinsicValue) <= 0) {
    return null;
  }
  
  const discountFactor = 1 - (targetMarginOfSafety / 100);
  const buyPrice = parseFloat((Number(intrinsicValue) * discountFactor).toFixed(2));
  
  console.log(`calculateBuffettBuyPrice: intrinsicValue=${intrinsicValue}, targetMarginOfSafety=${targetMarginOfSafety}, buyPrice=${buyPrice}`);
  
  return buyPrice;
};

/**
 * Fix DCF calculation for negative net debt (net cash position)
 * Correct formula: Equity Value = Enterprise Value - Net Debt
 * When Net Debt is negative (company has net cash), it should INCREASE equity value
 */
export const correctDCFForNegativeNetDebt = (dcfData: any): any => {
  if (!dcfData || typeof dcfData.netDebt === 'undefined') {
    return dcfData;
  }

  const netDebt = Number(dcfData.netDebt) || 0;
  const enterpriseValue = Number(dcfData.enterpriseValue) || 0;
  const sharesOutstanding = Number(dcfData.dilutedSharesOutstanding) || Number(dcfData.sharesOutstanding) || 0;

  console.log(`DCF Correction - Original values:`);
  console.log(`  Enterprise Value: ${enterpriseValue}`);
  console.log(`  Net Debt: ${netDebt}`);
  console.log(`  Shares Outstanding: ${sharesOutstanding}`);
  console.log(`  Original Equity Value: ${dcfData.equityValue}`);
  console.log(`  Original DCF Value per Share: ${dcfData.dcfValue || dcfData.equityValuePerShare || dcfData.intrinsicValue}`);

  // Apply correct DCF formula: Equity Value = Enterprise Value - Net Debt
  // When netDebt is negative (net cash), this will INCREASE equity value
  const correctedEquityValue = enterpriseValue - netDebt;
  const correctedDcfValuePerShare = sharesOutstanding > 0 ? correctedEquityValue / sharesOutstanding : 0;

  console.log(`DCF Correction - Corrected values:`);
  console.log(`  Corrected Equity Value = ${enterpriseValue} - (${netDebt}) = ${correctedEquityValue}`);
  console.log(`  Corrected DCF Value per Share = ${correctedEquityValue} / ${sharesOutstanding} = ${correctedDcfValuePerShare}`);

  // Update all relevant properties with corrected values
  const correctedDcfData = {
    ...dcfData,
    equityValue: correctedEquityValue,
    dcfValue: correctedDcfValuePerShare,
    equityValuePerShare: correctedDcfValuePerShare,
    intrinsicValue: correctedDcfValuePerShare
  };

  console.log(`DCF correction applied successfully. Net debt effect: ${netDebt < 0 ? 'INCREASED' : 'DECREASED'} equity value by ${Math.abs(netDebt)}`);

  return correctedDcfData;
};
