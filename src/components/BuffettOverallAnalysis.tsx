
import React from 'react';
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

  // Calculate the unified Buffett score
  const buffettScore = calculateTotalBuffettScore(criteria);

  console.log('BuffettOverallAnalysis unified score calculation:', {
    buffettScore
  });

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="text-xl font-semibold mb-6">Buffett-Kompatibilität Visualisierung</h3>
      
      <BuffettScoreChart score={buffettScore} />
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Berechnung: Gewichtete Summe aller Kriterien (0-10 Punkte) nach Buffetts Prioritäten. Basis sind öffentlich verfügbare Daten.</p>
      </div>
    </div>
  );
};

export default BuffettOverallAnalysis;
