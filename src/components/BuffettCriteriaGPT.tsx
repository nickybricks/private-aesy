
import React from 'react';
import { BuffettCriterionCard } from './BuffettCriterionCard';
import BuffettOverallAnalysis from './BuffettOverallAnalysis';
import { 
  BuffettCriteriaProps,
  BuffettCriterionProps,
  getUnifiedCriterionScore
} from '@/utils/buffettUtils';

interface BuffettCriteriaGPTProps {
  criteria: BuffettCriteriaProps;
}

const BuffettCriteriaGPT: React.FC<BuffettCriteriaGPTProps> = ({ criteria }) => {
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

  // Calculate scores using the unified system for display consistency  
  const detailedScores = allCriteria.map(criterion => {
    const score = getUnifiedCriterionScore(criterion);
    return { criterion, score };
  });
  
  const totalDetailedScore = detailedScores.reduce((acc, { score }) => acc + score, 0);
  const maxDetailedScore = detailedScores.length * 10; // Each criterion max 10 points
  
  const detailedScorePercentage = maxDetailedScore > 0 ? 
    Math.round((totalDetailedScore / maxDetailedScore) * 100) : 0;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Buffett-Kriterien Analyse mit GPT</h2>
      <p className="text-buffett-subtext mb-6">
        Eine umfassende Analyse nach Warren Buffetts 11 Investmentkriterien mit gewichteter Bewertung (0-10 Punkte pro Kriterium).
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {allCriteria.map((criterion, index) => (
          <BuffettCriterionCard 
            key={index} 
            criterion={criterion} 
            index={index}
          />
        ))}
      </div>
      
      <BuffettOverallAnalysis criteria={criteria} />
      
      <div className="mt-6 text-sm text-gray-500">
        <p>Die dargestellte Bewertung ist keine Anlageempfehlung.</p>
      </div>
    </div>
  );
};

export default BuffettCriteriaGPT;
