import React from 'react';
import { Card } from '@/components/ui/card';
import StockQuoteHeader from '@/components/StockQuoteHeader';
import BuffettScoreSpiderChart from '@/components/BuffettScoreSpiderChart';
import { useStock } from '@/context/StockContext';

interface StockHeaderWithScoreProps {
  onTabChange?: (tab: string) => void;
}

const StockHeaderWithScore: React.FC<StockHeaderWithScoreProps> = ({ onTabChange }) => {
  const { 
    overallRating,
    valuationScores,
    profitabilityScores,
    financialStrengthScores,
    growthScores,
    qualitativeScores
  } = useStock();
  
  // Extract and normalize real scores to 0-20 scale
  const profitabilityScore = profitabilityScores 
    ? (profitabilityScores.totalScore / profitabilityScores.maxTotalScore) * 20 
    : 0;

  const financialStrengthScore = financialStrengthScores 
    ? (financialStrengthScores.totalScore / financialStrengthScores.maxTotalScore) * 20 
    : 0;

  const valuationScore = valuationScores 
    ? (valuationScores.totalScore / valuationScores.maxTotalScore) * 20 
    : 0;

  const growthScore = growthScores 
    ? (growthScores.totalScore / growthScores.maxTotalScore) * 20 
    : 0;

  // Real data for AI Analysis (0-20)
  const aiAnalysisScore = qualitativeScores 
    ? qualitativeScores.totalScore 
    : 0;

  // Total score (max 100 = 5 × 20)
  const totalScore = profitabilityScore + financialStrengthScore + valuationScore + growthScore + aiAnalysisScore;

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-700';
    if (score >= 85) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Left: Stock Quote Header Content */}
        <div className="flex-1 w-full">
          <StockQuoteHeader />
        </div>
        
        {/* Right: Spider Chart with Score */}
        <div className="flex flex-col items-center justify-start lg:w-[320px]">
          {/* Aesy Score zentriert über dem Chart */}
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-semibold">Aesy Score:</span>
              <div className="text-lg font-bold">
                <span className={getScoreColor(totalScore)}>{totalScore.toFixed(0)}</span>
                <span className="text-foreground"> /100</span>
              </div>
            </div>
          </div>
          
          {/* Spider Chart ohne Card-Wrapper */}
          <BuffettScoreSpiderChart 
            onTabChange={onTabChange}
            profitabilityScore={profitabilityScore}
            financialStrengthScore={financialStrengthScore}
            valuationScore={valuationScore}
            growthScore={growthScore}
            aiAnalysisScore={aiAnalysisScore}
          />
        </div>
      </div>
    </Card>
  );
};

export default StockHeaderWithScore;
