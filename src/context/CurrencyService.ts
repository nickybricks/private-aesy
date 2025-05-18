
import { shouldConvertCurrency, getExchangeRate } from '@/utils/currencyConverter';
import { OverallRatingData } from './StockContextTypes';

// Define the needed types
interface HistoricalDataItem {
  value: number;
  year: string;
  originalValue?: number;
  originalCurrency?: string;
}

/**
 * Convert financial metrics values from source currency to target currency
 */
export const convertFinancialMetrics = async (metrics: any[], fromCurrency: string, toCurrency: string) => {
  if (!shouldConvertCurrency(fromCurrency, toCurrency) || !metrics || metrics.length === 0) {
    return metrics;
  }
  
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  if (!rate) return metrics;
  
  return metrics.map(metric => {
    if (metric.value !== null && metric.value !== undefined && !isNaN(Number(metric.value))) {
      const originalValue = metric.value;
      const convertedValue = originalValue * rate;
      
      return {
        ...metric,
        value: convertedValue,
        originalValue,
        originalCurrency: fromCurrency
      };
    }
    return metric;
  });
};

/**
 * Convert historical data from source currency to target currency
 */
export const convertHistoricalData = async (historicalData: any, fromCurrency: string, toCurrency: string) => {
  if (!shouldConvertCurrency(fromCurrency, toCurrency) || !historicalData) {
    return historicalData;
  }
  
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  if (!rate) return historicalData;
  
  const convertItemValues = (items: HistoricalDataItem[]) => {
    if (!items || !Array.isArray(items)) return [];
    
    return items.map(item => {
      if (item.value !== undefined && item.value !== null && !isNaN(Number(item.value))) {
        const originalValue = item.value;
        const convertedValue = originalValue * rate;
        
        return {
          ...item,
          value: convertedValue,
          originalValue,
          originalCurrency: fromCurrency
        };
      }
      return item;
    });
  };
  
  return {
    revenue: historicalData.revenue ? convertItemValues(historicalData.revenue) : [],
    earnings: historicalData.earnings ? convertItemValues(historicalData.earnings) : [],
    eps: historicalData.eps ? convertItemValues(historicalData.eps) : []
  };
};

/**
 * Convert rating values from source currency to target currency
 */
export const convertRatingValues = async (rating: OverallRatingData, fromCurrency: string, toCurrency: string) => {
  if (!shouldConvertCurrency(fromCurrency, toCurrency) || !rating) {
    return rating;
  }
  
  console.log(`Converting rating values from ${fromCurrency} to ${toCurrency}`);
  
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  if (!rate) return rating;
  
  console.log(`Exchange rate: ${rate}`);
  
  // Store original values before conversion
  const originalIntrinsicValue = rating.intrinsicValue;
  const originalBestBuyPrice = rating.bestBuyPrice;
  const originalPrice = rating.currentPrice;
  
  let updatedRating = { ...rating };
  
  // Check and ensure dcfData is used directly if available
  if (rating.dcfData && rating.dcfData.intrinsicValue !== undefined) {
    console.log(`Using intrinsicValue directly from dcfData: ${rating.dcfData.intrinsicValue}`);
    updatedRating.intrinsicValue = rating.dcfData.intrinsicValue;
    
    // Calculate bestBuyPrice from intrinsic value and targetMarginOfSafety
    if (rating.targetMarginOfSafety !== undefined) {
      const discountFactor = 1 - (rating.targetMarginOfSafety / 100);
      updatedRating.bestBuyPrice = rating.dcfData.intrinsicValue * discountFactor;
      console.log(`Calculated bestBuyPrice: ${updatedRating.bestBuyPrice} from intrinsicValue ${rating.dcfData.intrinsicValue} with discount factor ${discountFactor}`);
    }
  } else {
    // Only convert if dcfData is not directly available
    if (updatedRating.intrinsicValue !== null && updatedRating.intrinsicValue !== undefined && !isNaN(Number(updatedRating.intrinsicValue))) {
      const convertedValue = Number(updatedRating.intrinsicValue) * rate;
      updatedRating.intrinsicValue = convertedValue;
      console.log(`Converted intrinsicValue from ${originalIntrinsicValue} to ${updatedRating.intrinsicValue}`);
    }
    
    if (updatedRating.bestBuyPrice !== null && updatedRating.bestBuyPrice !== undefined && !isNaN(Number(updatedRating.bestBuyPrice))) {
      const convertedValue = Number(updatedRating.bestBuyPrice) * rate;
      updatedRating.bestBuyPrice = convertedValue;
      console.log(`Converted bestBuyPrice from ${originalBestBuyPrice} to ${updatedRating.bestBuyPrice}`);
    }
  }
  
  // Convert stock price
  if (updatedRating.currentPrice !== null && updatedRating.currentPrice !== undefined && !isNaN(Number(updatedRating.currentPrice))) {
    const convertedValue = Number(updatedRating.currentPrice) * rate;
    updatedRating.currentPrice = convertedValue;
    console.log(`Converted currentPrice from ${originalPrice} to ${updatedRating.currentPrice}`);
  }
  
  return {
    ...updatedRating,
    currency: toCurrency,
    originalCurrency: fromCurrency,
    originalIntrinsicValue,
    originalBestBuyPrice,
    originalPrice
  };
};
