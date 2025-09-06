import React from 'react';
import { Card } from '@/components/ui/card';
import { Check, AlertTriangle, X, Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  formatCurrency, 
  shouldConvertCurrency,
  needsCurrencyConversion
} from '@/utils/currencyConverter';

interface FinancialMetric {
  name: string;
  value: number | string;
  formula: string;
  explanation: string;
  threshold: string;
  status: 'pass' | 'warning' | 'fail';
  originalValue?: number | string;
  originalCurrency?: string;
  isPercentage?: boolean;
  isMultiplier?: boolean;
  isAlreadyPercent?: boolean;
}

interface CompactFinancialMetricsProps {
  metrics: FinancialMetric[] | null;
  currency?: string;
}

const MetricStatus: React.FC<{ status: 'pass' | 'warning' | 'fail' }> = ({ status }) => {
  switch (status) {
    case 'pass':
      return <Check className="text-buffett-green h-3 w-3" />;
    case 'warning':
      return <AlertTriangle className="text-buffett-yellow h-3 w-3" />;
    case 'fail':
      return <X className="text-buffett-red h-3 w-3" />;
    default:
      return null;
  }
};

const CompactMetricCard: React.FC<{ metric: FinancialMetric; currency: string }> = ({ metric, currency }) => {
  const { name, value, threshold, status, originalValue, originalCurrency, isPercentage, isMultiplier, isAlreadyPercent } = metric;
  
  const isValueMissing = value === 'N/A' || 
                         (typeof value === 'string' && (value.includes('N/A') || value === '0.00' || value === '0.00%')) ||
                         (typeof value === 'number' && (value === 0 || isNaN(value))) ||
                         value === undefined || 
                         value === null;
  
  const displayValue = isValueMissing ? 'N/A' : value;
  
  let cleanedDisplayValue = displayValue;
  
  if (!isValueMissing) {
    if (metric.isPercentage) {
      if (isAlreadyPercent) {
        cleanedDisplayValue = typeof displayValue === 'number' 
          ? `${displayValue.toLocaleString('de-DE', { maximumFractionDigits: 1 })}%`
          : displayValue;
      } else {
        const percentageValue = typeof displayValue === 'number' ? displayValue * 100 : displayValue;
        cleanedDisplayValue = typeof displayValue === 'number' 
          ? `${percentageValue.toLocaleString('de-DE', { maximumFractionDigits: 1 })}%`
          : displayValue;
      }
    } else if (metric.isMultiplier) {
      cleanedDisplayValue = typeof displayValue === 'number'
        ? `${displayValue.toLocaleString('de-DE', { maximumFractionDigits: 1 })}x`
        : displayValue;
    } else if (originalCurrency && originalValue && shouldConvertCurrency(currency, originalCurrency)) {
      cleanedDisplayValue = formatCurrency(
        value, 
        currency, 
        true, 
        originalValue, 
        originalCurrency,
        metric.isPercentage,
        metric.isMultiplier,
        metric.isAlreadyPercent
      );
    } else {
      cleanedDisplayValue = formatCurrency(
        displayValue, 
        currency,
        false,
        undefined,
        undefined,
        metric.isPercentage,
        metric.isMultiplier,
        metric.isAlreadyPercent
      );
    }
  }
  
  return (
    <div className="flex items-center justify-between p-2 border-b border-border/50 last:border-b-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <MetricStatus status={status} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{name}</div>
          <div className="text-xs text-muted-foreground">{threshold}</div>
        </div>
      </div>
      <div className="text-sm font-semibold text-right ml-2">
        {isValueMissing ? (
          <span className="text-muted-foreground">N/A</span>
        ) : (
          cleanedDisplayValue
        )}
      </div>
    </div>
  );
};

const CompactFinancialMetrics: React.FC<CompactFinancialMetricsProps> = ({ metrics, currency = 'USD' }) => {
  if (!metrics) return null;
  
  const metricsArray = Array.isArray(metrics) ? metrics : [];
  
  const hasConvertedMetrics = metricsArray.some(
    metric => metric.originalCurrency && shouldConvertCurrency(currency, metric.originalCurrency)
  );
  
  return (
    <Card className="h-fit">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Kennzahlen</h3>
          {hasConvertedMetrics && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="rounded-full p-1 bg-muted hover:bg-muted/80 transition-colors">
                  <Info size={14} className="text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="max-w-xs p-3">
                <p className="text-sm">
                  Einige Werte wurden in {currency} umgerechnet. Originalwerte in Klammern.
                </p>
              </PopoverContent>
            </Popover>
          )}
        </div>
        
        <div className="space-y-0">
          {metricsArray.map((metric, index) => (
            <CompactMetricCard key={index} metric={metric} currency={currency} />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default CompactFinancialMetrics;