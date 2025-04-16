
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, RefreshCcw, Edit2, ArrowRight, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { convertCurrency, needsCurrencyConversion } from '@/utils/currencyConverter';

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

const formatMarketCap = (marketCap: number | null, currency: string = 'EUR'): string => {
  if (marketCap === null || marketCap === undefined || isNaN(marketCap)) {
    return 'N/A';
  }
  
  // Scale large numbers appropriately
  let scaledValue: number;
  let unit: string;
  
  if (marketCap >= 1000000000000) {
    scaledValue = marketCap / 1000000000000;
    unit = "Bio.";
  } else if (marketCap >= 1000000000) {
    scaledValue = marketCap / 1000000000;
    unit = "Mrd.";
  } else if (marketCap >= 1000000) {
    scaledValue = marketCap / 1000000;
    unit = "Mio.";
  } else {
    scaledValue = marketCap;
    unit = "";
  }
  
  return `${scaledValue.toFixed(2)} ${unit} ${currency}`;
};

const StockHeader: React.FC<StockHeaderProps> = ({ stockInfo }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);
  const [convertedMarketCap, setConvertedMarketCap] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (stockInfo) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500);
      
      // Convert currency if needed
      const convertCurrencyValues = async () => {
        if (stockInfo.currency && needsCurrencyConversion(stockInfo.currency) && stockInfo.price) {
          try {
            const converted = await convertCurrency(stockInfo.price, stockInfo.currency, 'EUR');
            setConvertedPrice(converted);
            
            // Get exchange rate
            const response = await fetch(`https://open.er-api.com/v6/latest/${stockInfo.currency}`);
            const data = await response.json();
            if (data.rates && data.rates.EUR) {
              setExchangeRate(data.rates.EUR);
            }
            
            if (stockInfo.marketCap) {
              const convertedMC = await convertCurrency(stockInfo.marketCap, stockInfo.currency, 'EUR');
              setConvertedMarketCap(convertedMC);
            }
          } catch (error) {
            console.error('Currency conversion error:', error);
          }
        }
      };
      
      convertCurrencyValues();
      
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
  const hasCriticalDataMissing = price === null || price === 0 || marketCap === null || marketCap === 0;

  const alternativeSymbol = ticker.endsWith('.DE') ? ticker.replace('.DE', '') : null;
  const needsCurrencyConv = currency && needsCurrencyConversion(currency);

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

  if (hasCriticalDataMissing) {
    return (
      <div className="buffett-card mb-6 animate-fade-in">
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-700">Analyse nicht möglich</AlertTitle>
          <AlertDescription className="text-red-600">
            <p>
              Für {ticker} liegen aktuell nicht genügend Daten für eine vollständige Bewertung vor.
              Die Buffett-Analyse benötigt mindestens einen aktuellen Kurs und Marktkapitalisierung.
            </p>
            {alternativeSymbol && (
              <div className="mt-2">
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
      </div>
    );
  }

  const formatPrice = (price: number | null, originalCurrency: string, convertedPrice: number | null, exchangeRate: number | null) => {
    if (price === null) return `– ${originalCurrency}`;
    
    if (needsCurrencyConv && convertedPrice !== null) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help underline decoration-dotted">
                {convertedPrice.toFixed(2)} EUR
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 max-w-xs">
                <p>Originalwährung: {price.toLocaleString('de-DE')} {originalCurrency}</p>
                {exchangeRate && (
                  <p className="text-xs text-gray-500">Wechselkurs: 1 EUR ≈ {(1/exchangeRate).toFixed(2)} {originalCurrency}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return `${price.toFixed(2)} ${originalCurrency}`;
  };

  return (
    <div className="buffett-card mb-6 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <div className="text-buffett-subtext">{ticker}</div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col items-end">
          <div className="text-3xl font-semibold">
            {needsCurrencyConv ? (
              <div className="flex items-center gap-1">
                {formatPrice(price, currency, convertedPrice, exchangeRate)}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={16} className="text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Originalkurs: {price?.toLocaleString('de-DE')} {currency}
                        {exchangeRate && (<><br />Wechselkurs: 1 EUR ≈ {(1/exchangeRate).toFixed(2)} {currency}</>)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              `${price !== null && !isNaN(price) ? price.toFixed(2) : '–'} ${currency}`
            )}
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
          Marktkapitalisierung: {
            needsCurrencyConv && convertedMarketCap !== null ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="underline decoration-dotted cursor-help">
                      {formatMarketCap(convertedMarketCap, 'EUR')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Originalwert: {formatMarketCap(marketCap, currency)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : formatMarketCap(marketCap, currency)
          }
        </span>
      </div>
      
      {needsCurrencyConv && (
        <div className="mt-2 text-xs text-buffett-subtext flex items-center gap-1">
          <Info size={12} />
          <span>
            Alle Werte wurden von {currency} in EUR umgerechnet für eine bessere Vergleichbarkeit.
          </span>
        </div>
      )}
    </div>
  );
};

export default StockHeader;
