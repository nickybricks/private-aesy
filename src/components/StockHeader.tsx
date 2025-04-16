
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StockHeaderProps {
  stockInfo: {
    name: string;
    ticker: string;
    price: number | null;
    change: number | null;
    changePercent: number | null;
    currency: string;
    marketCap: number | null;
  } | null;
}

const formatMarketCap = (marketCap: number | null): string => {
  if (marketCap === null || marketCap === undefined || isNaN(marketCap)) {
    return 'N/A';
  }
  
  if (marketCap >= 1000000000000) {
    return `${(marketCap / 1000000000000).toFixed(2)} Bio. ${marketCap > 0 ? '$' : ''}`;
  } else if (marketCap >= 1000000000) {
    return `${(marketCap / 1000000000).toFixed(2)} Mrd. ${marketCap > 0 ? '$' : ''}`;
  } else if (marketCap >= 1000000) {
    return `${(marketCap / 1000000).toFixed(2)} Mio. ${marketCap > 0 ? '$' : ''}`;
  } else {
    return `${marketCap.toFixed(2)} ${marketCap > 0 ? '$' : ''}`;
  }
};

const StockHeader: React.FC<StockHeaderProps> = ({ stockInfo }) => {
  if (!stockInfo) return null;

  const { name, ticker, price, change, changePercent, currency, marketCap } = stockInfo;
  const isPositive = change !== null && change >= 0;
  const hasIncompleteData = price === null || change === null || changePercent === null || marketCap === null;

  // Log warning for incomplete data
  if (hasIncompleteData) {
    console.warn("Fehlende Werte bei Symbol:", ticker, stockInfo);
  }

  return (
    <div className="buffett-card mb-6 animate-slide-up">
      {hasIncompleteData && (
        <Alert variant="warning" className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-700">
            Für dieses Symbol liegen unvollständige Daten vor. Einige Kennzahlen und Bewertungen könnten fehlen oder ungenau sein.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <div className="text-buffett-subtext">{ticker}</div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col items-end">
          <div className="text-3xl font-semibold">
            {price !== null && !isNaN(price) 
              ? `${price.toFixed(2)} ${currency}` 
              : `– ${currency}`}
          </div>
          <div className={`flex items-center ${isPositive ? 'text-buffett-green' : 'text-buffett-red'}`}>
            {change !== null && changePercent !== null ? (
              <>
                {isPositive ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                <span>{change.toFixed(2)} ({changePercent.toFixed(2)}%)</span>
              </>
            ) : (
              <span className="text-gray-500">Keine Änderungsdaten verfügbar</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center">
        <DollarSign size={16} className="mr-2 text-buffett-subtext" />
        <span className="text-buffett-subtext">
          Marktkapitalisierung: {formatMarketCap(marketCap)}
        </span>
      </div>
    </div>
  );
};

export default StockHeader;
