
import { fetchStockInfo, analyzeBuffettCriteria, getFinancialMetrics, getOverallRating } from '@/api/stockApi';
import { hasOpenAiApiKey } from '@/api/openaiApi';
import { useToast } from '@/hooks/use-toast';
import { shouldConvertCurrency } from '@/utils/currencyConverter';
import { processFinancialMetrics } from './StockDataProcessor';
import { convertFinancialMetrics, convertHistoricalData, convertRatingValues } from './CurrencyService';
import { DCFData } from './StockContextTypes';

// Neue Funktion zur Berechnung der DCF-Daten
const calculateDCFData = (
  ufcf: number[], 
  wacc: number, 
  presentTerminalValue: number, 
  netDebt: number, 
  dilutedSharesOutstanding: number,
  currency: string
): DCFData | null => {
  // Prüfen, ob alle notwendigen Eingabedaten vorhanden sind
  if (!ufcf || !Array.isArray(ufcf) || ufcf.length < 1 || 
      wacc === undefined || wacc === null || 
      presentTerminalValue === undefined || presentTerminalValue === null || 
      netDebt === undefined || netDebt === null || 
      dilutedSharesOutstanding === undefined || dilutedSharesOutstanding === null ||
      dilutedSharesOutstanding <= 0) {
    console.warn("DCF-Berechnung nicht möglich - Unvollständige Daten:", {
      ufcf, wacc, presentTerminalValue, netDebt, dilutedSharesOutstanding
    });
    return null;
  }
  
  try {
    // WACC in Dezimalform
    const waccDecimal = wacc / 100;
    
    // Present Values der einzelnen UFCFs berechnen
    const pvUfcfs = ufcf.map((cashflow, idx) => {
      return cashflow / Math.pow(1 + waccDecimal, idx + 1);
    });
    
    // Summe aller PV der UFCFs berechnen
    const sumPvUfcfs = pvUfcfs.reduce((sum, val) => sum + val, 0);
    
    // Enterprise Value berechnen (Summe PV UFCFs + PV Terminal Value)
    const enterpriseValue = sumPvUfcfs + presentTerminalValue;
    
    // Equity Value berechnen (Enterprise Value - Nettoverschuldung)
    const equityValue = enterpriseValue - netDebt;
    
    // Inneren Wert pro Aktie berechnen
    const intrinsicValue = equityValue / dilutedSharesOutstanding;
    
    // DCF-Daten für Darstellung und weiteren Zugriff zurückgeben
    return {
      ufcf,
      wacc,
      presentTerminalValue,
      netDebt,
      dilutedSharesOutstanding,
      currency,
      pvUfcfs,
      sumPvUfcfs,
      enterpriseValue,
      equityValue,
      intrinsicValue
    };
  } catch (error) {
    console.error("Fehler bei DCF-Berechnung:", error);
    return null;
  }
};

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
      const info = await fetchStockInfo(ticker);
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
      
      // Rating mit erforderlichen Eigenschaften initialisieren
      let updatedRating = null;
      let extractedDcfInputData = null;
      let calculatedDcfData = null;
      
      if (rating) {
        // Prüfe, ob dcfData als benutzerdefinierte Eigenschaft in der API-Antwort vorhanden ist
        const ratingAny = rating as any;
        if (ratingAny && typeof ratingAny === 'object') {
          // Extrahiere die DCF-Eingabedaten aus der API-Antwort
          if ('dcfData' in ratingAny && ratingAny.dcfData) {
            extractedDcfInputData = ratingAny.dcfData;
            console.log('DCF Data gefunden:', JSON.stringify(extractedDcfInputData, null, 2));
            
            // Berechne die vollständigen DCF-Daten aus den Eingabedaten
            if (extractedDcfInputData.ufcf && 
                extractedDcfInputData.wacc !== undefined && 
                extractedDcfInputData.presentTerminalValue !== undefined && 
                extractedDcfInputData.netDebt !== undefined && 
                extractedDcfInputData.dilutedSharesOutstanding !== undefined) {
              calculatedDcfData = calculateDCFData(
                extractedDcfInputData.ufcf,
                extractedDcfInputData.wacc,
                extractedDcfInputData.presentTerminalValue,
                extractedDcfInputData.netDebt,
                extractedDcfInputData.dilutedSharesOutstanding,
                priceCurrency // Verwende die Kurswährung für DCF-Berechnungen
              );
              
              if (calculatedDcfData) {
                console.log('DCF-Berechnungen erfolgreich durchgeführt:', calculatedDcfData);
              }
            }
          }
        }
        
        updatedRating = {
          ...rating,
          originalIntrinsicValue: rating.originalIntrinsicValue || null,
          originalBestBuyPrice: rating.originalBestBuyPrice || null,
          originalPrice: rating.originalPrice || null,
          reportedCurrency: reportedCurrency, // Weise die erforderliche Eigenschaft explizit zu
          dcfData: calculatedDcfData  // Weise die berechneten DCF-Daten zu
        };
        
        const ratingCurrency = updatedRating.currency || reportedCurrency;
        updatedRating = await convertRatingValues(updatedRating, ratingCurrency, priceCurrency);
        
        // Setze den intrinsicValue basierend auf den DCF-Berechnungen, falls verfügbar
        if (calculatedDcfData) {
          updatedRating.intrinsicValue = calculatedDcfData.intrinsicValue;
          
          // Aktualisiere auch den bestBuyPrice basierend auf dem neu berechneten inneren Wert und der targetMarginOfSafety
          if (updatedRating.targetMarginOfSafety !== undefined) {
            updatedRating.bestBuyPrice = calculatedDcfData.intrinsicValue * (1 - updatedRating.targetMarginOfSafety / 100);
          }
        }
        
        if (info && info.price !== null && info.price !== undefined) {
          updatedRating.currentPrice = info.price;
          console.log(`Verwende Aktienkurs aus info: ${updatedRating.currentPrice} ${priceCurrency}`);
        }
      }
      
      toast({
        title: "Analyse abgeschlossen",
        description: `Die Analyse für ${info.name} wurde erfolgreich durchgeführt.`,
      });
      
      return { 
        info, 
        stockCurrency, 
        criticalDataMissing, 
        criteria, 
        metricsData, 
        rating: updatedRating,
        dcfData: calculatedDcfData
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
