/**
 * Processes financial metrics data and adds additional information
 */
export const processFinancialMetrics = (rawData: any, reportedCurrency: string, priceCurrency: string) => {
  if (!rawData || !rawData.metrics) {
    console.log('No financial metrics data available');
    return null;
  }

  console.log('Processing financial metrics with currencies:', { reportedCurrency, priceCurrency });
  
  // KORRIGIERT: Verhindere doppelte Währungszeichen bereits bei der Verarbeitung
  const cleanCurrencyValue = (value: number, currency: string): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    
    // Stelle sicher, dass die Währung nur einmal erscheint
    const cleanCurrency = currency?.toUpperCase() || 'USD';
    return `${value} ${cleanCurrency}`;
  };

  const processedMetrics = {
    ...rawData.metrics,
    // WICHTIG: EPS wird speziell behandelt - nur zur Information, nicht zur Bewertung
    eps: rawData.metrics.eps !== null && rawData.metrics.eps !== undefined 
      ? cleanCurrencyValue(rawData.metrics.eps, priceCurrency)
      : 'N/A'
  };

  console.log('Processed EPS value:', processedMetrics.eps);
  console.log('Original EPS from raw data:', rawData.metrics.eps);

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
