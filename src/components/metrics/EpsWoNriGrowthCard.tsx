import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, TrendingUp } from 'lucide-react';
import { HistoricalDataItem } from '@/context/StockContextTypes';

interface EpsWoNriGrowthCardProps {
  historicalEpsWoNri: HistoricalDataItem[];
}

// Calculate CAGR (Compound Annual Growth Rate)
const calculateCAGR = (startValue: number, endValue: number, years: number): number | null => {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return null;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

// Get score from CAGR value (0-6 points)
const getScoreFromCAGR = (cagr: number | null): number => {
  if (cagr === null) return 0;
  if (cagr >= 15) return 6;
  if (cagr >= 12) return 5;
  if (cagr >= 9) return 4;
  if (cagr >= 6) return 2;
  if (cagr >= 3) return 1;
  return 0;
};

// Color based on score
const getColorByScore = (score: number): string => {
  if (score >= 5) return 'text-green-600 dark:text-green-400';
  if (score >= 3) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 1) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const getBgColorByScore = (score: number): string => {
  if (score >= 5) return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
  if (score >= 3) return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
  if (score >= 1) return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800';
  return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
};

export function EpsWoNriGrowthCard({ historicalEpsWoNri }: EpsWoNriGrowthCardProps) {
  const [timeRange, setTimeRange] = useState<'3Y' | '5Y' | '10Y' | 'MAX'>('MAX');

  // Calculate CAGRs for different time periods
  const cagrData = useMemo(() => {
    if (!historicalEpsWoNri || historicalEpsWoNri.length < 2) {
      return { cagr3y: null, cagr5y: null, cagr10y: null };
    }

    const sortedData = [...historicalEpsWoNri].sort((a, b) => 
      parseInt(a.year) - parseInt(b.year)
    );

    const latestYear = sortedData[sortedData.length - 1];
    const latestValue = latestYear.value;
    
    // 3-year CAGR
    const year3Ago = sortedData.find(d => parseInt(d.year) === parseInt(latestYear.year) - 3);
    const cagr3y = year3Ago ? calculateCAGR(year3Ago.value, latestValue, 3) : null;

    // 5-year CAGR
    const year5Ago = sortedData.find(d => parseInt(d.year) === parseInt(latestYear.year) - 5);
    const cagr5y = year5Ago ? calculateCAGR(year5Ago.value, latestValue, 5) : null;

    // 10-year CAGR
    const year10Ago = sortedData.find(d => parseInt(d.year) === parseInt(latestYear.year) - 10);
    const cagr10y = year10Ago ? calculateCAGR(year10Ago.value, latestValue, 10) : null;

    return { cagr3y, cagr5y, cagr10y };
  }, [historicalEpsWoNri]);

  // Determine primary CAGR (prioritize longer periods)
  const primaryCAGR = useMemo(() => {
    if (cagrData.cagr10y !== null) return cagrData.cagr10y;
    if (cagrData.cagr5y !== null) return cagrData.cagr5y;
    if (cagrData.cagr3y !== null) return cagrData.cagr3y;
    return null;
  }, [cagrData]);

  const score = useMemo(() => getScoreFromCAGR(primaryCAGR), [primaryCAGR]);

  // Prepare chart data with growth rates
  const chartData = useMemo(() => {
    if (!historicalEpsWoNri || historicalEpsWoNri.length < 2) return [];

    const sortedData = [...historicalEpsWoNri].sort((a, b) => 
      parseInt(a.year) - parseInt(b.year)
    );

    // Filter by time range
    let filteredData = sortedData;
    const latestYear = parseInt(sortedData[sortedData.length - 1].year);
    
    if (timeRange === '3Y') {
      filteredData = sortedData.filter(d => parseInt(d.year) >= latestYear - 3);
    } else if (timeRange === '5Y') {
      filteredData = sortedData.filter(d => parseInt(d.year) >= latestYear - 5);
    } else if (timeRange === '10Y') {
      filteredData = sortedData.filter(d => parseInt(d.year) >= latestYear - 10);
    }

    // Calculate year-over-year growth
    return filteredData.map((item, index) => {
      const growthRate = index > 0 && filteredData[index - 1].value > 0
        ? ((item.value - filteredData[index - 1].value) / filteredData[index - 1].value) * 100
        : null;

      return {
        year: item.year,
        value: item.value,
        growthRate: growthRate,
      };
    });
  }, [historicalEpsWoNri, timeRange]);

  if (!historicalEpsWoNri || historicalEpsWoNri.length < 2) {
    return (
      <Card className="p-6 bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            EPS w/o NRI Wachstum
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Nicht genügend historische Daten verfügbar (mindestens 2 Jahre erforderlich).
        </p>
      </Card>
    );
  }

  return (
    <Card className={`p-6 border-2 transition-all ${getBgColorByScore(score)}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5" />
              <h3 className="text-lg font-semibold">EPS w/o NRI Wachstum</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-0.5 hover:bg-accent rounded-full transition-colors">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <div className="space-y-2">
                      <p className="font-semibold">Was ist EPS w/o NRI Wachstum?</p>
                      <p className="text-sm">
                        <strong>EPS w/o NRI</strong> = <strong>Gewinn je Aktie</strong> (<em>Earnings per Share</em>) <strong>ohne Sondereffekte</strong> (<em>Non-Recurring Items</em>).
                      </p>
                      <p className="text-sm">
                        Die <strong>Growth Rate</strong> zeigt, wie stark dieser <strong>bereinigte Gewinn je Aktie</strong> über die Zeit wächst (YoY oder als <strong>CAGR</strong> über 3/5/10 Jahre).
                      </p>
                      <p className="text-sm">
                        Beispiel (CAGR): EPS w/o NRI 1,00 → 1,26 → 1,58 → 1,98 in 3 Jahren ⇒ <strong>≈ 25 % p. a.</strong>
                      </p>
                      <hr className="my-2" />
                      <p className="font-semibold text-sm">Warum wichtig?</p>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        <li><strong>Saubere Ertragskraft:</strong> Blendet Einmaleffekte aus → <strong>ehrliches</strong> Gewinnwachstum.</li>
                        <li><strong>Aktionärssicht:</strong> "Je Aktie" berücksichtigt Verwässerung/Rückkäufe.</li>
                        <li><strong>Bewertung & Moat:</strong> Stabiles EPS-Wachstum stützt <strong>Wert</strong> (P/E), besonders wenn <strong>ROIC &gt; WACC</strong>.</li>
                      </ul>
                      <hr className="my-2" />
                      <p className="font-semibold text-sm">Punktelogik (CAGR):</p>
                      <ul className="text-sm space-y-0.5 list-none">
                        <li>≥ 15 % → 6 Punkte</li>
                        <li>12–&lt;15 % → 5 Punkte</li>
                        <li>9–&lt;12 % → 4 Punkte</li>
                        <li>6–&lt;9 % → 2 Punkte</li>
                        <li>3–&lt;6 % → 1 Punkt</li>
                        <li>&lt; 3 % → 0 Punkte</li>
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-3xl font-bold ${getColorByScore(score)}`}>
              {primaryCAGR !== null ? `${primaryCAGR.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Score: <span className={`font-semibold ${getColorByScore(score)}`}>{score}/6</span>
            </div>
          </div>
        </div>

        {/* CAGR KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-background/50 dark:bg-background/30 rounded-lg p-3 border">
            <div className="text-xs text-muted-foreground mb-1">3Y CAGR</div>
            <div className={`text-lg font-semibold ${cagrData.cagr3y !== null ? (cagrData.cagr3y >= 9 ? 'text-green-600 dark:text-green-400' : cagrData.cagr3y >= 6 ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400') : 'text-muted-foreground'}`}>
              {cagrData.cagr3y !== null ? `${cagrData.cagr3y.toFixed(1)}%` : 'N/A'}
            </div>
          </div>
          <div className="bg-background/50 dark:bg-background/30 rounded-lg p-3 border">
            <div className="text-xs text-muted-foreground mb-1">5Y CAGR</div>
            <div className={`text-lg font-semibold ${cagrData.cagr5y !== null ? (cagrData.cagr5y >= 9 ? 'text-green-600 dark:text-green-400' : cagrData.cagr5y >= 6 ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400') : 'text-muted-foreground'}`}>
              {cagrData.cagr5y !== null ? `${cagrData.cagr5y.toFixed(1)}%` : 'N/A'}
            </div>
          </div>
          <div className="bg-background/50 dark:bg-background/30 rounded-lg p-3 border">
            <div className="text-xs text-muted-foreground mb-1">10Y CAGR</div>
            <div className={`text-lg font-semibold ${cagrData.cagr10y !== null ? (cagrData.cagr10y >= 9 ? 'text-green-600 dark:text-green-400' : cagrData.cagr10y >= 6 ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400') : 'text-muted-foreground'}`}>
              {cagrData.cagr10y !== null ? `${cagrData.cagr10y.toFixed(1)}%` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Meta info row - compact */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium">Datenpunkte:</span>
            <span>{historicalEpsWoNri.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Zeitraum:</span>
            <span>
              {historicalEpsWoNri[0]?.year} - {historicalEpsWoNri[historicalEpsWoNri.length - 1]?.year}
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-3">
          {/* Time range selector */}
          <div className="flex justify-end gap-2">
            {(['3Y', '5Y', '10Y', 'MAX'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="year" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                stroke="hsl(var(--border))"
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                stroke="hsl(var(--border))"
                label={{ value: 'EPS w/o NRI', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 } }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                stroke="hsl(var(--border))"
                label={{ value: 'Wachstumsrate (%)', angle: 90, position: 'insideRight', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 } }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--popover-foreground))'
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                formatter={(value: any, name: string) => {
                  if (name === 'EPS w/o NRI') {
                    return [typeof value === 'number' ? value.toFixed(2) : value, name];
                  }
                  if (name === 'Wachstum YoY') {
                    return [typeof value === 'number' ? `${value.toFixed(1)}%` : 'N/A', name];
                  }
                  return [value, name];
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="line"
              />
              
              {/* Reference lines for growth targets */}
              <ReferenceLine 
                yAxisId="right"
                y={15} 
                stroke="hsl(142, 71%, 45%)" 
                strokeDasharray="3 3" 
                opacity={0.6}
                label={{ value: '15% (6 Punkte)', position: 'right', fill: 'hsl(142, 71%, 45%)', fontSize: 10 }}
              />
              <ReferenceLine 
                yAxisId="right"
                y={9} 
                stroke="hsl(47, 96%, 53%)" 
                strokeDasharray="3 3" 
                opacity={0.6}
                label={{ value: '9% (4 Punkte)', position: 'right', fill: 'hsl(47, 96%, 53%)', fontSize: 10 }}
              />
              <ReferenceLine 
                yAxisId="right"
                y={6} 
                stroke="hsl(25, 95%, 53%)" 
                strokeDasharray="3 3" 
                opacity={0.6}
                label={{ value: '6% (2 Punkte)', position: 'right', fill: 'hsl(25, 95%, 53%)', fontSize: 10 }}
              />
              
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="EPS w/o NRI"
                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="growthRate" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="Wachstum YoY"
                dot={{ fill: 'hsl(var(--chart-2))', r: 3 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
