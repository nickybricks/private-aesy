
import React from 'react';
import OverallRating from '@/components/OverallRating';
import { useStock } from '@/context/StockContext';
import { needsCurrencyConversion } from '@/utils/currencyConverter';

const RatingSection: React.FC = () => {
  const { overallRating, stockCurrency, hasCriticalDataMissing, dcfData } = useStock();
  
  if (!overallRating || hasCriticalDataMissing) {
    return null;
  }

  return (
    <div className="mb-10">
      <OverallRating 
        rating={{
          ...overallRating,
          originalCurrency: needsCurrencyConversion(stockCurrency, overallRating.currency) ? overallRating.currency : undefined
        }}
        dcfData={dcfData}
      />
    </div>
  );
};

export default RatingSection;
