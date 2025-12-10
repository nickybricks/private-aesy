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
import { ScoreResult } from "@/context/StockContextTypes";
import { useIsMobile } from "@/hooks/use-mobile";

interface OperatingMarginCardProps {
  currentValue: number | null;
  historicalData?: Array<{ year: string; value: number }>;
  preset?: string;
  scoreFromBackend?: ScoreResult;
}

export const OperatingMarginCard: React.FC<OperatingMarginCardProps> = ({
  currentValue,
  historicalData,
  preset = "Default",
  scoreFromBackend,
}) => {
  const isMobile = useIsMobile();
  console.log("OperatingMarginCard - Preset:", preset);
  console.log("OperatingMarginCard - Score from backend:", scoreFromBackend);

  // Calculate median from historical data
  const calculateMedian = (data: Array<{ year: string; value: number }>) => {
    if (!data || data.length === 0) return null;
    const values = data.map((d) => d.value).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  };

  // Determine which timeframe to use (10Y > 5Y > 3Y > current)
  let displayValue = currentValue;
  let displayLabel = "Aktuell";
  let chartData = historicalData || [];

  if (historicalData && historicalData.length >= 10) {
    const last10Years = historicalData.slice(-10);
    displayValue = calculateMedian(last10Years);
    displayLabel = "10-Jahres-Median";
    chartData = last10Years;
  } else if (historicalData && historicalData.length >= 5) {
    const last5Years = historicalData.slice(-5);
    displayValue = calculateMedian(last5Years);
    displayLabel = "5-Jahres-Median";
    chartData = last5Years;
  } else if (historicalData && historicalData.length >= 3) {
    const last3Years = historicalData.slice(-3);
    displayValue = calculateMedian(last3Years);
    displayLabel = "3-Jahres-Median";
    chartData = last3Years;
  }

  // Use backend score if available
  const score = scoreFromBackend?.score ?? 0;
  const maxScore = scoreFromBackend?.maxScore ?? 4;

  // Get color based on score
  const getColor = (score: number, maxScore: number): string => {
    const ratio = score / maxScore;
    if (ratio === 1) return "text-green-600";
    if (ratio >= 0.75) return "text-green-500";
    if (ratio >= 0.5) return "text-yellow-600";
    if (ratio >= 0.25) return "text-orange-600";
    return "text-red-600";
  };

  const getBgColor = (score: number, maxScore: number): string => {
    if (maxScore === 0) return "bg-gray-100 border-gray-300";
    const ratio = score / maxScore;
    if (ratio === 1) return "bg-green-50 border-green-200";
    if (ratio >= 0.75) return "bg-green-50/50 border-green-100";
    if (ratio >= 0.5) return "bg-yellow-50 border-yellow-200";
    if (ratio >= 0.25) return "bg-orange-50 border-orange-200";
    return "bg-red-50 border-red-200";
  };

  // Preset-specific tooltip content
  const getScoringTooltip = () => {
    if (preset === "Industrials") {
      return (
        <div className="space-y-1">
          <p className="font-medium text-sm">Bewertung (0-4 Punkte) - Industrials:</p>
          <p className="text-sm">
            <span className="text-green-600">●</span> 4 Pkt: ≥ 16%
          </p>
          <p className="text-sm">
            <span className="text-green-500">●</span> 3 Pkt: 12–&lt;16%
          </p>
          <p className="text-sm">
            <span className="text-yellow-600">●</span> 2 Pkt: 9–&lt;12%
          </p>
          <p className="text-sm">
            <span className="text-orange-600">●</span> 1 Pkt: 6–&lt;9%
          </p>
          <p className="text-sm">
            <span className="text-red-600">●</span> 0 Pkt: &lt; 6%
          </p>
        </div>
      );
    }

    if (preset === "Software") {
      return (
        <div className="space-y-1">
          <p className="font-medium text-sm">Bewertung (0-4 Punkte) - Software:</p>
          <p className="text-sm">
            <span className="text-green-600">●</span> 4 Pkt: ≥ 22%
          </p>
          <p className="text-sm">
            <span className="text-green-500">●</span> 3 Pkt: 18–&lt;22%
          </p>
          <p className="text-sm">
            <span className="text-yellow-600">●</span> 2 Pkt: 14–&lt;18%
          </p>
          <p className="text-sm">
            <span className="text-orange-600">●</span> 1 Pkt: 10–&lt;14%
          </p>
          <p className="text-sm">
            <span className="text-red-600">●</span> 0 Pkt: &lt; 10%
          </p>
        </div>
      );
    }

    // Default scoring
    return (
      <div className="space-y-1">
        <p className="font-medium text-sm">Bewertung (0-4 Punkte):</p>
        <p className="text-sm">
          <span className="text-green-600">●</span> 4 Pkt: ≥ 20%
        </p>
        <p className="text-sm">
          <span className="text-green-500">●</span> 3 Pkt: 15-20%
        </p>
        <p className="text-sm">
          <span className="text-yellow-600">●</span> 2 Pkt: 10-15%
        </p>
        <p className="text-sm">
          <span className="text-orange-600">●</span> 1 Pkt: 5-10%
        </p>
        <p className="text-sm">
          <span className="text-red-600">●</span> 0 Pkt: &lt; 5%
        </p>
      </div>
    );
  };

  const tooltipContent = (
    <div className="max-w-sm space-y-2">
      <p className="font-semibold">EBIT-Marge = EBIT / Umsatz</p>
      <p className="text-sm text-muted-foreground">(Operating Margin)</p>
      <p className="text-sm">
        Sie zeigt, <strong>wie viel vom Umsatz nach allen operativen Kosten</strong> (Material, Löhne, Vertrieb,
        Verwaltung, F&E) übrig bleibt – <strong>vor</strong> Zinsen und Steuern.
      </p>
      <p className="text-sm italic">
        Beispiel: 100 € Umsatz, 18 € EBIT ⇒ <strong>18 % Operating Margin</strong>.
      </p>

      <div className="space-y-1">
        <p className="font-medium text-sm">Warum wichtig?</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>
            <strong>Kerngeschäfts-Stärke:</strong> Misst die wahre Ertragskraft.
          </li>
          <li>
            <strong>Preissetzung & Kostenkontrolle:</strong> Hohe Marge = Preise durchsetzbar.
          </li>
          <li>
            <strong>Puffer in Krisen:</strong> Dickere Marge = mehr Schutz.
          </li>
        </ul>
      </div>

      {preset !== "Default" && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground italic">
            Scoring-Preset: <strong>{preset}</strong>
          </p>
        </div>
      )}
    </div>
  );

  return (
    <Card className={`p-4 border-2 ${getBgColor(score, maxScore)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">EBIT-Marge (Operating Margin)</h3>
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
          <div className={`text-2xl font-bold ${getColor(score, maxScore)}`}>
            {displayValue !== null ? `${displayValue.toFixed(1)}%` : "N/A"}
          </div>
          <div className="text-xs text-muted-foreground">{displayLabel}</div>
        </div>
      </div>

      {/* Score indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm font-medium">Bewertung:</div>
        <div className={`px-2 py-1 rounded text-sm font-semibold ${getColor(score, maxScore)}`}>
          {score}/{maxScore} Punkte
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side={isMobile ? "top" : "right"}>{getScoringTooltip()}</TooltipContent>
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
                          Operating Margin: <span className="font-bold">{payload[0].value}%</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
