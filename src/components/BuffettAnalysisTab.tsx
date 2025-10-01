import React from 'react';
import { useStock } from '@/context/StockContext';
import OverallRating from './OverallRating';

const BuffettAnalysisTab: React.FC = () => {
  const { overallRating, buffettCriteria } = useStock();

  if (!overallRating) return null;

  // Create enhanced rating object with criteria data
  const enhancedRating = {
    ...overallRating,
    criteria: buffettCriteria
  };

  return (
    <div className="space-y-6">
      <OverallRating rating={enhancedRating} />
    </div>
  );
};

export default BuffettAnalysisTab;
