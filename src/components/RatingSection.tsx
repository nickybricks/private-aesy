
import React, { useEffect } from 'react';
import { useStock } from '@/context/StockContext';
import OverallRating from '@/components/OverallRating';
import { debugDCFData } from '@/utils/currencyConverter';

const RatingSection: React.FC = () => {
  const { overallRating, isLoading, hasCriticalDataMissing, dcfData } = useStock();
  
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
    } else {
      console.warn('RatingSection: No DCF data available. Make sure the custom DCF endpoint is being called.');
    }
  }, [dcfData, overallRating]);
  
  if (isLoading || hasCriticalDataMissing || !overallRating) return null;
  
  return (
    <div className="mb-8">
      <OverallRating rating={overallRating} />
    </div>
  );
};

export default RatingSection;
