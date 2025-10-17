import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { Info, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { useStock } from '@/context/StockContext';
import { HistoricalDataItem } from '@/context/StockContextTypes';

type TimeRange = '3Y' | '5Y' | '10Y' | 'ALL';

interface RevenueGrowthCardProps {
  historicalRevenue: HistoricalDataItem[];
}

const calculateCAGR = (startValue: number, endValue: number, years: number): number => {
  if (startValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

const getScoreFromCAGR = (cagr: number): number => {
  if (cagr >= 12) return 4;
  if (cagr >= 8) return 3;
  if (cagr >= 5) return 2;
  if (cagr >= 2) return 1;
  return 0;
};

const getScoreColor = (score: number): string => {
  if (score >= 4) return 'text-success border-success/50';
  if (score >= 3) return 'text-chart-2 border-chart-2/50';
  if (score >= 2) return 'text-warning border-warning/50';
  if (score >= 1) return 'text-chart-4 border-chart-4/50';
  return 'text-destructive border-destructive/50';
};

const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
  if (score >= 3) return 'default';
  if (score >= 2) return 'secondary';
  return 'destructive';
};

export const RevenueGrowthCard: React.FC<RevenueGrowthCardProps> = ({ historicalRevenue }) => {
  const { stockCurrency } = useStock();
  const [timeRange, setTimeRange] = useState<TimeRange>('10Y');

  // Calculate CAGRs for different periods
  const cagrData = useMemo(() => {
    if (!historicalRevenue || historicalRevenue.length < 2) {
      return { cagr3Y: null, cagr5Y: null, cagr10Y: null };
    }

    const sortedData = [...historicalRevenue].sort((a, b) => 
      parseInt(a.year) - parseInt(b.year)
    );

    const latestYear = sortedData[sortedData.length - 1];
    const latestValue = latestYear.value;

    const cagr3Y = sortedData.length >= 4 ? 
      calculateCAGR(sortedData[sortedData.length - 4].value, latestValue, 3) : null;
    
    const cagr5Y = sortedData.length >= 6 ? 
      calculateCAGR(sortedData[sortedData.length - 6].value, latestValue, 5) : null;
    
    const cagr10Y = sortedData.length >= 11 ? 
      calculateCAGR(sortedData[sortedData.length - 11].value, latestValue, 10) : null;

    return { cagr3Y, cagr5Y, cagr10Y };
  }, [historicalRevenue]);

  // Use the best available CAGR (prefer longer periods)
  const primaryCAGR = cagrData.cagr10Y ?? cagrData.cagr5Y ?? cagrData.cagr3Y ?? 0;
  const score = getScoreFromCAGR(primaryCAGR);
  const scoreColor = getScoreColor(score);

  // Filter data based on time range
  const chartData = useMemo(() => {
    if (!historicalRevenue || historicalRevenue.length === 0) return [];

    const sortedData = [...historicalRevenue].sort((a, b) => 
      parseInt(a.year) - parseInt(b.year)
    );

    let filtered = sortedData;
    if (timeRange !== 'ALL') {
      const years = parseInt(timeRange);
      filtered = sortedData.slice(-years - 1);
    }

    return filtered.map((item, index, arr) => {
      const revenue = item.value / 1_000_000; // Convert to millions
      let growthRate = null;
      
      if (index > 0) {
        const prevRevenue = arr[index - 1].value;
        if (prevRevenue > 0) {
          growthRate = ((item.value - prevRevenue) / prevRevenue) * 100;
        }
      }

      return {
        year: item.year,
        revenue,
        growthRate
      };
    });
  }, [historicalRevenue, timeRange]);

  const tooltipContent = (
    <div className="space-y-3 text-sm">
      <div>
        <h4 className="font-semibold mb-2">Was ist Revenue Growth?</h4>
        <p className="text-muted-foreground">
          <strong>Umsatzwachstum = Wie stark die Erlöse steigen (oder fallen).</strong>
        </p>
      </div>
      
      <div>
        <p className="text-muted-foreground mb-2">Man betrachtet meist:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li><strong>YoY</strong> (Jahr-zu-Jahr) – kurzfristiger Blick.</li>
          <li><strong>CAGR</strong> (durchschnittliche jährliche Wachstumsrate über 3/5/10 Jahre) – <strong>stabilerer</strong> Blick.</li>
        </ul>
        <p className="text-muted-foreground mt-2 text-xs italic">
          Beispiel: 1.000 → 1.100 → 1.210 → 1.331 in 3 Jahren ⇒ <strong>CAGR ≈ 10 % p. a.</strong>
        </p>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Warum wichtig?</h4>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li><strong>Größenmotor:</strong> Ohne Umsatzwachstum ist nachhaltiges Gewinn-/Cash-Wachstum schwer.</li>
          <li><strong>Preissetzungsmacht:</strong> Wachstum aus <strong>Preis</strong> + <strong>Menge</strong> zeigt Marktmacht.</li>
          <li><strong>Skalierung:</strong> Langanhaltendes Wachstum erlaubt Margenhebel.</li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Punktelogik (CAGR):</h4>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>≥ 12% → <span className="text-success font-semibold">4 Punkte</span></li>
          <li>8–&lt;12% → <span className="text-chart-2 font-semibold">3 Punkte</span></li>
          <li>5–&lt;8% → <span className="text-warning font-semibold">2 Punkte</span></li>
          <li>2–&lt;5% → <span className="text-chart-4 font-semibold">1 Punkt</span></li>
          <li>&lt; 2% → <span className="text-destructive font-semibold">0 Punkte</span></li>
        </ul>
      </div>
    </div>
  );

  if (!historicalRevenue || historicalRevenue.length < 2) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Growth (Umsatzwachstum)
            <ClickableTooltip content={tooltipContent}>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </ClickableTooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nicht genügend historische Umsatzdaten verfügbar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 transition-colors ${scoreColor}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Growth (Umsatzwachstum)
            <ClickableTooltip content={tooltipContent}>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </ClickableTooltip>
          </div>
          <Badge variant={getScoreBadgeVariant(score)} className="text-sm font-semibold">
            {score} / 4 Punkte
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cagrData.cagr3Y !== null && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">CAGR 3 Jahre</p>
              <p className={`text-xl font-bold ${cagrData.cagr3Y >= 8 ? 'text-success' : cagrData.cagr3Y >= 5 ? 'text-warning' : 'text-muted-foreground'}`}>
                {cagrData.cagr3Y.toFixed(1)}%
              </p>
            </div>
          )}
          
          {cagrData.cagr5Y !== null && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">CAGR 5 Jahre</p>
              <p className={`text-xl font-bold ${cagrData.cagr5Y >= 8 ? 'text-success' : cagrData.cagr5Y >= 5 ? 'text-warning' : 'text-muted-foreground'}`}>
                {cagrData.cagr5Y.toFixed(1)}%
              </p>
            </div>
          )}
          
          {cagrData.cagr10Y !== null && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">CAGR 10 Jahre</p>
              <p className={`text-xl font-bold ${cagrData.cagr10Y >= 8 ? 'text-success' : cagrData.cagr10Y >= 5 ? 'text-warning' : 'text-muted-foreground'}`}>
                {cagrData.cagr10Y.toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        {/* Compact Meta Row */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <div>
            <span className="font-medium">Primär CAGR:</span>{' '}
            <span className="font-semibold">{primaryCAGR.toFixed(1)}%</span>
          </div>
          <div>
            <span className="font-medium">Bewertung:</span>{' '}
            <span className={scoreColor.split(' ')[0]}>
              {score >= 4 ? 'Exzellent' : score >= 3 ? 'Gut' : score >= 2 ? 'Akzeptabel' : score >= 1 ? 'Schwach' : 'Ungenügend'}
            </span>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 justify-center">
          {(['3Y', '5Y', '10Y', 'ALL'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Historisches Umsatzwachstum</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="year" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                yAxisId="left"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: `Umsatz (Mio. ${stockCurrency})`, angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Wachstum (%)', angle: 90, position: 'insideRight', style: { fill: 'hsl(var(--muted-foreground))' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'revenue') {
                    return [`${value.toFixed(2)} Mio. ${stockCurrency}`, 'Umsatz'];
                  }
                  if (name === 'growthRate' && value !== null) {
                    return [`${value.toFixed(1)}%`, 'Wachstum'];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                name="Umsatz"
                dot={{ fill: 'hsl(var(--chart-1))' }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="growthRate" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="Wachstum"
                dot={{ fill: 'hsl(var(--chart-2))' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
