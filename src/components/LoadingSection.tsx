import React from 'react';
import { useStock } from '@/context/StockContext';
import LoadingProgressCircle from './LoadingProgressCircle';

const LoadingSection: React.FC = () => {
  const { isLoading, deepResearchPerformed } = useStock();

  if (!isLoading) {
    return null;
  }

  return (
    <LoadingProgressCircle isDeepResearch={deepResearchPerformed} />
  );
};

export default LoadingSection;
