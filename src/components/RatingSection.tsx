
import React, { useEffect } from 'react';
import { useStock } from '@/context/StockContext';
import OverallRating from '@/components/OverallRating';
import { debugDCFData } from '@/utils/currencyConverter';

const RatingSection: React.FC = () => {
  const { overallRating, isLoading, hasCriticalDataMissing, dcfData, stockInfo } = useStock();
  
  // Add a useEffect to debug DCF data when it becomes available
  useEffect(() => {
    console.log('RatingSection mounted or dcfData changed');
    
    if (dcfData) {
      console.log('DCF Data in RatingSection:');
      debugDCFData(dcfData);
      
      if (overallRating) {
        console.log('Overall Rating has intrinsicValue:', overallRating.intrinsicValue);
        console.log('DCF has intrinsicValue:', dcfData.intrinsicValue);
        
        // Der intrinsische Wert sollte aus den DCF-Daten kommen
        if (overallRating.intrinsicValue !== dcfData.intrinsicValue) {
          console.warn('DCF ERROR: Mismatch between overallRating.intrinsicValue and dcfData.intrinsicValue');
        }
      }
      
      // Debug zu fehlenden wichtigen Daten
      const missingParts = [];
      
      // Prüfe explizit auf verschiedene Schlüsseldaten
      if (!dcfData.intrinsicValue || dcfData.intrinsicValue === 0) {
        console.warn("DCF ERROR: Fehlender intrinsischer Wert!");
        missingParts.push('intrinsicValue');
      }
      
      if (!dcfData.ufcf || !Array.isArray(dcfData.ufcf) || dcfData.ufcf.length === 0) {
        console.log("Hinweis: Keine ufcf-Werte vorhanden (optional wenn aus alternativer API)");
        missingParts.push('ufcf');
      } else {
        console.log(`ufcf values (${dcfData.ufcf.length} years):`, dcfData.ufcf);
      }
      
      if (!dcfData.wacc || dcfData.wacc === 0) {
        console.log("Hinweis: Kein WACC-Wert vorhanden (Default wird verwendet)");
        missingParts.push('wacc');
      }
      
      if (!dcfData.presentTerminalValue || dcfData.presentTerminalValue === 0) {
        console.log("Hinweis: Kein Terminal-Wert vorhanden (optional wenn aus alternativer API)");
        missingParts.push('terminalValue');
      }
      
      if (!dcfData.dilutedSharesOutstanding || dcfData.dilutedSharesOutstanding === 0) {
        console.warn("DCF WARNING: Keine Angabe zur Aktienanzahl!");
        missingParts.push('sharesOutstanding');
      }
      
      if (missingParts.length > 0) {
        if (missingParts.includes('intrinsicValue')) {
          console.error(`DCF CRITICAL ERROR: Wichtige Daten fehlen: ${missingParts.join(', ')}`);
        } else {
          console.warn(`DCF WARNING: Einige DCF-Daten fehlen: ${missingParts.join(', ')}`);
        }
      } else {
        console.log('Alle kritischen DCF-Daten sind vorhanden');
      }
      
      // Log the calculated intrinsic value
      if (dcfData.intrinsicValue && dcfData.intrinsicValue > 0) {
        console.log(`DCF Intrinsic Value berechnet: ${dcfData.intrinsicValue.toFixed(2)} ${dcfData.currency || 'USD'}`);
        
        // Vergleiche mit Aktienpreis
        if (stockInfo && stockInfo.price) {
          const ratio = stockInfo.price / dcfData.intrinsicValue;
          console.log(`Preis zu intrinsischem Wert Verhältnis: ${ratio.toFixed(2)} (Preis: ${stockInfo.price} / Wert: ${dcfData.intrinsicValue})`);
          
          if (ratio < 0.8) {
            console.log('DCF-ANALYSE: Aktie scheint unterbewertet zu sein (Ratio < 0.8)');
          } else if (ratio > 1.2) {
            console.log('DCF-ANALYSE: Aktie könnte überbewertet sein (Ratio > 1.2)');
          } else {
            console.log('DCF-ANALYSE: Aktie scheint nahe am fairen Wert zu sein (0.8 <= Ratio <= 1.2)');
          }
        }
      } else {
        console.error('DCF ERROR: Intrinsic Value ist 0 oder undefiniert!');
      }
    } else {
      console.warn('RatingSection: No DCF data available. Make sure the custom DCF endpoint is being called.');
      
      // Debug zum Kontext
      if (stockInfo) {
        console.log('Stock info is available:', stockInfo.ticker);
        console.log('Trying to get DCF data from stock API...');
      } else {
        console.log('No stock info available yet.');
      }
    }
  }, [dcfData, overallRating, stockInfo]);
  
  if (isLoading || hasCriticalDataMissing || !overallRating) return null;
  
  return (
    <div className="mb-8">
      <OverallRating rating={overallRating} />
    </div>
  );
};

export default RatingSection;
