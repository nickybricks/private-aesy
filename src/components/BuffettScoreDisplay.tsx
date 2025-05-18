
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, AlertCircle } from 'lucide-react';
import { BuffettCriterionProps, deriveScoreFromGptAnalysis, hasInconsistentAnalysis } from '@/utils/buffettUtils';

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
            <p className="text-xs">
              Punktzahl basierend auf der Analyse der Unterkategorien dieses Kriteriums.
              {criterion.title === '1. Verstehbares Geschäftsmodell' && 
                ' Einfaches Geschäftsmodell = 3/3, moderates = 2/3 und komplexes = 0-1/3 Punkte.'}
              {criterion.title === '11. Keine Turnarounds' && 
                ' Hier gilt: Kein Turnaround = 3/3, leichte Umstrukturierung = 1/3, klarer Turnaround = 0/3 Punkte.'}
            </p>
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
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
