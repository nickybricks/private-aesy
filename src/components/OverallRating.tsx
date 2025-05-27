
import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  BarChart3
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RatingExplanation from './RatingExplanation';
import BuffettValuationMetrics from './BuffettValuationMetrics';

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
  } | null;
}

// Quality assessment with the new 85% threshold
const getQualityAssessment = (buffettScore?: number): { 
  isQualityMet: boolean; 
  qualityLabel: string;
  qualityDescription: string;
  qualityLevel: 'high' | 'medium' | 'low';
} => {
  const score = buffettScore || 0;
  
  if (score >= 85) {
    return {
      isQualityMet: true,
      qualityLabel: "✅ Qualität erfüllt",
      qualityDescription: `Exzellente Qualität (${score}%)`,
      qualityLevel: 'high'
    };
  } else if (score >= 70) {
    return {
      isQualityMet: false,
      qualityLabel: "⚠️ Qualität knapp nicht erfüllt", 
      qualityDescription: `Gute Basis, aber unter Buffett-Standard (${score}% < 85%)`,
      qualityLevel: 'medium'
    };
  } else {
    return {
      isQualityMet: false,
      qualityLabel: "❌ Qualität nicht erfüllt",
      qualityDescription: `Unzureichende Qualität (${score}% < 70%)`,
      qualityLevel: 'low'
    };
  }
};

// Generate dynamic summary based on specific criteria
const generateDynamicSummary = (
  qualityAssessment: ReturnType<typeof getQualityAssessment>,
  marginOfSafetyValue?: number,
  strengths?: string[],
  weaknesses?: string[]
): string => {
  const score = qualityAssessment.qualityLevel;
  const priceStatus = (marginOfSafetyValue || 0) >= 0 ? 'günstig' : 'überbewertet';
  
  // Focus on the most impactful factors
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
  buffettScore?: number,
  marginOfSafetyValue?: number
): { 
  isBuffettConform: boolean;
  rating: Rating; 
  reasoning: string;
  qualityMet: boolean;
  priceMet: boolean;
  qualityAssessment: ReturnType<typeof getQualityAssessment>;
} => {
  const qualityAssessment = getQualityAssessment(buffettScore);
  const qualityMet = qualityAssessment.isQualityMet;
  const priceMet = (marginOfSafetyValue || 0) >= 0;
  const isBuffettConform = qualityMet && priceMet;
  
  if (isBuffettConform) {
    return { 
      isBuffettConform: true,
      rating: 'buy', 
      reasoning: 'Beide Buffett-Säulen erfüllt',
      qualityMet,
      priceMet,
      qualityAssessment
    };
  }
  
  if (qualityMet && !priceMet) {
    return { 
      isBuffettConform: false,
      rating: 'watch', 
      reasoning: 'Hohe Qualität, aber überbewertet',
      qualityMet,
      priceMet,
      qualityAssessment
    };
  }
  
  if (!qualityMet && priceMet) {
    return { 
      isBuffettConform: false,
      rating: 'avoid', 
      reasoning: qualityAssessment.qualityDescription + ', aber günstiger Preis',
      qualityMet,
      priceMet,
      qualityAssessment
    };
  }
  
  return { 
    isBuffettConform: false,
    rating: 'avoid', 
    reasoning: qualityAssessment.qualityDescription + ' und überbewertet',
    qualityMet,
    priceMet,
    qualityAssessment
  };
};

const RatingIcon: React.FC<{ isBuffettConform: boolean; rating: Rating }> = ({ isBuffettConform, rating }) => {
  if (isBuffettConform) {
    return <CheckCircle size={32} className="text-green-600" />;
  }
  
  switch (rating) {
    case 'watch':
      return <AlertTriangle size={32} className="text-orange-500" />;
    case 'avoid':
      return <XCircle size={32} className="text-red-500" />;
    default:
      return <CheckCircle size={32} className="text-green-600" />;
  }
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
    originalCurrency,
    originalPrice,
    originalIntrinsicValue,
    originalBestBuyPrice
  } = rating;
  
  const hasMissingPriceData = currentPrice === null || 
                             currentPrice === undefined || 
                             bestBuyPrice === null || 
                             bestBuyPrice === undefined || 
                             intrinsicValue === null || 
                             intrinsicValue === undefined;
  
  if (hasMissingPriceData) {
    console.warn("Fehlende Preisinformationen für Wertanalyse:", 
      { currentPrice, bestBuyPrice, intrinsicValue });
  }
  
  // Calculate margin of safety if needed
  if (!marginOfSafety && intrinsicValue !== null && intrinsicValue !== undefined && 
      currentPrice !== null && currentPrice !== undefined) {
    const mosValue = ((intrinsicValue - currentPrice) / currentPrice) * 100;
    marginOfSafety = {
      value: mosValue,
      status: interpretMarginOfSafety(mosValue)
    };
  } else if (marginOfSafety) {
    marginOfSafety.status = interpretMarginOfSafety(marginOfSafety.value);
  }
  
  const buffettAnalysis = determineBuffettConformity(buffettScore, marginOfSafety?.value);
  const dynamicSummary = generateDynamicSummary(buffettAnalysis.qualityAssessment, marginOfSafety?.value, strengths, weaknesses);
  
  return (
    <div className="buffett-card animate-fade-in">
      {hasMissingPriceData && (
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
      
      {/* Main Two-Pillars Section - Clean and Central */}
      <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
        <div className="flex items-start gap-4 mb-4">
          <RatingIcon rating={buffettAnalysis.rating} isBuffettConform={buffettAnalysis.isBuffettConform} />
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">
              {buffettAnalysis.isBuffettConform ? "✅ Buffett-konform" : "Warren Buffetts Zwei-Säulen-Prinzip"}
            </h3>
            <p className="text-gray-700 mb-4">{dynamicSummary}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className={`p-4 rounded-lg border-2 ${buffettAnalysis.qualityMet ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="font-semibold mb-2">
              {buffettAnalysis.qualityMet ? '✅' : '❌'} 1. Qualität (das Unternehmen)
            </div>
            <div className="text-gray-600 mb-1">
              {buffettAnalysis.qualityAssessment.qualityDescription}
            </div>
            <div className="text-xs text-gray-500">
              Standard: ≥ 85% für "Qualität erfüllt"
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border-2 ${buffettAnalysis.priceMet ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="font-semibold mb-2">
              {buffettAnalysis.priceMet ? '✅' : '❌'} 2. Preis (die Bewertung)
            </div>
            <div className="text-gray-600 mb-1">
              Sicherheitsmarge: {marginOfSafety?.value.toFixed(1)}% 
              {buffettAnalysis.priceMet ? ' (≥ 0% erfüllt)' : ' (< 0%, überbewertet)'}
            </div>
            <div className="text-xs text-gray-500">
              Standard: Positive Sicherheitsmarge
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs text-gray-600 italic text-center">
            "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price." - Warren Buffett
          </p>
        </div>
      </div>
      
      {/* Valuation Metrics */}
      <BuffettValuationMetrics
        marginOfSafety={marginOfSafety}
        bestBuyPrice={bestBuyPrice}
        currentPrice={currentPrice}
        currency={currency}
        intrinsicValue={intrinsicValue}
        targetMarginOfSafety={targetMarginOfSafety}
        originalCurrency={originalCurrency}
        originalPrice={originalPrice}
        originalIntrinsicValue={originalIntrinsicValue}
        originalBestBuyPrice={originalBestBuyPrice}
      />
      
      {/* Detailed Analysis - Cleaner Layout */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="font-semibold mb-4 text-lg">Detailanalyse</h3>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              Stärken
            </h4>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
              <XCircle size={16} className="text-red-600" />
              Schwächen
            </h4>
            <ul className="space-y-2">
              {weaknesses.map((weakness, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  {weakness}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <BarChart3 size={16} className="text-blue-600" />
            <span className="font-medium">Fazit:</span>
            <span className="text-gray-700">{buffettAnalysis.reasoning}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallRating;
