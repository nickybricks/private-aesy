
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
    // Optional fields for additional metrics
    buffettScore?: number;
    marginOfSafety?: {
      value: number;
      status: 'pass' | 'warning' | 'fail';
    };
    bestBuyPrice?: number | null;
    // New fields for price analysis
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

// Utility function to determine Buffett conformity based on both quality and price
const determineBuffettConformity = (
  buffettScore?: number,
  marginOfSafetyValue?: number
): { 
  isBuffettConform: boolean;
  rating: Rating; 
  reasoning: string;
  qualityMet: boolean;
  priceMet: boolean;
} => {
  const score = buffettScore || 0;
  const mos = marginOfSafetyValue || 0;
  
  // Buffett's two pillars
  const qualityMet = score >= 80; // High quality threshold
  const priceMet = mos >= 0; // Positive margin of safety
  
  // True Buffett conformity requires BOTH pillars
  const isBuffettConform = qualityMet && priceMet;
  
  if (isBuffettConform) {
    return { 
      isBuffettConform: true,
      rating: 'buy', 
      reasoning: 'Erfüllt beide Buffett-Säulen: Hohe Qualität UND attraktiver Preis',
      qualityMet,
      priceMet
    };
  }
  
  // Only one pillar fulfilled
  if (qualityMet && !priceMet) {
    return { 
      isBuffettConform: false,
      rating: 'watch', 
      reasoning: 'Hohe Qualität, aber überbewertet - warten auf besseren Preis',
      qualityMet,
      priceMet
    };
  }
  
  if (!qualityMet && priceMet) {
    return { 
      isBuffettConform: false,
      rating: 'avoid', 
      reasoning: 'Günstig, aber unzureichende Qualität - nicht Buffett-konform',
      qualityMet,
      priceMet
    };
  }
  
  // Neither pillar fulfilled
  return { 
    isBuffettConform: false,
    rating: 'avoid', 
    reasoning: 'Weder Qualitäts- noch Preisanforderungen erfüllt',
    qualityMet,
    priceMet
  };
};

// Function to interpret MoS status properly based on Buffett's standard
const interpretMarginOfSafety = (value: number): 'pass' | 'warning' | 'fail' => {
  if (value > 30) return 'pass'; // Strongly undervalued
  if (value >= 10) return 'warning'; // Slightly undervalued
  if (value >= 0) return 'warning'; // Fair value (borderline)
  return 'fail'; // Overvalued
};

const RatingIcon: React.FC<{ isBuffettConform: boolean; rating: Rating }> = ({ isBuffettConform, rating }) => {
  if (isBuffettConform) {
    return <CheckCircle size={40} className="text-buffett-green" />;
  }
  
  switch (rating) {
    case 'buy':
      return <CheckCircle size={40} className="text-buffett-green" />;
    case 'watch':
      return <AlertTriangle size={40} className="text-buffett-yellow" />;
    case 'avoid':
      return <XCircle size={40} className="text-buffett-red" />;
    default:
      return null;
  }
};

const OverallRating: React.FC<OverallRatingProps> = ({ rating }) => {
  if (!rating) return null;
  
  let { 
    overall, 
    summary, 
    strengths, 
    weaknesses, 
    recommendation, 
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
  
  // Überprüfe auf fehlende Daten
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
  
  // Calculate margin of safety if it's not provided but we have the necessary values
  if (!marginOfSafety && intrinsicValue !== null && intrinsicValue !== undefined && 
      currentPrice !== null && currentPrice !== undefined) {
    const mosValue = ((intrinsicValue - currentPrice) / currentPrice) * 100;
    marginOfSafety = {
      value: mosValue,
      status: interpretMarginOfSafety(mosValue)
    };
    console.log(`Calculated marginOfSafety: ${mosValue.toFixed(2)}% from intrinsicValue: ${intrinsicValue} and currentPrice: ${currentPrice}`);
  } else if (marginOfSafety && marginOfSafety.value === 0 && 
            intrinsicValue !== null && intrinsicValue !== undefined && 
            currentPrice !== null && currentPrice !== undefined) {
    const mosValue = ((intrinsicValue - currentPrice) / currentPrice) * 100;
    marginOfSafety.value = mosValue;
    marginOfSafety.status = interpretMarginOfSafety(mosValue);
    console.log(`Updated marginOfSafety from 0 to: ${mosValue.toFixed(2)}%`);
  }
  
  // Override the marginOfSafety status based on the actual value if marginOfSafety exists
  if (marginOfSafety) {
    marginOfSafety.status = interpretMarginOfSafety(marginOfSafety.value);
  }
  
  // Determine true Buffett conformity based on both pillars
  const buffettAnalysis = determineBuffettConformity(buffettScore, marginOfSafety?.value);
  
  // Update overall rating based on Buffett analysis
  overall = buffettAnalysis.rating;
  
  // Update summary and recommendation based on Buffett conformity
  if (buffettAnalysis.isBuffettConform) {
    summary = "✅ Buffett-konform - beide Säulen erfüllt";
    recommendation = `Diese Investition erfüllt beide Buffett-Säulen: Hohe Qualität (${buffettScore}%) und attraktiver Preis (Sicherheitsmarge: ${marginOfSafety?.value.toFixed(1)}%). "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price." - Warren Buffett`;
  } else {
    summary = buffettAnalysis.reasoning;
    
    if (buffettAnalysis.qualityMet && !buffettAnalysis.priceMet) {
      recommendation = `Hohe Qualität (${buffettScore}%), aber überbewertet. "Price is what you pay, value is what you get." - Buffett würde bei diesem Preis nicht kaufen. Warten auf Sicherheitsmarge ≥ 0%.`;
    } else if (!buffettAnalysis.qualityMet && buffettAnalysis.priceMet) {
      recommendation = `Günstiger Preis, aber unzureichende Qualität (${buffettScore}%). Buffett kauft keine Turnarounds oder Unternehmen ohne starken Moat. Qualität muss ≥ 80% erreichen.`;
    } else {
      recommendation = `Weder Qualitäts- (${buffettScore}%) noch Preisanforderungen erfüllt. Beide Buffett-Säulen müssen für eine Investition gegeben sein.`;
    }
  }
  
  const ratingTitle = buffettAnalysis.isBuffettConform 
    ? "✅ Buffett-konform" 
    : {
        buy: 'Hohe Übereinstimmung',
        watch: 'Mittlere Übereinstimmung', 
        avoid: 'Niedrige Übereinstimmung'
      }[overall];
  
  const ratingColor = buffettAnalysis.isBuffettConform
    ? 'bg-green-50 border-green-300'
    : {
        buy: 'bg-buffett-green bg-opacity-10 border-buffett-green',
        watch: 'bg-buffett-yellow bg-opacity-10 border-buffett-yellow',
        avoid: 'bg-buffett-red bg-opacity-10 border-buffett-red'
      }[overall];

  const decisionFactor = buffettAnalysis.isBuffettConform
    ? 'Beide Buffett-Säulen erfüllt: Qualität + Preis'
    : buffettAnalysis.qualityMet && !buffettAnalysis.priceMet
    ? 'Qualität vorhanden, aber Preis zu hoch'
    : !buffettAnalysis.qualityMet && buffettAnalysis.priceMet
    ? 'Preis attraktiv, aber Qualität unzureichend'
    : 'Beide Buffett-Säulen nicht erfüllt';
  
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
        <RatingExplanation rating={overall} />
      </h2>
      
      {/* Buffett Two Pillars Explanation */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">🏛️ Warren Buffetts Zwei-Säulen-Prinzip</h3>
        <p className="text-sm text-gray-700 mb-3">
          Eine Investitionsentscheidung im Sinne von Warren Buffett braucht immer beide Säulen:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className={`p-3 rounded border-2 ${buffettAnalysis.qualityMet ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="font-medium mb-1">
              {buffettAnalysis.qualityMet ? '✅' : '❌'} 1. Qualität (das Unternehmen)
            </div>
            <div className="text-xs text-gray-600">
              Buffett-Score: {buffettScore}% {buffettAnalysis.qualityMet ? '(≥ 80% erfüllt)' : '(< 80%, nicht erfüllt)'}
            </div>
          </div>
          <div className={`p-3 rounded border-2 ${buffettAnalysis.priceMet ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="font-medium mb-1">
              {buffettAnalysis.priceMet ? '✅' : '❌'} 2. Preis (die Bewertung)
            </div>
            <div className="text-xs text-gray-600">
              Sicherheitsmarge: {marginOfSafety?.value.toFixed(1)}% {buffettAnalysis.priceMet ? '(≥ 0% erfüllt)' : '(< 0%, nicht erfüllt)'}
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-600 italic">
          "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price." - Warren Buffett
        </div>
      </div>
      
      <div className={`rounded-xl p-6 border ${ratingColor} mb-6`}>
        <div className="flex items-center gap-4">
          <RatingIcon rating={overall} isBuffettConform={buffettAnalysis.isBuffettConform} />
          <div className="flex-1">
            <h3 className="text-xl font-bold">{ratingTitle}</h3>
            <p className="text-buffett-subtext">{summary}</p>
          </div>
        </div>
      </div>
      
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
      
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-6">
        <h3 className="font-semibold mb-1">Zusammenfassung</h3>
        <p className="text-buffett-subtext mb-4">{recommendation}</p>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="font-semibold text-buffett-green mb-2 flex items-center gap-2">
              <CheckCircle size={16} className="text-buffett-green" />
              Stärken
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              {strengths.map((strength, index) => (
                <li key={index} className="text-sm text-gray-700">{strength}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-buffett-red mb-2 flex items-center gap-2">
              <XCircle size={16} className="text-buffett-red" />
              Schwächen
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              {weaknesses.map((weakness, index) => (
                <li key={index} className="text-sm text-gray-700">{weakness}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-buffett-blue" />
            <span className="font-medium">Entscheidender Faktor:</span>
            <span>{decisionFactor}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallRating;
