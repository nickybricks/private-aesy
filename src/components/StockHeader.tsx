import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, RefreshCcw, Edit2, ArrowRight, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ClickableTooltip } from './ClickableTooltip';
import { convertCurrency, needsCurrencyConversion, getExchangeRate, shouldConvertCurrency } from '@/utils/currencyConverter';
import StockChart from './StockChart';

interface StockHeaderProps {
  stockInfo: {
    name: string;
    ticker: string;
    price: number | null;
    change: number | null;
    changePercent: number | null;
    currency: string;
    marketCap: number | null;
    intrinsicValue: number | null;
    sharesOutstanding?: number | null;
  } | null;
}

const formatMarketCap = (marketCap: number | null, currency: string = 'EUR'): string => {
  if (marketCap === null || marketCap === undefined || isNaN(marketCap)) {
    return 'N/A';
  }
  
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

const isIntrinsicValueUnreasonable = (intrinsicValue: number | null, price: number | null, threshold = 20): boolean => {
  if (intrinsicValue === null || price === null || price === 0) return false;
  return intrinsicValue / price > threshold;
};

const normalizeIntrinsicValuePerShare = (
  intrinsicValue: number | null, 
  sharesOutstanding: number | null,
  price: number | null
): number | null => {
  if (intrinsicValue === null) return null;
  
  if (isIntrinsicValueUnreasonable(intrinsicValue, price) && sharesOutstanding && sharesOutstanding > 0) {
    return intrinsicValue / sharesOutstanding;
  }
  
  return intrinsicValue;
};

const formatIntrinsicValue = (value: number | null, currency: string): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  return `${value.toFixed(2)} ${currency}`;
};

const StockHeader: React.FC<StockHeaderProps> = ({ stockInfo }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);
  const [convertedMarketCap, setConvertedMarketCap] = useState<number | null>(null);
  const [convertedIntrinsicValue, setConvertedIntrinsicValue] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [normalizedIntrinsicValue, setNormalizedIntrinsicValue] = useState<number | null>(null);
  const navigate = useNavigate();
  const [hasCriticalDataMissing, setHasCriticalDataMissing] = useState(false);
  const [showCurrencyNotice, setShowCurrencyNotice] = useState(false);
  const [dcfWarning, setDcfWarning] = useState(false);
  const [dcfNormalized, setDcfNormalized] = useState(false);

  useEffect(() => {
    if (stockInfo) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500);
      
      const criticalMissing = 
        stockInfo.price === null || 
        stockInfo.price === 0 || 
        stockInfo.marketCap === null || 
        stockInfo.marketCap === 0;
      
      setHasCriticalDataMissing(criticalMissing);
      
      if (stockInfo.intrinsicValue !== null && stockInfo.price !== null) {
        const isUnreasonable = isIntrinsicValueUnreasonable(stockInfo.intrinsicValue, stockInfo.price);
        setDcfWarning(isUnreasonable);
        
        if (isUnreasonable && stockInfo.sharesOutstanding && stockInfo.sharesOutstanding > 0) {
          const normalized = normalizeIntrinsicValuePerShare(
            stockInfo.intrinsicValue,
            stockInfo.sharesOutstanding,
            stockInfo.price
          );
          setNormalizedIntrinsicValue(normalized);
          setDcfNormalized(true);
          
          if (normalized !== null) {
            setDcfWarning(isIntrinsicValueUnreasonable(normalized, stockInfo.price, 10));
          }
        } else {
          setNormalizedIntrinsicValue(stockInfo.intrinsicValue);
          setDcfNormalized(false);
        }
      }
      
      const loadExchangeRateInfo = async () => {
        if (!criticalMissing && stockInfo.currency && stockInfo.currency !== 'EUR') {
          try {
            const rateToEUR = await getExchangeRate(stockInfo.currency, 'EUR');
            if (rateToEUR) {
              setExchangeRate(rateToEUR);
              setShowCurrencyNotice(true);

              if (stockInfo.intrinsicValue !== null) {
                const convertedValue = await convertCurrency(stockInfo.intrinsicValue, stockInfo.currency, 'EUR');
                setConvertedIntrinsicValue(convertedValue);
              }
            }
          } catch (error) {
            console.error('Error fetching exchange rate info:', error);
          }
        } else {
          setShowCurrencyNotice(false);
        }
      };
      
      loadExchangeRateInfo();
      
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

  const { name, ticker, price, change, changePercent, currency, marketCap, intrinsicValue } = stockInfo;
  const isPositive = change !== null && change >= 0;
  
  const alternativeSymbol = hasCriticalDataMissing && ticker.endsWith('.DE') ? ticker.replace('.DE', '') : null;

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

  const displayIntrinsicValue = 
    convertedIntrinsicValue !== null && currency !== 'EUR' ? 
      convertedIntrinsicValue : 
      normalizedIntrinsicValue !== null ? 
        normalizedIntrinsicValue : 
        intrinsicValue;

  const displayCurrency = convertedIntrinsicValue !== null && currency !== 'EUR' ? 'EUR' : currency;

  return (
    <div className="buffett-card mb-6 animate-slide-up space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <div className="text-buffett-subtext">{ticker}</div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col items-end">
          <div className="text-3xl font-semibold">
            {price !== null && !isNaN(price) ? `${price.toFixed(2)} ${currency}` : `– ${currency}`}
            
            {currency !== 'EUR' && exchangeRate && (
              <ClickableTooltip
                content={
                  <p className="max-w-xs">
                    Wechselkurs: 1 {currency} = {exchangeRate.toFixed(6)} EUR
                  </p>
                }
              >
                <Info size={16} className="text-gray-400 cursor-pointer ml-1" />
              </ClickableTooltip>
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
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <StockChart 
          symbol={ticker} 
          currency={currency} 
          intrinsicValue={displayIntrinsicValue}
          displayCurrency={displayCurrency} 
        />
      </div>
      
      <div className="pt-4 border-t border-gray-100 flex items-center">
        <DollarSign size={16} className="mr-2 text-buffett-subtext" />
        <span className="text-buffett-subtext">
          Marktkapitalisierung: {formatMarketCap(marketCap, currency)}
        </span>
      </div>
      
      {dcfWarning && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-700">
            {dcfNormalized ? "Hinweis zum intrinsischen Wert" : "Ungewöhnlich hoher intrinsischer Wert"}
          </AlertTitle>
          <AlertDescription className="text-yellow-600">
            <p>
              {dcfNormalized ? (
                <>
                  Der berechnete intrinsische Wert wurde automatisch durch die Anzahl ausstehender Aktien
                  ({stockInfo.sharesOutstanding?.toLocaleString('de-DE')}) geteilt,
                  da der ursprüngliche Wert unverhältnismäßig hoch erschien.
                </>
              ) : (
                <>
                  Der berechnete intrinsische Wert ({formatIntrinsicValue(intrinsicValue, currency)}) erscheint unverhältnismäßig 
                  hoch im Vergleich zum aktuellen Kurs ({price?.toFixed(2)} {currency}). 
                  Dies kann auf einen Berechnungsfehler oder außergewöhnliche Wachstumsannahmen hindeuten.
                </>
              )}
            </p>
            <p className="mt-2">
              Für eine genauere Analyse empfehlen wir, weitere Quellen zu konsultieren.
            </p>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="flex items-start gap-2">
          <Info size={18} className="text-buffett-blue mt-0.5" />
          <div>
            <h3 className="font-medium text-buffett-blue mb-1">Währungsinformation</h3>
            <p className="text-sm">
              <strong>Kurswährung: {currency}</strong>
              {convertedIntrinsicValue !== null && currency !== 'EUR' && (
                <> (Intrinsischer Wert in EUR: {convertedIntrinsicValue.toFixed(2)} €)</>
              )}
            </p>
            <p className="text-sm mt-1">
              Alle Finanzkennzahlen wurden – falls notwendig – in {currency} umgerechnet, 
              um eine korrekte Analyse zu ermöglichen. Originalwerte in abweichenden Währungen 
              werden in den Tooltips angezeigt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockHeader;
