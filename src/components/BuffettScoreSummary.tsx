
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { buffettCriteriaWeights } from '@/utils/buffettUtils';
import { Info } from 'lucide-react';

interface BuffettScoreSummaryProps {
  score: number;
}

export const BuffettScoreSummary: React.FC<BuffettScoreSummaryProps> = ({ score }) => {
  // Round the score to the nearest integer to ensure consistency
  const roundedScore = Math.round(score);
  
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center">
        <h3 className="text-lg font-semibold">
          Buffett-Kompatibilität: {roundedScore}%
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="ml-1">
              <Info className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs mb-2">
                Die Buffett-Kompatibilität berechnet sich aus den gewichteten Punkten der 11 Kriterien:
              </p>
              <div className="space-y-1 text-xs">
                {buffettCriteriaWeights.map((criterion, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{criterion.name.split('.')[0]}. {criterion.name.split('.')[1]}</span>
                    <span>{criterion.weight}%</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
        <div className="h-2.5 rounded-full" 
             style={{
               width: `${roundedScore}%`,
               backgroundColor: roundedScore >= 75 ? '#10b981' : roundedScore >= 60 ? '#f59e0b' : '#ef4444'
             }}></div>
      </div>
      <p className="text-sm mt-2 text-gray-600">
        {roundedScore >= 75 ? 'Hohe Übereinstimmung mit Buffetts Kriterien' :
        roundedScore >= 60 ? 'Mittlere Übereinstimmung, weitere Analyse empfohlen' :
        'Geringe Übereinstimmung mit Buffetts Investitionskriterien'}
      </p>
      <p className="text-xs mt-2 text-gray-500">
        Die Bewertung spiegelt nicht unbedingt die Qualität des Investments wider und stellt keine Anlageempfehlung dar.
      </p>
    </div>
  );
};
