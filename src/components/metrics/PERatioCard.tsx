import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';
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
  onScoreChange?: (score: number, maxScore: number) => void;
}

type TimeRange = '1M' | '6M' | 'YTD' | '1Y' | '5Y' | '10Y' | '25Y' | 'MAX';

export const PERatioCard: React.FC<PERatioCardProps> = ({
  currentPrice,
  historicalPE,
  weeklyPE,
  currentStockPE,
  currentIndustryPE,
  industry,
  onScoreChange
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1Y');
  const hasLoggedRef = React.useRef(false);

  // Debug logging (only once)
  React.useEffect(() => {
    if (!hasLoggedRef.current && weeklyPE && weeklyPE.length > 0) {
      hasLoggedRef.current = true;
      console.log('📊 PERatioCard loaded:', {
        weeklyPELength: weeklyPE.length,
        currentStockPE,
        currentIndustryPE,
        industry,
        hasIndustryData: weeklyPE.some(d => typeof d.industryPE === 'number')
      });
    }
  }, [weeklyPE, currentStockPE, currentIndustryPE, industry]);

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
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
    if (percentage >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  // Formatting helper to hide trailing zeros (e.g., 3.0 -> 3)
  const formatScore = (n: number, decimals = 1) =>
    Number.isInteger(n) ? n.toString() : n.toFixed(decimals);

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

  // Report score changes (only when actually changed)
  const lastReportedScoreRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (lastReportedScoreRef.current !== totalScore) {
      lastReportedScoreRef.current = totalScore;
      onScoreChange?.(totalScore, maxScore);
    }
  }, [totalScore, maxScore, onScoreChange]);

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

  const mainTooltipContent = (
    <div className="space-y-3 max-w-md">
      <div>
        <p className="font-semibold">Kurs-Gewinn-Verhältnis = Aktienkurs / Gewinn je Aktie</p>
        <p className="text-sm text-muted-foreground">(P/E Ratio = Price / Earnings per Share)</p>
        <p className="text-xs mt-1">
          Das KGV zeigt, wie teuer eine Aktie im Verhältnis zu ihren Gewinnen ist.
          Ein niedriges KGV deutet auf eine günstige Bewertung hin.
        </p>
      </div>
      
      <div className="text-xs">
        <p className="font-medium mb-1">Formel:</p>
        <code className="bg-muted px-2 py-1 rounded text-[10px]">
          KGV = Aktienkurs / Gewinn je Aktie (EPS)
        </code>
      </div>

      <div className="text-xs space-y-1">
        <p className="font-medium">Interpretation:</p>
        <div className="space-y-1 pl-2 border-l-2 border-border">
          <p>• KGV ≤ 15: <strong>Günstig bewertet</strong></p>
          <p>• KGV 15-20: <strong>Fair bewertet</strong></p>
          <p>• KGV 20-25: <strong>Leicht teuer</strong></p>
          <p>• KGV &gt; 25: <strong>Teuer</strong></p>
        </div>
      </div>
    </div>
  );

  const scoringTooltip = (
    <div className="space-y-2">
      <p className="font-medium text-sm">Bewertungssystem (0-3,0 Punkte):</p>
      
      <div className="space-y-1">
        <p className="font-medium text-xs">Absolut (0-1,5 P):</p>
        <div className="text-xs space-y-0.5">
          <p><span className="text-green-600">●</span> ≤15: 1,5 Punkte</p>
          <p><span className="text-yellow-600">●</span> 15-20: 1,0 Punkt</p>
          <p><span className="text-orange-600">●</span> 20-25: 0,5 Punkte</p>
          <p><span className="text-red-600">●</span> &gt;25: 0,0 Punkte</p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="font-medium text-xs">Relativ zur Branche (0-1,5 P):</p>
        <div className="text-xs space-y-0.5">
          <p><span className="text-green-600">●</span> ≤0,80x: 1,5 Punkte (Discount)</p>
          <p><span className="text-yellow-600">●</span> 0,80-1,10x: 1,0 Punkt (Fair)</p>
          <p><span className="text-orange-600">●</span> 1,10-1,30x: 0,5 Punkte (Premium)</p>
          <p><span className="text-red-600">●</span> &gt;1,30x: 0,0 Punkte (Overpremium)</p>
        </div>
      </div>
    </div>
  );

  const relativeValue = currentStockPE && currentIndustryPE 
    ? (currentStockPE / currentIndustryPE) 
    : null;

  return (
    <Card className={`p-4 border-2 ${getBgColorByScore(totalScore, maxScore)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Kurs-Gewinn-Verhältnis (KGV / P/E Ratio)</h3>
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
          <div className={`text-2xl font-bold ${getColorByScore(totalScore, maxScore)}`}>
            {currentStockPE !== null && currentStockPE !== undefined ? currentStockPE.toFixed(1) : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">Aktuell (TTM)</div>
        </div>
      </div>

      {/* Score indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm font-medium">Bewertung:</div>
        <div className={`px-2 py-1 rounded text-sm font-semibold ${getColorByScore(totalScore, maxScore)}`}>
          {formatScore(totalScore, 1)}/{maxScore} Punkte
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-md">
              {scoringTooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* KPIs as 3-column grid */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">KGV Aktie</p>
          <p className="font-semibold">
            {currentStockPE !== null && currentStockPE !== undefined ? currentStockPE.toFixed(1) : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">KGV Branche</p>
          <p className="font-semibold">
            {currentIndustryPE !== null && currentIndustryPE !== undefined ? currentIndustryPE.toFixed(1) : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Relativer Wert</p>
          {relativeValue !== null ? (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
              relativeValue <= 0.8 ? 'bg-green-100 text-green-700' : 
              relativeValue <= 1.1 ? 'bg-yellow-100 text-yellow-700' : 
              'bg-red-100 text-red-700'
            }`}>
              {relativeValue <= 1 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {relativeValue.toFixed(2)}x
            </div>
          ) : (
            <p className="font-semibold text-muted-foreground">N/A</p>
          )}
        </div>
      </div>

      {/* Meta Row with tooltips */}
      <div className="flex items-center justify-start gap-2 text-xs text-muted-foreground mb-4 flex-wrap">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                Absolut-Score: <span className={`font-bold ${getColorByScore(absoluteScore, 1.5)}`}>
                  {absoluteScore.toFixed(1)}/1,5
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Bewertung basierend auf KGV-Höhe</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span>•</span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                Relativ-Score: <span className={`font-bold ${getColorByScore(relativeScore, 1.5)}`}>
                  {relativeScore.toFixed(1)}/1,5
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Vergleich zur Branche {industry}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {currentIndustryPE && currentStockPE && (
          <>
            <span>•</span>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    Bewertung vs. Branche: <span className={`font-bold ${
                      relativeValue && relativeValue <= 0.8 ? 'text-green-600' : 
                      relativeValue && relativeValue <= 1.1 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {relativeValue ? (
                        relativeValue <= 0.8 ? 'Discount' : 
                        relativeValue <= 1.1 ? 'Fair' : 
                        'Premium'
                      ) : 'N/A'}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {relativeValue && relativeValue <= 0.8 && 'Aktie ist günstiger als Branchenschnitt'}
                    {relativeValue && relativeValue > 0.8 && relativeValue <= 1.1 && 'Aktie ist fair zur Branche bewertet'}
                    {relativeValue && relativeValue > 1.1 && 'Aktie ist teurer als Branchenschnitt'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>

      {/* Time Range Selector */}
      {weeklyPE && weeklyPE.length > 0 && (
        <>
          <div className="flex justify-end gap-1 mb-3 overflow-x-auto pb-1">
            {(['1M', '6M', 'YTD', '1Y', '5Y', '10Y', '25Y', 'MAX'] as TimeRange[]).map(range => (
              <Button
                key={range}
                variant={selectedRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRange(range)}
                className="text-xs h-7 px-2.5 whitespace-nowrap"
              >
                {range}
              </Button>
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
                    width={60}
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
                  {filteredData.some(d => typeof d.industryPE === 'number') && (
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
                {filteredData.some(d => typeof d.industryPE === 'number') && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-6 h-0.5 bg-[#f97316]"></span>
                    Branche ({industry})
                  </span>
                )}
                <span><span className="text-green-600">---</span> 15 (Günstig)</span>
                <span><span className="text-yellow-600">---</span> 20 (Fair)</span>
              </div>
            </div>
          )}
        </>
      )}

    </Card>
  );
};
