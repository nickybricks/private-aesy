import React from 'react';
import { useStock } from '@/context/StockContext';
import { Star, TrendingUp, TrendingDown } from 'lucide-react';
import { AddToWatchlistButton } from './AddToWatchlistButton';
import { Card } from '@/components/ui/card';

const StockQuoteHeader: React.FC = () => {
  const { 
    stockInfo, 
    predictabilityStars,
    financialMetrics,
    buffettCriteria,
    overallRating,
    isLoading,
    hasCriticalDataMissing 
  } = useStock();

  if (isLoading || hasCriticalDataMissing || !stockInfo) {
    return null;
  }

  const { name, ticker, price, change, changePercent, currency, marketCap } = stockInfo;
  const isPositive = change !== null && change >= 0;

  // Extract exchange from ticker (e.g., AAPL -> NASDAQ, AAPL.DE -> FWB)
  const getExchange = (ticker: string): string => {
    if (ticker.endsWith('.DE')) return 'FWB';
    if (ticker.endsWith('.L')) return 'LSE';
    if (ticker.endsWith('.PA')) return 'EPA';
    // Default to NASDAQ for US tickers
    return 'NASDAQ';
  };

  const exchange = getExchange(ticker);

  // Get current time in EST
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
    hour12: true
  });

  // Format large numbers
  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    
    if (value >= 1_000_000_000_000) {
      return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
    } else if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    return `$${value.toFixed(2)}`;
  };

  // Format volume
  const formatVolume = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K`;
    }
    return value.toFixed(0);
  };

  // Extract metrics from financialMetrics.metrics array
  const getMetricValue = (metricName: string): number | null => {
    if (!financialMetrics || !financialMetrics.metrics || !Array.isArray(financialMetrics.metrics)) return null;
    const metric = financialMetrics.metrics.find((m: any) => m.name === metricName);
    return metric?.value ?? null;
  };

  const peRatio = getMetricValue('P/E-Verhältnis (KGV)');
  const pbRatio = getMetricValue('P/B-Verhältnis (KBV)');
  const enterpriseValue = getMetricValue('Enterprise Value');
  const volume = getMetricValue('Handelsvolumen (Ø 3M)');
  const avgVolume = getMetricValue('Durchschnittliches Volumen');

  // Render stars
  const renderStars = (stars: number | 'NR') => {
    if (stars === 'NR') {
      return <span className="text-muted-foreground font-medium">NR</span>;
    }

    const fullStars = Math.floor(stars);
    const hasHalfStar = stars - fullStars >= 0.5;
    const totalStars = 5;

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: totalStars }, (_, index) => {
          const starIndex = index + 1;
          let starClass = 'text-muted-foreground/30';
          
          if (starIndex <= fullStars) {
            starClass = 'text-yellow-500 fill-yellow-500';
          } else if (starIndex === fullStars + 1 && hasHalfStar) {
            starClass = 'text-yellow-500 fill-yellow-500/50';
          }
          
          return (
            <Star key={index} size={20} className={starClass} />
          );
        })}
      </div>
    );
  };

  return (
    <Card className="p-3 md:p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          {/* Company Logo Placeholder - can be added later */}
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-muted flex items-center justify-center text-lg md:text-xl font-bold text-muted-foreground">
            {name.charAt(0)}
          </div>
          
          <div>
            <h1 className="text-lg md:text-xl font-bold mb-0.5">{name}</h1>
            <div className="text-xs text-muted-foreground">
              {exchange}:{ticker.replace(/\.(DE|L|PA)$/, '')} (USA) • Ordinary Shares
            </div>
          </div>
        </div>

        {/* Add to Watchlist Button */}
        {buffettCriteria && financialMetrics && overallRating && (
          <AddToWatchlistButton
            stockInfo={stockInfo}
            buffettCriteria={buffettCriteria}
            financialMetrics={financialMetrics}
            overallRating={overallRating}
          />
        )}
      </div>

      {/* Price Section */}
      <div className="mb-2">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-2xl md:text-3xl font-bold">
            ${price?.toFixed(2) ?? 'N/A'}
          </span>
          {change !== null && changePercent !== null && (
            <div className={`flex items-center gap-1 text-base font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>
                {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {currentTime} EST
        </div>
      </div>

      {/* Buffett Predictability Stars */}
      {predictabilityStars && (
        <div className="mb-3">
          {renderStars(predictabilityStars.stars)}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-1.5 text-xs">
        <div>
          <div className="text-muted-foreground">P/E:</div>
          <div className="font-semibold">{peRatio?.toFixed(2) ?? 'N/A'}</div>
        </div>
        
        <div>
          <div className="text-muted-foreground">P/B:</div>
          <div className="font-semibold">{pbRatio?.toFixed(2) ?? 'N/A'}</div>
        </div>
        
        <div>
          <div className="text-muted-foreground">Market Cap:</div>
          <div className="font-semibold">{formatNumber(marketCap)}</div>
        </div>
        
        <div>
          <div className="text-muted-foreground">Enterprise V:</div>
          <div className="font-semibold">{formatNumber(enterpriseValue)}</div>
        </div>
        
        <div>
          <div className="text-muted-foreground">Volume:</div>
          <div className="font-semibold">{formatVolume(volume)}</div>
        </div>
        
        <div>
          <div className="text-muted-foreground">Avg Vol (2M):</div>
          <div className="font-semibold">{formatVolume(avgVolume)}</div>
        </div>
      </div>
    </Card>
  );
};

export default StockQuoteHeader;
