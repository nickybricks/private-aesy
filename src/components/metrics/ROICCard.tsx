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

interface ROICCardProps {
  currentValue: number | null;
  historicalData?: Array<{ year: string; value: number }>;
  wacc?: number;
  preset?: string;
  scoreFromBackend?: ScoreResult;
}

export const ROICCard: React.FC<ROICCardProps> = ({
  currentValue,
  historicalData,
  wacc,
  preset = "Default",
  scoreFromBackend,
}) => {
  const isMobile = useIsMobile();
  console.log("ROICCard - WACC value:", wacc);
  console.log("ROICCard - Preset:", preset);
  console.log("ROICCard - Score from backend:", scoreFromBackend);

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

  // Calculate spread over WACC
  const spread = displayValue !== null && wacc !== null && wacc !== undefined ? displayValue - wacc : null;

  // Use backend score if available, otherwise calculate locally
  const score = scoreFromBackend?.score ?? 0;
  const maxScore = scoreFromBackend?.maxScore ?? 6;

  // Get color based on score
  const getColor = (score: number, maxScore: number): string => {
    const ratio = score / maxScore;
    if (ratio >= 0.83) return "text-green-600"; // 5/6 or higher
    if (ratio >= 0.67) return "text-green-500"; // 4/6
    if (ratio >= 0.33) return "text-yellow-600"; // 2/6
    return "text-red-600";
  };

  const getBgColor = (score: number, maxScore: number): string => {
    if (maxScore === 0) return "bg-gray-100 border-gray-300";
    const ratio = score / maxScore;
    if (ratio >= 0.83) return "bg-green-50 border-green-200";
    if (ratio >= 0.67) return "bg-green-50/50 border-green-100";
    if (ratio >= 0.33) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  // Preset-specific tooltip content
  const getScoringTooltip = () => {
    if (preset === "Industrials") {
      return (
        <div className="space-y-1">
          <p className="font-medium text-sm">Bewertung (0-5 Punkte) - Industrials:</p>
          <p className="text-sm">
            <span className="text-green-600">●</span> 5 Pkt: ≥ 14% und ROIC &gt; WACC + 5 pp
          </p>
          <p className="text-sm">
            <span className="text-green-600">●</span> 4 Pkt: ≥ 12% und ROIC &gt; WACC + 3 pp
          </p>
          <p className="text-sm">
            <span className="text-green-500">●</span> 3 Pkt: ≥ 10% und ROIC &gt; WACC
          </p>
          <p className="text-sm">
            <span className="text-yellow-600">●</span> 1 Pkt: ≥ 8%
          </p>
          <p className="text-sm">
            <span className="text-red-600">●</span> 0 Pkt: &lt; 8% oder ≤ WACC
          </p>
        </div>
      );
    }

    if (preset === "Software") {
      return (
        <div className="space-y-1">
          <p className="font-medium text-sm">Bewertung (0-6 Punkte) - Software:</p>
          <p className="text-sm">
            <span className="text-green-600">●</span> 6 Pkt: ≥ 18% und ROIC &gt; WACC + 8 pp
          </p>
          <p className="text-sm">
            <span className="text-green-600">●</span> 5 Pkt: ≥ 15% und ROIC &gt; WACC + 5 pp
          </p>
          <p className="text-sm">
            <span className="text-yellow-600">●</span> 4 Pkt: ≥ 12% und ROIC &gt; WACC
          </p>
          <p className="text-sm">
            <span className="text-yellow-600">●</span> 2 Pkt: ≥ 9%
          </p>
          <p className="text-sm">
            <span className="text-red-600">●</span> 0 Pkt: &lt; 9%
          </p>
        </div>
      );
    }

    // Default scoring
    return (
      <div className="space-y-1">
        <p className="font-medium text-sm">Bewertung (0-6 Punkte):</p>
        <p className="text-sm">
          <span className="text-green-600">●</span> 6 Pkt: ≥ 15% und ROIC &gt; WACC + 5 pp
        </p>
        <p className="text-sm">
          <span className="text-green-600">●</span> 5 Pkt: ≥ 12% und ROIC &gt; WACC
        </p>
        <p className="text-sm">
          <span className="text-green-500">●</span> 4 Pkt: ≥ 10% und ROIC ≥ WACC
        </p>
        <p className="text-sm">
          <span className="text-yellow-600">●</span> 2 Pkt: ≥ 8%
        </p>
        <p className="text-sm">
          <span className="text-red-600">●</span> 0 Pkt: &lt; 8% oder ≤ WACC
        </p>
      </div>
    );
  };

  const tooltipContent = (
    <div className="max-w-sm space-y-2">
      <p className="font-semibold">Kapitalrendite = Rendite auf das im Kerngeschäft gebundene Kapital</p>
      <p className="text-sm text-muted-foreground">(ROIC = Return on Invested Capital)</p>
      <p className="text-sm italic">
        Einfach gesagt: Wie viel Gewinn nach Steuern verdient die Firma auf jeden Euro, der im Geschäft arbeitet
        (Maschinen, Lager, Software – abzüglich überschüssiger Kasse).
      </p>

      <div className="space-y-1">
        <p className="font-medium text-sm">Formel in leicht:</p>
        <ul className="text-sm space-y-1 list-disc list-inside ml-2">
          <li>
            <strong>ROIC ≈ NOPAT / Invested Capital</strong>
          </li>
          <li>
            <strong>NOPAT</strong> = operativer Gewinn (EBIT) × (1 − normalisierte Steuerquote)
          </li>
          <li>
            <strong>Invested Capital</strong> = Betriebsvermögen minus überschüssige Liquidität
          </li>
        </ul>
      </div>

      <div className="space-y-1">
        <p className="font-medium text-sm">Warum wichtig?</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>
            <strong>Moat-Messer:</strong> Dauerhaft hoher ROIC zeigt Preissetzungsmacht.
          </li>
          <li>
            <strong>Werttreiber:</strong> Nur wenn ROIC &gt; WACC, wird nachhaltig Wert geschaffen.
          </li>
          <li>
            <strong>Manager-Score:</strong> Zeigt, wie gut das Management Kapital zuteilt.
          </li>
        </ul>
      </div>

      <div className="space-y-1">
        <p className="font-medium text-sm">Spread über WACC:</p>
        <p className="text-sm">
          Entscheidend ist der Abstand: <strong>ROIC − WACC</strong>. &gt; 0 = Wertschaffung; je größer, desto besser.
        </p>
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
          <h3 className="font-semibold text-lg">Kapitalrendite (ROIC)</h3>
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

      {/* Score indicator and WACC spread */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
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

        {spread !== null && wacc !== null && wacc !== undefined && (
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">Spread vs. WACC:</div>
            <div
              className={`px-2 py-1 rounded text-xs font-semibold ${
                spread > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {spread > 0 ? "+" : ""}
              {spread.toFixed(1)} pp
            </div>
          </div>
        )}
      </div>

      {wacc !== null && wacc !== undefined && (
        <div className="text-xs text-muted-foreground mb-3">WACC (Kapitalkosten): {wacc.toFixed(1)}%</div>
      )}

      {/* Chart if historical data available */}
      {chartData.length > 1 && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-2">Historischer Verlauf</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <YAxis
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
                domain={[
                  (dataMin: number) => {
                    const minVal = Math.min(dataMin, wacc || 0);
                    return Math.floor(minVal / 5) * 5;
                  },
                  (dataMax: number) => {
                    const maxVal = Math.max(dataMax, wacc || 0, 15);
                    return Math.ceil(maxVal / 5) * 5;
                  },
                ]}
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-semibold">{payload[0].payload.year}</p>
                        <p className="text-sm text-primary">
                          ROIC: <span className="font-bold">{payload[0].value}%</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={15} stroke="#16a34a" strokeDasharray="3 3" />
              <ReferenceLine y={8} stroke="#ca8a04" strokeDasharray="3 3" />
              {wacc !== null && wacc !== undefined && (
                <ReferenceLine
                  y={wacc}
                  stroke="#dc2626"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: `WACC (${wacc.toFixed(1)}%)`,
                    position: "insideTopRight",
                    fontSize: 11,
                    fill: "#dc2626",
                    fontWeight: "bold",
                  }}
                />
              )}
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
