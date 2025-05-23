
import React, { useEffect, useState } from 'react';
import { BuffettScoreSummary } from './BuffettScoreSummary';
import { BuffettScoreChart } from './BuffettScoreChart';
import { BuffettCriterionCard } from './BuffettCriterionCard';
import { 
  BuffettCriteriaProps,
  BuffettCriterionProps,
  hasInconsistentAnalysis,
  calculateWeightedScore,
  buffettCriteriaWeights
} from '@/utils/buffettUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface BuffettCriteriaGPTProps {
  criteria: BuffettCriteriaProps;
}

const BuffettCriteriaGPT: React.FC<BuffettCriteriaGPTProps> = ({ criteria }) => {
  const [inconsistentCriteria, setInconsistentCriteria] = useState<BuffettCriterionProps[]>([]);
  
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

  const processedCriteria = allCriteria.map(criterion => {
    if (criterion.score === undefined) {
      return criterion;
    }
    return criterion;
  });

  // Check for inconsistencies on component mount or criteria change
  useEffect(() => {
    const inconsistencies = processedCriteria.filter(criterion => 
      hasInconsistentAnalysis(criterion)
    );
    setInconsistentCriteria(inconsistencies);
  }, [processedCriteria]);

  const criteriaWithIds = [
    { criterion: criteria.businessModel, id: 'criterion1' },
    { criterion: criteria.economicMoat, id: 'criterion2' },
    { criterion: criteria.financialMetrics, id: 'criterion3' },
    { criterion: criteria.financialStability, id: 'criterion4' },
    { criterion: criteria.management, id: 'criterion5' },
    { criterion: criteria.valuation, id: 'criterion6' },
    { criterion: criteria.longTermOutlook, id: 'criterion7' },
    { criterion: criteria.rationalBehavior, id: 'criterion8' },
    { criterion: criteria.cyclicalBehavior, id: 'criterion9' },
    { criterion: criteria.oneTimeEffects, id: 'criterion10' },
    { criterion: criteria.turnaround, id: 'criterion11' }
  ];

  // Calculate weighted scores
  const weightedScores = criteriaWithIds
    .filter(({ criterion }) => isBuffettCriterion(criterion) && criterion.score !== undefined && criterion.maxScore !== undefined)
    .map(({ criterion, id }) => calculateWeightedScore(criterion, id));
  
  // Calculate total weighted score (Buffett compatibility)
  const totalWeightedScore = weightedScores.reduce((acc, score) => acc + score.weightedScore, 0);
  const buffettScore = Math.round(totalWeightedScore);

  // Calculate the total points and max points for the detailed breakdown
  const detailedScores = processedCriteria.filter(c => c.score !== undefined && c.maxScore !== undefined);
  const totalDetailedScore = detailedScores.reduce((acc, c) => acc + (c.score || 0), 0);
  const maxDetailedScore = detailedScores.reduce((acc, c) => acc + (c.maxScore || 0), 0);
  
  // Ensure the displayed percentage matches the weighted calculation
  const finalScore = buffettScore;
  const detailedScorePercentage = maxDetailedScore > 0 ? 
    Math.round((totalDetailedScore / maxDetailedScore) * 100) : 0;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Buffett-Kriterien Analyse mit GPT</h2>
      <p className="text-buffett-subtext mb-6">
        Eine umfassende Analyse nach Warren Buffetts 11 Investmentkriterien, unterstützt durch GPT für die qualitative Bewertung.
      </p>
      
      {inconsistentCriteria.length > 0 && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-700">
            Es wurden {inconsistentCriteria.length} Kriterien mit potenziellen Widersprüchen zwischen GPT-Analyse und Bewertung gefunden. 
            Bitte prüfen Sie die markierten Kriterien.
          </AlertDescription>
        </Alert>
      )}
      
      <BuffettScoreSummary score={finalScore} />
      
      <BuffettScoreChart score={finalScore} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {processedCriteria.map((criterion, index) => (
          <BuffettCriterionCard 
            key={index} 
            criterion={criterion} 
            index={index}
          />
        ))}
      </div>
      <div className="mt-6 text-sm text-gray-500">
        <p>Die dargestellte Bewertung ist keine Anlageempfehlung.</p>
        <p className="mt-1">Detaillierte Punktzahl: {totalDetailedScore}/{maxDetailedScore} ({detailedScorePercentage}%)</p>
      </div>
    </div>
  );
};

export default BuffettCriteriaGPT;
