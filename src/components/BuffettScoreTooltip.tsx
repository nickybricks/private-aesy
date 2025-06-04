
import React from 'react';
import { 
  BuffettCriteriaProps,
  getUnifiedCriterionScore,
  buffettCriteriaWeights
} from '@/utils/buffettUtils';

interface BuffettScoreTooltipProps {
  score: number;
  criteria?: BuffettCriteriaProps;
}

export const BuffettScoreTooltip: React.FC<BuffettScoreTooltipProps> = ({ 
  score, 
  criteria 
}) => {
  let realBreakdown = null;
  let totalWeightedScore = 0;
  let totalMaxWeightedScore = 0;
  
  if (criteria) {
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

    realBreakdown = criteriaArray.map(({ criterion, weight }) => {
      const criterionScore = getUnifiedCriterionScore(criterion);
      const weightedContribution = criterionScore * (weight.weight / 100);
      const maxWeightedContribution = 10 * (weight.weight / 100);
      
      totalWeightedScore += weightedContribution;
      totalMaxWeightedScore += maxWeightedContribution;
      
      return {
        name: weight.name,
        score: criterionScore,
        maxScore: 10,
        weight: weight.weight,
        weightedContribution,
        maxWeightedContribution
      };
    });
  }
  
  return (
    <div className="space-y-3 max-w-md">
      <h4 className="font-semibold">Buffett-Kompatibilität: {score}%</h4>
      <p className="text-sm mb-2 font-medium">
        Berechnung der Buffett-Kompatibilität ({score}%):
      </p>
      
      <div className="space-y-2 text-xs">
        {realBreakdown ? (
          realBreakdown.map((item, index) => (
            <div key={index} className="bg-white bg-opacity-50 p-2 rounded">
              <div className="font-medium text-xs mb-1">{item.name}</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                <div>Score: {item.score.toFixed(1)}/{item.maxScore}</div>
                <div>Gewichtung: {item.weight}%</div>
                <div>Beitrag: {item.weightedContribution.toFixed(2)}</div>
                <div>Max: {item.maxWeightedContribution.toFixed(2)}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-600">
            Keine Kriterien-Daten verfügbar für detaillierte Aufschlüsselung.
          </div>
        )}
      </div>
      
      <div className="pt-2 border-t border-gray-200">
        <div className="text-xs font-medium">Gesamtberechnung:</div>
        <div className="text-xs text-gray-700 mt-1">
          Gewichtete Summe: {realBreakdown ? totalWeightedScore.toFixed(2) : 'N/A'} / {realBreakdown ? totalMaxWeightedScore.toFixed(2) : 'N/A'}
        </div>
        <div className="text-xs text-gray-700">
          Prozent: {realBreakdown ? `(${totalWeightedScore.toFixed(2)} / ${totalMaxWeightedScore.toFixed(2)}) × 100 = ${score}%` : `${score}%`}
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-200">
        <p className="text-xs font-medium">Qualitätsschwellen:</p>
        <p className="text-xs">≥ 85%: ✅ Qualität erfüllt</p>
        <p className="text-xs">70-84%: ⚠️ Teilweise erfüllt</p>
        <p className="text-xs">&lt; 70%: ❌ Nicht erfüllt</p>
      </div>
      
      <div className="text-xs text-gray-500">
        Die Bewertung spiegelt nicht unbedingt die Qualität des Investments wider und stellt keine Anlageempfehlung dar.
      </div>
    </div>
  );
};
