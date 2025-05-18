
/**
 * Konvertiert die Werte der Finanzkennzahlen von der Quellwährung in die Zielwährung
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
      const convertedValue = convertCurrency(originalValue, rate);
      
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
 * Konvertiert historische Daten von der Quellwährung in die Zielwährung
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
        const convertedValue = convertCurrency(originalValue, rate);
        
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
 * Konvertiert die Bewertungswerte von der Quellwährung in die Zielwährung
 */
export const convertRatingValues = async (rating: OverallRatingData, fromCurrency: string, toCurrency: string) => {
  if (!shouldConvertCurrency(fromCurrency, toCurrency) || !rating) {
    return rating;
  }
  
  console.log(`Converting rating values from ${fromCurrency} to ${toCurrency}`);
  
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  if (!rate) return rating;
  
  console.log(`Exchange rate: ${rate}`);
  
  // Speichere Originalwerte vor der Konvertierung
  const originalIntrinsicValue = rating.intrinsicValue;
  const originalBestBuyPrice = rating.bestBuyPrice;
  const originalPrice = rating.currentPrice;
  
  let updatedRating = { ...rating };
  
  // Prüfen und sicherstellen, dass dcfData direkt verwendet wird, wenn vorhanden
  if (rating.dcfData && rating.dcfData.intrinsicValue !== undefined) {
    console.log(`Using intrinsicValue directly from dcfData: ${rating.dcfData.intrinsicValue}`);
    updatedRating.intrinsicValue = rating.dcfData.intrinsicValue;
    
    // Berechne den bestBuyPrice aus dem intrinsischen Wert und der targetMarginOfSafety
    if (rating.targetMarginOfSafety !== undefined) {
      const discountFactor = 1 - (rating.targetMarginOfSafety / 100);
      updatedRating.bestBuyPrice = rating.dcfData.intrinsicValue * discountFactor;
      console.log(`Calculated bestBuyPrice: ${updatedRating.bestBuyPrice} from intrinsicValue ${rating.dcfData.intrinsicValue} with discount factor ${discountFactor}`);
    }
  } else {
    // Nur konvertieren, wenn dcfData nicht direkt verfügbar ist
    if (updatedRating.intrinsicValue !== null && updatedRating.intrinsicValue !== undefined && !isNaN(Number(updatedRating.intrinsicValue))) {
      updatedRating.intrinsicValue = await convertCurrency(updatedRating.intrinsicValue, fromCurrency, toCurrency);
      console.log(`Converted intrinsicValue from ${originalIntrinsicValue} to ${updatedRating.intrinsicValue}`);
    }
    
    if (updatedRating.bestBuyPrice !== null && updatedRating.bestBuyPrice !== undefined && !isNaN(Number(updatedRating.bestBuyPrice))) {
      updatedRating.bestBuyPrice = await convertCurrency(updatedRating.bestBuyPrice, fromCurrency, toCurrency);
      console.log(`Converted bestBuyPrice from ${originalBestBuyPrice} to ${updatedRating.bestBuyPrice}`);
    }
  }
  
  // Aktienpreis konvertieren
  if (updatedRating.currentPrice !== null && updatedRating.currentPrice !== undefined && !isNaN(Number(updatedRating.currentPrice))) {
    updatedRating.currentPrice = await convertCurrency(updatedRating.currentPrice, fromCurrency, toCurrency);
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
