
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { BuffettScoreTooltip } from './BuffettScoreTooltip';
import { BuffettCriteriaProps } from '@/utils/buffettUtils';

interface QualityMetricsCardProps {
  buffettScore: number;
  criteria?: BuffettCriteriaProps;
}

const getQualityAssessment = (buffettScore: number) => {
  if (buffettScore >= 85) {
    return {
      qualityDescription: `Exzellente Qualität (${buffettScore}%)`,
      color: '#10b981'
    };
  } else if (buffettScore >= 70) {
    return {
      qualityDescription: `Gute Basis, aber unter Buffett-Standard (${buffettScore}% < 85%)`,
      color: '#f59e0b'
    };
  } else {
    return {
      qualityDescription: `Unzureichende Qualität (${buffettScore}% < 70%)`,
      color: '#ef4444'
    };
  }
};

export const QualityMetricsCard: React.FC<QualityMetricsCardProps> = ({ 
  buffettScore, 
  criteria 
}) => {
  const qualityAssessment = getQualityAssessment(buffettScore);

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex flex-col h-48">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp size={18} className="text-blue-600" />
        <h4 className="font-semibold">Kriterienbewertung</h4>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
                <Info size={14} className="text-gray-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <BuffettScoreTooltip 
                score={buffettScore}
                criteria={criteria}
              />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="text-2xl font-bold mb-2" style={{ color: qualityAssessment.color }}>
        {buffettScore.toFixed(1)}%
      </div>
      
      <div className="text-sm text-gray-600 mb-3 flex-1">
        {qualityAssessment.qualityDescription}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mt-auto">
        <div 
          className="h-2 rounded-full" 
          style={{
            width: `${Math.min(buffettScore, 100)}%`,
            backgroundColor: qualityAssessment.color
          }}
        />
      </div>
    </div>
  );
};
