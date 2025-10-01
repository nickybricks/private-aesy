import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Users, 
  Percent,
  Calendar,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StockChart from '@/components/StockChart';
import PredictabilityStarsSection from '@/components/PredictabilityStarsSection';
import { useStock } from '@/context/StockContext';

const formatNumber = (num: number, options?: { compact?: boolean; decimals?: number }) => {
  if (options?.compact) {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  }
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: options?.decimals ?? 2,
    maximumFractionDigits: options?.decimals ?? 2
  }).format(num);
};

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, change }) => {
  return (
    <Card className="glass">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
              </div>
            )}
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export const OverviewTab: React.FC = () => {
  const { stockInfo, financialMetrics, stockCurrency } = useStock();

  if (!stockInfo) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Keine Daten verfügbar. Bitte suchen Sie nach einer Aktie.
      </div>
    );
  }

  // Extract metrics from financialMetrics array
  const getMetric = (name: string) => {
    return financialMetrics?.metrics?.find(m => m.name === name);
  };

  const marketCap = getMetric('Marktkapitalisierung');
  const volume = getMetric('Handelsvolumen');
  const eps = getMetric('Gewinn pro Aktie (EPS)');
  const peRatio = getMetric('Kurs-Gewinn-Verhältnis (KGV)');

  return (
    <div className="space-y-6">
      {/* Price Header */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {stockInfo.companyName} ({stockInfo.ticker})
              </h2>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold">
                  {stockCurrency} {formatNumber(stockInfo.price, { decimals: 2 })}
                </span>
                <span className={`text-xl font-medium ${
                  stockInfo.priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stockInfo.priceChange >= 0 ? '+' : ''}{formatNumber(stockInfo.priceChange, { decimals: 2 })} 
                  ({stockInfo.priceChangePercent >= 0 ? '+' : ''}{stockInfo.priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart and Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Key Metrics */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold mb-4">Wichtige Kennzahlen</h3>
          
          <MetricCard
            label="Market Cap"
            value={marketCap ? formatNumber(marketCap.value, { compact: true }) : 'N/A'}
            icon={<DollarSign className="h-5 w-5" />}
          />
          
          <MetricCard
            label="Volumen"
            value={volume ? formatNumber(volume.value, { compact: true }) : 'N/A'}
            icon={<BarChart3 className="h-5 w-5" />}
          />
          
          <MetricCard
            label="EPS (ttm)"
            value={eps ? `${stockCurrency} ${formatNumber(eps.value, { decimals: 2 })}` : 'N/A'}
            icon={<Activity className="h-5 w-5" />}
          />
          
          <MetricCard
            label="KGV (P/E)"
            value={peRatio ? formatNumber(peRatio.value, { decimals: 2 }) : 'N/A'}
            icon={<Percent className="h-5 w-5" />}
          />

          <MetricCard
            label="52-Wochen Spanne"
            value={stockInfo.week52High && stockInfo.week52Low 
              ? `${formatNumber(stockInfo.week52Low)} - ${formatNumber(stockInfo.week52High)}`
              : 'N/A'}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        {/* Right Column: Chart */}
        <div className="lg:col-span-2">
          <Card className="glass h-full">
            <CardHeader>
              <CardTitle>Aktienchart</CardTitle>
            </CardHeader>
            <CardContent>
              <StockChart 
                symbol={stockInfo.ticker}
                currency={stockCurrency}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Predictability Stars */}
      <PredictabilityStarsSection />
    </div>
  );
};
