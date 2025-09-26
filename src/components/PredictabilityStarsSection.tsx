import React from 'react';
import { useStock } from '@/context/StockContext';
import PredictabilityStarsDisplay from '@/components/PredictabilityStarsDisplay';

const PredictabilityStarsSection: React.FC = () => {
  const { predictabilityStars, isLoading, hasCriticalDataMissing } = useStock();
  
  // Don't render if loading, has critical data missing, or no predictability data
  if (isLoading || hasCriticalDataMissing || !predictabilityStars) {
    return null;
  }

  return (
    <div className="mb-8">
      <PredictabilityStarsDisplay result={predictabilityStars} />
    </div>
  );
};

export default PredictabilityStarsSection;