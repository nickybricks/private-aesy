import { fetchStockInfo, analyzeBuffettCriteria, getFinancialMetrics, getOverallRating } from '@/api/stockApi';
import { hasOpenAiApiKey } from '@/api/openaiApi';
import { useToast } from '@/hooks/use-toast';
import { shouldConvertCurrency, debugDCFData } from '@/utils/currencyConverter';
import { processFinancialMetrics, calculateBuffettBuyPrice } from './StockDataProcessor';
import { convertFinancialMetrics, convertHistoricalData, convertRatingValues } from './CurrencyService';
import { DCFCalculationService } from '@/services/DCFCalculationService';
import { PredictabilityStarsService, PredictabilityResult } from '@/services/PredictabilityStarsService';
import { StockInfo } from '@/types/stock';
import { OverallRatingData } from './StockContextTypes';

// Neue DCF-Berechnung mit eigener FCFF-Logik
const calculateCustomDCF = async (ticker: string) => {
  console.log(`Starting custom DCF calculation for ${ticker}`);
  return await DCFCalculationService.calculateDCF(ticker);
};

// NEUE FUNKTION: Korrigiere Kriterium 3 Daten
const correctFinancialMetricsCriterion = (criteria: any) => {
  if (!criteria || !criteria.financialMetrics) {
    return criteria;
  }
  
  console.log('Correcting financial metrics criterion data...');
  
  // Korrigiere maxScore auf 10
  criteria.financialMetrics.maxScore = 10;
  console.log('Set financialMetrics maxScore to 10');
  
  // Korrigiere doppelte Währungszeichen in details
  if (criteria.financialMetrics.details && Array.isArray(criteria.financialMetrics.details)) {
    criteria.financialMetrics.details = criteria.financialMetrics.details.map((detail: string) => {
      // Entferne doppelte Währungszeichen wie "USD USD" -> "USD"
      const correctedDetail = detail.replace(/(\b[A-Z]{3})\s+\1\b/g, '$1');
      
      if (detail !== correctedDetail) {
        console.log(`Corrected detail: "${detail}" -> "${correctedDetail}"`);
      }
      
      return correctedDetail;
    });
  }
  
  return criteria;
};

export const useStockSearch = (setLoadingProgress?: (progress: number) => void) => {
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

  const searchStockInfo = async (ticker: string, enableDeepResearch = false) => {
    try {
      let info: StockInfo = await fetchStockInfo(ticker);
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
        return { info, stockCurrency, criticalDataMissing, criteria: null, metricsData: null, rating: null, dcfData: null, predictabilityStars: null };
      }
      
        const analysisType = enableDeepResearch ? "Deep Research AI Analyse (inkl. Perplexity)" : "Standard-Analyse";
        toast({
          title: "Analyse läuft",
          description: `${analysisType}: Analysiere ${info.name} (${info.ticker}) nach Warren Buffett's Kriterien...`,
        });
      
      // Parallele Ausführung aller API-Aufrufe mit Progress-Tracking
      try {
        setLoadingProgress?.(20);
        
        // Erstelle Promises mit individueller Progress-Updates (inklusive Predictability Stars)
        const promises = [
          analyzeBuffettCriteria(ticker, enableDeepResearch).then(result => { setLoadingProgress?.(32); return result; }),
          getFinancialMetrics(ticker).then(result => { setLoadingProgress?.(48); return result; }),
          getOverallRating(ticker).then(result => { setLoadingProgress?.(64); return result; }),
          calculateCustomDCF(ticker).then(result => { setLoadingProgress?.(80); return result; }),
          PredictabilityStarsService.calculatePredictabilityStars(ticker).then(result => { setLoadingProgress?.(90); return result; })
        ];
        
        const [rawCriteria, rawMetricsData, rating, customDcfData, predictabilityStars] = await Promise.all(promises);
        
        // KORRIGIERE KRITERIEN-DATEN VOR DER WEITEREN VERARBEITUNG
        const criteria = correctFinancialMetricsCriterion(rawCriteria);
        
        console.log('Buffett Criteria (corrected):', JSON.stringify(criteria, null, 2));
        console.log('Financial Metrics:', JSON.stringify(rawMetricsData, null, 2));
        console.log('Overall Rating:', JSON.stringify(rating, null, 2));
        console.log('Custom DCF Data:', JSON.stringify(customDcfData, null, 2));
        console.log('Predictability Stars:', JSON.stringify(predictabilityStars, null, 2));
        
        console.log('=== STOCK SEARCH SERVICE - CURRENCY LOGIC ===');
        const priceCurrency = info?.currency || 'USD';
        const reportedCurrency = (rawMetricsData as any)?.reportedCurrency;
        
        console.log(`info.currency (priceCurrency): ${info?.currency}`);
        console.log(`rawMetricsData.reportedCurrency: ${reportedCurrency}`);
        console.log(`Finale Werte: priceCurrency="${priceCurrency}", reportedCurrency="${reportedCurrency}"`);
        
        if (!reportedCurrency) {
          console.error('❌ KRITISCH: reportedCurrency fehlt komplett!');
          throw new Error('Berichtswährung fehlt in den Finanzdaten');
        }
        
        console.log(`Prüfe shouldConvertCurrency(${reportedCurrency}, ${priceCurrency}): ${shouldConvertCurrency(reportedCurrency, priceCurrency)}`);
        
        let metricsData = processFinancialMetrics(rawMetricsData, reportedCurrency, priceCurrency);
        
        if (metricsData) {
          if (metricsData.metrics) {
            if (shouldConvertCurrency(reportedCurrency, priceCurrency)) {
              console.log(`✅ Währungsumrechnung für Metrics wird eingeleitet: ${reportedCurrency} → ${priceCurrency}`);
              metricsData.metrics = await convertFinancialMetrics(metricsData.metrics, reportedCurrency, priceCurrency);
            } else {
              console.log('❌ Keine Umrechnung für Metrics nötig (Währungen identisch)');
            }
          }
          
          if (metricsData.historicalData) {
            if (shouldConvertCurrency(reportedCurrency, priceCurrency)) {
              console.log(`✅ Währungsumrechnung für Historical Data wird eingeleitet: ${reportedCurrency} → ${priceCurrency}`);
              metricsData.historicalData = await convertHistoricalData(metricsData.historicalData, reportedCurrency, priceCurrency);
            } else {
              console.log('❌ Keine Umrechnung für Historical Data nötig (Währungen identisch)');
            }
          }
        }
        
        console.log('=== STOCK SEARCH SERVICE - CURRENCY LOGIC ENDE ===');
        
        // Initialize the rating with required properties
        let updatedRating: OverallRatingData | null = null;
        let extractedDcfData = null;

        // Verarbeite das neue benutzerdefinierte DCF-Ergebnis
        if (customDcfData) {
          console.log('Using custom DCF calculation results');
          const customData = customDcfData as any;
          
          // Formatiere die Daten in das benötigte Format
          extractedDcfData = {
            ufcf: customData.projectedFcf || [],
            wacc: customData.wacc || 0,
            presentTerminalValue: customData.terminalValuePv || 0,
            netDebt: customData.netDebt || 0,
            dilutedSharesOutstanding: customData.sharesOutstanding || 0,
            currency: reportedCurrency, // WICHTIG: DCF-Daten sind in reportedCurrency
            intrinsicValue: customData.intrinsicValue || 0,
            pvUfcfs: customData.projectedFcfPv || [],
            sumPvUfcfs: customData.sumPvProjectedFcf || 0,
            enterpriseValue: customData.enterpriseValue || 0,
            equityValue: customData.equityValue || 0,
            debugOutput: customData.debugOutput || []
          };

          console.log(`Extracted DCF data from custom calculation (in ${reportedCurrency}):`);
          debugDCFData(extractedDcfData);
          
          // Speichere die Aktienanzahl in den Informationen, falls verfügbar
          if (customData.sharesOutstanding) {
            info = {
              ...info,
              sharesOutstanding: customData.sharesOutstanding
            };
          }
        } else if (rating) {
          // Fallback zu den DCF-Daten aus dem Rating, wenn vorhanden
          console.log('Falling back to DCF data from rating response');
          const ratingAny = rating as any;
          if (ratingAny && typeof ratingAny === 'object' && 'dcfData' in ratingAny) {
            let rawDcfData = ratingAny.dcfData;
            extractedDcfData = rawDcfData;
            
            console.log('DCF Data found in API response (fallback).');
            debugDCFData(extractedDcfData);
            
            // Prüfe explizit, ob equityValuePerShare vorhanden ist und logge es
            if (extractedDcfData.equityValuePerShare !== undefined) {
              console.log(`DCF equityValuePerShare (this should be used as intrinsicValue): ${extractedDcfData.equityValuePerShare}`);
            } else {
              throw new Error('equityValuePerShare fehlt in den DCF-Daten');
            }
            
            // Prüfe explizit die intrinsicValue aus dem DCF
            if (extractedDcfData.intrinsicValue !== undefined) {
              console.log(`DCF intrinsicValue: ${extractedDcfData.intrinsicValue}`);
            } else if (extractedDcfData.equityValuePerShare !== undefined) {
              // Wenn intrinsicValue nicht existiert, aber equityValuePerShare ja, verwende diese
              extractedDcfData.intrinsicValue = extractedDcfData.equityValuePerShare;
              console.log(`Setting intrinsicValue to equityValuePerShare: ${extractedDcfData.intrinsicValue}`);
            } else {
              throw new Error('Weder intrinsicValue noch equityValuePerShare sind in den DCF-Daten vorhanden');
            }
          } else {
            throw new Error('DCF ERROR: Keine DCF-Daten in der API-Antwort gefunden');
          }
        } else {
          throw new Error('Weder direkte DCF-Daten noch Rating-Daten verfügbar');
        }
        
        if (rating) {
          updatedRating = {
            ...(rating as any), // Cast to any to allow property access
            // Safely assign these properties with null as fallback
            originalIntrinsicValue: (rating as any).originalIntrinsicValue || null,
            originalBestBuyPrice: (rating as any).originalBestBuyPrice || null,
            originalPrice: (rating as any).originalPrice || null,
            marginOfSafety: (rating as any).marginOfSafety || { value: 0, status: "fail" as const },
            bestBuyPrice: (rating as any).bestBuyPrice || 0,
            reportedCurrency: reportedCurrency,
            dcfData: extractedDcfData
          };
          
          // WICHTIG: Setze den intrinsischen Wert aus den DCF-Daten (noch in reportedCurrency)
          if (extractedDcfData && extractedDcfData.intrinsicValue !== undefined) {
            console.log(`Setting rating.intrinsicValue from DCF data (in ${reportedCurrency}): ${extractedDcfData.intrinsicValue}`);
            updatedRating.intrinsicValue = extractedDcfData.intrinsicValue;
            
            // Berechne den bestBuyPrice basierend auf dem intrinsischen Wert (noch in reportedCurrency)
            const targetMarginOfSafety = updatedRating.targetMarginOfSafety || 20;
            updatedRating.bestBuyPrice = calculateBuffettBuyPrice(extractedDcfData.intrinsicValue, targetMarginOfSafety);
            console.log(`Calculated bestBuyPrice (in ${reportedCurrency}): ${updatedRating.bestBuyPrice}`);
          } else {
            throw new Error('Kein intrinsischer Wert in den DCF-Daten vorhanden');
          }
          
          // Stelle sicher, dass die Währung auf reportedCurrency gesetzt ist, bevor wir konvertieren
          updatedRating.currency = reportedCurrency;
          
          if (info && info.price !== null && info.price !== undefined) {
            updatedRating.currentPrice = info.price;
            console.log(`Using stock price from info: ${updatedRating.currentPrice} ${priceCurrency}`);
          } else {
            throw new Error('Kein Aktienpreis in den Info-Daten vorhanden');
          }
          
          // WICHTIG: Konvertiere die Rating-Werte von reportedCurrency zu priceCurrency
          if (shouldConvertCurrency(reportedCurrency, priceCurrency)) {
            console.log(`🔄 Converting rating values from ${reportedCurrency} to ${priceCurrency}`);
            updatedRating = await convertRatingValues(updatedRating, reportedCurrency, priceCurrency);
            console.log(`✅ Rating values converted. New intrinsicValue: ${updatedRating.intrinsicValue}, bestBuyPrice: ${updatedRating.bestBuyPrice}`);
            
            // Update info with converted intrinsicValue
            if (updatedRating.intrinsicValue !== undefined) {
              info = {
                ...info,
                intrinsicValue: updatedRating.intrinsicValue
              };
              console.log(`✅ Updated info.intrinsicValue to converted value: ${info.intrinsicValue}`);
            }
          }
        } else {
          throw new Error('Keine Rating-Daten verfügbar');
        }
        
        toast({
          title: "Analyse abgeschlossen",
          description: `Die ${enableDeepResearch ? 'erweiterte Deep Research AI' : 'Standard'}-Analyse für ${info.name} wurde erfolgreich durchgeführt.`,
        });
        
        // Logge die endgültigen Werte für Debugging
        console.log(`Final intrinsicValue in rating: ${updatedRating?.intrinsicValue}`);
        console.log(`Final bestBuyPrice in rating: ${updatedRating?.bestBuyPrice}`);
        if (info && 'intrinsicValue' in info) {
          console.log(`Final intrinsicValue in info: ${info.intrinsicValue}`);
        }
        console.log(`Final intrinsicValue in dcfData: ${extractedDcfData?.intrinsicValue}`);
        console.log(`Final currency used: ${priceCurrency}`);
        
        return { 
          info, 
          stockCurrency, 
          criticalDataMissing, 
          criteria, 
          metricsData, 
          rating: updatedRating,
          dcfData: extractedDcfData,
          predictabilityStars
        };
      } catch (error) {
        console.error('API-Aufruf oder Datenverarbeitung fehlgeschlagen:', error);
        throw new Error(`Datenverarbeitungsfehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      }
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
