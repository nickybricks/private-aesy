import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useStock } from '@/context/StockContext';
import { HistoricalDataItem } from '@/context/StockContextTypes';

type TimeRange = '3Y' | '5Y' | '10Y' | 'MAX';

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

const getColorByScore = (score: number, maxScore: number): string => {
  const ratio = score / maxScore;
  if (ratio >= 0.83) return 'text-green-600';
  if (ratio >= 0.67) return 'text-yellow-600';
  if (ratio >= 0.33) return 'text-orange-600';
  return 'text-red-600';
};

const getBgColorByScore = (score: number, maxScore: number): string => {
  const ratio = score / maxScore;
  if (ratio >= 0.83) return 'bg-green-50 border-green-200';
  if (ratio >= 0.67) return 'bg-yellow-50 border-yellow-200';
  if (ratio >= 0.33) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
};

export function EpsWoNriGrowthCard({ historicalEpsWoNri }: EpsWoNriGrowthCardProps) {
  const { stockCurrency } = useStock();
  const [timeRange, setTimeRange] = useState<TimeRange>('MAX');
  const maxScore = 6;

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

    console.log('📊 EPS w/o NRI Card: CAGR Calculation', {
      inputData: {
        length: historicalEpsWoNri?.length || 0,
        latestYear: sortedData[sortedData.length - 1]?.year,
        latestValue: sortedData[sortedData.length - 1]?.value?.toFixed(4)
      },
      calculated: {
        cagr3y: cagr3y !== null ? cagr3y.toFixed(2) + '%' : null,
        cagr5y: cagr5y !== null ? cagr5y.toFixed(2) + '%' : null,
        cagr10y: cagr10y !== null ? cagr10y.toFixed(2) + '%' : null
      }
    });

    return { cagr3y, cagr5y, cagr10y };
  }, [historicalEpsWoNri]);

  // Determine primary CAGR (prioritize longer periods)
  const primaryCAGR = useMemo(() => {
    if (cagrData.cagr10y !== null) return cagrData.cagr10y;
    if (cagrData.cagr5y !== null) return cagrData.cagr5y;
    if (cagrData.cagr3y !== null) return cagrData.cagr3y;
    return null;
  }, [cagrData]);

  const score = getScoreFromCAGR(primaryCAGR);

  console.log('🎯 EPS w/o NRI Card: Primary CAGR Selection', {
    selected: primaryCAGR !== null ? primaryCAGR.toFixed(2) + '%' : null,
    priority: cagrData.cagr10y !== null ? '10Y' : cagrData.cagr5y !== null ? '5Y' : cagrData.cagr3y !== null ? '3Y' : 'None',
    score,
    maxScore
  });

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
    const data = filteredData.map((item, index) => {
      const growthRate = index > 0 && filteredData[index - 1].value > 0
        ? ((item.value - filteredData[index - 1].value) / filteredData[index - 1].value) * 100
        : null;

      return {
        year: item.year,
        value: item.value,
        growthRate: growthRate,
      };
    });

    console.log('📈 EPS w/o NRI Card: Chart Data Prepared', {
      timeRange,
      dataPoints: data.length,
      yearRange: data.length > 0 ? {
        from: data[0].year,
        to: data[data.length - 1].year
      } : null,
      avgGrowthRate: data.length > 1 
        ? (data.reduce((sum, d) => sum + (d.growthRate || 0), 0) / data.filter(d => d.growthRate !== null).length).toFixed(2) + '%'
        : null
    });

    return data;
  }, [historicalEpsWoNri, timeRange]);

  const mainTooltipContent = (
    <div className="space-y-3 max-w-md">
      <div>
        <p className="font-semibold">EPS w/o NRI-Wachstum</p>
        <p className="text-sm text-muted-foreground">(EPS without NRI Growth = Earnings per Share without Non-Recurring Items Growth)</p>
        <p className="text-xs mt-1">
          <strong>Gewinn je Aktie ohne Sondereffekte</strong> – zeigt das bereinigte Gewinnwachstum.
        </p>
      </div>
      
      <div className="text-xs">
        <p className="mb-2">
          Die <strong>Growth Rate</strong> zeigt, wie stark dieser <strong>bereinigte Gewinn je Aktie</strong> über die Zeit wächst (YoY oder als <strong>CAGR</strong> über 3/5/10 Jahre).
        </p>
        <p className="text-[10px] italic">
          Beispiel (CAGR): EPS w/o NRI 1,00 → 1,26 → 1,58 → 1,98 in 3 Jahren ⇒ <strong>≈ 25 % p. a.</strong>
        </p>
      </div>

      <div className="text-xs">
        <p className="font-medium mb-1">Warum wichtig?</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Saubere Ertragskraft:</strong> Blendet Einmaleffekte aus → <strong>ehrliches</strong> Gewinnwachstum.</li>
          <li><strong>Aktionärssicht:</strong> "Je Aktie" berücksichtigt Verwässerung/Rückkäufe.</li>
          <li><strong>Bewertung & Moat:</strong> Stabiles EPS-Wachstum stützt <strong>Wert</strong> (P/E), besonders wenn <strong>ROIC &gt; WACC</strong>.</li>
        </ul>
      </div>
    </div>
  );

  const scoringTooltip = (
    <div className="space-y-1">
      <p className="font-medium text-sm">Bewertungssystem (0-6 Punkte):</p>
      <p className="text-sm"><span className="text-success">●</span> 6 Punkte: ≥ 15%</p>
      <p className="text-sm"><span className="text-chart-2">●</span> 5 Punkte: 12–&lt;15%</p>
      <p className="text-sm"><span className="text-chart-2">●</span> 4 Punkte: 9–&lt;12%</p>
      <p className="text-sm"><span className="text-warning">●</span> 2 Punkte: 6–&lt;9%</p>
      <p className="text-sm"><span className="text-chart-4">●</span> 1 Punkt: 3–&lt;6%</p>
      <p className="text-sm"><span className="text-destructive">●</span> 0 Punkte: &lt; 3%</p>
    </div>
  );

  if (!historicalEpsWoNri || historicalEpsWoNri.length < 2) {
    return (
      <Card className="p-4 border-2 border-muted">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-lg">EPS w/o NRI-Wachstum (EPS without NRI Growth)</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-md">
                {mainTooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">
          Nicht genügend historische EPS w/o NRI-Daten verfügbar.
        </p>
      </Card>
    );
  }

  return (
    <Card className={`p-4 border-2 ${getBgColorByScore(score, maxScore)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">EPS w/o NRI-Wachstum (EPS without NRI Growth)</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-md">
                {mainTooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getColorByScore(score, maxScore)}`}>
            {primaryCAGR !== null ? `${primaryCAGR.toFixed(1)}%` : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">
            CAGR
          </div>
        </div>
      </div>

      {/* Score indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm font-medium">Bewertung:</div>
        <div className={`px-2 py-1 rounded text-sm font-semibold ${getColorByScore(score, maxScore)}`}>
          {score}/{maxScore} Punkte
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right">
              {scoringTooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* KPIs as 3-column grid */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        {cagrData.cagr3y !== null && (
          <div>
            <p className="text-xs text-muted-foreground">CAGR 3 Jahre</p>
            <p className={`font-semibold ${cagrData.cagr3y >= 9 ? 'text-green-600' : cagrData.cagr3y >= 6 ? 'text-yellow-600' : ''}`}>
              {cagrData.cagr3y.toFixed(1)}%
            </p>
          </div>
        )}
        
        {cagrData.cagr5y !== null && (
          <div>
            <p className="text-xs text-muted-foreground">CAGR 5 Jahre</p>
            <p className={`font-semibold ${cagrData.cagr5y >= 9 ? 'text-green-600' : cagrData.cagr5y >= 6 ? 'text-yellow-600' : ''}`}>
              {cagrData.cagr5y.toFixed(1)}%
            </p>
          </div>
        )}
        
        {cagrData.cagr10y !== null && (
          <div>
            <p className="text-xs text-muted-foreground">CAGR 10 Jahre</p>
            <p className={`font-semibold ${cagrData.cagr10y >= 9 ? 'text-green-600' : cagrData.cagr10y >= 6 ? 'text-yellow-600' : ''}`}>
              {cagrData.cagr10y.toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {/* Meta Row with tooltips */}
      <div className="flex items-center justify-start gap-2 text-xs text-muted-foreground mb-4 flex-wrap">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                Primär CAGR <span className={`font-bold ${getColorByScore(score, maxScore)}`}>
                  {primaryCAGR !== null ? `${primaryCAGR.toFixed(1)}%` : 'N/A'}
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Beste verfügbare CAGR (bevorzugt 10Y, dann 5Y, dann 3Y)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span>•</span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                Bewertung <span className={`font-bold ${getColorByScore(score, maxScore)}`}>
                  {score >= 5 ? 'Exzellent' : score >= 4 ? 'Sehr Gut' : score >= 2 ? 'Gut' : score >= 1 ? 'Schwach' : 'Ungenügend'}
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Qualitatives Rating basierend auf CAGR</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end gap-1 mb-3 overflow-x-auto pb-1">
        {(['3Y', '5Y', '10Y', 'MAX'] as TimeRange[]).map(range => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
            className="text-xs h-7 px-2.5 whitespace-nowrap"
          >
            {range === 'MAX' ? 'MAX' : range.replace('Y', 'J')}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="year"
              tick={{ fontSize: 10 }}
              stroke="#9ca3af"
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 10 }}
              stroke="#9ca3af"
              domain={['auto', 'auto']}
              width={60}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10 }}
              stroke="#9ca3af"
              width={60}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                      <p className="text-xs font-semibold mb-1">{data.year}</p>
                      <p className="text-sm text-blue-600">
                        EPS w/o NRI: <span className="font-bold">{data.value.toFixed(2)} {stockCurrency}</span>
                      </p>
                      {data.growthRate !== null && (
                        <p className="text-sm text-green-600">
                          Wachstum: <span className={`font-bold ${data.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.growthRate >= 0 ? '+' : ''}{data.growthRate.toFixed(1)}%
                          </span>
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* Reference lines for growth targets */}
            <ReferenceLine yAxisId="right" y={15} stroke="#16a34a" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine yAxisId="right" y={9} stroke="#ca8a04" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine yAxisId="right" y={6} stroke="#ea580c" strokeDasharray="3 3" opacity={0.5} />
            
            {/* EPS w/o NRI Line (blue) */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="value" 
              stroke="#2563eb" 
              strokeWidth={2.5}
              dot={false}
              name="EPS w/o NRI"
            />
            
            {/* Growth Rate Line (green) */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="growthRate" 
              stroke="#16a34a" 
              strokeWidth={2.5}
              dot={false}
              name="Wachstum"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-blue-600 rounded"></span>
            EPS w/o NRI ({stockCurrency})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-green-600 rounded"></span>
            Wachstum (%)
          </span>
          <span className="flex items-center gap-1">
            <span className="text-green-600">---</span>
            15% (Exzellent)
          </span>
          <span className="flex items-center gap-1">
            <span className="text-yellow-600">---</span>
            9% (Sehr Gut)
          </span>
          <span className="flex items-center gap-1">
            <span className="text-orange-600">---</span>
            6% (Gut)
          </span>
        </div>
      </div>
    </Card>
  );
}
