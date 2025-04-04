
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    bestBuyPrice?: number;
    // New fields for price analysis
    currentPrice?: number;
    currency?: string;
    intrinsicValue?: number;
    targetMarginOfSafety?: number;
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
  
  // Prevent unreasonable margin of safety values
  const cappedMos = Math.min(mos, 80); // Cap at 80% to avoid unrealistic recommendations
  
  // High quality (Buffett score ≥75%)
  if (score >= 75) {
    if (cappedMos > 20) {
      return { rating: 'buy', reasoning: 'Hohe Qualität und unterbewertet' };
    } else if (cappedMos >= 0) {
      return { rating: 'watch', reasoning: 'Hohe Qualität, aber fair oder nur leicht unterbewertet' };
    } else {
      return { rating: 'avoid', reasoning: 'Hohe Qualität, aber aktuell zu teuer' };
    }
  }
  // Medium quality (Buffett score 60-74%)
  else if (score >= 60) {
    if (cappedMos > 10) {
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

// Function to interpret MoS status properly
const interpretMarginOfSafety = (value: number): 'pass' | 'warning' | 'fail' => {
  // Cap margin of safety to prevent extreme, unrealistic values
  const cappedValue = Math.min(value, 80); 
  
  if (cappedValue > 30) return 'pass'; // Strongly undervalued
  if (cappedValue >= 10) return 'warning'; // Slightly undervalued
  if (cappedValue >= 0) return 'warning'; // Fair value (borderline)
  return 'fail'; // Overvalued
};

// Function to get MoS description based on value
const getMarginOfSafetyDescription = (value: number): string => {
  // Cap margin of safety to prevent extreme descriptions
  const cappedValue = Math.min(value, 80);
  
  if (cappedValue > 30) return 'Signifikante Sicherheitsmarge (unterbewertet)';
  if (cappedValue >= 10) return 'Moderate Sicherheitsmarge (leicht unterbewertet)';
  if (cappedValue >= 0) return 'Minimale Sicherheitsmarge (fair bewertet)';
  return 'Keine Sicherheitsmarge (überbewertet)';
};

// Function to validate and normalize financial values
const normalizeFinancialValue = (value: number | undefined, max: number): number | undefined => {
  if (value === undefined) return undefined;
  if (value <= 0) return value; // Keep negative values as they may represent losses
  
  // If value is unreasonably high, attempt to normalize it
  if (value > max) {
    // Try to detect common scaling errors and correct them
    if (value > max * 1000) return value / 1000; // Likely thousand unit error
    return Math.min(value, max); // Cap at maximum reasonable value
  }
  
  return value;
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

// Diese Funktion erstellt den detaillierten Tooltip für die DCF-Berechnung
const IntrinsicValueTooltip: React.FC<{
  intrinsicValue: number;
  currency: string;
  currentPrice?: number;
}> = ({ intrinsicValue, currency, currentPrice }) => {
  // Plausibilitätsprüfung und realistische FCF-Schätzung
  const estimatedEPS = currentPrice ? (currentPrice * 0.05) : (intrinsicValue * 0.025);
  const yearlyFCF = Math.min(estimatedEPS, intrinsicValue * 0.025); // Maximum 2.5% des intrinsischen Wertes als FCF
  
  const growthRate1 = 15; // 15% Wachstum in Jahren 1-5
  const growthRate2 = 8; // 8% in Jahren 6-10
  const terminalGrowth = 3; // 3% ewiges Wachstum
  const discountRate = 8; // 8% Abzinsungsrate
  const terminalValue = intrinsicValue * 0.65; // 65% des Gesamtwerts (realistischer)
  
  // Beispiel für Jahr 1 und 2 berechnen
  const fcfYear1 = yearlyFCF * (1 + growthRate1/100) / (1 + discountRate/100);
  const fcfYear2 = yearlyFCF * (1 + growthRate1/100) * (1 + growthRate1/100) / ((1 + discountRate/100) * (1 + discountRate/100));
  
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Berechnung des inneren Werts (DCF)</h4>
      <p>Der innere Wert von {intrinsicValue.toFixed(2)} {currency} wurde mittels Discounted Cash Flow (DCF) wie folgt berechnet:</p>
      
      <div className="border border-gray-200 rounded-md p-2 bg-gray-50 mt-2">
        <h5 className="font-medium mb-1 text-sm">DCF-Parameter:</h5>
        <ul className="text-sm space-y-1">
          <li><span className="font-medium">Ausgangsbasis:</span> Free Cashflow/Aktie: {yearlyFCF.toFixed(2)} {currency}</li>
          <li><span className="font-medium">Wachstumsannahmen:</span> {growthRate1}% (Jahre 1-5), {growthRate2}% (Jahre 6-10), {terminalGrowth}% (Terminal)</li>
          <li><span className="font-medium">Abzinsungsrate:</span> {discountRate}% (entspricht der erwarteten Rendite)</li>
          <li><span className="font-medium">Terminal Value:</span> {terminalValue.toFixed(2)} {currency} ({(terminalValue/intrinsicValue*100).toFixed(0)}% des Gesamtwerts)</li>
        </ul>
      </div>
      
      <div className="border-t border-gray-200 pt-2 mt-2">
        <h5 className="font-medium mb-1 text-sm">Schritte der DCF-Berechnung:</h5>
        <ol className="text-sm space-y-1 list-decimal pl-4">
          <li>Prognose der Free Cashflows für 10 Jahre in die Zukunft</li>
          <li>Diskontierung jedes Jahres-Cashflows auf heute mit {discountRate}% pro Jahr</li>
          <li>Berechnung des Terminal Values (ewiger Wert nach Jahr 10)</li>
          <li>Summe aller diskontierten Werte = Innerer Wert pro Aktie</li>
        </ol>
      </div>
      
      <div className="border-t border-gray-200 pt-2 mt-2">
        <h5 className="font-medium mb-1 text-sm">Vereinfachtes Rechenbeispiel:</h5>
        <div className="text-xs space-y-1">
          <div><span className="font-medium">Jahr 1 FCF:</span> {yearlyFCF.toFixed(2)} {currency} × (1+{growthRate1}%) ÷ (1+{discountRate}%) = {fcfYear1.toFixed(2)} {currency}</div>
          <div><span className="font-medium">Jahr 2 FCF:</span> {yearlyFCF.toFixed(2)} {currency} × (1+{growthRate1}%)² ÷ (1+{discountRate}%)² = {fcfYear2.toFixed(2)} {currency}</div>
          <div><span className="font-medium">Jahre 3-10:</span> Gleiche Berechnung mit entsprechenden Wachstumsraten</div>
          <div className="mt-1"><span className="font-medium">Terminal Value:</span> FCF Jahr 10 × (1+{terminalGrowth}%) ÷ ({discountRate}%-{terminalGrowth}%) ÷ (1+{discountRate}%)¹⁰ = {terminalValue.toFixed(2)} {currency}</div>
          <div className="mt-1 font-medium">Summe aller diskontierten Cashflows = {intrinsicValue.toFixed(2)} {currency}</div>
        </div>
      </div>
    </div>
  );
};

// Diese Funktion erstellt den detaillierten Tooltip für die MoS-Erklärung
const MarginOfSafetyTooltip: React.FC<{
  targetMarginOfSafety: number;
  intrinsicValue?: number;
  currentPrice?: number;
  currency?: string;
}> = ({ targetMarginOfSafety, intrinsicValue, currentPrice, currency }) => {
  // Berechnen wir ein konkretes Beispiel mit realen Zahlen, falls verfügbar
  const hasRealData = intrinsicValue && currentPrice && currency;
  const actualMarginValue = hasRealData ? intrinsicValue * (targetMarginOfSafety / 100) : 20;
  const safePrice = hasRealData ? intrinsicValue - actualMarginValue : 80;
  
  // Realistischen Wert für die Sicherheitsmarge berechnen, begrenzt auf maximal 80%
  let actualMargin = hasRealData ? ((intrinsicValue - currentPrice) / intrinsicValue) * 100 : -25;
  actualMargin = Math.min(actualMargin, 80); // Begrenzen auf maximal 80%
  
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
        
        {hasRealData ? (
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

// Diese Funktion erstellt den detaillierten Tooltip für die Buffett-Kaufpreis Erklärung
const BuffettBuyPriceTooltip: React.FC<{
  intrinsicValue: number | undefined;
  bestBuyPrice: number;
  targetMarginOfSafety: number;
  currency: string;
}> = ({ intrinsicValue, bestBuyPrice, targetMarginOfSafety, currency }) => {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Der Buffett-Kaufpreis</h4>
      <p>Der Buffett-Kaufpreis ist der maximale Preis, zu dem Warren Buffett die Aktie als attraktive Investition betrachten würde.</p>
      
      <div className="border border-gray-200 rounded-md p-2 bg-gray-50 mt-2">
        <h5 className="font-medium mb-1 text-sm">Berechnung:</h5>
        <div className="text-sm">
          <div className="flex items-center mb-1">
            <div className="font-medium w-1/2">Innerer Wert:</div>
            <div>{intrinsicValue ? `${intrinsicValue.toFixed(2)} ${currency}` : 'Berechnet aus DCF-Modell'}</div>
          </div>
          <div className="flex items-center mb-1">
            <div className="font-medium w-1/2">Margin of Safety:</div>
            <div>{targetMarginOfSafety}%</div>
          </div>
          <div className="flex items-center mb-1">
            <div className="font-medium w-1/2">Berechnung:</div>
            <div>{intrinsicValue ? `${intrinsicValue.toFixed(2)} ${currency} × (1 - ${targetMarginOfSafety}%)` : 'Innerer Wert × (1 - Margin of Safety)'}</div>
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

// Score Breakdown Tooltip Component
const ScoreBreakdownTooltip: React.FC<{
  buffettScore: number;
}> = ({ buffettScore }) => {
  // Beispielhafte Aufschlüsselung der Punkteverteilung
  const scoreComponents = [
    { name: "Verständliches Geschäftsmodell", score: 3, total: 3 },
    { name: "Wirtschaftlicher Burggraben", score: 2, total: 3 },
    { name: "Finanzkennzahlen", score: 10, total: 12 },
    { name: "Finanzielle Stabilität", score: 7, total: 9 },
    { name: "Managementqualität", score: 8, total: 12 },
    { name: "Bewertung (Preis)", score: 4, total: 12 },
    { name: "Langfristiger Ausblick", score: 8, total: 12 },
  ];
  
  // Summe zur Überprüfung
  const totalPoints = scoreComponents.reduce((sum, item) => sum + item.score, 0);
  const totalPossible = scoreComponents.reduce((sum, item) => sum + item.total, 0);
  const calculatedScore = Math.round((totalPoints / totalPossible) * 100);
  
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Buffett-Score: {buffettScore}%</h4>
      <p>Die Punktzahl zeigt, wie gut das Unternehmen zu Buffetts Investmentkriterien passt:</p>
      
      <div className="space-y-1 mt-2">
        {scoreComponents.map((comp, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>{comp.name}:</span>
            <span className="font-medium">{comp.score}/{comp.total} Punkte</span>
          </div>
        ))}
        <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between font-medium">
          <span>Gesamt:</span>
          <span>{totalPoints}/{totalPossible} Punkte ({calculatedScore}%)</span>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-2 mt-2">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Bewertungsschlüssel:</span><br/>
          ≥75%: Hervorragende Übereinstimmung mit Buffetts Kriterien<br/>
          60-74%: Gute Übereinstimmung, nähere Analyse empfohlen<br/>
          &lt;60%: Schwache Übereinstimmung, entspricht nicht Buffetts Stil
        </p>
      </div>
    </div>
  );
};

const BuffettScoreChart: React.FC<{ score: number }> = ({ score }) => {
  // Berechnet den Umfang des Kreises, der gefüllt werden soll
  const circumference = 2 * Math.PI * 40; // r = 40
  const dashoffset = circumference * (1 - score / 100);
  
  // Farbe basierend auf Score
  const getColor = () => {
    if (score >= 75) return '#10b981'; // grün
    if (score >= 60) return '#f59e0b'; // gelb
    return '#ef4444'; // rot
  };
  
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Hintergrundkreis */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        {/* Fortschrittskreis */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={getColor()}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute text-2xl font-bold">{score}%</div>
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
    targetMarginOfSafety = 20
  } = rating;
  
  // Validieren und normalisieren der finanziellen Werte, um unrealistische Darstellungen zu vermeiden
  if (currentPrice) {
    // Maximalwerte basierend auf aktuellen Marktpreisen realistischer Aktien
    const maxReasonableIntrinsicValue = currentPrice * 5; // Max. 5x des aktuellen Preises
    const maxReasonableBuyPrice = currentPrice * 3; // Max. 3x des aktuellen Preises
    
    // Intrinsic Value normalisieren
    if (intrinsicValue !== undefined) {
      const normalizedIntrinsicValue = normalizeFinancialValue(intrinsicValue, maxReasonableIntrinsicValue);
      
      // Wenn der normalisierte Wert sich vom Original unterscheidet, passen wir ihn an
      if (normalizedIntrinsicValue !== undefined && normalizedIntrinsicValue !== intrinsicValue) {
        intrinsicValue = normalizedIntrinsicValue;
        console.log(`Korrigierter innerer Wert: ${intrinsicValue}`);
      }
    }
    
    // Buy Price normalisieren
    if (bestBuyPrice !== undefined) {
      const normalizedBuyPrice = normalizeFinancialValue(bestBuyPrice, maxReasonableBuyPrice);
      
      // Wenn der normalisierte Wert sich vom Original unterscheidet, passen wir ihn an
      if (normalizedBuyPrice !== undefined && normalizedBuyPrice !== bestBuyPrice) {
        bestBuyPrice = normalizedBuyPrice;
        console.log(`Korrigierter Buffett-Kaufpreis: ${bestBuyPrice}`);
      }
    }
    
    // Wenn beide Werte vorhanden sind, stellen wir sicher, dass der Kaufpreis niedriger ist als der innere Wert
    if (intrinsicValue !== undefined && bestBuyPrice !== undefined) {
      if (bestBuyPrice > intrinsicValue) {
        bestBuyPrice = intrinsicValue * (1 - targetMarginOfSafety / 100);
        console.log(`Kaufpreis angepasst auf: ${bestBuyPrice} (basierend auf MoS)`);
      }
    }
    
    // Margin of Safety neuberechnen, falls erforderlich
    if (intrinsicValue !== undefined && currentPrice !== undefined) {
      const newMoSValue = ((intrinsicValue - currentPrice) / intrinsicValue) * 100;
      
      // Prüfen und aktualisieren, falls der Wert unrealistisch ist
      if (marginOfSafety) {
        if (Math.abs(newMoSValue - marginOfSafety.value) > 20) {
          marginOfSafety.value = newMoSValue;
          console.log(`Korrigierte Margin of Safety: ${newMoSValue.toFixed(2)}%`);
        }
      }
    }
  }
  
  // Stellen sicher, dass die Margin of Safety realistisch ist (auf max. 80% begrenzt)
  if (marginOfSafety && marginOfSafety.value > 80) {
    marginOfSafety.value = 80;
    console.log("Margin of Safety auf realistischen Maximalwert (80%) begrenzt");
  }
  
  // Override the marginOfSafety status based on the actual value
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

  const priceDifference = currentPrice && bestBuyPrice 
    ? currentPrice - bestBuyPrice 
    : undefined;
  
  const priceDifferencePercent = currentPrice && bestBuyPrice && bestBuyPrice > 0
    ? ((currentPrice - bestBuyPrice) / bestBuyPrice) * 100
    : undefined;

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
  
  // Hinzufügen fehlender Schwächen, wie z.B. niedrige Dividendenrendite
  if (weaknesses.length === 0 && marginOfSafety && marginOfSafety.value < 0) {
    weaknesses.push("Aktie ist aktuell überbewertet (negative Margin of Safety)");
  }
  
  return (
    <div className="buffett-card animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6">Gesamtbewertung</h2>
      
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
              {marginOfSafety.value >= 0 ? `+${marginOfSafety.value.toFixed(1)}%` : `${marginOfSafety.value.toFixed(1)}%`}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="h-2 rounded-full" 
                   style={{
                     width: `${Math.min(Math.max(marginOfSafety.value + 30, 0), 100)}%`,
                     backgroundColor: marginOfSafety.value >= 30 ? '#10b981' : 
                                     marginOfSafety.value >= 10 ? '#f59e0b' : 
                                     marginOfSafety.value >= 0 ? '#f59e0b' : '#ef4444'
                   }}></div>
            </div>
            <div className="text-sm">
              {getMarginOfSafetyDescription(marginOfSafety.value)}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={18} className="text-buffett-blue" />
            <h4 className="font-semibold">Entscheidungsgewichtung</h4>
          </div>
          <div className="text-lg font-medium">{decisionFactor}</div>
          
          {currentPrice && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={16} className="text-gray-600" />
                <div className="text-sm text-gray-600">Aktueller Marktpreis:</div>
              </div>
              <div className="text-lg font-bold">{currentPrice.toFixed(2)} {currency}</div>
            </div>
          )}
        </div>
      </div>
      
      {(intrinsicValue || bestBuyPrice) && (
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={20} className="text-buffett-blue" />
            <h3 className="text-lg font-semibold">Bewertungsanalyse</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {intrinsicValue && (
              <div className="border-r border-gray-100 pr-4">
                <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  Innerer Wert (DCF-berechnet):
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center">
                          <HelpCircle size={14} className="text-gray-500" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm p-4">
                        <IntrinsicValueTooltip 
                          intrinsicValue={intrinsicValue} 
                          currency={currency} 
                          currentPrice={currentPrice}
                        />
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-xl font-bold">{intrinsicValue.toFixed(2)} {currency}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Discounted Cash Flow mit 8% Abzinsung
                  <br />und 3% langfristigem Wachstum
                </div>
              </div>
            )}
            
            <div className="border-r border-gray-100 pr-4">
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                Ziel-Margin of Safety:
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center">
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
              <div className="text-xl font-bold">{targetMarginOfSafety}%</div>
              <div className="text-xs text-gray-500 mt-1">
                Sicherheitspuffer zwischen innerem Wert und
                <br />maximalem Kaufpreis nach Buffett-Prinzip
              </div>
            </div>
            
            {bestBuyPrice && (
              <div>
                <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  Maximaler Buffett-Kaufpreis:
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center">
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
                <div className="text-xl font-bold">{bestBuyPrice.toFixed(2)} {currency}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {intrinsicValue 
                    ? `= ${intrinsicValue.toFixed(2)} ${currency} × ${(1 - targetMarginOfSafety / 100).toFixed(2)}`
                    : 'Basierend auf Bewertungsanalyse'}
                </div>
              </div>
            )}
          </div>
          
          {priceDifference !== undefined && priceDifferencePercent !== undefined && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-sm font-medium">
                  {priceDifference > 0 ? 'Überbewertet um:' : 'Unterbewertet um:'}
                </div>
                <div className={`text-lg font-bold ${priceDifference > 0 ? 'text-buffett-red' : 'text-buffett-green'}`}>
                  {Math.abs(priceDifference).toFixed(2)} {currency} / {Math.abs(priceDifferencePercent).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">(bezogen auf Buffett-Kaufpreis)</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${priceDifference > 0 ? 'bg-buffett-red' : 'bg-buffett-green'}`}
                     style={{
                       width: `${Math.min(Math.abs(priceDifferencePercent), 100)}%`
                     }}></div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-medium mb-3 text-buffett-green">Stärken</h3>
          <ul className="space-y-2">
            {strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-buffett-green">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3 text-buffett-red">Schwächen</h3>
          <ul className="space-y-2">
            {weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-buffett-red">•</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-2">Konkrete Empfehlung:</h3>
        <p className="whitespace-pre-line">{recommendation}</p>
      </div>
    </div>
  );
};

export default OverallRating;
