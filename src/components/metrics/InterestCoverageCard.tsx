import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface InterestCoverageCardProps {
  currentValue: number | null;
  historicalData?: { year: number | string; value: number }[];
}

export const InterestCoverageCard: React.FC<InterestCoverageCardProps> = ({ 
  currentValue, 
  historicalData 
}) => {
  console.log('[InterestCoverageCard] currentValue:', currentValue);
  console.log('[InterestCoverageCard] historicalData:', historicalData);

  // Calculate median for different time periods
  const calculateMedian = (arr: number[]): number => {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  let displayValue: number | null = null;
  let displayLabel = 'Aktuell';
  let chartData = historicalData || [];

  if (historicalData && historicalData.length > 0) {
    // Prefer 10-year median
    if (historicalData.length >= 10) {
      const values = historicalData.slice(-10).map(d => d.value);
      displayValue = calculateMedian(values);
      displayLabel = 'Median 10J';
      console.log('[InterestCoverageCard] 10Y median values:', values, '=> median:', displayValue);
    } 
    // Then 5-year median
    else if (historicalData.length >= 5) {
      const values = historicalData.slice(-5).map(d => d.value);
      displayValue = calculateMedian(values);
      displayLabel = 'Median 5J';
      console.log('[InterestCoverageCard] 5Y median values:', values, '=> median:', displayValue);
    } 
    // Finally 3-year median
    else if (historicalData.length >= 3) {
      const values = historicalData.slice(-3).map(d => d.value);
      displayValue = calculateMedian(values);
      displayLabel = 'Median 3J';
      console.log('[InterestCoverageCard] 3Y median values:', values, '=> median:', displayValue);
    }
    // Fall back to most recent value
    else {
      displayValue = historicalData[historicalData.length - 1].value;
      displayLabel = `${historicalData[historicalData.length - 1].year}`;
      console.log('[InterestCoverageCard] Using most recent value:', displayValue, displayLabel);
    }
  } else if (currentValue !== null) {
    displayValue = currentValue;
    console.log('[InterestCoverageCard] Using currentValue:', displayValue);
  }

  console.log('[InterestCoverageCard] Final displayValue:', displayValue, 'displayLabel:', displayLabel);

  // Check if trend is improving (stable or increasing)
  const isImprovingTrend = (data: typeof historicalData): boolean => {
    if (!data || data.length < 3) return false;
    
    const values = data.map(d => d.value);
    const firstThird = values.slice(0, Math.ceil(values.length / 3));
    const lastThird = values.slice(-Math.ceil(values.length / 3));
    
    const avgFirst = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
    const avgLast = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;
    
    console.log('[InterestCoverageCard] Trend analysis:');
    console.log('  - First third values:', firstThird, '=> avg:', avgFirst);
    console.log('  - Last third values:', lastThird, '=> avg:', avgLast);
    console.log('  - Is improving (stable/rising)?', avgLast >= avgFirst * 0.95);
    
    // Consider stable or improving (within 5% tolerance)
    return avgLast >= avgFirst * 0.95;
  };

  // Scoring logic
  const getScore = (value: number | null): { score: number; maxScore: number; reason: string } => {
    if (value === null) {
      console.log('[InterestCoverageCard] Score: value is null, returning 0/6');
      return { score: 0, maxScore: 6, reason: 'Keine Daten verfügbar' };
    }

    console.log('[InterestCoverageCard] Scoring value:', value);

    let baseScore = 0;
    let reason = '';

    if (value >= 12) {
      baseScore = 6;
      reason = '≥12× (hervorragend)';
    } else if (value >= 8) {
      baseScore = 5;
      reason = '≥8-<12× (stark)';
    } else if (value >= 5) {
      baseScore = 3;
      reason = '≥5-<8× (ok)';
    } else if (value >= 3) {
      baseScore = 1;
      reason = '≥3-<5× (beobachten)';
    } else {
      baseScore = 0;
      reason = '<3× (riskant)';
    }

    console.log('[InterestCoverageCard] Base score:', baseScore, 'Reason:', reason);

    return { score: baseScore, maxScore: 6, reason };
  };

  const { score, maxScore, reason } = getScore(displayValue);

  // Color coding
  const getColor = (value: number | null): string => {
    if (value === null) return 'text-muted-foreground';
    if (value >= 8) return 'text-success';
    if (value >= 5) return 'text-warning';
    return 'text-destructive';
  };

  const getBgColor = (value: number | null): string => {
    if (value === null) return 'bg-muted';
    if (value >= 8) return 'bg-success/10';
    if (value >= 5) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  // Tooltip content for scoring
  const getScoringTooltip = () => (
    <div className="space-y-2 text-sm">
      <p className="font-semibold">Punktevergabe:</p>
      <ul className="space-y-1">
        <li>≥12× → 6 Punkte (hervorragend)</li>
        <li>≥8-&lt;12× → 5 Punkte (stark)</li>
        <li>≥5-&lt;8× → 3 Punkte (ok)</li>
        <li>≥3-&lt;5× → 1 Punkt (beobachten)</li>
        <li>&lt;3× → 0 Punkte (riskant)</li>
      </ul>
      <p className="text-xs text-muted-foreground mt-2">
        {reason}
      </p>
    </div>
  );

  // Main tooltip content
  const tooltipContent = (
    <div className="space-y-3 max-w-md">
      <div>
        <h4 className="font-semibold text-base mb-2">Zinsdeckungsgrad = EBIT / Zinsaufwand</h4>
        <p className="text-sm">
          Er zeigt, <strong>wie oft</strong> das operative Ergebnis (vor Zinsen & Steuern) die <strong>jährlichen Zinsen</strong> deckt.
        </p>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm font-medium">Beispiel:</p>
        <p className="text-sm">EBIT 80, Zinsen 10 ⇒ <strong>8× Zinsdeckung</strong></p>
      </div>
      
      <div>
        <p className="text-sm font-semibold mb-1">Warum wichtig?</p>
        <ul className="space-y-1 text-sm list-disc pl-4">
          <li><strong>Sicherheitsmarge:</strong> Je höher, desto <strong>mehr Puffer</strong> bei Gegenwind.</li>
          <li><strong>Zinsrisiko:</strong> Zeigt, ob steigende Zinsen/Refinanzierungen <strong>verkraftbar</strong> sind.</li>
          <li><strong>Kreditqualität:</strong> Banken & Anleihemärkte achten stark darauf.</li>
        </ul>
      </div>
      
      <div>
        <p className="text-sm font-semibold mb-1">Was ist „gut"?</p>
        <ul className="space-y-1 text-sm">
          <li><span className="text-success">●</span> <strong>Grün (stark):</strong> ≥8× (komfortabel, „Buffett-kompatibel")</li>
          <li><span className="text-warning">●</span> <strong>Gelb (ok):</strong> 5–8× (beobachten, besonders bei Zyklizität)</li>
          <li><span className="text-destructive">●</span> <strong>Rot (riskant):</strong> &lt;3× (anfällig; kleine Rückgänge können wehtun)</li>
        </ul>
      </div>
    </div>
  );

  return (
    <Card className={`${getBgColor(displayValue)} border-l-4 ${displayValue !== null && displayValue >= 8 ? 'border-l-success' : displayValue !== null && displayValue >= 5 ? 'border-l-warning' : 'border-l-destructive'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Zinsdeckungsgrad
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-md">
                  {tooltipContent}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-background/50 cursor-help">
                  <span className="text-sm font-semibold">{score}/{maxScore}</span>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                {getScoringTooltip()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className={`text-3xl font-bold ${getColor(displayValue)}`}>
            {displayValue !== null ? `${displayValue.toFixed(1)}×` : 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">{displayLabel}</div>
        </div>
        
        {chartData && chartData.length > 1 && (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => String(value)}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  domain={[0, 'auto']}
                />
                <RechartsTooltip 
                  formatter={(value: any) => [`${Number(value).toFixed(1)}×`, 'Zinsdeckung']}
                  labelFormatter={(label) => `Jahr: ${label}`}
                />
                <ReferenceLine y={8} stroke="hsl(var(--success))" strokeDasharray="3 3" label={{ value: '8× (stark)', fontSize: 10, fill: 'hsl(var(--success))' }} />
                <ReferenceLine y={5} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ value: '5× (ok)', fontSize: 10, fill: 'hsl(var(--warning))' }} />
                <ReferenceLine y={3} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: '3× (riskant)', fontSize: 10, fill: 'hsl(var(--destructive))' }} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={displayValue !== null && displayValue >= 8 ? 'hsl(var(--success))' : displayValue !== null && displayValue >= 5 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'}
                  strokeWidth={2}
                  dot={{ fill: displayValue !== null && displayValue >= 8 ? 'hsl(var(--success))' : displayValue !== null && displayValue >= 5 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
