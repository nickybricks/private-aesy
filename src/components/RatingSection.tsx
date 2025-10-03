
import React, { useEffect } from 'react';
import { useStock } from '@/context/StockContext';

import OverallRating from '@/components/OverallRating';

const RatingSection: React.FC = () => {
  const { overallRating, isLoading, hasCriticalDataMissing, valuationData, stockInfo, buffettCriteria, gptAvailable } = useStock();
  
  useEffect(() => {
    console.log('RatingSection mounted or valuationData changed');
    
    if (valuationData) {
      console.log('Valuation Data in RatingSection:');
      console.log('Fair Value:', valuationData.fairValuePerShare);
      console.log('Margin of Safety:', valuationData.marginOfSafetyPct);
      console.log('Currency:', stockInfo?.currency);
      
      if (overallRating) {
        console.log('Overall Rating will use valuation data fairValuePerShare:', valuationData.fairValuePerShare);
      }
    } else {
      console.warn('RatingSection: No valuation data available yet.');
      
      // Debug context
      if (stockInfo) {
        console.log('Stock info is available:', stockInfo.ticker);
        console.log('Stock currency:', stockInfo.currency);
      } else {
        console.log('No stock info available yet.');
      }
    }
  }, [valuationData, overallRating, stockInfo]);
  
  if (isLoading || hasCriticalDataMissing || !overallRating) return null;
  
  // Create enhanced rating object with criteria data and valuation data
  const enhancedRating = overallRating ? {
    ...overallRating,
    criteria: buffettCriteria,
    // Use fairValuePerShare from valuationData instead of old dcfData intrinsicValue
    intrinsicValue: valuationData?.fairValuePerShare ?? overallRating.intrinsicValue,
    marginOfSafety: valuationData ? {
      value: valuationData.marginOfSafetyPct,
      status: valuationData.marginOfSafetyPct >= 20 ? 'pass' as const : 
              valuationData.marginOfSafetyPct >= 0 ? 'warning' as const : 
              'fail' as const
    } : overallRating.marginOfSafety,
    // Calculate bestBuyPrice from fairValuePerShare
    bestBuyPrice: valuationData?.fairValuePerShare 
      ? valuationData.fairValuePerShare * 0.8 // 20% safety margin
      : overallRating.bestBuyPrice
  } : null;
  
  // Determine analysis mode based on GPT availability
  const analysisMode = gptAvailable ? 'gpt' : 'standard';
  
  return (
    <div className="mb-8">
      <OverallRating rating={enhancedRating} analysisMode={analysisMode} />
    </div>
  );
};

export default RatingSection;
