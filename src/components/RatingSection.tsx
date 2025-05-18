
import React from 'react';
import { useStock } from '@/context/StockContext';
import OverallRating from '@/components/OverallRating';

const RatingSection: React.FC = () => {
  const { overallRating, isLoading, hasCriticalDataMissing, dcfData } = useStock();
  
  if (isLoading || hasCriticalDataMissing || !overallRating) return null;
  
  // Debugging-Information
  console.log("DCF Data in RatingSection:", dcfData);
  if (dcfData) {
    console.log("DCF intrinsicValue:", dcfData.intrinsicValue);
  }
  console.log("overallRating intrinsicValue:", overallRating.intrinsicValue);
  
  return (
    <div className="mb-8">
      <OverallRating rating={overallRating} />
    </div>
  );
};

export default RatingSection;
