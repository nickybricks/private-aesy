
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { buffettCriteriaWeights, getBuffettScoreInterpretation } from '@/utils/buffettUtils';
import { Info } from 'lucide-react';

interface BuffettScoreSummaryProps {
  score: number;
}

export const BuffettScoreSummary: React.FC<BuffettScoreSummaryProps> = ({ score }) => {
  // Round the score to one decimal place for better precision
  const roundedScore = Math.round(score * 10) / 10;
  const interpretation = getBuffettScoreInterpretation(roundedScore);
  
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
                Die Buffett-Kompatibilität berechnet sich aus den gewichteten Punkten der 11 Kriterien (0-10 Punkte je Kriterium):
              </p>
              <div className="space-y-1 text-xs">
                {buffettCriteriaWeights.map((criterion, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{criterion.name}</span>
                    <span>{criterion.weight}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-medium">Bewertungsskala:</p>
                <p className="text-xs">≥ 80%: Sehr hohe Buffett-Kompatibilität</p>
                <p className="text-xs">65-79%: Gute Übereinstimmung</p>
                <p className="text-xs">< 65%: Eher nicht Buffett-kompatibel</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
        <div className="h-2.5 rounded-full" 
             style={{
               width: `${Math.min(roundedScore, 100)}%`,
               backgroundColor: interpretation.color
             }}></div>
      </div>
      <p className="text-sm mt-2 text-gray-600" style={{ color: interpretation.color }}>
        {interpretation.label}
      </p>
      <p className="text-xs mt-1 text-gray-500">
        {interpretation.description}
      </p>
      <p className="text-xs mt-2 text-gray-500">
        Die Bewertung spiegelt nicht unbedingt die Qualität des Investments wider und stellt keine Anlageempfehlung dar.
      </p>
    </div>
  );
};
