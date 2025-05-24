
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

// Utility function to determine the correct rating based on Buffett score and MoS
const determineRating = (
  buffettScore?: number,
  marginOfSafetyValue?: number
): { rating: Rating; reasoning: string } => {
  // Default values if not provided
  const score = buffettScore || 0;
  const mos = marginOfSafetyValue || 0;
  
  // High quality (Buffett score ≥75%)
  if (score >= 75) {
    if (mos > 20) {
      return { rating: 'buy', reasoning: 'Hohe Qualität und stark unterbewertet' };
    } else if (mos >= 0) {
      return { rating: 'watch', reasoning: 'Hohe Qualität, aber fair oder nur leicht unterbewertet' };
    } else {
      return { rating: 'avoid', reasoning: 'Hohe Qualität, aber aktuell zu teuer' };
    }
  }
  // Medium quality (Buffett score 60-74%)
  else if (score >= 60) {
    if (mos > 10) {
      return { rating: 'watch', reasoning: 'Mittlere Qualität, nur mit Vorsicht kaufen' };
    } else {
      return { rating: 'avoid', reasoning: 'Mittlere Qualität, nicht ausreichend unterbewertet' };
    }
  }
  // Low quality (Buffett score <60%)
  else {
    return { rating: 'avoid', reasoning: 'Schwache Übereinstimmung mit Buffetts Kriterien' };
  }
};

// Function to interpret MoS status properly based on Buffett's standard
const interpretMarginOfSafety = (value: number): 'pass' | 'warning' | 'fail' => {
  if (value > 30) return 'pass'; // Strongly undervalued
  if (value >= 10) return 'warning'; // Slightly undervalued
  if (value >= 0) return 'warning'; // Fair value (borderline)
  return 'fail'; // Overvalued
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
  // Using Buffett's formula: MoS = (Intrinsic Value - Market Price) / Market Price
  if (!marginOfSafety && intrinsicValue !== null && intrinsicValue !== undefined && 
      currentPrice !== null && currentPrice !== undefined) {
    const mosValue = ((intrinsicValue - currentPrice) / currentPrice) * 100;
    marginOfSafety = {
      value: mosValue,
      status: interpretMarginOfSafety(mosValue)
    };
    console.log(`Calculated marginOfSafety: ${mosValue.toFixed(2)}% from intrinsicValue: ${intrinsicValue} and currentPrice: ${currentPrice} (using Market Price as denominator)`);
  } else if (marginOfSafety && marginOfSafety.value === 0 && 
            intrinsicValue !== null && intrinsicValue !== undefined && 
            currentPrice !== null && currentPrice !== undefined) {
    // Recalculate if it's 0 but we have the values to calculate it properly
    const mosValue = ((intrinsicValue - currentPrice) / currentPrice) * 100;
    marginOfSafety.value = mosValue;
    marginOfSafety.status = interpretMarginOfSafety(mosValue);
    console.log(`Updated marginOfSafety from 0 to: ${mosValue.toFixed(2)}% using intrinsicValue: ${intrinsicValue} and currentPrice: ${currentPrice} (using Market Price as denominator)`);
  }
  
  // Override the marginOfSafety status based on the actual value if marginOfSafety exists
  if (marginOfSafety) {
    marginOfSafety.status = interpretMarginOfSafety(marginOfSafety.value);
  }
  
  // Re-determine the overall rating based on buffettScore and marginOfSafety
  if (buffettScore !== undefined && marginOfSafety !== undefined) {
    const newRatingData = determineRating(buffettScore, marginOfSafety.value);
    overall = newRatingData.rating;
    
    // Update summary based on the new rating logic
    summary = newRatingData.reasoning;
    
    // Update recommendation based on new rating
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
  
  // Verwende neutralere Formulierungen für die Bewertungen
  const ratingTitle = {
    buy: 'Hohe Übereinstimmung',
    watch: 'Mittlere Übereinstimmung',
    avoid: 'Niedrige Übereinstimmung'
  }[overall];
  
  const ratingColor = {
    buy: 'bg-buffett-green bg-opacity-10 border-buffett-green',
    watch: 'bg-buffett-yellow bg-opacity-10 border-buffett-yellow',
    avoid: 'bg-buffett-red bg-opacity-10 border-buffett-red'
  }[overall];

  const decisionFactor = overall === 'avoid' && marginOfSafety && marginOfSafety.value < 0 
    ? 'Preis ist zu hoch für ein Investment' 
    : overall === 'avoid' && buffettScore && buffettScore < 60
    ? 'Zu wenige Buffett-Kriterien erfüllt'
    : overall === 'watch'
    ? 'Fundamentalwerte gut, aber nicht optimal bewertet'
    : 'Preis und Qualität im Einklang';
  
  // Funktion, die die Rating-Logik erklärt
  const explainRatingLogic = () => {
    if (buffettScore === undefined || marginOfSafety === undefined) {
      return null;
    }

    if (buffettScore >= 75 && marginOfSafety.value > 20 && overall === 'buy') {
      return "Hohe Qualität (≥75%) + starke Unterbewertung (>20%) = Hohe Übereinstimmung";
    } else if (buffettScore >= 75 && marginOfSafety.value >= 0 && overall === 'watch') {
      return "Hohe Qualität (≥75%) + faire/leichte Bewertung = Mittlere Übereinstimmung";
    } else if (buffettScore >= 75 && marginOfSafety.value < 0 && overall === 'avoid') {
      return "Hohe Qualität (≥75%), aber überbewertet (<0%) = Niedrige Übereinstimmung";
    } else if (buffettScore >= 60 && buffettScore < 75 && marginOfSafety.value > 10 && overall === 'watch') {
      return "Mittlere Qualität (60-74%) + Unterbewertung (>10%) = Mittlere Übereinstimmung";
    } else if (buffettScore < 60 && overall === 'avoid') {
      return "Schwache Qualität (<60%) = Niedrige Übereinstimmung (unabhängig vom Preis)";
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
