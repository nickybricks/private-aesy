
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, RefreshCcw, Edit2, ArrowRight, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ClickableTooltip } from './ClickableTooltip';
import { DCFExplanationTooltip } from './DCFExplanationTooltip';
import { convertCurrency, needsCurrencyConversion, getExchangeRate, shouldConvertCurrency } from '@/utils/currencyConverter';
import StockChart from './StockChart';
import { DCFData } from '@/context/StockContextTypes';
import { AddToWatchlistButton } from './AddToWatchlistButton';
import { SaveAnalysisButton } from './SaveAnalysisButton';
import { useStock } from '@/context/StockContext';

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
    originalIntrinsicValue?: number | null;
    originalCurrency?: string;
    reportedCurrency?: string;
    dcfData?: DCFData;
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

const StockHeader: React.FC<StockHeaderProps> = ({ stockInfo }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);
  const [convertedMarketCap, setConvertedMarketCap] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const navigate = useNavigate();
  const [hasCriticalDataMissing, setHasCriticalDataMissing] = useState(false);
  const [showCurrencyNotice, setShowCurrencyNotice] = useState(false);
  const { buffettCriteria, financialMetrics, overallRating } = useStock();

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
      
      const loadExchangeRateInfo = async () => {
        if (!criticalMissing && stockInfo.currency && stockInfo.reportedCurrency && stockInfo.currency !== stockInfo.reportedCurrency) {
          try {
            // Show currency notice if report currency differs from stock currency
            setShowCurrencyNotice(true);
            const rate = await getExchangeRate(stockInfo.reportedCurrency, stockInfo.currency);
            if (rate) {
              setExchangeRate(rate);
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

  const { name, ticker, price, change, changePercent, currency, marketCap, intrinsicValue, originalIntrinsicValue, originalCurrency, reportedCurrency, dcfData } = stockInfo;
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
            
            {stockInfo.reportedCurrency && currency !== stockInfo.reportedCurrency && exchangeRate && (
              <ClickableTooltip
                content={
                  <p className="max-w-xs">
                    Wechselkurs: 1 {stockInfo.reportedCurrency} = {exchangeRate.toFixed(6)} {currency}
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
          
          {/* Intrinsic Value Display */}
          {intrinsicValue !== null && intrinsicValue !== undefined && !isNaN(Number(intrinsicValue)) && (
            <div className="mt-2 flex items-center justify-end text-lg font-medium text-buffett-blue">
              <span>Innerer Wert: {Number(intrinsicValue).toFixed(2)} {currency}</span>
              {dcfData ? (
                <DCFExplanationTooltip dcfData={dcfData} />
              ) : (
                <ClickableTooltip
                  content={
                    <div className="max-w-sm space-y-2">
                      <h4 className="font-semibold text-buffett-blue">DCF-Bewertung (Innerer Wert)</h4>
                      <p className="text-sm">
                        Der innere Wert wird mittels Discounted Cash Flow (DCF) Methode berechnet:
                      </p>
                      <div className="text-sm space-y-1">
                        <p><strong>1. Free Cash Flow (FCF):</strong> Operative Cash Flows abzüglich Investitionen</p>
                        <p><strong>2. Wachstumsrate:</strong> Durchschnitt der letzten 5 Jahre FCF-Wachstum</p>
                        <p><strong>3. Diskontierungssatz:</strong> 10% (Buffett's typische Mindestrendite)</p>
                        <p><strong>4. Projektionszeitraum:</strong> 10 Jahre + Endwert</p>
                        <p><strong>5. Sicherheitsmarge:</strong> 20% Abschlag für Unsicherheiten</p>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Diese Bewertung stellt eine Schätzung des fairen Wertes dar und sollte nicht als einzige Entscheidungsgrundlage verwendet werden.
                      </p>
                    </div>
                  }
                >
                  <Info size={16} className="text-buffett-blue/70 hover:text-buffett-blue cursor-pointer ml-2" />
                </ClickableTooltip>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <StockChart 
          symbol={ticker} 
          currency={currency} 
          intrinsicValue={intrinsicValue}
        />
      </div>
      
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <DollarSign size={16} className="mr-2 text-buffett-subtext" />
          <span className="text-buffett-subtext">
            Marktkapitalisierung: {formatMarketCap(marketCap, currency)}
          </span>
        </div>
        
        {/* Analysis buttons - only show when analysis is complete */}
        {buffettCriteria && financialMetrics && overallRating && (
          <div className="flex items-center gap-2">
            <SaveAnalysisButton />
            <AddToWatchlistButton
              stockInfo={stockInfo}
              buffettCriteria={buffettCriteria}
              financialMetrics={financialMetrics}
              overallRating={overallRating}
            />
          </div>
        )}
      </div>
      
      {showCurrencyNotice && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div className="flex items-start gap-2">
            <Info size={18} className="text-buffett-blue mt-0.5" />
            <div>
              <h3 className="font-medium text-buffett-blue mb-1">Währungsinformation</h3>
              <p className="text-sm">
                <strong>Kurswährung: {currency}</strong>
                {reportedCurrency && reportedCurrency !== currency && (
                  <> (Berichtswährung: {reportedCurrency})</>
                )}
              </p>
              <p className="text-sm mt-1">
                Wenn Finanzkennzahlen (z. B. Umsatz, FCF, EBIT) in einer anderen Währung angegeben sind als die Kurswährung der Aktie ({currency}), werden diese intern auf die Kurswährung umgerechnet.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockHeader;
