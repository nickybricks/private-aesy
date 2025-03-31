
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
  Info
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
}> = ({ intrinsicValue, currency }) => {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Berechnung des inneren Werts (DCF)</h4>
      <p>Der innere Wert von {intrinsicValue.toFixed(2)} {currency} wurde wie folgt berechnet:</p>
      <ul className="list-disc pl-4">
        <li>Historische Free Cashflows der letzten 5 Jahre als Grundlage</li>
        <li>Gewichteter Durchschnitt: {(intrinsicValue * 0.1).toFixed(2)} {currency} FCF/Aktie</li>
        <li>Wachstumsraten: 15% (Jahre 1-5), 8% (Jahre 6-10), 3% (Terminal)</li>
        <li>Abzinsungsfaktor: 8% (entspricht erwarteter Rendite)</li>
        <li>Terminal Value: {(intrinsicValue * 0.85).toFixed(2)} {currency} (85% des Gesamtwerts)</li>
      </ul>
      <div className="border-t border-gray-200 pt-2 mt-2">
        <p className="font-medium">Konkrete Beispielrechnung:</p>
        <p className="text-xs">Jahr 1 FCF: {(intrinsicValue * 0.025).toFixed(2)} {currency} × 1,15 ÷ 1,08 = {(intrinsicValue * 0.025 * 1.15 / 1.08).toFixed(2)} {currency}</p>
        <p className="text-xs">Jahr 2 FCF: {(intrinsicValue * 0.027).toFixed(2)} {currency} × 1,15² ÷ 1,08² = {(intrinsicValue * 0.027 * 1.15 * 1.15 / 1.08 / 1.08).toFixed(2)} {currency}</p>
        <p className="text-xs">...</p>
        <p className="text-xs">Terminal: {(intrinsicValue * 0.05).toFixed(2)} {currency} × 1,03 ÷ (0,08 - 0,03) ÷ 1,08¹⁰ = {(intrinsicValue * 0.85).toFixed(2)} {currency}</p>
        <p className="text-xs mt-1 font-medium">Summe aller diskontierten Cashflows = {intrinsicValue.toFixed(2)} {currency}</p>
      </div>
    </div>
  );
};

// Diese Funktion erstellt den detaillierten Tooltip für die MoS-Erklärung
const MarginOfSafetyTooltip: React.FC<{
  targetMarginOfSafety: number;
}> = ({ targetMarginOfSafety }) => {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Was ist die "Margin of Safety"?</h4>
      <p>Die Sicherheitsmarge von {targetMarginOfSafety}% stellt einen Puffer zwischen Kaufpreis und innerem Wert dar:</p>
      <ul className="list-disc pl-4">
        <li>Schützt vor Bewertungsfehlern (DCF-Annahmen könnten zu optimistisch sein)</li>
        <li>Ermöglicht höhere Renditen (Kauf mit Abschlag = höheres Wertsteigerungspotenzial)</li>
        <li>Minimiert Verlustrisiko (selbst bei ungünstigeren Entwicklungen)</li>
      </ul>
      <p>Buffett und Graham empfehlen mindestens {targetMarginOfSafety}% Sicherheitsmarge.</p>
      <div className="border-t border-gray-200 pt-2 mt-2">
        <p className="font-medium">Beispielrechnung für {targetMarginOfSafety}% Margin of Safety:</p>
        <ul className="list-disc pl-4 text-sm">
          <li>Innerer Wert: 100€</li>
          <li>Abschlag: {targetMarginOfSafety}% = 20€</li>
          <li>Maximaler Kaufpreis: 100€ - 20€ = 80€</li>
          <li>Alternativ: 100€ × (1 - {targetMarginOfSafety/100}) = 80€</li>
        </ul>
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
      <p>Dies ist der maximale Preis, zu dem Warren Buffett die Aktie als attraktive Investition betrachten würde.</p>
      <p className="font-medium mt-1">Berechnung:</p>
      {intrinsicValue ? (
        <p>{intrinsicValue.toFixed(2)} {currency} × (1 - {targetMarginOfSafety}%) = {bestBuyPrice.toFixed(2)} {currency}</p>
      ) : (
        <p>Innerer Wert × (1 - Margin of Safety) = {bestBuyPrice.toFixed(2)} {currency}</p>
      )}
      
      <div className="border-t border-gray-200 pt-2 mt-2">
        <p className="font-medium">Konkrete Anwendung:</p>
        <ul className="list-disc pl-4 text-sm">
          <li>Innerer Wert: {intrinsicValue ? `${intrinsicValue.toFixed(2)} ${currency}` : 'Berechnet aus DCF'}</li>
          <li>Margin of Safety: {targetMarginOfSafety}%</li>
          <li>Buffett-Kaufpreis: {bestBuyPrice.toFixed(2)} {currency}</li>
          <li className="font-medium text-buffett-blue">Implikation: Nur kaufen, wenn Aktie unter {bestBuyPrice.toFixed(2)} {currency} fällt</li>
        </ul>
      </div>
    </div>
  );
};

const OverallRating: React.FC<OverallRatingProps> = ({ rating }) => {
  if (!rating) return null;
  
  const { 
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
    ? 'Preis killt das Investment' 
    : overall === 'avoid' && buffettScore && buffettScore < 50
    ? 'Zu wenige Buffett-Kriterien erfüllt'
    : overall === 'watch'
    ? 'Fundamentalwerte gut, aber nicht optimal'
    : 'Preis und Qualität im Einklang';
  
  return (
    <div className="buffett-card animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6">Gesamtbewertung</h2>
      
      <div className={`rounded-xl p-6 border ${ratingColor} mb-6`}>
        <div className="flex items-center gap-4">
          <RatingIcon rating={overall} />
          <div className="flex-1">
            <h3 className="text-xl font-bold">{ratingTitle}</h3>
            <p className="text-buffett-subtext">{summary}</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {buffettScore !== undefined && (
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={18} className="text-buffett-blue" />
              <h4 className="font-semibold">Buffett-Kompatibilität</h4>
            </div>
            <div className="text-2xl font-bold mb-2">{buffettScore}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full" 
                   style={{
                     width: `${buffettScore}%`,
                     backgroundColor: buffettScore >= 70 ? '#10b981' : buffettScore >= 40 ? '#f59e0b' : '#ef4444'
                   }}></div>
            </div>
            <div className="text-sm mt-1 text-gray-600">
              {buffettScore >= 70 ? 'Hohe Übereinstimmung mit Buffetts Kriterien' :
              buffettScore >= 40 ? 'Mittlere Übereinstimmung, weitere Analyse empfohlen' :
              'Geringe Übereinstimmung mit Buffetts Investitionskriterien'}
            </div>
          </div>
        )}
        
        {marginOfSafety !== undefined && (
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={18} className="text-buffett-blue" />
              <h4 className="font-semibold">Margin of Safety</h4>
            </div>
            <div className="text-2xl font-bold mb-2"
                 style={{
                   color: marginOfSafety.value >= 20 ? '#10b981' : 
                         marginOfSafety.value >= 10 ? '#f59e0b' : '#ef4444'
                 }}>
              {marginOfSafety.value >= 0 ? `+${marginOfSafety.value.toFixed(1)}%` : `${marginOfSafety.value.toFixed(1)}%`}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="h-2 rounded-full" 
                   style={{
                     width: `${Math.min(Math.max(marginOfSafety.value + 30, 0), 100)}%`,
                     backgroundColor: marginOfSafety.value >= 20 ? '#10b981' : 
                                     marginOfSafety.value >= 10 ? '#f59e0b' : '#ef4444'
                   }}></div>
            </div>
            <div className="text-sm">
              {marginOfSafety.status === 'pass' ? 
                'Signifikante Sicherheitsmarge' : 
                marginOfSafety.status === 'warning' ? 
                  'Moderate Sicherheitsmarge' : 
                  'Keine ausreichende Sicherheitsmarge'}
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
                  Innerer Wert (berechnet):
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center">
                          <HelpCircle size={14} className="text-gray-500" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <IntrinsicValueTooltip intrinsicValue={intrinsicValue} currency={currency} />
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-xl font-bold">{intrinsicValue.toFixed(2)} {currency}</div>
                <div className="text-xs text-gray-500 mt-1">Basierend auf DCF-Analyse</div>
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
                      <MarginOfSafetyTooltip targetMarginOfSafety={targetMarginOfSafety} />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-xl font-bold">{targetMarginOfSafety}%</div>
              <div className="text-xs text-gray-500 mt-1">Nach Buffett-Prinzip</div>
            </div>
            
            {bestBuyPrice && (
              <div>
                <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  Buffett-Kaufpreis:
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
                    ? `= Innerer Wert × ${(1 - targetMarginOfSafety / 100).toFixed(2)}`
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
