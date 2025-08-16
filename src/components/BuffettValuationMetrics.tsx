
import React from 'react';
import { 
  TrendingDown,
  DollarSign,
  Calculator,
  Info
} from 'lucide-react';
import { ClickableTooltip } from './ClickableTooltip';
import MarginOfSafetyExplanation from './MarginOfSafetyExplanation';

interface BuffettValuationMetricsProps {
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
}

// Function to get MoS description based on value
const getMarginOfSafetyDescription = (value: number): string => {
  if (value > 30) return 'Signifikante Sicherheitsmarge (stark unterbewertet)';
  if (value >= 10) return 'Moderate Sicherheitsmarge (leicht unterbewertet)';
  if (value >= 0) return 'Minimale Sicherheitsmarge (fair bewertet)';
  return 'Keine Sicherheitsmarge (überbewertet)';
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

// Diese Funktion erstellt den detaillierten Tooltip für die MoS-Erklärung
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
    
  // Corrected calculation using Buffett's formula: MoS = (Intrinsic Value - Market Price) / Market Price
  const actualMargin = hasRealData && intrinsicValue && currentPrice 
    ? ((intrinsicValue - currentPrice) / currentPrice) * 100 
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

const BuffettValuationMetrics: React.FC<BuffettValuationMetricsProps> = ({
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
}) => {
  // Safely calculate price difference
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

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {marginOfSafety !== undefined && (
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} className="text-buffett-blue" />
            <h4 className="font-semibold">Margin of Safety</h4>
            
            <ClickableTooltip
              content={
                <MarginOfSafetyTooltip 
                  targetMarginOfSafety={targetMarginOfSafety}
                  intrinsicValue={intrinsicValue}
                  currentPrice={currentPrice}
                  currency={currency}
                />
              }
              width="96"
            >
              <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
                <Info size={14} className="text-gray-500" />
              </button>
            </ClickableTooltip>
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
            
            <ClickableTooltip
              content={
                <BuffettBuyPriceTooltip 
                  intrinsicValue={intrinsicValue}
                  bestBuyPrice={bestBuyPrice}
                  targetMarginOfSafety={targetMarginOfSafety}
                  currency={currency}
                />
              }
              width="96"
            >
              <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
                <Info size={14} className="text-gray-500" />
              </button>
            </ClickableTooltip>
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
                <ClickableTooltip
                  content={
                    <IntrinsicValueTooltip 
                      intrinsicValue={intrinsicValue} 
                      currency={currency}
                      originalCurrency={originalCurrency}
                      originalIntrinsicValue={originalIntrinsicValue}
                    />
                  }
                  width="96"
                >
                  <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
                    <Info size={14} className="text-gray-500" />
                  </button>
                </ClickableTooltip>
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
  );
};

export default BuffettValuationMetrics;
