import React from 'react';
import { useStock } from '@/context/StockContext';
import StockChart from './StockChart';
import PredictabilityStarsSection from './PredictabilityStarsSection';
import { Section, SectionTitle } from './layout/Section';
import { DollarSign, TrendingUp, Users, Building2 } from 'lucide-react';

const formatNumber = (num: number | null, decimals: number = 2): string => {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  
  if (Math.abs(num) >= 1e12) {
    return `${(num / 1e12).toFixed(decimals)}T`;
  } else if (Math.abs(num) >= 1e9) {
    return `${(num / 1e9).toFixed(decimals)}Mrd`;
  } else if (Math.abs(num) >= 1e6) {
    return `${(num / 1e6).toFixed(decimals)}Mio`;
  }
  return num.toFixed(decimals);
};

const OverviewTab: React.FC = () => {
  const { stockInfo, financialMetrics } = useStock();

  if (!stockInfo) return null;

  // Extract specific metrics from the metrics array
  const getMetricValue = (metricName: string): any => {
    if (!financialMetrics?.metrics || !Array.isArray(financialMetrics.metrics)) return null;
    const metric = financialMetrics.metrics.find(m => m.name === metricName);
    return metric?.value ?? null;
  };

  const epsValue = getMetricValue('Gewinn pro Aktie');
  
  const keyMetrics = [
    {
      label: 'Marktkapitalisierung',
      value: stockInfo.marketCap ? `${formatNumber(stockInfo.marketCap)} ${stockInfo.currency}` : 'N/A',
      icon: Building2,
    },
    {
      label: 'Volumen',
      value: 'N/A', // Volume not in metrics array
      icon: TrendingUp,
    },
    {
      label: 'Gewinn je Aktie (EPS)',
      value: epsValue !== null && !isNaN(Number(epsValue))
        ? `${Number(epsValue).toFixed(2)} ${stockInfo.currency}`
        : 'N/A',
      icon: Users,
    },
    {
      label: 'Umsatz (TTM)',
      value: financialMetrics?.historicalData?.revenue?.[0]?.value
        ? `${formatNumber(financialMetrics.historicalData.revenue[0].value)} ${stockInfo.currency}`
        : 'N/A',
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Exchange Info */}
      <Section variant="subtle">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {stockInfo.ticker.includes(':') 
              ? stockInfo.ticker.split(':')[0] 
              : 'NASDAQ'}: {stockInfo.ticker}
          </p>
        </div>
      </Section>

      {/* Chart Section */}
      <Section variant="flat">
        <SectionTitle as="h3">Aktienchart</SectionTitle>
        <StockChart
          symbol={stockInfo.ticker}
          currency={stockInfo.currency}
          intrinsicValue={stockInfo.intrinsicValue}
        />
      </Section>

      {/* Predictability Stars */}
      <PredictabilityStarsSection />

      {/* Key Metrics */}
      <Section variant="flat">
        <SectionTitle as="h3">Wichtige Kennzahlen</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {keyMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="p-4 rounded-2xl border border-border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                </div>
                <p className="text-lg font-semibold mt-1">{metric.value}</p>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
};

export default OverviewTab;
