
import React, { useEffect, useState } from 'react';
import { BuffettScoreSummary } from './BuffettScoreSummary';
import { BuffettScoreChart } from './BuffettScoreChart';
import { BuffettCriterionCard } from './BuffettCriterionCard';
import { 
  BuffettCriteriaProps,
  BuffettCriterionProps,
  calculateTotalBuffettScore,
  deriveScoreFromGptAnalysis
} from '@/utils/buffettUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

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

  // Calculate the unified Buffett score using the new weighted system
  const buffettScore = calculateTotalBuffettScore(criteria);

  // Calculate detailed scores for display
  const detailedScores = allCriteria.map(criterion => {
    const score = criterion.score || deriveScoreFromGptAnalysis(criterion) || 0;
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
      
      <BuffettScoreSummary score={buffettScore} />
      
      <BuffettScoreChart score={buffettScore} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {allCriteria.map((criterion, index) => (
          <BuffettCriterionCard 
            key={index} 
            criterion={criterion} 
            index={index}
          />
        ))}
      </div>
      <div className="mt-6 text-sm text-gray-500">
        <p>Die dargestellte Bewertung ist keine Anlageempfehlung.</p>
        <p className="mt-1">
          Gewichteter Buffett-Score: {buffettScore}% | 
          Rohpunktzahl: {totalDetailedScore.toFixed(1)}/{maxDetailedScore} ({detailedScorePercentage}%)
        </p>
      </div>
    </div>
  );
};

export default BuffettCriteriaGPT;
