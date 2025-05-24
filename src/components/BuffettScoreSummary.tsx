import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  buffettCriteriaWeights, 
  getBuffettScoreInterpretation,
  BuffettCriteriaProps,
  getUnifiedCriterionScore,
  getUnifiedCriterionMaxScore
} from '@/utils/buffettUtils';
import { Info } from 'lucide-react';

interface BuffettScoreSummaryProps {
  score: number;
  criteria: BuffettCriteriaProps;
}

export const BuffettScoreSummary: React.FC<BuffettScoreSummaryProps> = ({ score, criteria }) => {
  // This component is now deprecated - scoring is handled in OverallRating
  // Keeping minimal implementation for backward compatibility
  
  const interpretation = getBuffettScoreInterpretation(score);
  
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center">
        <h3 className="text-lg font-semibold">
          Buffett-Kompatibilität: {score}%
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="ml-1">
              <Info className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <p className="text-xs">
                Diese Komponente wurde in die Gesamtbewertung integriert. 
                Die detaillierte Bewertung finden Sie in der Hauptbewertung oben.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
        <div 
          className="h-2.5 rounded-full" 
          style={{
            width: `${Math.min(score, 100)}%`,
            backgroundColor: interpretation.color
          }}
        />
      </div>
      <p className="text-sm mt-2 text-gray-600" style={{ color: interpretation.color }}>
        {interpretation.label}
      </p>
      <p className="text-xs mt-1 text-gray-500">
        Detaillierte Bewertung siehe Gesamtbewertung oben.
      </p>
    </div>
  );
};
