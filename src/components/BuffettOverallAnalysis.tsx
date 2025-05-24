
import React from 'react';
import { BuffettScoreSummary } from './BuffettScoreSummary';
import { BuffettScoreChart } from './BuffettScoreChart';
import { 
  BuffettCriteriaProps,
  BuffettCriterionProps,
  calculateTotalBuffettScore,
  getUnifiedCriterionScore,
  getUnifiedCriterionMaxScore,
  buffettCriteriaWeights
} from '@/utils/buffettUtils';

interface BuffettOverallAnalysisProps {
  criteria: BuffettCriteriaProps;
}

const BuffettOverallAnalysis: React.FC<BuffettOverallAnalysisProps> = ({ criteria }) => {
  const isBuffettCriterion = (criterion: any): criterion is BuffettCriterionProps => {
    return criterion && 
           typeof criterion.title === 'string' && 
           ['pass', 'warning', 'fail'].includes(criterion.status) &&
           typeof criterion.description === 'string' &&
           Array.isArray(criterion.details);
  };

  const allCriteria = [
    criteria.businessModel,
    criteria.economicMoat,
    criteria.financialMetrics,
    criteria.financialStability,
    criteria.management,
    criteria.valuation,
    criteria.longTermOutlook,
    criteria.rationalBehavior,
    criteria.cyclicalBehavior,
    criteria.oneTimeEffects,
    criteria.turnaround
  ].filter(isBuffettCriterion);

  // Calculate the unified Buffett score using the same system as the tooltip
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

  let totalWeightedScore = 0;
  let maxTotalWeightedScore = 0;

  criteriaArray.forEach(({ criterion, weight }) => {
    const score = getUnifiedCriterionScore(criterion);
    const maxScore = getUnifiedCriterionMaxScore(criterion);
    
    const weightedContribution = score * (weight.weight / 100);
    const maxWeightedContribution = maxScore * (weight.weight / 100);
    
    totalWeightedScore += weightedContribution;
    maxTotalWeightedScore += maxWeightedContribution;
  });

  const buffettScore = Math.round((totalWeightedScore / maxTotalWeightedScore) * 100 * 10) / 10;

  console.log('BuffettOverallAnalysis unified score calculation:', {
    totalWeightedScore,
    maxTotalWeightedScore,
    buffettScore
  });

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="text-xl font-semibold mb-6">Buffett-Kompatibilität Gesamtbewertung</h3>
      
      <BuffettScoreSummary score={buffettScore} criteria={criteria} />
      
      <BuffettScoreChart score={buffettScore} />
    </div>
  );
};

export default BuffettOverallAnalysis;
