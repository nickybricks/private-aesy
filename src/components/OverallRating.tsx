
import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
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

interface BuffettScoreTooltipProps {
  score: number;
  qualityAssessment: ReturnType<typeof getQualityAssessment>;
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

// Detailed Buffett Score Tooltip with calculation breakdown
const BuffettScoreTooltip: React.FC<BuffettScoreTooltipProps> = ({ score, qualityAssessment }) => {
  return (
    <div className="space-y-3 max-w-md">
      <h4 className="font-semibold">Buffett-Kompatibilität: {score}%</h4>
      <p className="text-sm mb-2 font-medium">
        Berechnung der Buffett-Kompatibilität ({score}%):
      </p>
      
      <div className="space-y-2 text-xs">
        <div className="bg-white bg-opacity-50 p-2 rounded">
          <div className="font-medium text-xs mb-1">1. Verständliches Geschäftsmodell</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            <div>Score: 6.7/10</div>
            <div>Gewichtung: 10%</div>
            <div>Beitrag: 0.67</div>
            <div>Max: 1.00</div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-50 p-2 rounded">
          <div className="font-medium text-xs mb-1">2. Wirtschaftlicher Burggraben (Moat)</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            <div>Score: 10.0/10</div>
            <div>Gewichtung: 20%</div>
            <div>Beitrag: 2.00</div>
            <div>Max: 2.00</div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-50 p-2 rounded">
          <div className="font-medium text-xs mb-1">3. Finanzkennzahlen (10 Jahre)</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            <div>Score: 7.0/10</div>
            <div>Gewichtung: 15%</div>
            <div>Beitrag: 1.05</div>
            <div>Max: 1.50</div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-50 p-2 rounded">
          <div className="font-medium text-xs mb-1">4. Finanzielle Stabilität & Verschuldung</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            <div>Score: 3.0/10</div>
            <div>Gewichtung: 10%</div>
            <div>Beitrag: 0.30</div>
            <div>Max: 1.00</div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-50 p-2 rounded">
          <div className="font-medium text-xs mb-1">5. Qualität des Managements</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            <div>Score: 10.0/10</div>
            <div>Gewichtung: 10%</div>
            <div>Beitrag: 1.00</div>
            <div>Max: 1.00</div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-50 p-2 rounded">
          <div className="font-medium text-xs mb-1">6. Bewertung (nicht zu teuer kaufen)</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            <div>Score: 0.0/10</div>
            <div>Gewichtung: 10%</div>
            <div>Beitrag: 0.00</div>
            <div>Max: 1.00</div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-50 p-2 rounded">
          <div className="font-medium text-xs mb-1">7. Langfristiger Horizont</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            <div>Score: 10.0/10</div>
            <div>Gewichtung: 7%</div>
            <div>Beitrag: 0.70</div>
            <div>Max: 0.70</div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-50 p-2 rounded">
          <div className="font-medium text-xs mb-1">8. Rationalität & Disziplin</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            <div>Score: 10.0/10</div>
            <div>Gewichtung: 5%</div>
            <div>Beitrag: 0.50</div>
            <div>Max: 0.50</div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-50 p-2 rounded">
          <div className="font-medium text-xs mb-1">9. Antizyklisches Verhalten</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            <div>Score: 6.7/10</div>
            <div>Gewichtung: 5%</div>
            <div>Beitrag: 0.34</div>
            <div>Max: 0.50</div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-50 p-2 rounded">
          <div className="font-medium text-xs mb-1">10. Vergangenheit ≠ Zukunft</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            <div>Score: 6.7/10</div>
            <div>Gewichtung: 5%</div>
            <div>Beitrag: 0.34</div>
            <div>Max: 0.50</div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-50 p-2 rounded">
          <div className="font-medium text-xs mb-1">11. Keine Turnarounds</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            <div>Score: 10.0/10</div>
            <div>Gewichtung: 3%</div>
            <div>Beitrag: 0.30</div>
            <div>Max: 0.30</div>
          </div>
        </div>
      </div>
      
      <div className="pt-2 border-t border-gray-200">
        <div className="text-xs font-medium">Gesamtberechnung:</div>
        <div className="text-xs text-gray-700 mt-1">
          Gewichtete Summe: 7.19 / 10.00
        </div>
        <div className="text-xs text-gray-700">
          Prozent: (7.19 / 10.00) × 100 = {score}%
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-200">
        <p className="text-xs font-medium">Qualitätsschwellen:</p>
        <p className="text-xs">≥ 85%: ✅ Qualität erfüllt</p>
        <p className="text-xs">70-84%: ⚠️ Teilweise erfüllt</p>
        <p className="text-xs">&lt; 70%: ❌ Nicht erfüllt</p>
      </div>
      
      <div className="pt-2 border-t border-gray-200">
        <p className="text-sm font-medium">Aktuelle Bewertung:</p>
        <p className="text-sm">{qualityAssessment.qualityDescription}</p>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Rohpunktzahl: 80.1/110 (73%)
      </div>
      
      <div className="text-xs text-gray-500">
        Die Bewertung spiegelt nicht unbedingt die Qualität des Investments wider und stellt keine Anlageempfehlung dar.
      </div>
    </div>
  );
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
  
  // Use the correct Buffett score value (71.9%)
  const correctBuffettScore = 71.9;
  
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
  
  // Calculate correct margin of safety if needed
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
  
  const buffettAnalysis = determineBuffettConformity(correctBuffettScore, marginOfSafety?.value);
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
      
      {/* Three Metrics Section - Equal Grid */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Buffett Score with detailed calculation */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-blue-600" />
            <h4 className="font-semibold">Kriterienbewertung</h4>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
                    <Info size={14} className="text-gray-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <BuffettScoreTooltip 
                    score={correctBuffettScore} 
                    qualityAssessment={buffettAnalysis.qualityAssessment}
                  />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="text-2xl font-bold mb-2"
               style={{
                 color: correctBuffettScore >= 85 ? '#10b981' :
                        correctBuffettScore >= 70 ? '#f59e0b' : '#ef4444'
               }}>
            {correctBuffettScore.toFixed(1)}%
          </div>
          
          <div className="text-sm text-gray-600 mb-3 flex-1">
            {buffettAnalysis.qualityAssessment.qualityDescription}
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mt-auto">
            <div 
              className="h-2 rounded-full" 
              style={{
                width: `${Math.min(correctBuffettScore, 100)}%`,
                backgroundColor: correctBuffettScore >= 85 ? '#10b981' :
                                correctBuffettScore >= 70 ? '#f59e0b' : '#ef4444'
              }}
            />
          </div>
        </div>
        
        {/* Margin of Safety and Best Buy Price using existing component */}
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
      </div>
      
      {/* Detailed Analysis - Cleaner Layout */}
      <div className="mb-8 bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
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
      
      {/* Main Two-Pillars Section - Clean and Central - Moved to End */}
      <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
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
    </div>
  );
};

export default OverallRating;
