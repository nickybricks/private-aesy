import React from 'react';
import { Card } from '@/components/ui/card';
import StockQuoteHeader from '@/components/StockQuoteHeader';
import BuffettScoreSpiderChart from '@/components/BuffettScoreSpiderChart';
import { useStock } from '@/context/StockContext';

interface StockHeaderWithScoreProps {
  onTabChange?: (tab: string) => void;
}

const StockHeaderWithScore: React.FC<StockHeaderWithScoreProps> = ({ onTabChange }) => {
  const { overallRating } = useStock();
  
  // Mock data for now - replace with actual data from context
  const data = [
    { criterion: 'Profitabilität', score: 85, tabValue: 'profitability' },
    { criterion: 'Fin. Stärke', score: 70, tabValue: 'financial-strength' },
    { criterion: 'Bewertung', score: 60, tabValue: 'valuation' },
    { criterion: 'Growth', score: 90, tabValue: 'growth-rank' },
    { criterion: 'KI Analyse', score: 75, tabValue: 'ai-analysis' },
  ];

  const totalScore = data.reduce((sum, item) => sum + item.score, 0) / data.length;

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
          <BuffettScoreSpiderChart onTabChange={onTabChange} />
        </div>
      </div>
    </Card>
  );
};

export default StockHeaderWithScore;
