import { Info } from "lucide-react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { calculateAesyScore } from "@/services/AesyScoreService";
import { useStock } from "@/context/StockContext";
import { useState, useEffect } from "react";
import { DEFAULT_FMP_API_KEY } from "./ApiKeyInput";

export function AesyScoreSnowflake() {
  const { stockInfo, financialMetrics, overallRating, buffettCriteria } = useStock();
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  
  // Fetch historical data and company profile for momentum and sector calculation
  useEffect(() => {
    if (!stockInfo?.ticker) return;
    
    const fetchData = async () => {
      try {
        // Fetch historical data for momentum
        const histEndpoint = `https://financialmodelingprep.com/api/v3/historical-price-full/${stockInfo.ticker}?apikey=${DEFAULT_FMP_API_KEY}`;
        const histResponse = await fetch(histEndpoint);
        const histData = await histResponse.json();
        
        if (histData.historical && Array.isArray(histData.historical)) {
          setHistoricalData(histData.historical.reverse());
        }
        
        // Fetch company profile for sector/industry
        const profileEndpoint = `https://financialmodelingprep.com/api/v3/profile/${stockInfo.ticker}?apikey=${DEFAULT_FMP_API_KEY}`;
        const profileResponse = await fetch(profileEndpoint);
        const profileData = await profileResponse.json();
        
        if (profileData && profileData.length > 0) {
          setCompanyProfile({
            sector: profileData[0].sector,
            industry: profileData[0].industry
          });
        }
      } catch (error) {
        console.error('Error fetching data for AesyScore:', error);
      }
    };
    
    fetchData();
  }, [stockInfo?.ticker]);
  
  // Prepare stockData object for AesyScore service
  const stockData = {
    stockInfo,
    financialMetrics,
    overallRating,
    buffettCriteria,
    historicalData,
    companyProfile,
  };
  
  const aesyScoreData = calculateAesyScore(stockData);

  // Radar-Chart Daten vorbereiten
  const radarData = [
    { 
      subject: "Finanzen", 
      value: aesyScoreData.financialStrength,
      fullMark: 100 
    },
    { 
      subject: "Profit", 
      value: aesyScoreData.profitability,
      fullMark: 100 
    },
    { 
      subject: "Wachstum", 
      value: aesyScoreData.growth,
      fullMark: 100 
    },
    { 
      subject: "Bewertung", 
      value: aesyScoreData.value,
      fullMark: 100 
    },
    { 
      subject: "Momentum", 
      value: aesyScoreData.momentum,
      fullMark: 100 
    },
  ];

  // Qualitative hinzufügen wenn vorhanden
  if (aesyScoreData.qualitative !== null) {
    radarData.push({
      subject: "Qualität",
      value: aesyScoreData.qualitative,
      fullMark: 100
    });
  }

  // Farbe basierend auf Score
  const getScoreColor = (score: number) => {
    if (score >= 70) return "hsl(var(--success))";
    if (score >= 40) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const scoreColor = getScoreColor(aesyScoreData.aesyScore);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Snowflake Radar Chart */}
      <div className="relative w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            />
            <Radar
              dataKey="value"
              stroke={scoreColor}
              fill={scoreColor}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
        
        {/* Aesy Score in der Mitte */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center bg-background/90 rounded-full px-2 py-1">
            <div className="text-2xl font-bold" style={{ color: scoreColor }}>
              {aesyScoreData.aesyScore}
            </div>
          </div>
        </div>
      </div>

      {/* Info Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <Info className="h-3 w-3" />
            Wie berechnet?
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aesy Score Berechnung</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-sm">
            {/* Gesamtscore */}
            <div>
              <h3 className="font-semibold mb-2">Gesamtscore: {aesyScoreData.aesyScore}/100</h3>
              <p className="text-muted-foreground">
                {aesyScoreData.notes.aiIncluded 
                  ? "Der Aesy Score besteht aus 5 quantitativen Säulen (je 18%) und einer qualitativen KI-Analyse (10%)."
                  : "Der Aesy Score ist der Durchschnitt der 5 quantitativen Säulen."
                }
              </p>
            </div>

            {/* Säulen */}
            <div className="space-y-3">
              <h3 className="font-semibold">Die Säulen:</h3>
              
              <div className="grid gap-2">
                <ScorePillar 
                  name="Finanzielle Stärke" 
                  score={aesyScoreData.financialStrength}
                  info={aesyScoreData.tooltips.financialStrength}
                />
                <ScorePillar 
                  name="Profitabilität" 
                  score={aesyScoreData.profitability}
                  info={aesyScoreData.tooltips.profitability}
                />
                <ScorePillar 
                  name="Wachstum" 
                  score={aesyScoreData.growth}
                  info={aesyScoreData.tooltips.growth}
                />
                <ScorePillar 
                  name="Bewertung" 
                  score={aesyScoreData.value}
                  info={aesyScoreData.tooltips.value}
                />
                <ScorePillar 
                  name="Momentum" 
                  score={aesyScoreData.momentum}
                  info={aesyScoreData.tooltips.momentum}
                />
                {aesyScoreData.qualitative !== null && (
                  <ScorePillar 
                    name="Qualitative Faktoren" 
                    score={aesyScoreData.qualitative}
                    info={aesyScoreData.tooltips.qualitative}
                  />
                )}
              </div>
            </div>

            {/* Peter Lynch */}
            {aesyScoreData.peterLynch.fairValue && (
              <div className="border-t pt-3">
                <h3 className="font-semibold mb-1">Peter Lynch Fair Value</h3>
                <p className="text-muted-foreground text-xs mb-2">
                  Der Peter Lynch Fair Value fließt in die Bewertungs-Säule ein.
                </p>
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Fair Value:</span>{" "}
                    <span className="font-semibold">{aesyScoreData.peterLynch.fairValue}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Preis/Fair Value:</span>{" "}
                    <span className="font-semibold">{aesyScoreData.peterLynch.priceToLynch}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Hinweise */}
            {(aesyScoreData.notes.hasDataGaps || !aesyScoreData.notes.aiIncluded) && (
              <div className="border-t pt-3 space-y-2">
                <h3 className="font-semibold">Hinweise:</h3>
                {aesyScoreData.notes.hasDataGaps && (
                  <p className="text-xs text-warning">
                    ⚠️ Es fehlen wichtige Finanzkennzahlen. Der Score basiert auf unvollständigen Daten.
                  </p>
                )}
                {!aesyScoreData.notes.aiIncluded && (
                  <p className="text-xs text-muted-foreground">
                    ℹ️ Keine KI-Analyse verfügbar. Der Score basiert nur auf quantitativen Kennzahlen.
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ScorePillarProps {
  name: string;
  score: number;
  info: {
    what: string;
    why: string;
    good: string;
  };
}

function ScorePillar({ name, score, info }: ScorePillarProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-success";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="border rounded-lg p-3 space-y-1">
      <div className="flex justify-between items-center">
        <span className="font-medium">{name}</span>
        <span className={`font-bold ${getScoreColor(score)}`}>{score}/100</span>
      </div>
      <p className="text-xs text-muted-foreground">{info.what}</p>
      <p className="text-xs text-muted-foreground italic">{info.good}</p>
    </div>
  );
}
