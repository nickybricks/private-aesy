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
    ? Math.min(valuationScores.totalScore, 20)
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

  // Prepare detailed card scores for tooltips
  const profitabilityCards = profitabilityScores?.scores ? [
    { name: 'ROIC', score: profitabilityScores.scores.roic.score, maxScore: profitabilityScores.scores.roic.maxScore },
    { name: 'Operating Margin', score: profitabilityScores.scores.operatingMargin.score, maxScore: profitabilityScores.scores.operatingMargin.maxScore },
    { name: 'Net Margin', score: profitabilityScores.scores.netMargin.score, maxScore: profitabilityScores.scores.netMargin.maxScore },
    { name: 'Jahre Profitabel', score: profitabilityScores.scores.years.score, maxScore: profitabilityScores.scores.years.maxScore },
    { name: 'ROE', score: profitabilityScores.scores.roe.score, maxScore: profitabilityScores.scores.roe.maxScore },
    { name: 'ROA', score: profitabilityScores.scores.roa.score, maxScore: profitabilityScores.scores.roa.maxScore },
  ] : [];

  const financialStrengthCards = financialStrengthScores?.scores ? [
    { name: 'Net Debt/EBITDA', score: financialStrengthScores.scores.netDebtToEbitda.score, maxScore: financialStrengthScores.scores.netDebtToEbitda.maxScore },
    { name: 'Interest Coverage', score: financialStrengthScores.scores.interestCoverage.score, maxScore: financialStrengthScores.scores.interestCoverage.maxScore },
    { name: 'Debt/Assets', score: financialStrengthScores.scores.debtToAssets.score, maxScore: financialStrengthScores.scores.debtToAssets.maxScore },
    { name: 'Current Ratio', score: financialStrengthScores.scores.currentRatio.score, maxScore: financialStrengthScores.scores.currentRatio.maxScore },
  ] : [];

  const valuationCards = valuationScores?.scores ? [
    { name: 'Intrinsic Value', score: valuationScores.scores.intrinsicValueDiscount.score, maxScore: valuationScores.scores.intrinsicValueDiscount.maxScore },
    { name: 'Peter Lynch', score: valuationScores.scores.peterLynchDiscount.score, maxScore: valuationScores.scores.peterLynchDiscount.maxScore },
    { name: 'KGV (P/E)', score: valuationScores.scores.peRatio.score, maxScore: valuationScores.scores.peRatio.maxScore },
    { name: 'Dividende', score: valuationScores.scores.dividendYield.score, maxScore: valuationScores.scores.dividendYield.maxScore },
    { name: 'Price/Book', score: valuationScores.scores.priceToBook.score, maxScore: valuationScores.scores.priceToBook.maxScore },
    { name: 'Price/FCF', score: valuationScores.scores.priceToCashFlow.score, maxScore: valuationScores.scores.priceToCashFlow.maxScore },
  ] : [];

  const growthCards = growthScores?.scores ? [
    { name: 'Revenue Growth', score: growthScores.scores.revenue.score, maxScore: growthScores.scores.revenue.maxScore },
    { name: 'EBITDA Growth', score: growthScores.scores.ebitda.score, maxScore: growthScores.scores.ebitda.maxScore },
    { name: 'EPS w/o NRI Growth', score: growthScores.scores.epsWoNri.score, maxScore: growthScores.scores.epsWoNri.maxScore },
    { name: 'FCF Growth', score: growthScores.scores.fcf.score, maxScore: growthScores.scores.fcf.maxScore },
  ] : [];

  const aiAnalysisCards = qualitativeScores?.criteria ? 
    qualitativeScores.criteria.map(c => ({ 
      name: c.title, 
      score: c.score, 
      maxScore: c.maxScore 
    })) : [];

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
            profitabilityCards={profitabilityCards}
            financialStrengthCards={financialStrengthCards}
            valuationCards={valuationCards}
            growthCards={growthCards}
            aiAnalysisCards={aiAnalysisCards}
          />
        </div>
      </div>
    </Card>
  );
};

export default StockHeaderWithScore;
