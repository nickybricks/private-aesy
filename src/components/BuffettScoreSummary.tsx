
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  buffettCriteriaWeights, 
  getBuffettScoreInterpretation,
  BuffettCriteriaProps,
  getUnifiedCriterionScore
} from '@/utils/buffettUtils';
import { Info } from 'lucide-react';

interface BuffettScoreSummaryProps {
  score: number;
  criteria: BuffettCriteriaProps;
  rawScore?: number;
  maxRawScore?: number;
}

export const BuffettScoreSummary: React.FC<BuffettScoreSummaryProps> = ({ 
  score, 
  criteria, 
  rawScore, 
  maxRawScore 
}) => {
  // Calculate detailed breakdown for each criterion using unified scoring
  const criteriaArray = [
    { criterion: criteria.businessModel, weight: buffettCriteriaWeights[0], name: "1. Verständliches Geschäftsmodell" },
    { criterion: criteria.economicMoat, weight: buffettCriteriaWeights[1], name: "2. Wirtschaftlicher Burggraben (Moat)" },
    { criterion: criteria.financialMetrics, weight: buffettCriteriaWeights[2], name: "3. Finanzkennzahlen (10 Jahre)" },
    { criterion: criteria.financialStability, weight: buffettCriteriaWeights[3], name: "4. Finanzielle Stabilität & Verschuldung" },
    { criterion: criteria.management, weight: buffettCriteriaWeights[4], name: "5. Qualität des Managements" },
    { criterion: criteria.valuation, weight: buffettCriteriaWeights[5], name: "6. Bewertung (nicht zu teuer kaufen)" },
    { criterion: criteria.longTermOutlook, weight: buffettCriteriaWeights[6], name: "7. Langfristiger Horizont" },
    { criterion: criteria.rationalBehavior, weight: buffettCriteriaWeights[7], name: "8. Rationalität & Disziplin" },
    { criterion: criteria.cyclicalBehavior, weight: buffettCriteriaWeights[8], name: "9. Antizyklisches Verhalten" },
    { criterion: criteria.oneTimeEffects, weight: buffettCriteriaWeights[9], name: "10. Vergangenheit ≠ Zukunft" },
    { criterion: criteria.turnaround, weight: buffettCriteriaWeights[10], name: "11. Keine Turnarounds" }
  ];

  const detailedBreakdown = criteriaArray.map(({ criterion, weight, name }) => {
    // Use the unified scoring functions with correct 10-point scale
    const score = getUnifiedCriterionScore(criterion);
    const maxScore = 10; // Always 10 for the new scoring system
    
    const weightedContribution = score * (weight.weight / 100);
    const maxWeightedContribution = maxScore * (weight.weight / 100);
    
    return {
      name: name,
      score: score,
      maxScore: maxScore,
      weight: weight.weight,
      weightedContribution: weightedContribution,
      maxWeightedContribution: maxWeightedContribution
    };
  });
  
  const totalWeightedScore = detailedBreakdown.reduce((acc, item) => acc + item.weightedContribution, 0);
  const maxTotalWeightedScore = detailedBreakdown.reduce((acc, item) => acc + item.maxWeightedContribution, 0);
  
  // Use the passed score to ensure consistency
  const displayScore = score;
  
  // Calculate raw score if not provided
  const calculatedRawScore = rawScore || detailedBreakdown.reduce((acc, item) => acc + item.score, 0);
  const calculatedMaxRawScore = maxRawScore || detailedBreakdown.length * 10;
  const rawScorePercentage = Math.round((calculatedRawScore / calculatedMaxRawScore) * 100);
  
  console.log('BuffettScoreSummary calculation:', {
    displayScore,
    totalWeightedScore,
    maxTotalWeightedScore,
    calculatedRawScore,
    calculatedMaxRawScore,
    rawScorePercentage
  });
  
  const interpretation = getBuffettScoreInterpretation(displayScore);
  
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center">
        <h3 className="text-lg font-semibold">
          Buffett-Kompatibilität: {displayScore}%
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="ml-1">
              <Info className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <div className="space-y-3">
                <p className="text-xs mb-2 font-medium">
                  Berechnung der Buffett-Kompatibilität ({displayScore}%):
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
                    Prozent: ({totalWeightedScore.toFixed(2)} / {maxTotalWeightedScore.toFixed(2)}) × 100 = {displayScore}%
                  </div>
                </div>
                
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium">Bewertungsskala (0-10 Punkte pro Kriterium):</p>
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
            width: `${Math.min(displayScore, 100)}%`,
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
      
      {/* Add raw score display for transparency */}
      <p className="text-xs mt-2 text-gray-500">
        Rohpunktzahl: {calculatedRawScore.toFixed(1)}/{calculatedMaxRawScore} ({rawScorePercentage}%)
      </p>
      
      <p className="text-xs mt-2 text-gray-500">
        Die Bewertung spiegelt nicht unbedingt die Qualität des Investments wider und stellt keine Anlageempfehlung dar.
      </p>
    </div>
  );
};
