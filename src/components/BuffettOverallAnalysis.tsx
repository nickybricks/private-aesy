
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
import { AlertTriangle } from 'lucide-react';

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

  // Calculate the unified Buffett score with error handling
  let buffettScore: number;
  let scoreError: string | null = null;

  try {
    buffettScore = calculateTotalBuffettScore(criteria);
  } catch (error) {
    scoreError = error instanceof Error ? error.message : 'Unbekannter Fehler bei der Score-Berechnung';
    console.error('BuffettOverallAnalysis error:', scoreError);
    
    // Show error state
    return (
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h3 className="text-xl font-semibold mb-6">Buffett-Kompatibilität Gesamtbewertung</h3>
        
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-red-700">
              Gesamtbewertung nicht möglich
            </h3>
          </div>
          <div className="mt-2 text-sm text-red-600">
            <p>Die Buffett-Kompatibilität konnte nicht berechnet werden:</p>
            <div className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded">
              {scoreError}
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('BuffettOverallAnalysis unified score calculation:', {
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
