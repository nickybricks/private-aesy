
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, AlertCircle } from 'lucide-react';
import { 
  BuffettCriterionProps, 
  deriveScoreFromGptAnalysis, 
  hasInconsistentAnalysis,
  buffettCriteriaWeights,
  calculateWeightedScore,
  extractGptAssessmentStatus
} from '@/utils/buffettUtils';

interface ScoreDisplayProps {
  criterion: BuffettCriterionProps;
}

export const BuffettScoreDisplay: React.FC<ScoreDisplayProps> = ({ criterion }) => {
  if (criterion.maxScore === undefined) {
    return null;
  }
  
  const derivedScore = deriveScoreFromGptAnalysis(criterion);
  const score = criterion.score !== undefined ? criterion.score : derivedScore;
  
  if (score === undefined) {
    return null;
  }
  
  const hasInconsistency = hasInconsistentAnalysis(criterion);
  
  // Get the GPT assessment to determine partial fulfillment for warning states
  const gptAssessment = criterion.gptAnalysis ? 
    extractGptAssessmentStatus(criterion.gptAnalysis) : undefined;
  
  // Find criterion weight by matching the title
  const criterionWeight = buffettCriteriaWeights.find(c => 
    c.name.includes(criterion.title.replace(/^\d+\.\s+/, '').split(' ')[0])
  );
  
  return (
    <div className="inline-flex items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="inline-flex items-center ml-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              score / criterion.maxScore >= 0.7 ? 'bg-green-100 text-green-700' :
              score / criterion.maxScore >= 0.4 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {score}/{criterion.maxScore}
            </span>
            <Info className="h-3 w-3 ml-1 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div>
              <p className="text-xs">
                Punktzahl basierend auf der Analyse der Unterkategorien dieses Kriteriums.
                {criterion.title === '1. Verstehbares Geschäftsmodell' && 
                  ' Einfaches Geschäftsmodell = 3/3, moderates = 2/3 und komplexes = 0-1/3 Punkte.'}
                {criterion.title === '11. Keine Turnarounds' && 
                  ' Hier gilt: Kein Turnaround = 3/3, leichte Umstrukturierung = 1/3, klarer Turnaround = 0/3 Punkte.'}
              </p>
              
              {criterion.status === 'warning' && gptAssessment?.partialFulfillment && (
                <div className="mt-1 pt-1 border-t border-gray-200">
                  <p className="text-xs">
                    GPT hat {gptAssessment.partialFulfillment} von 3 Teilkriterien als erfüllt bewertet.
                  </p>
                </div>
              )}
              
              {criterionWeight && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium">Gewichtung dieses Kriteriums:</p>
                  <p className="text-xs">Max. {criterionWeight.weight}% des Gesamtscores</p>
                  <p className="text-xs">Maximal erreichbare Punkte: {criterionWeight.maxPoints}</p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {hasInconsistency && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="ml-2">
              <AlertCircle size={16} className="text-amber-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">
                Mögliche Inkonsistenz zwischen GPT-Analyse und Bewertung:
                {criterion.title === '1. Verstehbares Geschäftsmodell' && 
                  ' Bei "moderater Komplexität" sollten 2/3 Punkte vergeben werden.'}
                {criterion.title === '11. Keine Turnarounds' && 
                  ' Bei "leichter Umstrukturierung" sollte 1/3 Punkt vergeben werden.'}
                {criterion.status === 'warning' && gptAssessment?.partialFulfillment &&
                  ` Laut GPT sind ${gptAssessment.partialFulfillment} von 3 Teilaspekten erfüllt.`}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
