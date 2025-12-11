import React, { useState, useEffect } from 'react';
import { useStock } from '@/context/StockContext';
import LoadingProgressCircle from './LoadingProgressCircle';

const LoadingSection: React.FC = () => {
  const { isLoading, deepResearchPerformed, setShowAnalysis, stockInfo } = useStock();
  const [wasLoading, setWasLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isLoading && !wasLoading) {
      // Started loading - hide analysis until animation completes
      setShowAnalysis(false);
      setShowLoader(true);
      setIsComplete(false);
      setWasLoading(true);
    } else if (!isLoading && wasLoading) {
      // Data finished loading - trigger completion animation
      setIsComplete(true);
    }
  }, [isLoading, wasLoading, setShowAnalysis]);

  const handleAnimationComplete = () => {
    // Animation is done, now show the analysis
    setShowAnalysis(true);
    setShowLoader(false);
    setWasLoading(false);
    setIsComplete(false);
  };

  if (!showLoader) {
    return null;
  }

  return (
    <LoadingProgressCircle 
      isDeepResearch={deepResearchPerformed} 
      isComplete={isComplete}
      onAnimationComplete={handleAnimationComplete}
    />
  );
};

export default LoadingSection;
