import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PERatioCardProps {
  currentPrice: number;
  historicalPE?: Array<{ year: string; value: number }>; // Annual data (for fallback)
  weeklyPE?: Array<{ date: string; stockPE: number; industryPE?: number }>; // NEW: Weekly data
  currentStockPE?: number;    // Current TTM P/E
  currentIndustryPE?: number; // Current industry P/E
  industry?: string;          // Industry name for display
}

type TimeRange = '1M' | '6M' | 'YTD' | '1Y' | '5Y' | '10Y' | '25Y' | 'MAX';

export const PERatioCard: React.FC<PERatioCardProps> = ({
  currentPrice,
  historicalPE,
  weeklyPE,
  currentStockPE,
  currentIndustryPE,
  industry
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1Y');

  // Helper function to get color based on score
  const getColorByScore = (score: number, maxScore: number): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Helper function to get background color based on score
  const getBgColorByScore = (score: number, maxScore: number): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'border-green-200 bg-green-50/30';
    if (percentage >= 60) return 'border-yellow-200 bg-yellow-50/30';
    if (percentage >= 40) return 'border-orange-200 bg-orange-50/30';
    return 'border-red-200 bg-red-50/30';
  };

  // Absolute Score (0-1.5 points)
  const getAbsoluteScore = (pe: number | null | undefined): number => {
    if (pe === null || pe === undefined || pe <= 0) return 0;
    if (pe <= 15) return 1.5;
    if (pe <= 20) return 1.0;
    if (pe <= 25) return 0.5;
    return 0.0;
  };

  // Relative Score (0-1.5 points) - CORRECTED
  const getRelativeScore = (stockPE: number | null | undefined, industryPE: number | null | undefined): number => {
    if (!stockPE || !industryPE || stockPE <= 0 || industryPE <= 0) return 0;
    
    const peRel = stockPE / industryPE;
    
    if (peRel <= 0.80) return 1.5;  // Significant discount
    if (peRel <= 1.10) return 1.0;  // Fair valuation
    if (peRel <= 1.30) return 0.5;  // Slight premium
    return 0.0;                     // Overpremium
  };

  // Calculate scores
  const absoluteScore = getAbsoluteScore(currentStockPE);
  const relativeScore = getRelativeScore(currentStockPE, currentIndustryPE);
  const totalScore = absoluteScore + relativeScore;
  const maxScore = 3.0;

  // Filter data by range
  const filterDataByRange = (
    data: Array<{ date: string; stockPE: number; industryPE?: number }>,
    range: TimeRange
  ): typeof data => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'YTD':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case '5Y':
        startDate.setFullYear(now.getFullYear() - 5);
        break;
      case '10Y':
        startDate.setFullYear(now.getFullYear() - 10);
        break;
      case '25Y':
        startDate.setFullYear(now.getFullYear() - 25);
        break;
      case 'MAX':
        return data;
    }
    
    return data.filter(d => new Date(d.date) >= startDate);
  };

  // X-axis formatter based on range
  const getXAxisTickFormatter = (range: TimeRange) => {
    switch (range) {
      case '1M':
      case '6M':
        // Weekly: "15. Oct"
        return (value: string) => {
          const date = new Date(value);
          return `${date.getDate()}. ${date.toLocaleDateString('de-DE', { month: 'short' })}`;
        };
      case 'YTD':
      case '1Y':
        // Monthly: "Jan", "Feb"
        return (value: string) => {
          const date = new Date(value);
          return date.toLocaleDateString('de-DE', { month: 'short' });
        };
      case '5Y':
      case '10Y':
      case '25Y':
      case 'MAX':
        // Yearly: "2020", "2021"
        return (value: string) => {
          const date = new Date(value);
          return date.getFullYear().toString();
        };
    }
  };

  // Reduce number of ticks based on range
  const getXAxisTicks = (data: any[], range: TimeRange): string[] => {
    if (data.length === 0) return [];
    
    let interval = 1;
    switch (range) {
      case '1M':
      case '6M':
        interval = 4; // Every 4 weeks
        break;
      case 'YTD':
      case '1Y':
        interval = Math.ceil(data.length / 12); // ~12 ticks
        break;
      case '5Y':
        interval = Math.ceil(data.length / 10); // ~10 ticks
        break;
      case '10Y':
      case '25Y':
      case 'MAX':
        interval = Math.ceil(data.length / 10); // Max 10 ticks
        break;
    }
    
    return data
      .filter((_, index) => index % interval === 0)
      .map(d => d.date);
  };

  const filteredData = filterDataByRange(weeklyPE || [], selectedRange);
  const xAxisTicks = getXAxisTicks(filteredData, selectedRange);
  const xAxisFormatter = getXAxisTickFormatter(selectedRange);

  const tooltipContent = (
    <div className="space-y-2">
      <p className="font-medium">Kurs-Gewinn-Verhältnis (KGV)</p>
      <p className="text-xs">
        Das KGV zeigt, wie teuer eine Aktie im Verhältnis zu ihren Gewinnen ist.
        Ein niedriges KGV deutet auf eine günstige Bewertung hin.
      </p>
      <p className="text-xs">
        Formel: Aktienkurs / Gewinn je Aktie (EPS)
      </p>
    </div>
  );

  return (
    <Card className={`p-4 border-2 ${getBgColorByScore(totalScore, maxScore)}`}>
      {/* Header with Score */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">KGV (Kurs-Gewinn-Verhältnis)</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-md">
                {tooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getColorByScore(totalScore, maxScore)}`}>
            {currentStockPE !== null && currentStockPE !== undefined ? currentStockPE.toFixed(1) : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">Aktuell (TTM)</div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2 mb-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Gesamtbewertung:</div>
          <div className={`px-3 py-1 rounded text-sm font-bold ${getColorByScore(totalScore, maxScore)}`}>
            {totalScore.toFixed(1)}/{maxScore} Punkte
          </div>
        </div>
        
        <div className="text-xs space-y-1 pl-3 border-l-2 border-border">
          <div className="flex justify-between">
            <span>Absolut (KGV {currentStockPE?.toFixed(1) || 'N/A'}):</span>
            <span className="font-medium">{absoluteScore.toFixed(1)}/1,5 P</span>
          </div>
          {currentIndustryPE && currentStockPE && (
            <>
              <div className="flex justify-between">
                <span>
                  Relativ zur Branche ({(currentStockPE / currentIndustryPE).toFixed(2)}x):
                </span>
                <span className="font-medium">{relativeScore.toFixed(1)}/1,5 P</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                Branche: {industry} (KGV: {currentIndustryPE.toFixed(1)})
              </div>
            </>
          )}
        </div>
      </div>

      {/* Time Range Selector */}
      {weeklyPE && weeklyPE.length > 0 && (
        <>
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
            {(['1M', '6M', 'YTD', '1Y', '5Y', '10Y', '25Y', 'MAX'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap transition-colors ${
                  selectedRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Chart */}
          {filteredData.length > 1 && (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date"
                    ticks={xAxisTicks}
                    tickFormatter={xAxisFormatter}
                    tick={{ fontSize: 10 }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    stroke="#9ca3af"
                    domain={[0, 'auto']}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                            <p className="text-xs font-semibold mb-1">
                              {new Date(data.date).toLocaleDateString('de-DE')}
                            </p>
                            <p className="text-sm text-blue-600">
                              KGV Aktie: <span className="font-bold">{data.stockPE.toFixed(1)}</span>
                            </p>
                            {data.industryPE && (
                              <>
                                <p className="text-sm text-orange-600">
                                  KGV Branche: <span className="font-bold">{data.industryPE.toFixed(1)}</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Relativ: {(data.stockPE / data.industryPE).toFixed(2)}x
                                </p>
                              </>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  {/* Reference lines for absolute valuation */}
                  <ReferenceLine y={15} stroke="#16a34a" strokeDasharray="3 3" opacity={0.5} />
                  <ReferenceLine y={20} stroke="#ca8a04" strokeDasharray="3 3" opacity={0.5} />
                  <ReferenceLine y={25} stroke="#ea580c" strokeDasharray="3 3" opacity={0.5} />
                  
                  {/* Industry P/E Line (orange) */}
                  {filteredData.some(d => d.industryPE) && (
                    <Line 
                      type="monotone" 
                      dataKey="industryPE" 
                      stroke="#f97316" 
                      strokeWidth={2.5}
                      dot={false}
                      name="Branche"
                      connectNulls
                    />
                  )}
                  
                  {/* Stock P/E Line (blue) */}
                  <Line 
                    type="monotone" 
                    dataKey="stockPE" 
                    stroke="#2563eb" 
                    strokeWidth={2.5}
                    dot={false}
                    name="Aktie"
                  />
                </LineChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-6 h-0.5 bg-[#2563eb]"></span>
                  Aktie
                </span>
                {filteredData.some(d => d.industryPE) && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-6 h-0.5 bg-[#f97316]"></span>
                    Branche ({industry})
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Extended Scoring Explanation */}
      <div className="mt-4 text-xs text-muted-foreground space-y-2 p-3 bg-muted/20 rounded-lg">
        <div>
          <p className="font-semibold mb-1">Bewertungssystem (0-3,0 Punkte):</p>
        </div>
        
        <div>
          <p className="font-semibold text-[10px]">Absolut (0-1,5 P):</p>
          <div className="grid grid-cols-2 gap-x-2 text-[10px]">
            <span>• ≤15: 1,5 P</span>
            <span>• 15-20: 1,0 P</span>
            <span>• 20-25: 0,5 P</span>
            <span>• &gt;25: 0,0 P</span>
          </div>
        </div>
        
        <div>
          <p className="font-semibold text-[10px]">Relativ zur Branche (0-1,5 P):</p>
          <div className="grid grid-cols-2 gap-x-2 text-[10px]">
            <span>• ≤0,80x: 1,5 P</span>
            <span>• 0,80-1,10x: 1,0 P</span>
            <span>• 1,10-1,30x: 0,5 P</span>
            <span>• &gt;1,30x: 0,0 P</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
