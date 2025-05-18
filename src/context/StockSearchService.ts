
import { fetchStockInfo, analyzeBuffettCriteria, getFinancialMetrics, getOverallRating } from '@/api/stockApi';
import { hasOpenAiApiKey } from '@/api/openaiApi';
import { useToast } from '@/hooks/use-toast';
import { shouldConvertCurrency } from '@/utils/currencyConverter';
import { processFinancialMetrics } from './StockDataProcessor';
import { convertFinancialMetrics, convertHistoricalData, convertRatingValues } from './CurrencyService';

export const useStockSearch = () => {
  const { toast } = useToast();
  
  const checkHasGptAvailable = (): boolean => {
    return hasOpenAiApiKey();
  };

  const checkCriticalDataMissing = (info: any): boolean => {
    if (!info) return true;
    
    return (
      info.price === null || 
      info.price === 0 || 
      info.marketCap === null || 
      info.marketCap === 0
    );
  };

  const searchStockInfo = async (ticker: string) => {
    try {
      let info = await fetchStockInfo(ticker);
      console.log('Stock Info:', JSON.stringify(info, null, 2));
      
      const stockCurrency = info && info.currency ? info.currency : 'USD';
      console.log(`Stock price currency: ${stockCurrency}`);
      
      const criticalDataMissing = checkCriticalDataMissing(info);
      
      if (criticalDataMissing) {
        toast({
          title: "Analyse nicht möglich",
          description: `Für ${info.name} liegen nicht ausreichend Daten für eine Buffett-Analyse vor.`,
          variant: "destructive",
        });
        return { info, stockCurrency, criticalDataMissing, criteria: null, metricsData: null, rating: null, dcfData: null };
      }
      
      toast({
        title: "Analyse läuft",
        description: `Analysiere ${info.name} (${info.ticker}) nach Warren Buffett's Kriterien...`,
      });
      
      const [criteria, rawMetricsData, rating] = await Promise.all([
        analyzeBuffettCriteria(ticker),
        getFinancialMetrics(ticker),
        getOverallRating(ticker)
      ]);
      
      console.log('Buffett Criteria:', JSON.stringify(criteria, null, 2));
      console.log('Financial Metrics:', JSON.stringify(rawMetricsData, null, 2));
      console.log('Overall Rating:', JSON.stringify(rating, null, 2));
      
      const priceCurrency = info?.currency || 'USD';
      const reportedCurrency = rawMetricsData?.reportedCurrency || priceCurrency;
      
      console.log(`Price currency: ${priceCurrency}, Reported financial data currency: ${reportedCurrency}`);
      
      let metricsData = processFinancialMetrics(rawMetricsData, reportedCurrency, priceCurrency);
      
      if (metricsData) {
        if (metricsData.metrics) {
          if (shouldConvertCurrency(priceCurrency, reportedCurrency)) {
            metricsData.metrics = await convertFinancialMetrics(metricsData.metrics, reportedCurrency, priceCurrency);
          }
        }
        
        if (metricsData.historicalData) {
          if (shouldConvertCurrency(priceCurrency, reportedCurrency)) {
            metricsData.historicalData = await convertHistoricalData(metricsData.historicalData, reportedCurrency, priceCurrency);
          }
        }
      }
      
      // Initialize the rating with required properties
      let updatedRating = null;
      let extractedDcfData = null;
      
      if (rating) {
        // Überprüfe, ob dcfData in der API-Antwort vorhanden ist
        const ratingAny = rating as any;
        if (ratingAny && typeof ratingAny === 'object' && 'dcfData' in ratingAny) {
          extractedDcfData = ratingAny.dcfData;
          console.log('DCF Data found:', JSON.stringify(extractedDcfData, null, 2));
          
          // Prüfe explizit, ob equityValuePerShare vorhanden ist und logge es
          if (extractedDcfData.equityValuePerShare !== undefined) {
            console.log(`DCF equityValuePerShare (this should be used as intrinsicValue): ${extractedDcfData.equityValuePerShare}`);
          }
          
          // Prüfe explizit die intrinsicValue aus dem DCF
          if (extractedDcfData.intrinsicValue !== undefined) {
            console.log(`DCF intrinsicValue: ${extractedDcfData.intrinsicValue}`);
          } else if (extractedDcfData.equityValuePerShare !== undefined) {
            // Wenn intrinsicValue nicht existiert, aber equityValuePerShare ja, verwende diese
            extractedDcfData.intrinsicValue = extractedDcfData.equityValuePerShare;
            console.log(`Setting intrinsicValue to equityValuePerShare: ${extractedDcfData.intrinsicValue}`);
          }
        }
        
        updatedRating = {
          ...rating,
          originalIntrinsicValue: rating.originalIntrinsicValue || null,
          originalBestBuyPrice: rating.originalBestBuyPrice || null,
          originalPrice: rating.originalPrice || null,
          reportedCurrency: reportedCurrency, // Explicitly assign the required property
          dcfData: extractedDcfData // Assign the extracted DCF data
        };
        
        // WICHTIG: Setze den intrinsischen Wert aus den DCF-Daten, wenn verfügbar
        if (extractedDcfData && (extractedDcfData.intrinsicValue !== undefined || extractedDcfData.equityValuePerShare !== undefined)) {
          const intrinsicValue = extractedDcfData.intrinsicValue || extractedDcfData.equityValuePerShare;
          
          console.log(`Setting rating.intrinsicValue directly from DCF data: ${intrinsicValue}`);
          updatedRating.intrinsicValue = intrinsicValue;
          
          // Aktualisiere auch den info Objekt mit dem intrinsicValue
          if (info) {
            // Erstelle ein neues Objekt anstatt das bestehende zu modifizieren
            info = {
              ...info,
              intrinsicValue: intrinsicValue
            };
            console.log(`Updated info.intrinsicValue with DCF data: ${intrinsicValue}`);
          }
        }
        
        const ratingCurrency = updatedRating.currency || reportedCurrency;
        updatedRating = await convertRatingValues(updatedRating, ratingCurrency, priceCurrency);
        
        if (info && info.price !== null && info.price !== undefined) {
          updatedRating.currentPrice = info.price;
          console.log(`Using stock price from info: ${updatedRating.currentPrice} ${priceCurrency}`);
        }
      }
      
      toast({
        title: "Analyse abgeschlossen",
        description: `Die Analyse für ${info.name} wurde erfolgreich durchgeführt.`,
      });
      
      // Logge die endgültigen Werte für Debugging
      console.log(`Final intrinsicValue in rating: ${updatedRating?.intrinsicValue}`);
      console.log(`Final intrinsicValue in info: ${info?.intrinsicValue}`);
      console.log(`Final intrinsicValue in dcfData: ${extractedDcfData?.intrinsicValue}`);
      
      return { 
        info, 
        stockCurrency, 
        criticalDataMissing, 
        criteria, 
        metricsData, 
        rating: updatedRating,
        dcfData: extractedDcfData
      };
    } catch (error) {
      console.error('Error searching for stock:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      
      let enhancedErrorMessage = errorMessage;
      if(errorMessage.includes("Keine Daten gefunden für")) {
        const searchedTicker = ticker.toUpperCase();
        
        if(searchedTicker === "APPL") {
          enhancedErrorMessage = `Keine Daten gefunden für ${searchedTicker}. Meinten Sie vielleicht AAPL (Apple)?`;
        } else if(searchedTicker === "GOOGL" || searchedTicker === "GOOG") {
          enhancedErrorMessage = `Keine Daten gefunden für ${searchedTicker}. Versuchen Sie es mit GOOGL oder GOOG (Alphabet/Google).`;
        } else if(searchedTicker === "FB") {
          enhancedErrorMessage = `Keine Daten gefunden für ${searchedTicker}. Meta (ehemals Facebook) wird jetzt als META gehandelt.`;
        } else {
          enhancedErrorMessage = `Keine Daten gefunden für ${searchedTicker}. Bitte überprüfen Sie das Aktiensymbol.`;
        }
      }
      
      toast({
        title: "Fehler",
        description: enhancedErrorMessage,
        variant: "destructive",
      });
      
      throw new Error(enhancedErrorMessage);
    }
  };

  return {
    checkHasGptAvailable,
    checkCriticalDataMissing,
    searchStockInfo
  };
};
