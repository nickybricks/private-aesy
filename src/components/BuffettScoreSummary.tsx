
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  buffettCriteriaWeights, 
  getBuffettScoreInterpretation,
  BuffettCriteriaProps,
  deriveScoreFromGptAnalysis
} from '@/utils/buffettUtils';
import { Info } from 'lucide-react';

interface BuffettScoreSummaryProps {
  score: number;
  criteria: BuffettCriteriaProps;
}

export const BuffettScoreSummary: React.FC<BuffettScoreSummaryProps> = ({ score, criteria }) => {
  // Round the score to one decimal place for better precision
  const roundedScore = Math.round(score * 10) / 10;
  const interpretation = getBuffettScoreInterpretation(roundedScore);
  
  // Calculate detailed breakdown for each criterion
  const criteriaArray = [
    { criterion: criteria.businessModel, weight: buffettCriteriaWeights[0] },
    { criterion: criteria.economicMoat, weight: buffettCriteriaWeights[1] },
    { criterion: criteria.financialMetrics, weight: buffettCriteriaWeights[2] },
    { criterion: criteria.financialStability, weight: buffettCriteriaWeights[3] },
    { criterion: criteria.management, weight: buffettCriteriaWeights[4] },
    { criterion: criteria.valuation, weight: buffettCriteriaWeights[5] },
    { criterion: criteria.longTermOutlook, weight: buffettCriteriaWeights[6] },
    { criterion: criteria.rationalBehavior, weight: buffettCriteriaWeights[7] },
    { criterion: criteria.cyclicalBehavior, weight: buffettCriteriaWeights[8] },
    { criterion: criteria.oneTimeEffects, weight: buffettCriteriaWeights[9] },
    { criterion: criteria.turnaround, weight: buffettCriteriaWeights[10] }
  ];

  const detailedBreakdown = criteriaArray.map(({ criterion, weight }) => {
    const score = criterion.score !== undefined ? criterion.score : 
                  deriveScoreFromGptAnalysis(criterion) || 0;
    
    const weightedContribution = score * (weight.weight / 100);
    const maxWeightedContribution = 10 * (weight.weight / 100);
    const contributionPercentage = (weightedContribution / 10) * 100; // How much this criterion contributes to total %
    
    return {
      name: weight.name,
      score: score,
      weight: weight.weight,
      weightedContribution: weightedContribution,
      maxWeightedContribution: maxWeightedContribution,
      contributionPercentage: contributionPercentage
    };
  });
  
  const totalWeightedScore = detailedBreakdown.reduce((acc, item) => acc + item.weightedContribution, 0);
  const maxTotalWeightedScore = detailedBreakdown.reduce((acc, item) => acc + item.maxWeightedContribution, 0);
  
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
            <TooltipContent className="max-w-md">
              <div className="space-y-3">
                <p className="text-xs mb-2 font-medium">
                  Berechnung der Buffett-Kompatibilität ({roundedScore}%):
                </p>
                
                <div className="space-y-2 text-xs">
                  {detailedBreakdown.map((item, idx) => (
                    <div key={idx} className="bg-white bg-opacity-50 p-2 rounded">
                      <div className="font-medium text-xs mb-1">
                        {item.name}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                        <div>Score: {item.score.toFixed(1)}/10</div>
                        <div>Gewichtung: {item.weight}%</div>
                        <div>Beitrag: {item.weightedContribution.toFixed(2)}</div>
                        <div>Max: {item.maxWeightedContribution.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs font-medium">
                    Gesamtberechnung:
                  </div>
                  <div className="text-xs text-gray-700 mt-1">
                    Gewichtete Summe: {totalWeightedScore.toFixed(2)} / {maxTotalWeightedScore.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-700">
                    Prozent: ({totalWeightedScore.toFixed(2)} / {maxTotalWeightedScore.toFixed(2)}) × 100 = {roundedScore}%
                  </div>
                </div>
                
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium">Bewertungsskala:</p>
                  <p className="text-xs">≥ 80%: Sehr hohe Übereinstimmung</p>
                  <p className="text-xs">65-79%: Gute Übereinstimmung</p>
                  <p className="text-xs">{"< 65%: Niedrige Übereinstimmung"}</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
        <div 
          className="h-2.5 rounded-full" 
          style={{
            width: `${Math.min(roundedScore, 100)}%`,
            backgroundColor: interpretation.color
          }}
        />
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
