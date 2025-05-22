
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
    { criterion: criteria.businessModel, id: 'businessModel' },
    { criterion: criteria.economicMoat, id: 'economicMoat' },
    { criterion: criteria.financialMetrics, id: 'financialMetrics' },
    { criterion: criteria.financialStability, id: 'financialStability' },
    { criterion: criteria.management, id: 'management' },
    { criterion: criteria.valuation, id: 'valuation' },
    { criterion: criteria.longTermOutlook, id: 'longTermOutlook' },
    { criterion: criteria.rationalBehavior, id: 'rationalBehavior' },
    { criterion: criteria.cyclicalBehavior, id: 'cyclicalBehavior' },
    { criterion: criteria.oneTimeEffects, id: 'oneTimeEffects' },
    { criterion: criteria.turnaround, id: 'turnaround' }
  ];

  // Calculate weighted scores
  const weightedScores = criteriaWithIds
    .filter(({ criterion }) => isBuffettCriterion(criterion) && criterion.score !== undefined && criterion.maxScore !== undefined)
    .map(({ criterion, id }) => calculateWeightedScore(criterion, id));
  
  // Calculate total weighted score (Buffett compatibility)
  const totalWeightedScore = weightedScores.reduce((acc, score) => acc + score.weightedScore, 0);
  const buffettScore = Math.round(totalWeightedScore);

  // Old calculation kept for reference or fallback
  const totalPoints = processedCriteria.reduce((acc, criterion) => {
    if (criterion.status === 'pass') return acc + 3;
    if (criterion.status === 'warning') return acc + 1;
    return acc;
  }, 0);
  
  const maxPoints = processedCriteria.length * 3;
  const oldBuffettScore = Math.round((totalPoints / maxPoints) * 100);

  const detailedScores = processedCriteria.filter(c => c.score !== undefined && c.maxScore !== undefined);
  const hasDetailedScores = detailedScores.length > 0;
  
  const totalDetailedScore = hasDetailedScores ? 
    detailedScores.reduce((acc, c) => acc + (c.score || 0), 0) : 0;
  const maxDetailedScore = hasDetailedScores ? 
    detailedScores.reduce((acc, c) => acc + (c.maxScore || 0), 0) : 0;
  
  const detailedBuffettScore = hasDetailedScores && maxDetailedScore > 0 ? 
    Math.round((totalDetailedScore / maxDetailedScore) * 100) : oldBuffettScore;

  // Use the weighted score as final score
  const finalScore = buffettScore;

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
      </div>
    </div>
  );
};

export default BuffettCriteriaGPT;
