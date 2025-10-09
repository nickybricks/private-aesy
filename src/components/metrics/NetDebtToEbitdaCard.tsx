import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { HistoricalDataItem } from "@/context/StockContextTypes";

interface NetDebtToEbitdaCardProps {
  currentValue: number;
  historicalData?: HistoricalDataItem[];
}

const NetDebtToEbitdaCard = ({ currentValue, historicalData }: NetDebtToEbitdaCardProps) => {
  console.info("NetDebtToEbitda - Initial values:", {
    currentValue: currentValue,
    historicalDataLength: historicalData?.length || 0,
    historicalData: historicalData?.map(d => ({ year: d.year, value: d.value }))
  });

  // Helper to calculate median
  const calculateMedian = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
    
    console.info("NetDebtToEbitda - calculateMedian:", {
      inputLength: values.length,
      values: sorted.map(v => v.toFixed(2)),
      median: median.toFixed(2)
    });
    
    return median;
  };

  // Determine display value: prioritize 10-year > 5-year > 3-year > current
  let displayValue = currentValue;
  let displayLabel = "Aktuell";

  if (historicalData && historicalData.length > 0) {
    // Filter out TTM from median calculations but keep for chart
    const yearlyData = historicalData.filter(d => !String(d.year).includes('TTM'));
    
    if (yearlyData.length >= 10) {
      const last10 = yearlyData.slice(0, 10).map(d => Number(d.value));
      displayValue = calculateMedian(last10);
      displayLabel = "10-Jahres-Median";
      console.info("NetDebtToEbitda - Using 10-year median:", displayValue.toFixed(2));
    } else if (yearlyData.length >= 5) {
      const last5 = yearlyData.slice(0, 5).map(d => Number(d.value));
      displayValue = calculateMedian(last5);
      displayLabel = "5-Jahres-Median";
      console.info("NetDebtToEbitda - Using 5-year median:", displayValue.toFixed(2));
    } else if (yearlyData.length >= 3) {
      const last3 = yearlyData.slice(0, 3).map(d => Number(d.value));
      displayValue = calculateMedian(last3);
      displayLabel = "3-Jahres-Median";
      console.info("NetDebtToEbitda - Using 3-year median:", displayValue.toFixed(2));
    }
  }

  // Check if trend is improving (lower is better for debt ratios)
  const isImprovingTrend = (): boolean => {
    if (!historicalData || historicalData.length < 4) return false;
    
    const chartData = [...historicalData].reverse();
    const thirdLength = Math.floor(chartData.length / 3);
    if (thirdLength < 1) return false;
    
    const firstThird = chartData.slice(0, thirdLength);
    const lastThird = chartData.slice(-thirdLength);
    
    const avgFirst = firstThird.reduce((sum, d) => sum + Number(d.value), 0) / firstThird.length;
    const avgLast = lastThird.reduce((sum, d) => sum + Number(d.value), 0) / lastThird.length;
    
    const improving = avgLast < avgFirst; // Lower is better
    
    console.info("NetDebtToEbitda - Trend analysis:", {
      chartDataLength: chartData.length,
      firstThirdYears: firstThird.map(d => d.year),
      lastThirdYears: lastThird.map(d => d.year),
      avgFirst: avgFirst.toFixed(2),
      avgLast: avgLast.toFixed(2),
      difference: (avgLast - avgFirst).toFixed(2),
      improving: improving,
      interpretation: improving ? "fallend (gut)" : "steigend/stabil (schlecht)"
    });
    
    return improving;
  };

  const trendImproving = isImprovingTrend();

  // Calculate score based on displayValue
  const getScore = (value: number): number => {
    console.info("NetDebtToEbitda - Score calculation start:", {
      value: value.toFixed(2),
      displayLabel,
      trendImproving,
      chartDataLength: historicalData?.length || 0
    });

    let score = 0;
    let scoreReason = "";

    // Special case: Net Cash position (negative net debt)
    if (value <= 0) {
      score = 6;
      scoreReason = "Net Cash Position (exzellent)";
    } else if (value <= 1.0) {
      score = 6;
      scoreReason = "≤ 1,0× (exzellent)";
    } else if (value <= 1.5) {
      score = 5;
      scoreReason = "> 1,0–1,5× (sehr gut)";
    } else if (value <= 2.0) {
      score = 4;
      scoreReason = "> 1,5–2,0× (gut)";
    } else if (value <= 3.0) {
      score = 2;
      scoreReason = "> 2,0–3,0× (beobachten)";
    } else {
      score = 0;
      scoreReason = "> 3,0× (riskant)";
    }

    console.info("NetDebtToEbitda - Final score:", {
      value: value.toFixed(2) + "×",
      baseScore: score,
      scoreReason,
      maxScore: 6,
      trendNote: trendImproving ? "Trend verbessert sich" : "Trend verschlechtert sich oder stabil"
    });

    return score;
  };

  const score = getScore(displayValue);
  const maxScore = 6;

  // Color coding based on score
  const getColorByRatio = (score: number) => {
    if (score >= 5) return "text-success";
    if (score >= 2) return "text-warning";
    return "text-destructive";
  };

  const getBgColorByRatio = (score: number) => {
    if (score >= 5) return "bg-success/10";
    if (score >= 2) return "bg-warning/10";
    return "bg-destructive/10";
  };

  const tooltipContent = (
    <div className="max-w-md space-y-3 text-sm">
      <div>
        <strong>Net Debt/EBITDA = verzinsliche Schulden / EBITDA.</strong>
      </div>
      <div>
        Zeigt, <strong>wie viele Jahre</strong> das Unternehmen (theoretisch) mit seinem{" "}
        <strong>operativen Gewinn vor Abschreibungen</strong> braucht, um die{" "}
        <strong>Schulden</strong> zurückzuzahlen – wenn es <em>alles</em> dafür verwenden würde.
      </div>
      <div className="bg-muted/50 p-2 rounded">
        <strong>Beispiel:</strong> Schulden 400, EBITDA 200 ⇒ <strong>2,0×</strong>.
      </div>
      <div>
        <strong>Warum wichtig?</strong>
        <ul className="list-disc pl-4 mt-1 space-y-1">
          <li><strong>Verschuldungsgrad in Betriebseinheiten:</strong> leicht verständliche „Jahre"-Logik.</li>
          <li><strong>Zins- & Refi-Risiko:</strong> je höher, desto sensibler für Zinsen/Bank-Covenants.</li>
          <li><strong>Buffett-Filter:</strong> konservative Unternehmen halten diesen Wert <strong>niedrig und stabil</strong>.</li>
        </ul>
      </div>
      <div className="border-t pt-2">
        <strong>Was ist „gut"?</strong>
        <ul className="list-none space-y-1 mt-1">
          <li className="text-success">✓ Grün (stark): &lt; 2,0× (Buffett-konservativ: ≤ 1,5×)</li>
          <li className="text-warning">⚠ Gelb (ok): 2,0–3,0× – beobachten</li>
          <li className="text-destructive">✗ Rot (heikel): &gt; 3,0× – anfällig für Zins-/Refi-Schocks</li>
        </ul>
        <div className="text-xs mt-2 text-muted-foreground">
          <strong>Bonus:</strong> Net Cash (Net Debt ≤ 0) = sehr solide.
        </div>
      </div>
    </div>
  );

  const scoringTooltip = (
    <div className="max-w-xs space-y-2 text-sm">
      <strong>Punktelogik:</strong>
      <ul className="list-none space-y-1">
        <li>≤ 1,0× → 6 Punkte</li>
        <li>&gt; 1,0–1,5× → 5 Punkte</li>
        <li>&gt; 1,5–2,0× → 4 Punkte</li>
        <li>&gt; 2,0–3,0× → 2 Punkte</li>
        <li>&gt; 3,0× → 0 Punkte</li>
      </ul>
    </div>
  );

  // Prepare chart data
  const chartData = historicalData
    ? [...historicalData].reverse().map(d => ({
        year: String(d.year),
        value: Number(d.value)
      }))
    : [];

  return (
    <Card className={`p-6 ${getBgColorByRatio(score)} border-l-4 ${score >= 5 ? 'border-l-success' : score >= 2 ? 'border-l-warning' : 'border-l-destructive'}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground">Net Debt/EBITDA</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {tooltipContent}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className={`text-3xl font-bold ${getColorByRatio(score)}`}>
              {displayValue <= 0 ? "Net Cash" : `${displayValue.toFixed(2)}×`}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{displayLabel}</div>
            {trendImproving && (
              <div className="text-xs text-success mt-1">↓ Trend verbessert sich</div>
            )}
          </div>
          <div className="text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="text-2xl font-bold text-foreground">{score}/{maxScore}</div>
                    <div className="text-xs text-muted-foreground">Punkte</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {scoringTooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Historischer Verlauf</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="year" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}×`, 'Net Debt/EBITDA']}
                />
                <ReferenceLine y={1.5} stroke="hsl(var(--success))" strokeDasharray="3 3" label={{ value: '1,5×', fill: 'hsl(var(--success))' }} />
                <ReferenceLine y={2.0} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ value: '2,0×', fill: 'hsl(var(--warning))' }} />
                <ReferenceLine y={3.0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: '3,0×', fill: 'hsl(var(--destructive))' }} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="1 1" />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NetDebtToEbitdaCard;
