import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DividendYieldCardProps {
  dividendPerShare?: number;
  currentPrice: number;
  payoutRatio?: number; // Dividenden / FCF
  dividendStreak?: number; // Jahre ohne Kürzung
  dividendCAGR?: number; // 3/5/10J Median
  historicalDividends?: Array<{ year: number | string; value: string | number }>;
}

export const DividendYieldCard = ({
  dividendPerShare = 0,
  currentPrice,
  payoutRatio,
  dividendStreak,
  dividendCAGR,
  historicalDividends = []
}: DividendYieldCardProps) => {
  // Calculate dividend yield
  const dividendYield = dividendPerShare && currentPrice > 0 
    ? (dividendPerShare / currentPrice) * 100 
    : 0;

  // Score calculation: Payout Ratio (0-2 points)
  const calculatePayoutScore = (ratio?: number): number => {
    if (!ratio || ratio < 0) return 0;
    if (ratio >= 50 && ratio <= 65) return 2;
    if (ratio <= 50) return 1;
    if (ratio > 65 && ratio <= 80) return 1;
    return 0; // > 80%
  };

  // Score calculation: Dividend Growth (0-2 points)
  const calculateGrowthScore = (streak?: number, cagr?: number): number => {
    let streakScore = 0;
    let cagrScore = 0;

    // Streak score (0-1)
    if (streak !== undefined) {
      if (streak >= 10) streakScore = 1;
      else if (streak >= 5) streakScore = 0.66;
      else if (streak > 0) streakScore = 0.34;
    }

    // CAGR score (0-1)
    if (cagr !== undefined) {
      if (cagr >= 6) cagrScore = 1;
      else if (cagr >= 3) cagrScore = 0.66;
      else if (cagr >= 0) cagrScore = 0.34;
    }

    return streakScore + cagrScore;
  };

  const payoutScore = calculatePayoutScore(payoutRatio);
  const growthScore = calculateGrowthScore(dividendStreak, dividendCAGR);
  const totalScore = payoutScore + growthScore;
  const maxScore = 4;

  // Color coding
  const getColorByScore = (score: number, max: number): string => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBgColorByScore = (score: number, max: number): string => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
    if (percentage >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  // Prepare chart data
  const chartData = historicalDividends
    .filter(d => d.value !== null && d.value !== undefined && d.value !== 'N/A')
    .map(d => ({
      year: typeof d.year === 'string' ? d.year : d.year.toString(),
      value: typeof d.value === 'string' ? parseFloat(d.value) : d.value
    }))
    .filter(d => !isNaN(d.value));

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Dividendenrendite</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <div className="space-y-2">
                    <p className="font-semibold">Was ist die Dividendenrendite?</p>
                    <p className="text-sm"><strong>Dividendenrendite = Jahresdividende je Aktie / Aktienkurs</strong></p>
                    <p className="text-sm">
                      Sie sagt, <strong>wie viel „Bargeld-Ertrag"</strong> du pro Jahr im Verhältnis zum aktuellen Kurs bekommst.
                    </p>
                    <p className="text-sm">
                      Beispiel: Dividende 1,20 €; Kurs 40 € ⇒ <strong>3,0 % Rendite</strong>.
                    </p>
                    <p className="text-sm font-semibold mt-2">Warum wichtig?</p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      <li><strong>Einkommensquelle:</strong> Regelmäßiger Cash-Rückfluss für Anleger.</li>
                      <li><strong>Bewertungshinweis:</strong> Höhere Rendite kann auf <strong>günstige Bewertung</strong> hindeuten – <strong>oder</strong> auf Probleme.</li>
                      <li><strong>Disziplin-Signal:</strong> Stetige, wachsende Dividenden deuten oft auf <strong>solide Cashflows</strong> hin.</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Scoring-Preset: Payout Ratio (0-2) + Growth (0-2)
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className={`px-3 py-1 rounded-lg border-2 ${getBgColorByScore(totalScore, maxScore)}`}>
            <span className={`font-bold ${getColorByScore(totalScore, maxScore)}`}>
              {totalScore.toFixed(1)} / {maxScore}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dividend Yield Display */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <span className="text-sm text-muted-foreground">Aktuelle Dividendenrendite</span>
          <span className="text-2xl font-bold text-primary">
            {dividendYield.toFixed(2)}%
          </span>
        </div>

        {/* Score Breakdown */}
        <div className="grid gap-3">
          <div className="p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Ausschüttungsquote (Payout Ratio)</span>
              <Badge variant="outline">{payoutScore.toFixed(1)} / 2</Badge>
            </div>
            {payoutRatio !== undefined && (
              <p className="text-xs text-muted-foreground">
                Dividenden / FCF: <strong>{payoutRatio.toFixed(1)}%</strong>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              50-65% → 2 Pkt | ≤50% → 1 Pkt | 65-80% → 1 Pkt | &gt;80% → 0 Pkt
            </p>
          </div>

          <div className="p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Dividenden-Wachstum</span>
              <Badge variant="outline">{growthScore.toFixed(1)} / 2</Badge>
            </div>
            <div className="space-y-1">
              {dividendStreak !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Streak: <strong>{dividendStreak} Jahre</strong> ohne Kürzung
                </p>
              )}
              {dividendCAGR !== undefined && (
                <p className="text-xs text-muted-foreground">
                  CAGR: <strong>{dividendCAGR.toFixed(1)}%</strong> p.a.
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Streak: ≥10J → 1 | 5-10J → 0.66 | CAGR: ≥6% → 1 | 3-6% → 0.66
            </p>
          </div>
        </div>

        {/* Historical Chart */}
        {chartData.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Historische Dividenden</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="dividendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fill="url(#dividendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
