
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { 
  BuffettCriterionProps, 
  deriveScoreFromGptAnalysis, 
  buffettCriteriaWeights,
  extractGptAssessmentStatus
} from '@/utils/buffettUtils';

interface ScoreDisplayProps {
  criterion: BuffettCriterionProps;
}

export const BuffettScoreDisplay: React.FC<ScoreDisplayProps> = ({ criterion }) => {
  if (criterion.maxScore === undefined) {
    return null;
  }
  
  // Get the GPT assessment to determine partial fulfillment
  const gptAssessment = criterion.gptAnalysis ? 
    extractGptAssessmentStatus(criterion.gptAnalysis) : undefined;
  
  // Use the provided score or derive it from GPT analysis
  const derivedScore = deriveScoreFromGptAnalysis(criterion);
  const score = criterion.score !== undefined ? criterion.score : derivedScore;
  
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
  const scorePercentage = score / criterion.maxScore;
  
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
              {score}/{criterion.maxScore}
            </span>
            <Info className="h-3 w-3 ml-1 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div>
              <p className="text-xs mb-2">
                Bewertung basierend auf der Analyse der Teilkriterien (0-10 Punkte):
              </p>
              
              {/* Display all 11 criteria with their scores in the tooltip */}
              <div className="space-y-1 text-xs">
                {buffettCriteriaWeights.map((cWeight, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{cWeight.name}</span>
                    <span className="font-medium">{
                      criterionNumber && cWeight.id === `criterion${criterionNumber}` ? 
                      `${score}/${criterion.maxScore}` : 
                      `?/${cWeight.maxPoints}`
                    }</span>
                  </div>
                ))}
              </div>
              
              {gptAssessment && gptAssessment.status === 'warning' && gptAssessment.partialFulfillment !== undefined && (
                <div className="mt-2 pt-1 border-t border-gray-200">
                  <p className="text-xs">
                    <strong>Erfüllte Teilaspekte:</strong> {gptAssessment.partialFulfillment} von 3 Teilaspekten erfüllt
                  </p>
                </div>
              )}
              
              {criterionWeight && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium">Gewichtung dieses Kriteriums:</p>
                  <p className="text-xs">{criterionWeight.weight}% des Gesamtscores</p>
                  <p className="text-xs">Maximal erreichbare Punkte: {criterionWeight.maxPoints}</p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
