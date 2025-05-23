
import React from 'react';
import { BuffettScoreSummary } from './BuffettScoreSummary';
import { BuffettScoreChart } from './BuffettScoreChart';
import { 
  BuffettCriteriaProps,
  BuffettCriterionProps,
  calculateTotalBuffettScore
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

  // Calculate the unified Buffett score using the new weighted system
  const buffettScore = calculateTotalBuffettScore(criteria);

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="text-xl font-semibold mb-6">Buffett-Kompatibilität Gesamtbewertung</h3>
      
      <BuffettScoreSummary score={buffettScore} />
      
      <BuffettScoreChart score={buffettScore} />
    </div>
  );
};

export default BuffettOverallAnalysis;
