
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
  
  console.log(`Converting financial metrics from ${fromCurrency} to ${toCurrency}`);
  
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  if (!rate) {
    console.warn(`DCF ERROR: No exchange rate available for ${fromCurrency} to ${toCurrency}`);
    return metrics;
  }
  
  console.log(`Using exchange rate: ${rate} for financial metrics conversion`);
  
  return metrics.map(metric => {
    if (metric.value !== null && metric.value !== undefined && !isNaN(Number(metric.value))) {
      const originalValue = metric.value;
      const convertedValue = originalValue * rate;
      
      // Check for NaN result
      if (isNaN(convertedValue)) {
        console.warn(`DCF ERROR: Converted value is NaN for metric ${metric.name || 'unnamed'}`);
        return metric; // Return original metric if conversion fails
      }
      
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
  
  console.log(`Converting historical data from ${fromCurrency} to ${toCurrency}`);
  
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  if (!rate) {
    console.warn(`DCF ERROR: No exchange rate available for historical data conversion from ${fromCurrency} to ${toCurrency}`);
    return historicalData;
  }
  
  console.log(`Using exchange rate: ${rate} for historical data conversion`);
  
  const convertItemValues = (items: HistoricalDataItem[]) => {
    if (!items || !Array.isArray(items)) return [];
    
    return items.map(item => {
      if (item.value !== undefined && item.value !== null && !isNaN(Number(item.value))) {
        const originalValue = item.value;
        const convertedValue = originalValue * rate;
        
        // Check for NaN result
        if (isNaN(convertedValue)) {
          console.warn(`DCF ERROR: Converted historical value is NaN for year ${item.year}`);
          return item; // Return original item if conversion fails
        }
        
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
  if (!rate) {
    console.warn(`DCF ERROR: No exchange rate available for rating values conversion from ${fromCurrency} to ${toCurrency}`);
    return rating;
  }
  
  console.log(`Exchange rate for rating values: ${rate}`);
  
  // Store original values before conversion
  const originalIntrinsicValue = rating.intrinsicValue;
  const originalBestBuyPrice = rating.bestBuyPrice;
  const originalPrice = rating.currentPrice;
  
  let updatedRating = { ...rating };
  
  // Check and ensure dcfData is used directly if available
  if (rating.dcfData && rating.dcfData.intrinsicValue !== undefined) {
    console.log(`Using intrinsicValue directly from dcfData: ${rating.dcfData.intrinsicValue}`);
    
    if (isNaN(Number(rating.dcfData.intrinsicValue))) {
      console.warn(`DCF ERROR: Intrinsic value from DCF data is NaN: ${rating.dcfData.intrinsicValue}`);
    } else {
      // Check if we need to convert the DCF intrinsic value
      if (rating.dcfData.currency && rating.dcfData.currency !== toCurrency) {
        console.log(`Converting DCF intrinsic value from ${rating.dcfData.currency} to ${toCurrency}`);
        const dcfRate = await getExchangeRate(rating.dcfData.currency, toCurrency);
        
        if (!dcfRate || isNaN(Number(dcfRate))) {
          console.warn(`DCF ERROR: No valid exchange rate for DCF value from ${rating.dcfData.currency} to ${toCurrency}`);
        } else {
          const convertedDcfValue = rating.dcfData.intrinsicValue * dcfRate;
          if (isNaN(convertedDcfValue)) {
            console.warn('DCF ERROR: Converted DCF intrinsic value is NaN');
          } else {
            console.log(`Converted DCF intrinsic value: ${convertedDcfValue}`);
            updatedRating.intrinsicValue = convertedDcfValue;
          }
        }
      } else {
        updatedRating.intrinsicValue = rating.dcfData.intrinsicValue;
      }
    }
    
    // Calculate bestBuyPrice from intrinsic value and targetMarginOfSafety
    if (rating.targetMarginOfSafety !== undefined && updatedRating.intrinsicValue !== null && !isNaN(updatedRating.intrinsicValue)) {
      const discountFactor = 1 - (rating.targetMarginOfSafety / 100);
      updatedRating.bestBuyPrice = updatedRating.intrinsicValue * discountFactor;
      console.log(`Calculated bestBuyPrice: ${updatedRating.bestBuyPrice} from intrinsicValue ${updatedRating.intrinsicValue} with discount factor ${discountFactor}`);
    }
  } else {
    // Only convert if dcfData is not directly available
    if (updatedRating.intrinsicValue !== null && updatedRating.intrinsicValue !== undefined && !isNaN(Number(updatedRating.intrinsicValue))) {
      const convertedValue = Number(updatedRating.intrinsicValue) * rate;
      
      if (isNaN(convertedValue)) {
        console.warn('DCF ERROR: Converted intrinsic value is NaN');
      } else {
        updatedRating.intrinsicValue = convertedValue;
        console.log(`Converted intrinsicValue from ${originalIntrinsicValue} to ${updatedRating.intrinsicValue}`);
      }
    }
    
    if (updatedRating.bestBuyPrice !== null && updatedRating.bestBuyPrice !== undefined && !isNaN(Number(updatedRating.bestBuyPrice))) {
      const convertedValue = Number(updatedRating.bestBuyPrice) * rate;
      
      if (isNaN(convertedValue)) {
        console.warn('DCF ERROR: Converted best buy price is NaN');
      } else {
        updatedRating.bestBuyPrice = convertedValue;
        console.log(`Converted bestBuyPrice from ${originalBestBuyPrice} to ${updatedRating.bestBuyPrice}`);
      }
    }
  }
  
  // Convert stock price
  if (updatedRating.currentPrice !== null && updatedRating.currentPrice !== undefined && !isNaN(Number(updatedRating.currentPrice))) {
    const convertedValue = Number(updatedRating.currentPrice) * rate;
    
    if (isNaN(convertedValue)) {
      console.warn('DCF ERROR: Converted current price is NaN');
    } else {
      updatedRating.currentPrice = convertedValue;
      console.log(`Converted currentPrice from ${originalPrice} to ${updatedRating.currentPrice}`);
    }
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
