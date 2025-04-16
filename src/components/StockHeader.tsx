
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, RefreshCcw, Edit2, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [showWarning, setShowWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (stockInfo) {
      // Show loading state briefly for better UX
      const timer = setTimeout(() => {
        setIsLoading(false);
        // Only show warning after loading if data is incomplete
        if (hasIncompleteData) {
          setShowWarning(true);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [stockInfo]);

  if (!stockInfo) {
    return (
      <div className="buffett-card mb-6 animate-fade-in">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Keine Daten verfügbar</AlertTitle>
          <AlertDescription>
            Leider konnten keine ausreichenden Daten für dieses Symbol geladen werden.
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCcw className="h-4 w-4" />
                Neu versuchen
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => navigate('/')}
              >
                <Edit2 className="h-4 w-4" />
                Symbol anpassen
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { name, ticker, price, change, changePercent, currency, marketCap } = stockInfo;
  const isPositive = change !== null && change >= 0;
  const hasIncompleteData = price === null || change === null || changePercent === null || marketCap === null;

  const alternativeSymbol = ticker.endsWith('.DE') ? ticker.replace('.DE', '') : null;

  // Log warning for incomplete data
  if (hasIncompleteData) {
    console.warn("Fehlende Werte bei Symbol:", ticker, stockInfo);
  }

  if (isLoading) {
    return (
      <div className="buffett-card mb-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="buffett-card mb-6 animate-slide-up">
      {showWarning && hasIncompleteData && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-700">
            <p>
              Die Analyse konnte nicht abgeschlossen werden, da für {ticker} nur eingeschränkte 
              Daten vorliegen (z.B. Marktkapitalisierung, EPS oder Cashflow fehlen).
            </p>
            {alternativeSymbol && (
              <div className="mt-2">
                <p className="mb-2">
                  Bitte probiere alternativ {alternativeSymbol} (US-Börse) aus oder prüfe ein anderes Unternehmen.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => navigate(`/?symbol=${alternativeSymbol}`)}
                >
                  <ArrowRight className="h-4 w-4" />
                  {alternativeSymbol} (NASDAQ) analysieren statt {ticker}
                </Button>
              </div>
            )}
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
