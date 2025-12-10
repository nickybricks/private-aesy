import React from "react";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface ScoreResult {
  score: number;
  maxScore: number;
}

interface NetDebtToEbitdaCardProps {
  currentValue: number | null;
  historicalData?: Array<{ year: string; value: number }>;
  preset?: string;
  scoreFromBackend?: ScoreResult;
}

export const NetDebtToEbitdaCard: React.FC<NetDebtToEbitdaCardProps> = ({
  currentValue,
  historicalData,
  preset,
  scoreFromBackend,
}) => {
  const isMobile = useIsMobile();
  // Calculate median from historical data
  const calculateMedian = (data: Array<{ year: string; value: number }>) => {
    if (!data || data.length === 0) return null;
    const values = data.map((d) => d.value).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
    console.log("NetDebtToEbitda - calculateMedian:", {
      inputLength: data.length,
      values: values.map((v) => v.toFixed(2)),
      median: median.toFixed(2),
    });
    return median;
  };

  // Determine which timeframe to use (10Y > 5Y > 3Y > current)
  let displayValue = currentValue;
  let displayLabel = "Aktuell";
  let chartData = historicalData || [];

  console.log("NetDebtToEbitda - Initial values:", {
    currentValue: currentValue?.toFixed(2),
    historicalDataLength: historicalData?.length || 0,
    historicalData: historicalData?.map((d) => ({ year: d.year, value: d.value.toFixed(2) })),
  });

  if (historicalData && historicalData.length >= 10) {
    const last10Years = historicalData.slice(-10);
    displayValue = calculateMedian(last10Years);
    displayLabel = "10-Jahres-Median";
    chartData = last10Years;
    console.log("NetDebtToEbitda - Using 10-year median:", displayValue?.toFixed(2));
  } else if (historicalData && historicalData.length >= 5) {
    const last5Years = historicalData.slice(-5);
    displayValue = calculateMedian(last5Years);
    displayLabel = "5-Jahres-Median";
    chartData = last5Years;
    console.log("NetDebtToEbitda - Using 5-year median:", displayValue?.toFixed(2));
  } else if (historicalData && historicalData.length >= 3) {
    const last3Years = historicalData.slice(-3);
    displayValue = calculateMedian(last3Years);
    displayLabel = "3-Jahres-Median";
    chartData = last3Years;
    console.log("NetDebtToEbitda - Using 3-year median:", displayValue?.toFixed(2));
  }

  // Check if trend is improving (decreasing ratio over time is good)
  const isImprovingTrend = () => {
    if (!chartData || chartData.length < 3) {
      console.log("NetDebtToEbitda - Trend check: insufficient data", { dataLength: chartData?.length || 0 });
      return false;
    }
    const firstThird = chartData.slice(0, Math.ceil(chartData.length / 3));
    const lastThird = chartData.slice(-Math.ceil(chartData.length / 3));
    const avgFirst = firstThird.reduce((sum, d) => sum + d.value, 0) / firstThird.length;
    const avgLast = lastThird.reduce((sum, d) => sum + d.value, 0) / lastThird.length;
    const improving = avgLast < avgFirst; // Lower is better for debt ratio

    console.log("NetDebtToEbitda - Trend analysis:", {
      chartDataLength: chartData.length,
      firstThirdYears: firstThird.map((d) => d.year),
      lastThirdYears: lastThird.map((d) => d.year),
      avgFirst: avgFirst.toFixed(2),
      avgLast: avgLast.toFixed(2),
      difference: (avgLast - avgFirst).toFixed(2),
      improving,
      interpretation: improving ? "sinkend (gut)" : "steigend/stabil (schlecht)",
    });

    return improving;
  };

  const trendImproving = isImprovingTrend();

  // Score calculation based on Net Debt/EBITDA value
  const getScore = (value: number | null): { score: number; maxScore: number } => {
    // Use backend score if available
    if (scoreFromBackend) {
      console.log("NetDebtToEbitda - Using backend score:", scoreFromBackend);
      return scoreFromBackend;
    }

    // Fallback to default scoring
    console.log("NetDebtToEbitda - Score calculation start:", {
      value: value?.toFixed(2),
      displayLabel,
      trendImproving,
      chartDataLength: chartData.length,
    });

    if (value === null) {
      console.log("NetDebtToEbitda - No value, returning 0/6");
      return { score: 0, maxScore: 6 };
    }

    let baseScore = 0;
    let scoreReason = "";

    // Special case: Net Cash (negative or zero net debt)
    if (value <= 0) {
      baseScore = 6;
      scoreReason = "Net Cash (sehr solide)";
    }
    // Scoring: ≤1.0 = 6 points, >1.0-1.5 = 5 points, >1.5-2.0 = 4 points, >2.0-3.0 = 2 points, >3.0 = 0 points
    else if (value <= 1.0) {
      baseScore = 6;
      scoreReason = "≤ 1.0× (sehr stark)";
    } else if (value <= 1.5) {
      baseScore = 5;
      scoreReason = "> 1.0-1.5× (stark)";
    } else if (value <= 2.0) {
      baseScore = 4;
      scoreReason = "> 1.5-2.0× (ok)";
    } else if (value <= 3.0) {
      baseScore = 2;
      scoreReason = "> 2.0-3.0× (beobachten)";
    } else {
      baseScore = 0;
      scoreReason = "> 3.0× (heikel)";
    }

    console.log("NetDebtToEbitda - Final score:", {
      value: value.toFixed(2),
      baseScore,
      scoreReason,
      maxScore: 6,
      trendNote: trendImproving ? "Trend verbessert sich" : "Trend verschlechtert sich oder stabil",
    });

    return { score: baseScore, maxScore: 6 };
  };

  const { score, maxScore } = getScore(displayValue);

  // Get color based on score ratio
  const getColorByRatio = (score: number, maxScore: number): string => {
    const ratio = score / maxScore;
    if (ratio >= 0.67) return "text-green-600"; // 4-6 points
    if (ratio >= 0.33) return "text-yellow-600"; // 2-3 points
    return "text-red-600"; // 0-1 points
  };

  const getBgColorByRatio = (score: number, maxScore: number): string => {
    if (maxScore === 0) return "bg-gray-100 border-gray-300";
    const ratio = score / maxScore;
    if (ratio >= 0.67) return "bg-green-50 border-green-200";
    if (ratio >= 0.33) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const tooltipContent = (
    <div className="max-w-sm space-y-2">
      <p className="font-semibold">Nettoverschuldung = Verzinsliche Schulden / EBITDA</p>
      <p className="text-sm text-muted-foreground">(Net Debt/EBITDA Ratio)</p>
      <p className="text-sm">
        Zeigt, <strong>wie viele Jahre</strong> das Unternehmen (theoretisch) mit seinem{" "}
        <strong>operativen Gewinn vor Abschreibungen</strong> braucht, um die <strong>Schulden</strong> zurückzuzahlen –
        wenn es <em>alles</em> dafür verwenden würde.
      </p>
      <div className="space-y-1">
        <p className="text-sm">
          <strong>Beispiel:</strong> Schulden 400, EBITDA 200 ⇒ <strong>2,0×</strong>.
        </p>
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm">Warum wichtig?</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>
            <strong>Verschuldungsgrad in Betriebseinheiten:</strong> leicht verständliche „Jahre"-Logik.
          </li>
          <li>
            <strong>Zins- & Refi-Risiko:</strong> je höher, desto sensibler für Zinsen/Bank-Covenants.
          </li>
          <li>
            <strong>Buffett-Filter:</strong> konservative Unternehmen halten diesen Wert{" "}
            <strong>niedrig und stabil</strong>.
          </li>
        </ul>
      </div>
    </div>
  );

  const scoringTooltip = (
    <div className="space-y-1">
      {preset && (
        <p className="text-xs text-muted-foreground mb-1">
          Branche: <strong>{preset}</strong>
        </p>
      )}
      <p className="font-medium text-sm">Bewertung (0-6 Punkte):</p>
      <p className="text-sm">
        <span className="text-green-600">●</span> 6 Punkte: ≤ 1.0× (sehr stark) oder Net Cash
      </p>
      <p className="text-sm">
        <span className="text-green-600">●</span> 5 Punkte: &gt; 1.0-1.5× (stark)
      </p>
      <p className="text-sm">
        <span className="text-yellow-600">●</span> 4 Punkte: &gt; 1.5-2.0× (ok)
      </p>
      <p className="text-sm">
        <span className="text-orange-600">●</span> 2 Punkte: &gt; 2.0-3.0× (beobachten)
      </p>
      <p className="text-sm">
        <span className="text-red-600">●</span> 0 Punkte: &gt; 3.0× (heikel)
      </p>
      <p className="text-xs text-muted-foreground mt-2">Sinkender Trend = gut, steigender Trend = Warnsignal</p>
    </div>
  );

  return (
    <Card className={`p-4 border-2 ${getBgColorByRatio(score, maxScore)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Nettoverschuldung (Net Debt/EBITDA)</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent
                side={isMobile ? "top" : "right"}
                align={isMobile ? "center" : "start"}
                sideOffset={12}
                className="z-50 max-w-[min(420px,calc(100vw-40px))] mx-auto"
              >
                {tooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getColorByRatio(score, maxScore)}`}>
            {displayValue !== null ? (displayValue <= 0 ? "Net Cash" : `${displayValue.toFixed(2)}×`) : "N/A"}
          </div>
          <div className="text-xs text-muted-foreground">{displayLabel}</div>
        </div>
      </div>

      {/* Score indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm font-medium">Bewertung:</div>
        <div className={`px-2 py-1 rounded text-sm font-semibold ${getColorByRatio(score, maxScore)}`}>
          {score}/{maxScore} Punkte
        </div>
        {trendImproving && chartData.length >= 3 && (
          <div className="text-xs text-green-600 flex items-center gap-1">
            <span>↓</span> Verbesserung über Zeit
          </div>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side={isMobile ? "top" : "right"}>{scoringTooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Chart if historical data available */}
      {chartData.length > 1 && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-2">Historischer Verlauf</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" domain={[0, "auto"]} />
              <RechartsTooltip
                allowEscapeViewBox={{ x: false, y: false }}
                wrapperStyle={{ zIndex: 50, maxWidth: "calc(100vw - 32px)", overflow: "hidden" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-semibold">{payload[0].payload.year}</p>
                        <p className="text-sm text-primary">
                          Net Debt/EBITDA: <span className="font-bold">{payload[0].value}×</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#10b981" strokeDasharray="3 3" />
              <ReferenceLine y={1.5} stroke="#16a34a" strokeDasharray="3 3" />
              <ReferenceLine y={2.0} stroke="#eab308" strokeDasharray="3 3" />
              <ReferenceLine y={3.0} stroke="#dc2626" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>
              <span className="text-green-600">---</span> 1.5 (Buffett-konservativ)
            </span>
            <span>
              <span className="text-yellow-600">---</span> 2.0 (Grenze)
            </span>
            <span>
              <span className="text-red-600">---</span> 3.0 (Risikogrenze)
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
