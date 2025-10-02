import React, { useState, useEffect } from 'react';
import { useStock } from '@/context/StockContext';
import { fetchValuation } from '@/api/valuationApi';
import { ValuationMode, ValuationResponse } from '@/types/valuation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { InfoIcon, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ValuationTab = () => {
  const { stockInfo } = useStock();
  const [selectedMode, setSelectedMode] = useState<ValuationMode>('EPS_WO_NRI');
  const [valuationData, setValuationData] = useState<ValuationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stockInfo?.symbol) {
      loadValuation(stockInfo.symbol, selectedMode);
    }
  }, [stockInfo?.symbol, selectedMode]);

  const loadValuation = async (ticker: string, mode: ValuationMode) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchValuation(ticker, mode);
      setValuationData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Bewertung');
      console.error('Valuation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoSBadge = (mosPct: number) => {
    if (mosPct >= 30) {
      return { label: 'Stark unterbewertet', variant: 'default' as const, color: 'text-green-600 dark:text-green-400' };
    } else if (mosPct >= 10) {
      return { label: 'Unterbewertet', variant: 'secondary' as const, color: 'text-green-600 dark:text-green-400' };
    } else if (mosPct >= 0) {
      return { label: 'Fair bewertet', variant: 'outline' as const, color: 'text-yellow-600 dark:text-yellow-400' };
    } else {
      return { label: 'Überbewertet', variant: 'destructive' as const, color: 'text-red-600 dark:text-red-400' };
    }
  };

  const getValuationProgress = (mosPct: number) => {
    // Map -100% to 100% MoS to 0-100 progress scale
    // -100% = 0, 0% = 50, 100% = 100
    return Math.max(0, Math.min(100, 50 + mosPct / 2));
  };

  const modeLabels = {
    EPS_WO_NRI: 'EPS w/o NRI',
    FCF: 'FCF',
    ADJUSTED_DIVIDEND: 'Adjusted Dividend'
  };

  const modeTooltips = {
    EPS_WO_NRI: 'Gewinn je Aktie ohne Sondereffekte – glättet Ausreißer',
    FCF: 'Freier Cashflow je Aktie (operativer Cash – Investitionen)',
    ADJUSTED_DIVIDEND: 'Dividende + Netto-Aktienrückkäufe je Aktie'
  };

  if (!stockInfo) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Bitte wählen Sie eine Aktie aus
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Innerer Wert (20-Jahre-Modell)</h2>
        <p className="text-sm text-muted-foreground">
          Zwei Phasen, per Share, diskontiert mit WACC. Annahmen serverseitig festgelegt.
        </p>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bewertungsmethode</CardTitle>
          <CardDescription>Wählen Sie die Kennzahl für die Bewertung</CardDescription>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {(Object.keys(modeLabels) as ValuationMode[]).map((mode) => (
                <Tooltip key={mode}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedMode === mode ? "default" : "outline"}
                      onClick={() => setSelectedMode(mode)}
                      className={cn(
                        "h-auto py-3 px-4 flex items-center gap-2",
                        selectedMode === mode && "bg-primary text-primary-foreground"
                      )}
                    >
                      {modeLabels[mode]}
                      <InfoIcon className="h-3 w-3 opacity-50" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{modeTooltips[mode]}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="font-semibold">Fehler beim Laden der Bewertung</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Valuation Results */}
      {valuationData && !isLoading && (
        <>
          {/* Summary Card */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Values */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Aktueller Preis</p>
                    <p className="text-2xl font-bold">${valuationData.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fair Value (Innerer Wert)</p>
                    <p className="text-4xl font-bold text-primary">
                      ${valuationData.fairValuePerShare.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Margin of Safety:</p>
                    <Badge variant={getMoSBadge(valuationData.marginOfSafetyPct).variant}>
                      {valuationData.marginOfSafetyPct > 0 ? '+' : ''}
                      {valuationData.marginOfSafetyPct.toFixed(1)}%
                    </Badge>
                    <span className={getMoSBadge(valuationData.marginOfSafetyPct).color}>
                      {getMoSBadge(valuationData.marginOfSafetyPct).label}
                    </span>
                  </div>
                </div>

                {/* Right: Gauge */}
                <div className="flex flex-col justify-center space-y-4">
                  <div className="text-center">
                    {valuationData.marginOfSafetyPct >= 30 ? (
                      <TrendingDown className="h-16 w-16 mx-auto text-green-600 dark:text-green-400" />
                    ) : valuationData.marginOfSafetyPct >= 0 ? (
                      <Minus className="h-16 w-16 mx-auto text-yellow-600 dark:text-yellow-400" />
                    ) : (
                      <TrendingUp className="h-16 w-16 mx-auto text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Progress value={getValuationProgress(valuationData.marginOfSafetyPct)} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Stark unterbewertet</span>
                      <span>Fair</span>
                      <span>Überbewertet</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assumptions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Annahmen (Read-only)</CardTitle>
              <CardDescription>Alle Parameter werden serverseitig berechnet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">WACC</p>
                  <p className="font-semibold">{valuationData.assumptions.discountRatePct.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Wachstumsphase</p>
                  <p className="font-semibold">
                    {valuationData.assumptions.growthYears} Jahre @ {valuationData.assumptions.growthRatePct.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Terminal Phase</p>
                  <p className="font-semibold">
                    {valuationData.assumptions.terminalYears} Jahre @ {valuationData.assumptions.terminalRatePct.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Predictability</p>
                  <Badge variant="outline" className="capitalize">
                    {valuationData.assumptions.predictability}
                  </Badge>
                </div>
              </div>
              {valuationData.assumptions.tangibleBookPerShare > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">Tangible Book per Share</p>
                    <p className="font-semibold">${valuationData.assumptions.tangibleBookPerShare.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {valuationData.assumptions.includeTangibleBook ? 'Im Fair Value enthalten' : 'Nicht im Fair Value enthalten'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Components Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Komponenten der Berechnung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Startwert (per Share):</span>
                  <span className="font-semibold">${valuationData.components.startValuePerShare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PV Phase 1 ({valuationData.assumptions.growthYears} Jahre):</span>
                  <span className="font-semibold">${valuationData.components.pvPhase1.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PV Phase 2 ({valuationData.assumptions.terminalYears} Jahre):</span>
                  <span className="font-semibold">${valuationData.components.pvPhase2.toFixed(2)}</span>
                </div>
                {valuationData.components.tangibleBookAdded > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tangible Book hinzugefügt:</span>
                    <span className="font-semibold">${valuationData.components.tangibleBookAdded.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t">
                  <span className="font-semibold">Fair Value gesamt:</span>
                  <span className="font-bold text-primary">${valuationData.fairValuePerShare.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <div className="text-xs text-center text-muted-foreground">
            Stand: {valuationData.asOf}
          </div>
        </>
      )}
    </div>
  );
};

export default ValuationTab;
