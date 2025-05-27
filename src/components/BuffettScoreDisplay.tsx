
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, AlertTriangle } from 'lucide-react';
import { 
  BuffettCriterionProps, 
  getUnifiedCriterionScore,
  buffettCriteriaWeights
} from '@/utils/buffettUtils';

interface ScoreDisplayProps {
  criterion: BuffettCriterionProps;
}

export const BuffettScoreDisplay: React.FC<ScoreDisplayProps> = ({ criterion }) => {
  // Use the unified scoring function with error handling
  let score: number;
  let scoreError: string | null = null;
  
  try {
    score = getUnifiedCriterionScore(criterion);
  } catch (error) {
    scoreError = error instanceof Error ? error.message : 'Unbekannter Fehler bei Score-Berechnung';
    console.error('BuffettScoreDisplay error:', scoreError);
    
    // Show error state
    return (
      <div className="inline-flex items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="inline-flex items-center ml-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-700">
                Fehler
              </span>
              <AlertTriangle className="h-3 w-3 ml-1 text-red-500" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div>
                <p className="text-xs mb-2 font-medium text-red-600">
                  Score-Berechnung fehlgeschlagen:
                </p>
                <p className="text-xs text-red-700">
                  {scoreError}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
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
  
  if (!criterionWeight) {
    console.error('Criterion weight not found for:', criterion.title);
    return (
      <div className="inline-flex items-center">
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-700 ml-2">
          Gewichtung fehlt
        </span>
      </div>
    );
  }
  
  // Calculate score percentage for color coding
  const scorePercentage = score / 10; // Using 0-10 scale
  
  // Calculate weighted contribution
  const weightedContribution = (score * criterionWeight.weight) / 100;
  
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
              
              <div className="space-y-1 text-xs">
                <p><strong>{criterionWeight.name}</strong></p>
                <p>Aktuelle Punktzahl: <span className="font-medium">{score}/10</span></p>
                <p>Gewichtung im Gesamtscore: <span className="font-medium">{criterionWeight.weight}%</span></p>
                <p>Beitrag zum Gesamtscore: <span className="font-medium">{weightedContribution.toFixed(1)} Punkte</span></p>
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-medium">Bewertungsskala:</p>
                <p className="text-xs">Pass: 10/10 Punkte</p>
                <p className="text-xs">Warning: Je nach Erfüllungsgrad (z.B. 2/3 = 6,7/10)</p>
                <p className="text-xs">Fail: 0/10 Punkte</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
