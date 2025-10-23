import React from 'react';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip as RechartsTooltip } from 'recharts';

interface DividendYieldCardProps {
  currentPrice: number;
  currentDividendPerShare?: number;
  historicalDividends?: Array<{ year: string; value: number }>;
  payoutRatioFCFHistory?: Array<{ year: string; value: number }>;
  payoutRatioEPSHistory?: Array<{ year: string; value: number }>;
  dividendStreak?: number;
  dividendCAGR3Y?: number | null;
  dividendCAGR5Y?: number | null;
  dividendCAGR10Y?: number | null;
  preset?: string;
  onScoreChange?: (score: number, maxScore: number) => void;
}

export const DividendYieldCard: React.FC<DividendYieldCardProps> = ({
  currentPrice,
  currentDividendPerShare = 0,
  historicalDividends = [],
  payoutRatioFCFHistory = [],
  payoutRatioEPSHistory = [],
  dividendStreak = 0,
  dividendCAGR3Y = null,
  dividendCAGR5Y = null,
  dividendCAGR10Y = null,
  preset = 'Standard (Nicht-Finanz)',
  onScoreChange
}) => {
  // Calculate current dividend yield
  const dividendYield = currentPrice > 0 && currentDividendPerShare > 0
    ? (currentDividendPerShare / currentPrice) * 100
    : 0;

  // NEW Scoring function (applies to both EPS and FCF)
  const getPayoutRatioScore = (ratio: number | null): number => {
    if (ratio === null || ratio < 0 || ratio > 80) return 0;
    if (ratio >= 40 && ratio <= 65) return 1;
    if (ratio < 40) return 0.5; // Conservative, growth room
    if (ratio > 65 && ratio <= 80) return 0.5; // OK, less buffer
    return 0;
  };

  const getDividendGrowthScore = (streak: number, cagr: number | null): number => {
    let streakScore = 0;
    if (streak >= 10) streakScore = 1;
    else if (streak >= 5) streakScore = 0.66;
    else if (streak >= 1) streakScore = 0.34;
    
    let cagrScore = 0;
    if (cagr !== null) {
      if (cagr >= 6) cagrScore = 1;
      else if (cagr >= 3) cagrScore = 0.66;
      else if (cagr >= 0) cagrScore = 0.34;
    }
    
    return streakScore + cagrScore;
  };

  // Use median CAGR from available data
  const getMedianCAGR = (): number | null => {
    const cagrs = [dividendCAGR3Y, dividendCAGR5Y, dividendCAGR10Y].filter(c => c !== null) as number[];
    if (cagrs.length === 0) return null;
    cagrs.sort((a, b) => a - b);
    const mid = Math.floor(cagrs.length / 2);
    return cagrs.length % 2 === 0 ? (cagrs[mid - 1] + cagrs[mid]) / 2 : cagrs[mid];
  };

  const medianCAGR = getMedianCAGR();
  
  // Get latest payout ratios (both EPS and FCF)
  const latestPayoutRatioFCF = payoutRatioFCFHistory.length > 0 
    ? payoutRatioFCFHistory[payoutRatioFCFHistory.length - 1].value 
    : null;
  
  const latestPayoutRatioEPS = payoutRatioEPSHistory.length > 0 
    ? payoutRatioEPSHistory[payoutRatioEPSHistory.length - 1].value 
    : null;

  // Calculate scores (max 1 point each for EPS and FCF)
  const payoutScoreFCF = getPayoutRatioScore(latestPayoutRatioFCF);
  const payoutScoreEPS = getPayoutRatioScore(latestPayoutRatioEPS);
  const totalPayoutScore = payoutScoreFCF + payoutScoreEPS; // max 2 points
  const growthScore = getDividendGrowthScore(dividendStreak, medianCAGR);
  const totalScore = totalPayoutScore + growthScore;
  const maxScore = 4;

  // Report score changes
  React.useEffect(() => {
    if (currentDividendPerShare > 0 && historicalDividends.length > 0) {
      onScoreChange?.(totalScore, maxScore);
    }
  }, [totalScore, maxScore, currentDividendPerShare, historicalDividends.length, onScoreChange]);

  // Get color based on score ratio
  const getColorByRatio = (score: number, maxScore: number): string => {
    const ratio = score / maxScore;
    if (ratio >= 0.8) return 'text-green-600';
    if (ratio >= 0.6) return 'text-yellow-600';
    if (ratio >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBgColorByRatio = (score: number, maxScore: number): string => {
    const ratio = score / maxScore;
    if (ratio >= 0.8) return 'bg-green-50 border-green-200';
    if (ratio >= 0.6) return 'bg-yellow-50 border-yellow-200';
    if (ratio >= 0.4) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  // Merge data for chart (with both EPS and FCF payout ratios)
  const mergedChartData = historicalDividends.map(d => {
    const payoutFCFEntry = payoutRatioFCFHistory.find(p => p.year === d.year);
    const payoutEPSEntry = payoutRatioEPSHistory.find(p => p.year === d.year);
    return {
      year: d.year,
      dividend: d.value,
      payoutRatioFCF: payoutFCFEntry ? payoutFCFEntry.value : null,
      payoutRatioEPS: payoutEPSEntry ? payoutEPSEntry.value : null,
    };
  });

  // Main tooltip content
  const mainTooltipContent = (
    <div className="max-w-sm space-y-2">
      <p className="font-semibold">Dividendenrendite = Jahresdividende je Aktie / Aktienkurs</p>
      <p className="text-sm text-muted-foreground">(Dividend Yield = Annual Dividend per Share / Stock Price)</p>
      <p className="text-sm">
        Sie sagt, wie viel „Bargeld-Ertrag" du pro Jahr im Verhältnis zum aktuellen Kurs bekommst.
      </p>
      <div className="space-y-1">
        <p className="text-sm">
          <strong>Beispiel:</strong> Dividende 1,20 €; Kurs 40 € ⇒ <strong>3,0 % Rendite</strong>.
        </p>
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm">Warum wichtig?</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li><strong>Einkommensquelle:</strong> Regelmäßiger Cash-Rückfluss für Anleger.</li>
          <li><strong>Bewertungshinweis:</strong> Höhere Rendite kann auf günstige Bewertung hindeuten – oder auf Probleme.</li>
          <li><strong>Disziplin-Signal:</strong> Stetige, wachsende Dividenden deuten oft auf solide Cashflows hin.</li>
        </ul>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Scoring-Preset: <strong>{preset}</strong>
      </p>
    </div>
  );

  // Scoring tooltip
  const scoringTooltip = (
    <div className="space-y-2">
      <p className="font-medium text-sm">Bewertungssystem (0-4 Punkte):</p>
      
      <div className="space-y-1">
        <p className="font-medium text-xs">Ausschüttungsquote (Payout Ratio) – 0-2 Punkte</p>
        <p className="text-xs text-muted-foreground">EPS-basiert (0-1 Punkt) + FCF-basiert (0-1 Punkt)</p>
        <p className="text-xs"><span className="text-green-600">●</span> 40-65% → 1 Punkt</p>
        <p className="text-xs"><span className="text-yellow-600">●</span> ≤ 40% → 0,5 Punkte (konservativ, Wachstumsraum)</p>
        <p className="text-xs"><span className="text-yellow-600">●</span> 65-80% → 0,5 Punkte (ok, weniger Puffer)</p>
        <p className="text-xs"><span className="text-red-600">●</span> &gt; 80% oder negativ → 0 Punkte</p>
      </div>

      <div className="space-y-1">
        <p className="font-medium text-xs">Dividenden-Wachstum (Streak & CAGR) – 0-2 Punkte</p>
        
        <p className="text-xs font-medium mt-1">Streak (Jahre ohne Kürzung):</p>
        <p className="text-xs"><span className="text-green-600">●</span> ≥ 10 Jahre → 1 Punkt</p>
        <p className="text-xs"><span className="text-yellow-600">●</span> 5-&lt;10 Jahre → 0,66 Punkte</p>
        <p className="text-xs"><span className="text-orange-600">●</span> &lt; 5 Jahre → 0,34 Punkte</p>
        <p className="text-xs"><span className="text-red-600">●</span> Cut in 5J → 0 Punkte</p>
        
        <p className="text-xs font-medium mt-1">CAGR (3/5/10J, Median):</p>
        <p className="text-xs"><span className="text-green-600">●</span> ≥ 6% p.a. → 1 Punkt</p>
        <p className="text-xs"><span className="text-yellow-600">●</span> 3-&lt;6% → 0,66 Punkte</p>
        <p className="text-xs"><span className="text-orange-600">●</span> 0-&lt;3% → 0,34 Punkte</p>
        <p className="text-xs"><span className="text-red-600">●</span> &lt; 0% → 0 Punkte</p>
      </div>
    </div>
  );

  // Handle no dividend case
  if (currentDividendPerShare === 0 || historicalDividends.length === 0) {
    return (
      <Card className="p-4 border-2 bg-muted/30">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">Dividendenrendite (Dividend Yield)</h3>
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
        </div>
        <p className="text-sm text-muted-foreground">Unternehmen zahlt keine Dividende</p>
      </Card>
    );
  }

  return (
    <Card className={`p-4 border-2 ${getBgColorByRatio(totalScore, maxScore)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Dividendenrendite (Dividend Yield)</h3>
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
          <div className={`text-2xl font-bold ${getColorByRatio(totalScore, maxScore)}`}>
            {dividendYield.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground">
            ${currentDividendPerShare.toFixed(2)} / ${currentPrice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Score indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm font-medium">Bewertung:</div>
        <div className={`px-2 py-1 rounded text-sm font-semibold ${getColorByRatio(totalScore, maxScore)}`}>
          {Number.isInteger(totalScore) ? totalScore.toString() : totalScore.toFixed(2)}/{maxScore} Punkte
        </div>
        <div className="text-xs text-muted-foreground">
          (EPS: {payoutScoreEPS} + FCF: {payoutScoreFCF} | Growth: {growthScore.toFixed(2)})
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

      {/* Metrics summary */}
      <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Payout (EPS)</p>
          <p className="font-semibold">
            {latestPayoutRatioEPS !== null ? `${latestPayoutRatioEPS.toFixed(1)}%` : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Payout (FCF)</p>
          <p className="font-semibold">
            {latestPayoutRatioFCF !== null ? `${latestPayoutRatioFCF.toFixed(1)}%` : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Streak</p>
          <p className="font-semibold">{dividendStreak} Jahre</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">CAGR (Median)</p>
          <p className="font-semibold">
            {medianCAGR !== null ? `${medianCAGR.toFixed(1)}%` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Combined Chart */}
      {mergedChartData.length > 1 && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-2">Historischer Verlauf</div>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={mergedChartData}>
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
                label={{ value: 'Payout Ratio (%)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
                label={{ value: 'Dividende ($)', angle: 90, position: 'insideRight', style: { fontSize: 10 } }}
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-semibold">{payload[0].payload.year}</p>
                        <p className="text-sm text-blue-600">
                          Dividende: <span className="font-bold">${payload[0].payload.dividend?.toFixed(2) || 'N/A'}</span>
                        </p>
                        <p className="text-sm text-emerald-600">
                          Payout (EPS): <span className="font-bold">{payload[0].payload.payoutRatioEPS?.toFixed(1) || 'N/A'}%</span>
                        </p>
                        <p className="text-sm text-sky-600">
                          Payout (FCF): <span className="font-bold">{payload[0].payload.payoutRatioFCF?.toFixed(1) || 'N/A'}%</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              {/* Reference lines for Payout Ratio scoring */}
              <ReferenceLine yAxisId="left" y={40} stroke="#10b981" strokeDasharray="3 3" />
              <ReferenceLine yAxisId="left" y={65} stroke="#ca8a04" strokeDasharray="3 3" />
              <ReferenceLine yAxisId="left" y={80} stroke="#ea580c" strokeDasharray="3 3" />
              
              {/* Bars for both Payout Ratios - side by side */}
              <Bar yAxisId="left" dataKey="payoutRatioEPS" fill="#10b981" name="Payout (EPS)" />
              <Bar yAxisId="left" dataKey="payoutRatioFCF" fill="#3b82f6" name="Payout (FCF)" />
              
              {/* Line for Dividend */}
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="dividend" 
                stroke="#2563eb" 
                strokeWidth={2.5}
                dot={{ fill: '#2563eb', r: 3 }}
                name="Dividende/Aktie"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span><span className="text-green-600">---</span> 40% (Min. Ideal)</span>
            <span><span className="text-yellow-600">---</span> 65% (Max. Ideal)</span>
            <span><span className="text-orange-600">---</span> 80% (Risiko)</span>
          </div>
          <div className="flex justify-center gap-4 mt-1 text-xs text-muted-foreground">
            <span><span className="inline-block w-3 h-3 bg-emerald-500 mr-1"></span>EPS-basiert</span>
            <span><span className="inline-block w-3 h-3 bg-blue-500 mr-1"></span>FCF-basiert</span>
          </div>
        </div>
      )}
    </Card>
  );
};
