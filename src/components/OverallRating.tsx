
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RatingExplanation from './RatingExplanation';
import { QualityMetricsCard } from './QualityMetricsCard';
import { MarginOfSafetyCard } from './MarginOfSafetyCard';
import { BestBuyPriceCard } from './BestBuyPriceCard';
import { BuffettTwoPillarsSection } from './BuffettTwoPillarsSection';
import { DetailedAnalysisSection } from './DetailedAnalysisSection';
import { 
  BuffettCriteriaProps,
  getUnifiedCriterionScore,
  buffettCriteriaWeights
} from '@/utils/buffettUtils';

type Rating = 'buy' | 'watch' | 'avoid';

interface OverallRatingProps {
  rating: {
    overall: Rating;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
    buffettScore?: number;
    marginOfSafety?: {
      value: number;
      status: 'pass' | 'warning' | 'fail';
    };
    bestBuyPrice?: number | null;
    currentPrice?: number | null;
    currency?: string;
    intrinsicValue?: number | null;
    targetMarginOfSafety?: number;
    originalCurrency?: string;
    originalPrice?: number | null;
    originalIntrinsicValue?: number | null;
    originalBestBuyPrice?: number | null;
    criteria?: BuffettCriteriaProps;
  } | null;
}

// Calculate real Buffett score from criteria
const calculateBuffettScore = (criteria?: BuffettCriteriaProps): number => {
  if (!criteria) return 0;
  
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
    const maxScore = 10;
    
    const weightedContribution = score * (weight.weight / 100);
    const maxWeightedContribution = maxScore * (weight.weight / 100);
    
    totalWeightedScore += weightedContribution;
    maxTotalWeightedScore += maxWeightedContribution;
  });

  return Math.round((totalWeightedScore / maxTotalWeightedScore) * 100 * 10) / 10;
};

const getQualityAssessment = (buffettScore: number) => {
  if (buffettScore >= 85) {
    return {
      isQualityMet: true,
      qualityLabel: "✅ Qualität erfüllt",
      qualityDescription: `Exzellente Qualität (${buffettScore}%)`,
      qualityLevel: 'high' as const
    };
  } else if (buffettScore >= 70) {
    return {
      isQualityMet: false,
      qualityLabel: "⚠️ Qualität knapp nicht erfüllt", 
      qualityDescription: `Gute Basis, aber unter Buffett-Standard (${buffettScore}% < 85%)`,
      qualityLevel: 'medium' as const
    };
  } else {
    return {
      isQualityMet: false,
      qualityLabel: "❌ Qualität nicht erfüllt",
      qualityDescription: `Unzureichende Qualität (${buffettScore}% < 70%)`,
      qualityLevel: 'low' as const
    };
  }
};

const generateDynamicSummary = (
  qualityAssessment: ReturnType<typeof getQualityAssessment>,
  marginOfSafetyValue?: number,
  strengths?: string[],
  weaknesses?: string[]
): string => {
  const score = qualityAssessment.qualityLevel;
  const priceStatus = (marginOfSafetyValue || 0) >= 0 ? 'günstig' : 'überbewertet';
  
  if (score === 'high' && priceStatus === 'günstig') {
    return 'Sowohl Qualität als auch Preis erfüllen Buffetts Kriterien vollständig.';
  }
  
  if (score === 'high' && priceStatus === 'überbewertet') {
    return 'Hohe Qualität erkannt, aber der aktuelle Preis bietet keine Sicherheitsmarge.';
  }
  
  if (score === 'medium' && priceStatus === 'günstig') {
    return 'Attraktiver Preis, aber Qualitätskriterien knapp unter Buffetts Standard.';
  }
  
  if (score === 'medium') {
    return 'Solide Basis mit erkennbaren Stärken, aber wichtige Buffett-Kriterien fehlen noch.';
  }
  
  return 'Wesentliche Verbesserungen in Qualität und/oder Bewertung erforderlich.';
};

const interpretMarginOfSafety = (value: number): 'pass' | 'warning' | 'fail' => {
  if (value > 30) return 'pass';
  if (value >= 10) return 'warning';
  if (value >= 0) return 'warning';
  return 'fail';
};

const determineBuffettConformity = (
  buffettScore: number,
  marginOfSafetyValue?: number
) => {
  const qualityAssessment = getQualityAssessment(buffettScore);
  const qualityMet = qualityAssessment.isQualityMet;
  const priceMet = (marginOfSafetyValue || 0) >= 0;
  const isBuffettConform = qualityMet && priceMet;
  
  if (isBuffettConform) {
    return { 
      isBuffettConform: true,
      rating: 'buy' as Rating, 
      reasoning: 'Beide Buffett-Säulen erfüllt',
      qualityMet,
      priceMet,
      qualityAssessment
    };
  }
  
  if (qualityMet && !priceMet) {
    return { 
      isBuffettConform: false,
      rating: 'watch' as Rating, 
      reasoning: 'Hohe Qualität, aber überbewertet',
      qualityMet,
      priceMet,
      qualityAssessment
    };
  }
  
  if (!qualityMet && priceMet) {
    return { 
      isBuffettConform: false,
      rating: 'avoid' as Rating, 
      reasoning: qualityAssessment.qualityDescription + ', aber günstiger Preis',
      qualityMet,
      priceMet,
      qualityAssessment
    };
  }
  
  return { 
    isBuffettConform: false,
    rating: 'avoid' as Rating, 
    reasoning: qualityAssessment.qualityDescription + ' und überbewertet',
    qualityMet,
    priceMet,
    qualityAssessment
  };
};

const OverallRating: React.FC<OverallRatingProps> = ({ rating }) => {
  if (!rating) return null;
  
  let { 
    strengths, 
    weaknesses, 
    buffettScore, 
    marginOfSafety, 
    bestBuyPrice,
    currentPrice,
    currency = '€',
    intrinsicValue,
    targetMarginOfSafety = 20,
    criteria
  } = rating;
  
  // Calculate real Buffett score from criteria instead of using hardcoded value
  const realBuffettScore = calculateBuffettScore(criteria);
  
  console.log('OverallRating - Real Buffett Score calculated:', realBuffettScore);
  
  // Prüfe auf negativen DCF-Wert anstatt fehlende Daten
  const hasNegativeDcfValue = intrinsicValue !== null && 
                             intrinsicValue !== undefined && 
                             !isNaN(Number(intrinsicValue)) && 
                             Number(intrinsicValue) < 0;
  
  const hasMissingPriceData = currentPrice === null || 
                             currentPrice === undefined || 
                             (intrinsicValue === null || intrinsicValue === undefined);
  
  if (hasMissingPriceData) {
    console.warn("Fehlende Preisinformationen für Wertanalyse:", 
      { currentPrice, bestBuyPrice, intrinsicValue });
  }
  
  if (hasNegativeDcfValue) {
    console.log("Negativer DCF-Wert erkannt:", intrinsicValue);
  }
  
  // Calculate correct margin of safety if needed or missing
  let calculatedMarginOfSafety = marginOfSafety;
  if ((!marginOfSafety || marginOfSafety.value === 0) && 
      intrinsicValue !== null && intrinsicValue !== undefined && 
      currentPrice !== null && currentPrice !== undefined &&
      !isNaN(Number(intrinsicValue)) && !isNaN(Number(currentPrice))) {
    const mosValue = ((intrinsicValue - currentPrice) / currentPrice) * 100;
    calculatedMarginOfSafety = {
      value: mosValue,
      status: interpretMarginOfSafety(mosValue)
    };
    console.log(`Calculated Margin of Safety: ${mosValue.toFixed(1)}%`);
  } else if (marginOfSafety) {
    calculatedMarginOfSafety.status = interpretMarginOfSafety(marginOfSafety.value);
  }
  
  const buffettAnalysis = determineBuffettConformity(realBuffettScore, calculatedMarginOfSafety?.value);
  const dynamicSummary = generateDynamicSummary(buffettAnalysis.qualityAssessment, calculatedMarginOfSafety?.value, strengths, weaknesses);
  
  return (
    <div className="buffett-card animate-fade-in">
      {hasNegativeDcfValue && (
        <div className="mb-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTriangle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-700">
              Das DCF-Modell ergibt einen negativen intrinsischen Wert. Dies deutet auf signifikante operative Herausforderungen hin.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {hasMissingPriceData && !hasNegativeDcfValue && (
        <div className="mb-6">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-700">
              Für dieses Symbol liegen unvollständige Preisdaten vor. Die Bewertung basiert auf verfügbaren Daten und könnte ungenau sein.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        Gesamtbewertung
        <RatingExplanation rating={buffettAnalysis.rating} />
      </h2>
      
      {/* Three Metrics Section */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <QualityMetricsCard 
          buffettScore={realBuffettScore}
          criteria={criteria}
        />
        
        <MarginOfSafetyCard 
          marginOfSafetyValue={calculatedMarginOfSafety?.value || 0}
          targetMarginOfSafety={targetMarginOfSafety}
          intrinsicValue={intrinsicValue}
          currentPrice={currentPrice}
          currency={currency}
        />
        
        <BestBuyPriceCard 
          bestBuyPrice={bestBuyPrice}
          currentPrice={currentPrice}
          intrinsicValue={intrinsicValue}
          targetMarginOfSafety={targetMarginOfSafety}
          currency={currency}
        />
      </div>
      
      {/* Detailed Analysis */}
      <DetailedAnalysisSection 
        strengths={strengths}
        weaknesses={weaknesses}
        reasoning={buffettAnalysis.reasoning}
      />
      
      {/* Main Two-Pillars Section */}
      <BuffettTwoPillarsSection 
        buffettAnalysis={buffettAnalysis}
        marginOfSafetyValue={calculatedMarginOfSafety?.value || 0}
        dynamicSummary={dynamicSummary}
      />
    </div>
  );
};

export default OverallRating;
