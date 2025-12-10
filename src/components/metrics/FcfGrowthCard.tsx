import React, { useState, useMemo } from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';

type TimeRange = '3Y' | '5Y' | '10Y' | 'MAX';

interface FcfGrowthCardProps {
  historicalFcf: HistoricalDataItem[];
}

const calculateCAGR = (startValue: number, endValue: number, years: number): number => {
  if (startValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

const getScoreFromCAGR = (cagr: number): number => {
  if (cagr >= 12) return 6;
  if (cagr >= 10) return 5;
  if (cagr >= 7) return 4;
  if (cagr >= 4) return 2;
  if (cagr >= 2) return 1;
  return 0;
};

const getColorByScore = (score: number, maxScore: number): string => {
  const ratio = score / maxScore;
  if (ratio === 1) return 'text-green-600';
  if (ratio >= 0.67) return 'text-yellow-600';
  if (ratio >= 0.33) return 'text-orange-600';
  return 'text-red-600';
};

const getBgColorByScore = (score: number, maxScore: number): string => {
  if (maxScore === 0) return 'bg-gray-100 border-gray-300';
  const ratio = score / maxScore;
  if (ratio === 1) return 'bg-green-50 border-green-200';
  if (ratio >= 0.67) return 'bg-yellow-50 border-yellow-200';
  if (ratio >= 0.33) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
};

export const FcfGrowthCard: React.FC<FcfGrowthCardProps> = ({ historicalFcf }) => {
  const { stockCurrency } = useStock();
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState<TimeRange>('MAX');
  const maxScore = 6;

  // Calculate CAGRs for different periods
  const cagrData = useMemo(() => {
    if (!historicalFcf || historicalFcf.length < 2) {
      return { cagr3Y: null, cagr5Y: null, cagr10Y: null };
    }

    const sortedData = [...historicalFcf].sort((a, b) => 
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
  }, [historicalFcf]);

  // Use the best available CAGR (prefer longer periods)
  const primaryCAGR = cagrData.cagr10Y ?? cagrData.cagr5Y ?? cagrData.cagr3Y ?? 0;
  const score = getScoreFromCAGR(primaryCAGR);

  // Filter data based on time range
  const chartData = useMemo(() => {
    if (!historicalFcf || historicalFcf.length === 0) return [];

    const sortedData = [...historicalFcf].sort((a, b) => 
      parseInt(a.year) - parseInt(b.year)
    );

    let filtered = sortedData;
    if (timeRange !== 'MAX') {
      const years = parseInt(timeRange);
      filtered = sortedData.slice(-years - 1);
    }

    return filtered.map((item, index, arr) => {
      const fcf = item.value / 1_000_000; // Convert to millions
      let growthRate = null;
      
      if (index > 0) {
        const prevFcf = arr[index - 1].value;
        if (prevFcf > 0) {
          growthRate = ((item.value - prevFcf) / prevFcf) * 100;
        }
      }

      return {
        year: item.year,
        fcf,
        growthRate
      };
    });
  }, [historicalFcf, timeRange]);

  const mainTooltipContent = (
    <div className="space-y-3 max-w-md">
      <div>
        <p className="font-semibold">FCF-Wachstum</p>
        <p className="text-sm text-muted-foreground">(Free Cash Flow Growth)</p>
        <p className="text-xs mt-1">
          <strong>Free Cash Flow (FCF) = Operativer Cashflow − Investitionen (Capex).</strong>
        </p>
      </div>
      
      <div className="text-xs">
        <p className="mb-2">
          Die <strong>FCF Growth Rate</strong> zeigt, wie stark der <strong>freie Cash</strong> eines Unternehmens über die Zeit steigt (YoY oder als <strong>CAGR</strong> über 3/5/10 Jahre).
        </p>
        <p className="text-[10px] italic">
          Beispiel: FCF 100 → 121 → 146 → 176 ⇒ <strong>CAGR ≈ 20 % p. a.</strong>
        </p>
      </div>

      <div className="text-xs">
        <p className="font-medium mb-1">Warum wichtig?</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Ausschüttungs-Power:</strong> Aus FCF werden <strong>Dividenden</strong>, <strong>Rückkäufe</strong> und <strong>Schuldenabbau</strong> bezahlt.</li>
          <li><strong>Qualitätsmaß:</strong> Cash ist schwerer zu „schönen" als Buchgewinne.</li>
          <li><strong>Bewertung:</strong> Steigender, stabiler FCF stützt <strong>P/FCF</strong>, <strong>EV/EBIT</strong> und den <strong>inneren Wert</strong>.</li>
        </ul>
      </div>
    </div>
  );

  const scoringTooltip = (
    <div className="space-y-1">
      <p className="font-medium text-sm">Bewertungssystem (0-6 Punkte):</p>
      <p className="text-sm"><span className="text-success">●</span> 6 Punkte: ≥ 12%</p>
      <p className="text-sm"><span className="text-chart-2">●</span> 5 Punkte: 10–&lt;12%</p>
      <p className="text-sm"><span className="text-chart-2">●</span> 4 Punkte: 7–&lt;10%</p>
      <p className="text-sm"><span className="text-warning">●</span> 2 Punkte: 4–&lt;7%</p>
      <p className="text-sm"><span className="text-chart-4">●</span> 1 Punkt: 2–&lt;4%</p>
      <p className="text-sm"><span className="text-destructive">●</span> 0 Punkte: &lt; 2%</p>
    </div>
  );

  if (!historicalFcf || historicalFcf.length < 2) {
    return (
      <Card className="p-4 border-2 border-muted">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-lg">FCF-Wachstum (Free Cash Flow Growth)</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "top" : "right"} className="max-w-md">
                {mainTooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">
          Nicht genügend historische FCF-Daten verfügbar.
        </p>
      </Card>
    );
  }

  return (
    <Card className={`p-4 border-2 ${getBgColorByScore(score, maxScore)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">FCF-Wachstum (Free Cash Flow Growth)</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "top" : "right"} className="max-w-md">
                {mainTooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getColorByScore(score, maxScore)}`}>
            {primaryCAGR.toFixed(1)}%
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
            <TooltipContent side={isMobile ? "top" : "right"}>
              {scoringTooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* KPIs as 3-column grid */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        {cagrData.cagr3Y !== null && (
          <div>
            <p className="text-xs text-muted-foreground">CAGR 3 Jahre</p>
            <p className={`font-semibold ${cagrData.cagr3Y >= 7 ? 'text-green-600' : cagrData.cagr3Y >= 4 ? 'text-yellow-600' : ''}`}>
              {cagrData.cagr3Y.toFixed(1)}%
            </p>
          </div>
        )}
        
        {cagrData.cagr5Y !== null && (
          <div>
            <p className="text-xs text-muted-foreground">CAGR 5 Jahre</p>
            <p className={`font-semibold ${cagrData.cagr5Y >= 7 ? 'text-green-600' : cagrData.cagr5Y >= 4 ? 'text-yellow-600' : ''}`}>
              {cagrData.cagr5Y.toFixed(1)}%
            </p>
          </div>
        )}
        
        {cagrData.cagr10Y !== null && (
          <div>
            <p className="text-xs text-muted-foreground">CAGR 10 Jahre</p>
            <p className={`font-semibold ${cagrData.cagr10Y >= 7 ? 'text-green-600' : cagrData.cagr10Y >= 4 ? 'text-yellow-600' : ''}`}>
              {cagrData.cagr10Y.toFixed(1)}%
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
                  {primaryCAGR.toFixed(1)}%
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
                  {score >= 6 ? 'Exzellent' : score >= 4 ? 'Sehr Gut' : score >= 2 ? 'Gut' : score >= 1 ? 'Schwach' : 'Ungenügend'}
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
              allowEscapeViewBox={{ x: false, y: false }}
              wrapperStyle={{ zIndex: 50, maxWidth: 'calc(100vw - 32px)', overflow: 'hidden' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                      <p className="text-xs font-semibold mb-1">{data.year}</p>
                      <p className="text-sm text-blue-600">
                        FCF: <span className="font-bold">{data.fcf.toFixed(2)} Mio. {stockCurrency}</span>
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
            <ReferenceLine yAxisId="right" y={12} stroke="#16a34a" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine yAxisId="right" y={7} stroke="#ca8a04" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine yAxisId="right" y={4} stroke="#ea580c" strokeDasharray="3 3" opacity={0.5} />
            
            {/* FCF Line (blue) */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="fcf" 
              stroke="#2563eb" 
              strokeWidth={2.5}
              dot={false}
              name="FCF"
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
            FCF (Mio. {stockCurrency})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-green-600 rounded"></span>
            Wachstum (%)
          </span>
          <span className="flex items-center gap-1">
            <span className="text-green-600">---</span>
            12% (Exzellent)
          </span>
          <span className="flex items-center gap-1">
            <span className="text-yellow-600">---</span>
            7% (Sehr Gut)
          </span>
          <span className="flex items-center gap-1">
            <span className="text-orange-600">---</span>
            4% (Gut)
          </span>
        </div>
      </div>
    </Card>
  );
};