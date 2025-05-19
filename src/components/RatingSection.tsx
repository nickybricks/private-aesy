
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
        
        if (overallRating.intrinsicValue !== dcfData.intrinsicValue) {
          console.warn('DCF ERROR: Mismatch between overallRating.intrinsicValue and dcfData.intrinsicValue');
        }
      }
      
      // Debug zu fehlenden wichtigen Daten
      const missingParts = [];
      if (!dcfData.ufcf || dcfData.ufcf.length === 0) missingParts.push('ufcf');
      if (dcfData.wacc === 0) missingParts.push('wacc');
      if (dcfData.presentTerminalValue === 0) missingParts.push('terminalValue');
      if (dcfData.dilutedSharesOutstanding === 0) missingParts.push('sharesOutstanding');
      
      if (missingParts.length > 0) {
        console.warn(`DCF WARNING: Wichtige Daten fehlen: ${missingParts.join(', ')}`);
      } else {
        console.log('Alle kritischen DCF-Daten sind vorhanden');
      }
    } else {
      console.warn('RatingSection: No DCF data available. Make sure the custom DCF endpoint is being called.');
      
      // Debug zum Kontext
      if (stockInfo) {
        console.log('Stock info is available:', stockInfo.ticker);
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
