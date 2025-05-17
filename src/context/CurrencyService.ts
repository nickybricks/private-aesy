
import { shouldConvertCurrency, convertCurrency } from '@/utils/currencyConverter';
import { FinancialMetricsData, HistoricalDataItem, OverallRatingData } from './StockContextTypes';

export const convertFinancialMetrics = async (
  metrics: any[], 
  reportedCurrency: string, 
  stockPriceCurrency: string
): Promise<any[]> => {
  if (!metrics || !reportedCurrency || !stockPriceCurrency) return metrics;
  
  if (!shouldConvertCurrency(stockPriceCurrency, reportedCurrency)) {
    console.log(`No conversion needed: both stock price and metrics are in ${stockPriceCurrency}`);
    return metrics;
  }
  
  const convertedMetrics = await Promise.all(metrics.map(async metric => {
    if (
      typeof metric.value !== 'number' || 
      isNaN(metric.value) || 
      metric.isPercentage ||
      metric.isMultiplier
    ) {
      return metric;
    }
    
    try {
      const originalValue = metric.value;
      const convertedValue = await convertCurrency(metric.value, reportedCurrency, stockPriceCurrency);
      
      return {
        ...metric,
        value: convertedValue,
        originalValue: originalValue,
        originalCurrency: reportedCurrency
      };
    } catch (error) {
      console.error(`Error converting ${metric.name}:`, error);
      return metric;
    }
  }));

  return convertedMetrics;
};

export const convertHistoricalData = async (
  historicalData: any, 
  reportedCurrency: string, 
  stockPriceCurrency: string
): Promise<any> => {
  if (!historicalData || !reportedCurrency || !stockPriceCurrency) return historicalData;
  
  if (!shouldConvertCurrency(stockPriceCurrency, reportedCurrency)) {
    console.log(`No historical data conversion needed: both stock price and data are in ${stockPriceCurrency}`);
    return historicalData;
  }
  
  try {
    const convertedData = {
      revenue: historicalData.revenue ? await Promise.all(historicalData.revenue.map(async (item: any) => ({
        ...item,
        originalValue: item.value,
        originalCurrency: reportedCurrency,
        value: await convertCurrency(item.value, reportedCurrency, stockPriceCurrency)
      }))) : [],
      earnings: historicalData.earnings ? await Promise.all(historicalData.earnings.map(async (item: any) => ({
        ...item,
        originalValue: item.value,
        originalCurrency: reportedCurrency,
        value: await convertCurrency(item.value, reportedCurrency, stockPriceCurrency)
      }))) : [],
      eps: historicalData.eps ? await Promise.all(historicalData.eps.map(async (item: any) => ({
        ...item,
        originalValue: item.value,
        originalCurrency: reportedCurrency,
        value: await convertCurrency(item.value, reportedCurrency, stockPriceCurrency)
      }))) : []
    };

    return convertedData;
  } catch (error) {
    console.error('Error converting historical data:', error);
    return historicalData;
  }
};

export const convertRatingValues = async (
  rating: OverallRatingData, 
  ratingCurrency: string, 
  priceCurrency: string
): Promise<OverallRatingData> => {
  if (!rating) return rating;
  
  try {
    // Create a copy of the rating object and initialize required properties
    const updatedRating = {
      ...rating,
      originalIntrinsicValue: rating.originalIntrinsicValue || null,
      originalBestBuyPrice: rating.originalBestBuyPrice || null,
      originalPrice: rating.originalPrice || null
    };
    
    console.log(`Rating original currency: ${ratingCurrency}, Target currency: ${priceCurrency}`);
    console.log(`Original intrinsic value: ${updatedRating.intrinsicValue} ${ratingCurrency}`);
    
    if (shouldConvertCurrency(priceCurrency, ratingCurrency)) {
      console.log(`Converting rating values from ${ratingCurrency} to ${priceCurrency}`);
      
      if (updatedRating.intrinsicValue !== null && updatedRating.intrinsicValue !== undefined) {
        updatedRating.originalIntrinsicValue = updatedRating.intrinsicValue;
        
        updatedRating.intrinsicValue = await convertCurrency(
          updatedRating.intrinsicValue, 
          ratingCurrency, 
          priceCurrency
        );
        
        console.log(`Converted intrinsic value: ${updatedRating.intrinsicValue} ${priceCurrency}`);
      }
      
      if (updatedRating.intrinsicValue !== null && 
          updatedRating.intrinsicValue !== undefined && 
          updatedRating.targetMarginOfSafety !== undefined) {
          
        if (updatedRating.bestBuyPrice !== null && updatedRating.bestBuyPrice !== undefined) {
          updatedRating.originalBestBuyPrice = updatedRating.bestBuyPrice;
        }
        
        updatedRating.bestBuyPrice = updatedRating.intrinsicValue * 
          (1 - (updatedRating.targetMarginOfSafety / 100));
        
        console.log(`Recalculated best buy price: ${updatedRating.bestBuyPrice} ${priceCurrency}`);
      }
      
      if (updatedRating.intrinsicValue !== null && 
          updatedRating.intrinsicValue !== undefined && 
          updatedRating.currentPrice !== null && 
          updatedRating.currentPrice !== undefined) {
        
        if (updatedRating.currentPrice) {
          updatedRating.originalPrice = updatedRating.currentPrice;
          
          console.log(`Current price already in ${priceCurrency}: ${updatedRating.currentPrice}`);
        }
        
        if (updatedRating.intrinsicValue > 0) {
          updatedRating.marginOfSafety = {
            value: ((updatedRating.intrinsicValue - updatedRating.currentPrice) / 
              updatedRating.intrinsicValue) * 100,
            status: updatedRating.marginOfSafety?.status || 'fail'
          };
          
          console.log(`Recalculated margin of safety: ${updatedRating.marginOfSafety.value}%`);
        }
      }
      
      if (ratingCurrency !== priceCurrency) {
        updatedRating.originalCurrency = ratingCurrency;
        updatedRating.currency = priceCurrency;
      }
    } else {
      console.log(`No rating conversion needed: both stock price and rating are in ${priceCurrency}`);
    }
    
    return updatedRating;
  } catch (error) {
    console.error('Error converting rating values:', error);
    return rating;
  }
};
