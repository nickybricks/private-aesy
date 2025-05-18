import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  BarChart3,
  TrendingDown,
  Eye,
  DollarSign,
  Calculator,
  HelpCircle,
  Info,
  PieChart
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DCFExplanationTooltip } from './DCFExplanationTooltip';
import { DCFData } from '@/context/StockContextTypes';
import RatingExplanation from './RatingExplanation';
import ScoreBreakdownTooltip from './ScoreBreakdownTooltip';
import { BuffettScoreChart } from './BuffettScoreChart';
import MarginOfSafetyExplanation from './MarginOfSafetyExplanation';

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
    dcfData?: DCFData; // Include dcfData for calculations
  } | null;
}

// Utility function to determine the correct rating based on Buffett score and MoS
const determineRating = (
  buffettScore?: number,
  marginOfSafetyValue?: number
): { rating: Rating; reasoning: string } => {
  const score = buffettScore || 0;
  const mos = marginOfSafetyValue || 0;

  if (score >= 75) {
    if (mos > 20) {
      return { rating: 'buy', reasoning: 'Hohe Qualität und stark unterbewertet' };
    } else if (mos >= 0) {
      return { rating: 'watch', reasoning: 'Hohe Qualität, aber fair oder nur leicht unterbewertet' };
    } else {
      return { rating: 'avoid', reasoning: 'Hohe Qualität, aber aktuell zu teuer' };
    }
  } else if (score >= 60) {
    if (mos > 10) {
      return { rating: 'watch', reasoning: 'Mittlere Qualität, nur mit Vorsicht kaufen' };
    } else {
      return { rating: 'avoid', reasoning: 'Mittlere Qualität, nicht ausreichend unterbewertet' };
    }
  } else {
    return { rating: 'avoid', reasoning: 'Schwache Übereinstimmung mit Buffetts Kriterien' };
  }
};

// Function to interpret MoS status properly
const interpretMarginOfSafety = (value: number): 'pass' | 'warning' | 'fail' => {
  if (value > 30) return 'pass';
  if (value >= 10) return 'warning';
  if (value >= 0) return 'warning';
  return 'fail';
};

// Function to get MoS description based on value
const getMarginOfSafetyDescription = (value: number): string => {
  if (value > 30) return 'Signifikante Sicherheitsmarge (stark unterbewertet)';
  if (value >= 10) return 'Moderate Sicherheitsmarge (leicht unterbewertet)';
  if (value >= 0) return 'Minimale Sicherheitsmarge (fair bewertet)';
  return 'Keine Sicherheitsmarge (überbewertet)';
};

const RatingIcon: React.FC<{ rating: Rating }> = ({ rating }) => {
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

const MarginOfSafetyTooltip: React.FC<{
  targetMarginOfSafety: number;
  intrinsicValue?: number | null;
  currentPrice?: number | null;
  currency?: string;
}> = ({ targetMarginOfSafety, intrinsicValue, currentPrice, currency }) => {
  const hasRealData = intrinsicValue !== null && 
                     intrinsicValue !== undefined && 
                     !isNaN(Number(intrinsicValue)) && 
                     currentPrice !== null && 
                     currentPrice !== undefined && 
                     !isNaN(Number(currentPrice)) && 
                     currency;

  const actualMarginValue = hasRealData && intrinsicValue 
    ? intrinsicValue * (targetMarginOfSafety / 100) 
    : 20;

  const safePrice = hasRealData && intrinsicValue 
    ? intrinsicValue - (actualMarginValue as number) 
    : 80;

  const actualMargin = hasRealData && intrinsicValue && currentPrice 
    ? ((intrinsicValue - currentPrice) / intrinsicValue) * 100 
    : -25;

  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Was ist die "Margin of Safety"?</h4>
      <p>Die Sicherheitsmarge von {targetMarginOfSafety}% stellt einen Puffer zwischen Kaufpreis und innerem Wert dar:</p>
      <ul className="list-disc pl-4">
        <li>Schützt vor Bewertungsfehlern (DCF-Annahmen könnten zu optimistisch sein)</li>
        <li>Ermöglicht höhere Renditen (Kauf mit Abschlag = höheres Wertsteigerungspotenzial)</li>
        <li>Minimiert Verlustrisiko (selbst bei ungünstigeren Entwicklungen)</li>
      </ul>
      <p className="font-medium">Buffett und Graham empfehlen mindestens {targetMarginOfSafety}% Sicherheitsmarge.</p>
      
      <div className="border-t border-gray-200 pt-2 mt-2">
        <h5 className="font-medium mb-1">Berechnung der Margin of Safety:</h5>
        
        {hasRealData && intrinsicValue !== null && currentPrice !== null ? (
          <div className="space-y-1">
            <p><span className="font-medium">Innerer Wert:</span> {intrinsicValue.toFixed(2)} {currency}</p>
            <p><span className="font-medium">Sicherheitsmarge ({targetMarginOfSafety}%):</span> {actualMarginValue.toFixed(2)} {currency}</p>
            <p><span className="font-medium">Idealer Kaufpreis:</span> {safePrice.toFixed(2)} {currency}</p>
            <p><span className="font-medium">Aktueller Preis:</span> {currentPrice.toFixed(2)} {currency}</p>
            <p className={`font-medium ${actualMargin > 0 ? 'text-buffett-green' : 'text-buffett-red'}`}>
              Aktuelle Margin of Safety: {actualMargin.toFixed(1)}%
              {actualMargin > 0 ? ' (Unterbewertet)' : ' (Überbewertet)'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p><span className="font-medium">Beispiel:</span></p>
            <p><span className="font-medium">Innerer Wert:</span> 100 {currency}</p>
            <p><span className="font-medium">Sicherheitsmarge ({targetMarginOfSafety}%):</span> {targetMarginOfSafety} {currency}</p>
            <p><span className="font-medium">Idealer Kaufpreis:</span> {100 - targetMarginOfSafety} {currency}</p>
          </div>
        )}
      </div>
    </div>
  );
};

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
    originalBestBuyPrice,
    dcfData
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
  
  if (marginOfSafety) {
    marginOfSafety.status = interpretMarginOfSafety(marginOfSafety.value);
  }
  
  if (buffettScore !== undefined && marginOfSafety !== undefined) {
    const newRatingData = determineRating(buffettScore, marginOfSafety.value);
    overall = newRatingData.rating;
    summary = newRatingData.reasoning;
    
    if (overall === 'buy') {
      recommendation = `Basierend auf der hohen Buffett-Kompatibilität (${buffettScore}%) und der attraktiven Unterbewertung (MoS: ${marginOfSafety.value.toFixed(1)}%) wird ein Kauf empfohlen. Der aktuelle Preis bietet eine ausreichende Sicherheitsmarge zum inneren Wert.`;
    } else if (overall === 'watch') {
      recommendation = `Die Aktie zeigt ${buffettScore >= 75 ? 'sehr gute' : 'solide'} Fundamentaldaten (${buffettScore}%), aber ${marginOfSafety.value >= 0 ? 'bietet nicht genug Sicherheitsmarge' : 'ist zu teuer'}. Es wird empfohlen, die Aktie auf die Beobachtungsliste zu setzen und bei einem günstigeren Kurs erneut zu prüfen.`;
    } else {
      if (buffettScore < 60) {
        recommendation = `Die Aktie erfüllt zu wenige von Buffetts Qualitätskriterien (${buffettScore}%). Unabhängig vom Preis sollte nach Alternativen mit besseren Fundamentaldaten gesucht werden.`;
      } else {
        recommendation = `Trotz ${buffettScore >= 75 ? 'sehr guter' : 'solider'} Fundamentaldaten (${buffettScore}%) ist die Aktie mit einer negativen Sicherheitsmarge von ${Math.abs(marginOfSafety.value).toFixed(1)}% zu teuer. Ein Kauf ist erst bei deutlich niedrigeren Kursen zu empfehlen.`;
      }
    }
  }
  
  const ratingTitle = {
    buy: 'Kaufen',
    watch: 'Beobachten',
    avoid: 'Vermeiden'
  }[overall];
  
  const ratingColor = {
    buy: 'bg-buffett-green bg-opacity-10 border-buffett-green',
    watch: 'bg-buffett-yellow bg-opacity-10 border-buffett-yellow',
    avoid: 'bg-buffett-red bg-opacity-10 border-buffett-red'
  }[overall];

  const priceDifference = (currentPrice !== null && 
                          currentPrice !== undefined && 
                          bestBuyPrice !== null && 
                          bestBuyPrice !== undefined && 
                          !isNaN(Number(currentPrice)) && 
                          !isNaN(Number(bestBuyPrice))) 
    ? currentPrice - bestBuyPrice 
    : undefined;
  
  const priceDifferencePercent = (currentPrice !== null && 
                                 currentPrice !== undefined && 
                                 !isNaN(Number(currentPrice)) && 
                                 bestBuyPrice !== null && 
                                 bestBuyPrice !== undefined && 
                                 !isNaN(Number(bestBuyPrice)) && 
                                 bestBuyPrice > 0)
    ? ((currentPrice - bestBuyPrice) / bestBuyPrice) * 100
    : undefined;

  const decisionFactor = overall === 'avoid' && marginOfSafety && marginOfSafety.value < 0 
    ? 'Preis ist zu hoch für ein Investment' 
    : overall === 'avoid' && buffettScore && buffettScore < 60
    ? 'Zu wenige Buffett-Kriterien erfüllt'
    : overall === 'watch'
    ? 'Fundamentalwerte gut, aber nicht optimal bewertet'
    : 'Preis und Qualität im Einklang';
  
  const explainRatingLogic = () => {
    if (buffettScore === undefined || marginOfSafety === undefined) {
      return null;
    }

    if (buffettScore >= 75 && marginOfSafety.value > 20 && overall === 'buy') {
      return "Hohe Qualität (≥75%) + starke Unterbewertung (>20%) = Kaufempfehlung";
    } else if (buffettScore >= 75 && marginOfSafety.value >= 0 && overall === 'watch') {
      return "Hohe Qualität (≥75%) + faire/leichte Bewertung = Beobachten";
    } else if (buffettScore >= 75 && marginOfSafety.value < 0 && overall === 'avoid') {
      return "Hohe Qualität (≥75%), aber überbewertet (<0%) = Vermeiden";
    } else if (buffettScore >= 60 && buffettScore < 75 && marginOfSafety.value > 10 && overall === 'watch') {
      return "Mittlere Qualität (60-74%) + Unterbewertung (>10%) = Beobachten (vorsichtiger Kauf)";
    } else if (buffettScore < 60 && overall === 'avoid') {
      return "Schwache Qualität (<60%) = Vermeiden (unabhängig vom Preis)";
    }
    
    return "Bewertung basierend auf Buffett-Score und Margin of Safety";
  };
  
  const ratingLogic = explainRatingLogic();
  
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
      
      <div className={`rounded-xl p-6 border ${ratingColor} mb-6`}>
        <div className="flex items-center gap-4">
          <RatingIcon rating={overall} />
          <div className="flex-1">
            <h3 className="text-xl font-bold">{ratingTitle}</h3>
            <p className="text-buffett-subtext">{summary}</p>
            
            {ratingLogic && (
              <div className="mt-2 text-sm p-2 bg-white bg-opacity-50 rounded-md">
                <p className="font-medium">Bewertungslogik:</p>
                <p>{ratingLogic}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {buffettScore !== undefined && (
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <PieChart size={18} className="text-buffett-blue" />
              <h4 className="font-semibold">Buffett-Kompatibilität</h4>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
                      <Info size={14} className="text-gray-500" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <ScoreBreakdownTooltip buffettScore={buffettScore} />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-center justify-center mb-3">
              <BuffettScoreChart score={buffettScore} />
            </div>
            
            <div className="text-sm mt-2 text-gray-600">
              {buffettScore >= 75 ? 'Hohe Übereinstimmung mit Buffetts Kriterien' :
              buffettScore >= 60 ? 'Mittlere Übereinstimmung, weitere Analyse empfohlen' :
              'Geringe Übereinstimmung mit Buffetts Investitionskriterien'}
            </div>
          </div>
        )}
        
        {marginOfSafety !== undefined && (
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={18} className="text-buffett-blue" />
              <h4 className="font-semibold">Margin of Safety</h4>
              
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
                    />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-2xl font-bold mb-2"
                 style={{
                   color: marginOfSafety.value >= 30 ? '#10b981' :
                          marginOfSafety.value >= 10 ? '#f59e0b' :
                          marginOfSafety.value >= 0 ? '#f59e0b' : '#ef4444'
                 }}>
              {marginOfSafety.value.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">
              {getMarginOfSafetyDescription(marginOfSafety.value)}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <MarginOfSafetyExplanation />
                <span className="text-sm font-medium">Buffett-Standard: {targetMarginOfSafety}% Sicherheitsmarge</span>
              </div>
            </div>
          </div>
        )}
        
        {(bestBuyPrice !== undefined && bestBuyPrice !== null) && (
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-buffett-blue" />
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
            
            <div className="flex items-baseline gap-2 mb-1">
              <div className="text-2xl font-bold text-buffett-blue">
                {!isNaN(Number(bestBuyPrice)) ? `${Number(bestBuyPrice).toFixed(2)} ${currency}` : 'N/A'}
              </div>
              {currentPrice !== null && currentPrice !== undefined && !isNaN(Number(currentPrice)) && (
                <div className={`text-sm ${priceDifference && priceDifference < 0 ? 'text-buffett-green' : 'text-buffett-red'}`}>
                  {currentPrice.toFixed(2)} {currency}
                  {priceDifference !== undefined && priceDifferencePercent !== undefined && (
                    <span>
                      {' '}
                      ({priceDifference > 0 ? '+' : ''}{priceDifference.toFixed(2)} {currency} / 
                      {priceDifferencePercent > 0 ? '+' : ''}{priceDifferencePercent.toFixed(1)}%)
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              Maximaler Kaufpreis für attraktives Investment
            </div>
            
            {intrinsicValue !== undefined && intrinsicValue !== null && !isNaN(Number(intrinsicValue)) && (
              <div className="flex items-center mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calculator size={14} className="text-gray-500" />
                  <span className="text-gray-600">Innerer Wert (DCF): {intrinsicValue.toFixed(2)} {currency}</span>
                  
                  <DCFExplanationTooltip dcfData={dcfData} />
                </div>
              </div>
            )}
            
            {originalCurrency && originalCurrency !== currency && originalBestBuyPrice !== null && originalBestBuyPrice !== undefined && (
              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                Ursprünglicher Preis: {originalBestBuyPrice.toFixed(2)} {originalCurrency}
              </div>
            )}
          </div>
        )}
      </div>
      
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
