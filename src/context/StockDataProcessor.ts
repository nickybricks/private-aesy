/**
 * Processes financial metrics data and adds additional information
 */
export const processFinancialMetrics = (data: any, reportedCurrency: string, stockCurrency: string) => {
  if (!data) return null;
  
  // Process all metrics
  const processedData = {
    ...data,
    reportedCurrency: reportedCurrency || data.reportedCurrency || stockCurrency,
  };

  // Calculate any needed derivatives
  if (processedData.metrics) {
    for (const metric of processedData.metrics) {
      // Keep original values for potential conversion
      if (metric.value !== undefined && metric.value !== null) {
        metric.originalValue = metric.value;
      }
    }
  }

  // Process historical data
  if (processedData.historicalData) {
    // Keep original values for potential conversions
    if (processedData.historicalData.revenue) {
      for (const item of processedData.historicalData.revenue) {
        if (item.value !== undefined) {
          item.originalValue = item.value;
          item.originalCurrency = reportedCurrency;
        }
      }
    }
    
    if (processedData.historicalData.earnings) {
      for (const item of processedData.historicalData.earnings) {
        if (item.value !== undefined) {
          item.originalValue = item.value;
          item.originalCurrency = reportedCurrency;
        }
      }
    }
    
    if (processedData.historicalData.eps) {
      for (const item of processedData.historicalData.eps) {
        if (item.value !== undefined) {
          item.originalValue = item.value;
          item.originalCurrency = reportedCurrency;
        }
      }
    }
  }

  return processedData;
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
  
  // Calculate margin of safety percentage
  const mos = ((Number(intrinsicValue) - Number(currentPrice)) / Number(intrinsicValue)) * 100;
  
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
