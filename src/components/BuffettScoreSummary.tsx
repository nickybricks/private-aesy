
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  buffettCriteriaWeights, 
  getBuffettScoreInterpretation,
  BuffettCriteriaProps,
  getUnifiedCriterionScore,
  getUnifiedCriterionMaxScore
} from '@/utils/buffettUtils';
import { Info, AlertTriangle } from 'lucide-react';

interface BuffettScoreSummaryProps {
  score: number;
  criteria: BuffettCriteriaProps;
}

export const BuffettScoreSummary: React.FC<BuffettScoreSummaryProps> = ({ score, criteria }) => {
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

  let detailedBreakdown = [];
  let errors = [];
  let totalWeightedScore = 0;
  let maxTotalWeightedScore = 0;

  criteriaArray.forEach(({ criterion, weight, name }) => {
    try {
      // Use the unified scoring functions - will throw error if score unavailable
      const score = getUnifiedCriterionScore(criterion);
      const maxScore = getUnifiedCriterionMaxScore(criterion);
      
      const weightedContribution = score * (weight.weight / 100);
      const maxWeightedContribution = maxScore * (weight.weight / 100);
      
      console.log(`BuffettScoreSummary - ${name}: unified score=${score}/${maxScore}, weighted=${weightedContribution.toFixed(2)}`);
      
      detailedBreakdown.push({
        name: name,
        score: score,
        maxScore: maxScore,
        weight: weight.weight,
        weightedContribution: weightedContribution,
        maxWeightedContribution: maxWeightedContribution,
        error: null
      });
      
      totalWeightedScore += weightedContribution;
      maxTotalWeightedScore += maxWeightedContribution;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      errors.push(`${name}: ${errorMessage}`);
      
      detailedBreakdown.push({
        name: name,
        score: 0,
        maxScore: 10,
        weight: weight.weight,
        weightedContribution: 0,
        maxWeightedContribution: weight.weight / 10,
        error: errorMessage
      });
      
      // Still add max weighted score to denominator
      maxTotalWeightedScore += weight.weight / 10;
    }
  });
  
  // Calculate the actual percentage from the unified scores
  const actualCalculatedScore = maxTotalWeightedScore > 0 ? 
    Math.round((totalWeightedScore / maxTotalWeightedScore) * 100 * 10) / 10 : 0;
  
  console.log('BuffettScoreSummary unified score calculation:', {
    totalWeightedScore,
    maxTotalWeightedScore,
    actualCalculatedScore,
    errors,
    breakdown: detailedBreakdown
  });
  
  const interpretation = getBuffettScoreInterpretation(actualCalculatedScore);
  
  // Show error state if there are errors
  if (errors.length > 0) {
    return (
      <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-lg font-semibold text-red-700">
            Fehler bei der Buffett-Score Berechnung
          </h3>
        </div>
        <div className="mt-2 text-sm text-red-600">
          <p>Folgende Kriterien konnten nicht bewertet werden:</p>
          <ul className="list-disc list-inside mt-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-xs">{error}</li>
            ))}
          </ul>
        </div>
        {totalWeightedScore > 0 && (
          <div className="mt-3 text-sm text-red-600">
            <p>Partieller Score basierend auf verfügbaren Daten: {actualCalculatedScore}%</p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center">
        <h3 className="text-lg font-semibold">
          Buffett-Kompatibilität: {actualCalculatedScore}%
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="ml-1">
              <Info className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <div className="space-y-3">
                <p className="text-xs mb-2 font-medium">
                  Berechnung der Buffett-Kompatibilität ({actualCalculatedScore}%):
                </p>
                
                <div className="space-y-2 text-xs">
                  {detailedBreakdown.map((item, idx) => (
                    <div key={idx} className={`p-2 rounded ${item.error ? 'bg-red-100' : 'bg-white bg-opacity-50'}`}>
                      <div className="font-medium text-xs mb-1">
                        {item.name}
                      </div>
                      {item.error ? (
                        <div className="text-xs text-red-600">
                          Fehler: {item.error}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                          <div>Score: {item.score.toFixed(1)}/{item.maxScore}</div>
                          <div>Gewichtung: {item.weight}%</div>
                          <div>Beitrag: {item.weightedContribution.toFixed(2)}</div>
                          <div>Max: {item.maxWeightedContribution.toFixed(2)}</div>
                        </div>
                      )}
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
                    Prozent: ({totalWeightedScore.toFixed(2)} / {maxTotalWeightedScore.toFixed(2)}) × 100 = {actualCalculatedScore}%
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
            width: `${Math.min(actualCalculatedScore, 100)}%`,
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
