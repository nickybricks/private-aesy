import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Info, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { calculateAesyScore } from "@/services/AesyScoreService";
import { useStock } from "@/context/StockContext";
import { useState, useEffect } from "react";
import { DEFAULT_FMP_API_KEY } from "./ApiKeyInput";
import { Button } from "./ui/button";
import { ClickableTooltip } from "./ClickableTooltip";

export function AesyScoreSummaryTab() {
  const { stockInfo, financialMetrics, overallRating, buffettCriteria, triggerDeepResearch } = useStock();
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  
  // Fetch historical data for momentum calculation
  useEffect(() => {
    if (!stockInfo?.ticker) return;
    
    const fetchHistoricalData = async () => {
      try {
        const endpoint = `https://financialmodelingprep.com/api/v3/historical-price-full/${stockInfo.ticker}?apikey=${DEFAULT_FMP_API_KEY}`;
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.historical && Array.isArray(data.historical)) {
          setHistoricalData(data.historical.reverse());
        }
      } catch (error) {
        console.error('Error fetching historical data for momentum:', error);
      }
    };
    
    fetchHistoricalData();
  }, [stockInfo?.ticker]);
  
  const stockData = {
    stockInfo,
    financialMetrics,
    overallRating,
    buffettCriteria,
    historicalData,
  };
  
  const aesyScoreData = calculateAesyScore(stockData);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-success";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return "bg-success/10 border-success/20";
    if (score >= 40) return "bg-warning/10 border-warning/20";
    return "bg-destructive/10 border-destructive/20";
  };

  const getTrendIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="h-4 w-4 text-success" />;
    if (score >= 40) return <Minus className="h-4 w-4 text-warning" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const getPeterLynchBadge = () => {
    if (!aesyScoreData.peterLynch.priceToLynch) return null;
    
    const ratio = aesyScoreData.peterLynch.priceToLynch;
    if (ratio <= 0.8) return <Badge variant="default" className="bg-success text-white">Unterbewertet</Badge>;
    if (ratio <= 1.2) return <Badge variant="secondary">Fair bewertet</Badge>;
    return <Badge variant="destructive">Überbewertet</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Hinweise */}
      {!aesyScoreData.notes.aiIncluded && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>KI-Analyse nicht durchgeführt – starte sie für eine vollständige Bewertung.</span>
            <Button 
              size="sm" 
              onClick={() => triggerDeepResearch(stockInfo?.ticker)}
              disabled={!stockInfo?.ticker}
            >
              KI-Analyse starten
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {aesyScoreData.notes.hasDataGaps && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Daten unvollständig – Ergebnis vorsichtig interpretieren. Wichtige Finanzkennzahlen fehlen.
          </AlertDescription>
        </Alert>
      )}

      {/* Säulen-Karten */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Die 6 Säulen</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PillarCard
            title="Finanzielle Stärke"
            score={aesyScoreData.financialStrength}
            tooltip={aesyScoreData.tooltips.financialStrength}
          />
          <PillarCard
            title="Profitabilität"
            score={aesyScoreData.profitability}
            tooltip={aesyScoreData.tooltips.profitability}
          />
          <PillarCard
            title="Wachstum"
            score={aesyScoreData.growth}
            tooltip={aesyScoreData.tooltips.growth}
          />
          <PillarCard
            title="Bewertung"
            score={aesyScoreData.value}
            tooltip={aesyScoreData.tooltips.value}
          />
          <PillarCard
            title="Momentum"
            score={aesyScoreData.momentum}
            tooltip={aesyScoreData.tooltips.momentum}
          />
          {aesyScoreData.qualitative !== null && (
            <PillarCard
              title="Qualitative Faktoren"
              score={aesyScoreData.qualitative}
              tooltip={aesyScoreData.tooltips.qualitative}
            />
          )}
        </div>
      </div>

      {/* Peter Lynch Mini */}
      {aesyScoreData.peterLynch.fairValue && (
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Peter Lynch Fair Value</h3>
              {getPeterLynchBadge()}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fair Value</p>
                <p className="text-2xl font-bold">
                  {aesyScoreData.peterLynch.fairValue} {stockInfo?.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Preis / Fair Value</p>
                <p className="text-2xl font-bold">
                  {aesyScoreData.peterLynch.priceToLynch}x
                </p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-2">
                Der aktuelle Preis liegt bei{" "}
                <span className="font-semibold">
                  {((aesyScoreData.peterLynch.priceToLynch - 1) * 100).toFixed(0)}%
                </span>
                {aesyScoreData.peterLynch.priceToLynch > 1 ? " über" : " unter"} dem Fair Value.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="#peter-lynch-tab">Mehr Details im Peter Lynch Tab →</a>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Gesamtscore Zusammenfassung */}
      <Card className="p-6 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Aesy Score Gesamt</h3>
            <p className="text-sm text-muted-foreground">
              {aesyScoreData.notes.aiIncluded 
                ? "Basierend auf 5 quantitativen Säulen (90%) und qualitativer KI-Analyse (10%)"
                : "Basierend auf 5 quantitativen Säulen"
              }
            </p>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-bold ${getScoreColor(aesyScoreData.aesyScore)}`}>
              {aesyScoreData.aesyScore}
            </div>
            <div className="text-sm text-muted-foreground">von 100</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface PillarCardProps {
  title: string;
  score: number;
  tooltip: {
    title: string;
    what: string;
    why: string;
    good: string;
  };
}

function PillarCard({ title, score, tooltip }: PillarCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-success";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return "bg-success/10 border-success/20";
    if (score >= 40) return "bg-warning/10 border-warning/20";
    return "bg-destructive/10 border-destructive/20";
  };

  const getTrendIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="h-5 w-5 text-success" />;
    if (score >= 40) return <Minus className="h-5 w-5 text-warning" />;
    return <TrendingDown className="h-5 w-5 text-destructive" />;
  };

  return (
    <Card className={`p-4 border-2 ${getScoreBgColor(score)} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-sm">{title}</h4>
          <ClickableTooltip
            content={
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-semibold text-xs text-muted-foreground mb-1">Was ist das?</p>
                  <p>{tooltip.what}</p>
                </div>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground mb-1">Warum wichtig?</p>
                  <p>{tooltip.why}</p>
                </div>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground mb-1">Guter Score bedeutet:</p>
                  <p>{tooltip.good}</p>
                </div>
              </div>
            }
          >
            <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help" />
          </ClickableTooltip>
        </div>
        {getTrendIcon(score)}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
          {score}
        </span>
        <span className="text-sm text-muted-foreground">/100</span>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        {tooltip.good}
      </p>
    </Card>
  );
}
