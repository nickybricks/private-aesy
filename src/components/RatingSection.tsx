
import React, { useEffect } from 'react';
import { useStock } from '@/context/StockContext';
import OverallRating from '@/components/OverallRating';
import { debugDCFData } from '@/utils/currencyConverter';

const RatingSection: React.FC = () => {
  const { overallRating, isLoading, hasCriticalDataMissing, dcfData, stockInfo } = useStock();
  
  useEffect(() => {
    console.log('RatingSection mounted or dcfData changed');
    
    if (dcfData) {
      console.log('DCF Data in RatingSection:');
      debugDCFData(dcfData);
      
      if (overallRating) {
        console.log('Overall Rating has intrinsicValue:', overallRating.intrinsicValue);
        console.log('DCF has intrinsicValue:', dcfData.intrinsicValue);
      }
      
      // Debug missing important data
      const missingParts = [];
      if (!dcfData.ufcf || dcfData.ufcf.length === 0) missingParts.push('ufcf');
      if (!dcfData.wacc) missingParts.push('wacc');
      if (!dcfData.presentTerminalValue) missingParts.push('terminalValue');
      if (!dcfData.dilutedSharesOutstanding) missingParts.push('sharesOutstanding');
      if (!dcfData.intrinsicValue) missingParts.push('intrinsicValue');
      
      if (missingParts.length > 0) {
        console.warn(`DCF WARNING: Important data missing: ${missingParts.join(', ')}`);
      } else {
        console.log('All critical DCF data is available');
      }
    } else {
      console.warn('RatingSection: No DCF data available. Make sure the custom DCF endpoint is being called.');
      
      // Debug context
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
