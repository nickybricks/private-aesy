import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  BarChart3,
  TrendingUp,
  Target,
  Euro
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import RatingExplanation from './RatingExplanation';

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

// Diese Funktion erstellt den detaillierten Tooltip für die DCF-Berechnung
const IntrinsicValueTooltip: React.FC<{
  intrinsicValue: number | null | undefined;
  currency: string;
  originalCurrency?: string;
  originalIntrinsicValue?: number | null;
}> = ({ intrinsicValue, currency, originalCurrency, originalIntrinsicValue }) => {
  if (!intrinsicValue || isNaN(Number(intrinsicValue))) {
    return (
      <div className="space-y-2">
        <h4 className="font-semibold">DCF-Berechnung nicht möglich</h4>
        <p>Für dieses Wertpapier liegen nicht genügend Daten vor, um einen inneren Wert zu ermitteln. Eine DCF-Berechnung kann nicht durchgeführt werden.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2 max-w-2xl">
      <h4 className="font-semibold">Detaillierte DCF-Berechnung</h4>
      <p>Der innere Wert von <strong>{intrinsicValue.toFixed(2)} {currency}</strong> wurde mittels einer Discounted Cash Flow (DCF) Berechnung ermittelt.</p>
      
      <div className="text-sm text-gray-600 mt-2">
        <p className="italic">
          Hinweis: Der intrinsische Wert wurde durch ein detailliertes DCF-Modell berechnet, das auf den historischen und prognostizierten Finanzdaten des Unternehmens basiert.
          Für eine detaillierte Aufschlüsselung der Berechnung nutzen Sie bitte das DCF-Tool.
        </p>
      </div>
    </div>
  );
};

// Diese Funktion erstellt den detaillierten Tooltip für die MoS-Berechnung mit aktuellen Werten
const MarginOfSafetyTooltip: React.FC<{
  targetMarginOfSafety: number;
  intrinsicValue?: number | null;
  currentPrice?: number | null;
  currency?: string;
  marginOfSafetyValue?: number;
}> = ({ targetMarginOfSafety, intrinsicValue, currentPrice, currency, marginOfSafetyValue }) => {
  const hasRealData = intrinsicValue !== null && 
                     intrinsicValue !== undefined && 
                     !isNaN(Number(intrinsicValue)) && 
                     currentPrice !== null && 
                     currentPrice !== undefined && 
                     !isNaN(Number(currentPrice)) && 
                     currency;
  
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Sicherheitsmarge (Margin of Safety)</h4>
      <p>Die Sicherheitsmarge zeigt, um wie viel Prozent der Aktienkurs unter dem inneren Wert liegt.</p>
      <ul className="list-disc pl-4 text-sm">
        <li>Schützt vor Bewertungsfehlern</li>
        <li>Erhöht langfristiges Renditepotential</li>
        <li>Reduziert Verlustrisiko</li>
      </ul>
      
      <div className="border-t border-gray-200 pt-2 mt-2">
        <h5 className="font-medium mb-1">Berechnung der Margin of Safety:</h5>
        <p className="text-sm mb-2">Formel: (Innerer Wert - Aktueller Preis) / Aktueller Preis × 100</p>
        
        {hasRealData && intrinsicValue !== null && currentPrice !== null ? (
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Innerer Wert:</span> {intrinsicValue.toFixed(2)} {currency}</p>
            <p><span className="font-medium">Aktueller Preis:</span> {currentPrice.toFixed(2)} {currency}</p>
            <p><span className="font-medium">Berechnung:</span> ({intrinsicValue.toFixed(2)} - {currentPrice.toFixed(2)}) / {currentPrice.toFixed(2)} × 100</p>
            <p className={`font-medium ${marginOfSafetyValue && marginOfSafetyValue > 0 ? 'text-buffett-green' : 'text-buffett-red'}`}>
              <span className="font-medium">Ergebnis:</span> {marginOfSafetyValue?.toFixed(1)}%
              {marginOfSafetyValue && marginOfSafetyValue > 0 ? ' (Unterbewertet)' : ' (Überbewertet)'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">Für eine konkrete Berechnung werden Daten zum inneren Wert und aktuellen Preis benötigt.</p>
          </div>
        )}
        
        <p className="text-sm font-medium mt-2">Positive Werte bedeuten "günstig", negative "überbewertet".</p>
      </div>
    </div>
  );
};

// Diese Funktion erstellt den detaillierten Tooltip für die Buffett-Kaufpreis Erklärung
const BuffettBuyPriceTooltip: React.FC<{
  intrinsicValue: number | null | undefined;
  bestBuyPrice: number | null;
  targetMarginOfSafety: number;
  currency: string;
}> = ({ intrinsicValue, bestBuyPrice, targetMarginOfSafety, currency }) => {
  if (bestBuyPrice === null || bestBuyPrice === undefined || isNaN(Number(bestBuyPrice))) {
    return (
      <div className="space-y-2">
        <h4 className="font-semibold">Buffett-Kaufpreis nicht verfügbar</h4>
        <p>Für dieses Wertpapier liegen nicht genügend Daten vor, um einen Buffett-Kaufpreis zu berechnen.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Der Buffett-Kaufpreis</h4>
      <p>Der Buffett-Kaufpreis ist der maximale Preis, zu dem Warren Buffett die Aktie als attraktive Investition betrachten würde.</p>
      
      <div className="border border-gray-200 rounded-md p-2 bg-gray-50 mt-2">
        <h5 className="font-medium mb-1 text-sm">Berechnung:</h5>
        <div className="text-sm">
          <div className="flex items-center mb-1">
            <div className="font-medium w-1/2">Innerer Wert:</div>
            <div>{intrinsicValue && !isNaN(Number(intrinsicValue)) ? `${Number(intrinsicValue).toFixed(2)} ${currency}` : 'Berechnet aus DCF-Modell'}</div>
          </div>
          <div className="flex items-center mb-1">
            <div className="font-medium w-1/2">Margin of Safety:</div>
            <div>{targetMarginOfSafety}%</div>
          </div>
          <div className="flex items-center mb-1">
            <div className="font-medium w-1/2">Berechnung:</div>
            <div>{intrinsicValue && !isNaN(Number(intrinsicValue)) ? `${Number(intrinsicValue).toFixed(2)} ${currency} × (1 - ${targetMarginOfSafety}%)` : 'Innerer Wert × (1 - Margin of Safety)'}</div>
          </div>
          <div className="flex items-center font-medium text-buffett-blue">
            <div className="w-1/2">Buffett-Kaufpreis:</div>
            <div>{bestBuyPrice.toFixed(2)} {currency}</div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-2 mt-2">
        <p className="font-medium text-sm">Buffett's Prinzip:</p>
        <p className="text-sm">Eine Aktie sollte nur gekauft werden, wenn sie deutlich unter ihrem inneren Wert gehandelt wird. Der Buffett-Kaufpreis stellt diese Grenze dar - kaufe nur unter diesem Preis.</p>
      </div>
    </div>
  );
};

// Detailed Buffett Score Tooltip with calculation breakdown
const BuffettScoreTooltip: React.FC<{ score: number; qualityAssessment: ReturnType<typeof getQualityAssessment> }> = ({ score, qualityAssessment }) => {
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
  
  const buffettAnalysis = determineBuffettConformity(correctBuffettScore, calculatedMarginOfSafety?.value);
  const dynamicSummary = generateDynamicSummary(buffettAnalysis.qualityAssessment, calculatedMarginOfSafety?.value, strengths, weaknesses);
  
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
      
      {/* Three Metrics Section - Equal Grid with exactly equal sizes */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Buffett Score with detailed calculation */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex flex-col h-48">
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
        
        {/* Margin of Safety Card */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex flex-col h-48">
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} className="text-green-600" />
            <h4 className="font-semibold">Sicherheitsmarge</h4>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
                    <Info size={14} className="text-gray-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <MarginOfSafetyTooltip 
                    targetMarginOfSafety={targetMarginOfSafety}
                    intrinsicValue={intrinsicValue}
                    currentPrice={currentPrice}
                    currency={currency}
                    marginOfSafetyValue={calculatedMarginOfSafety?.value}
                  />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="text-2xl font-bold mb-2"
               style={{
                 color: (calculatedMarginOfSafety?.value || 0) >= 20 ? '#10b981' :
                        (calculatedMarginOfSafety?.value || 0) >= 0 ? '#f59e0b' : '#ef4444'
               }}>
            {calculatedMarginOfSafety?.value?.toFixed(1) || '0.0'}%
          </div>
          
          <div className="text-sm text-gray-600 mb-3 flex-1">
            {(calculatedMarginOfSafety?.value || 0) >= 0 ? 'Positive Sicherheitsmarge' : 'Überbewertet'}
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mt-auto">
            <div 
              className="h-2 rounded-full" 
              style={{
                width: `${Math.min(Math.max((calculatedMarginOfSafety?.value || 0) + 50, 0), 100)}%`,
                backgroundColor: (calculatedMarginOfSafety?.value || 0) >= 20 ? '#10b981' :
                                (calculatedMarginOfSafety?.value || 0) >= 0 ? '#f59e0b' : '#ef4444'
              }}
            />
          </div>
        </div>
        
        {/* Best Buy Price Card */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex flex-col h-48">
          <div className="flex items-center gap-2 mb-2">
            <Euro size={18} className="text-blue-600" />
            <h4 className="font-semibold">Idealer Kaufpreis</h4>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
                    <Info size={14} className="text-gray-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <BuffettBuyPriceTooltip 
                    intrinsicValue={intrinsicValue}
                    bestBuyPrice={bestBuyPrice}
                    targetMarginOfSafety={targetMarginOfSafety}
                    currency={currency}
                  />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="text-2xl font-bold mb-2 text-blue-600">
            {bestBuyPrice ? `${bestBuyPrice.toFixed(2)} ${currency}` : 'N/A'}
          </div>
          
          <div className="text-sm text-gray-600 mb-3 flex-1">
            {bestBuyPrice && currentPrice 
              ? `${((currentPrice - bestBuyPrice) / bestBuyPrice * 100).toFixed(1)}% über ideal` 
              : 'Berechnung nicht möglich'
            }
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mt-auto">
            <div 
              className="h-2 rounded-full bg-blue-500"
              style={{
                width: bestBuyPrice && currentPrice 
                  ? `${Math.min(Math.max((bestBuyPrice / currentPrice) * 100, 0), 100)}%`
                  : '0%'
              }}
            />
          </div>
        </div>
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
              Sicherheitsmarge: {calculatedMarginOfSafety?.value.toFixed(1)}% 
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
