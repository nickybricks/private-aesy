
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { 
  BuffettCriterionProps, 
  deriveScoreFromGptAnalysis, 
  buffettCriteriaWeights
} from '@/utils/buffettUtils';

interface ScoreDisplayProps {
  criterion: BuffettCriterionProps;
}

export const BuffettScoreDisplay: React.FC<ScoreDisplayProps> = ({ criterion }) => {
  // Get score (0-10) from criterion or derive from GPT analysis
  const score = criterion.score !== undefined ? criterion.score : deriveScoreFromGptAnalysis(criterion);
  
  if (score === undefined) {
    return null;
  }
  
  // Extract criterion number for identifying the weight
  const criterionNumber = criterion.title.match(/^\d+/)?.[0];
  
  // Find criterion weight by matching the criterion number
  const criterionWeight = buffettCriteriaWeights.find(c => {
    if (criterionNumber) {
      return c.id === `criterion${criterionNumber}`;
    }
    return false;
  });
  
  // Calculate score percentage for color coding
  const scorePercentage = score / 10; // Now using 0-10 scale
  
  return (
    <div className="inline-flex items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="inline-flex items-center ml-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              scorePercentage >= 0.8 ? 'bg-green-100 text-green-700' :
              scorePercentage >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {score}/10
            </span>
            <Info className="h-3 w-3 ml-1 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div>
              <p className="text-xs mb-2">
                Bewertung basierend auf der Analyse (0-10 Punkte):
              </p>
              
              {criterionWeight && (
                <div className="space-y-1 text-xs">
                  <p><strong>{criterionWeight.name}</strong></p>
                  <p>Aktuelle Punktzahl: <span className="font-medium">{score}/10</span></p>
                  <p>Gewichtung im Gesamtscore: <span className="font-medium">{criterionWeight.weight}%</span></p>
                  <p>Beitrag zum Gesamtscore: <span className="font-medium">{((score * criterionWeight.weight) / 100).toFixed(1)} Punkte</span></p>
                </div>
              )}
              
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-medium">Bewertungsskala:</p>
                <p className="text-xs">9-10 Punkte: Exzellent</p>
                <p className="text-xs">7-8 Punkte: Gut</p>
                <p className="text-xs">5-6 Punkte: Durchschnittlich</p>
                <p className="text-xs">0-4 Punkte: Schwach</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
