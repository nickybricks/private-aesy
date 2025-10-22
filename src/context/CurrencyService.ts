
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
  console.log('=== HISTORICAL DATA CONVERSION START ===');
  console.log(`fromCurrency: ${fromCurrency}, toCurrency: ${toCurrency}`);
  console.log(`shouldConvertCurrency: ${shouldConvertCurrency(fromCurrency, toCurrency)}`);
  
  if (!shouldConvertCurrency(fromCurrency, toCurrency) || !historicalData) {
    console.log('❌ Conversion übersprungen (shouldConvert=false oder keine Daten)');
    return historicalData;
  }
  
  console.log(`✅ Conversion wird durchgeführt...`);
  
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  if (!rate) {
    console.warn(`❌ Keine Exchange Rate verfügbar - Conversion abgebrochen!`);
    return historicalData;
  }
  
  console.log(`✅ Exchange Rate erhalten: ${rate}`);
  console.log(`Beispiel-Umrechnung: 1,000,000 ${fromCurrency} = ${(1000000 * rate).toFixed(2)} ${toCurrency}`);
  
  const convertItemValues = (items: HistoricalDataItem[]) => {
    if (!items || !Array.isArray(items)) {
      console.log('⚠️ Keine Items zum Konvertieren');
      return [];
    }
    
    console.log(`📊 Konvertiere ${items.length} Items...`);
    
    return items.map((item, index) => {
      if (item.value !== undefined && item.value !== null && !isNaN(Number(item.value))) {
        const originalValue = item.value;
        const convertedValue = originalValue * rate;
        
        if (index === 0) {
          console.log(`Beispiel (erstes Item): ${originalValue} ${fromCurrency} → ${convertedValue} ${toCurrency}`);
        }
        
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
  
  // Preserve all existing keys; only convert known currency-based series
  const result: any = { ...historicalData };
  
  console.log('Konvertiere Revenue-Serie...');
  result.revenue = historicalData.revenue ? convertItemValues(historicalData.revenue) : historicalData.revenue;
  
  console.log('Konvertiere Earnings-Serie...');
  result.earnings = historicalData.earnings ? convertItemValues(historicalData.earnings) : historicalData.earnings;
  
  console.log('Konvertiere EPS-Serie...');
  result.eps = historicalData.eps ? convertItemValues(historicalData.eps) : historicalData.eps;
  
  console.log('Konvertiere EBITDA-Serie...');
  result.ebitda = historicalData.ebitda ? convertItemValues(historicalData.ebitda) : historicalData.ebitda;
  
  console.log('Konvertiere EPS W/O NRI-Serie...');
  result.epsWoNri = historicalData.epsWoNri ? convertItemValues(historicalData.epsWoNri) : historicalData.epsWoNri;
  
  console.log('Konvertiere Free Cash Flow-Serie...');
  result.freeCashFlow = historicalData.freeCashFlow ? convertItemValues(historicalData.freeCashFlow) : historicalData.freeCashFlow;
  
  console.log('Konvertiere Dividend-Serie...');
  result.dividend = historicalData.dividend ? convertItemValues(historicalData.dividend) : historicalData.dividend;
  
  console.log('Konvertiere Net Income-Serie...');
  result.netIncome = historicalData.netIncome ? convertItemValues(historicalData.netIncome) : historicalData.netIncome;
  
  console.log('Konvertiere Operating Cash Flow-Serie...');
  result.operatingCashFlow = historicalData.operatingCashFlow ? convertItemValues(historicalData.operatingCashFlow) : historicalData.operatingCashFlow;
  
  // Do NOT convert percentages like payoutRatio; leave other keys untouched
  
  console.log(`✅ Converted historical data series (netIncome and operatingCashFlow included)`);
  console.log('=== HISTORICAL DATA CONVERSION ENDE ===');
  
  return result;
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
            // Auch DCF-Daten aktualisieren
            updatedRating.dcfData = {
              ...updatedRating.dcfData,
              intrinsicValue: convertedDcfValue,
              currency: toCurrency
            };
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
        
        // Berechne auch den bestBuyPrice neu
        if (updatedRating.targetMarginOfSafety !== undefined) {
          const discountFactor = 1 - (updatedRating.targetMarginOfSafety / 100);
          updatedRating.bestBuyPrice = updatedRating.intrinsicValue * discountFactor;
          console.log(`Recalculated bestBuyPrice after conversion: ${updatedRating.bestBuyPrice}`);
        }
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

