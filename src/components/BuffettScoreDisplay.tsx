
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { 
  BuffettCriterionProps,
  getUnifiedCriterionScore,
  getUnifiedCriterionMaxScore,
  buffettCriteriaWeights
} from '@/utils/buffettUtils';

interface BuffettScoreDisplayProps {
  criterion: BuffettCriterionProps;
}

export const BuffettScoreDisplay: React.FC<BuffettScoreDisplayProps> = ({ criterion }) => {
  // Use unified scoring system
  const score = getUnifiedCriterionScore(criterion);
  const maxScore = getUnifiedCriterionMaxScore(criterion);
  
  // Find the weight for this criterion based on title
  const criterionWeight = buffettCriteriaWeights.find(weight => 
    criterion.title.includes(weight.name.split('.')[1]?.trim() || '')
  );
  
  const weightPercentage = criterionWeight?.weight || 0;
  const weightedContribution = score * (weightPercentage / 100);
  const maxWeightedContribution = maxScore * (weightPercentage / 100);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="ml-2 rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
            <Info size={14} className="text-gray-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <h4 className="font-semibold">Bewertungsdetails</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Punkte:</span>
                <span className="font-medium">{score.toFixed(1)}/{maxScore}</span>
              </div>
              <div className="flex justify-between">
                <span>Gewichtung:</span>
                <span className="font-medium">{weightPercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span>Gewichteter Beitrag:</span>
                <span className="font-medium">{weightedContribution.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Max. Beitrag:</span>
                <span className="font-medium">{maxWeightedContribution.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Die Punkte basieren auf der GPT-Analyse und werden mit der Gewichtung multipliziert.
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
