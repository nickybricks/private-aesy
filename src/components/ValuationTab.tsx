import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStock } from '@/context/StockContext';
import { fetchValuation } from '@/services/ValuationService';
import { ValuationGauge } from './ValuationGauge';

type BasisMode = 'EPS_WO_NRI' | 'FCF_PER_SHARE' | 'ADJUSTED_DIVIDEND';

interface ValuationTabProps {
  ticker: string;
  currentPrice: number;
}

export const ValuationTab = ({ ticker, currentPrice }: ValuationTabProps) => {
  const [selectedMode, setSelectedMode] = useState<BasisMode>('EPS_WO_NRI');
  const [loading, setLoading] = useState(false);
  const [valuationData, setValuationData] = useState<any>(null);
  const { toast } = useToast();
  const { valuationData: contextValuationData } = useStock();

  // Use context data if available and matches current mode
  useEffect(() => {
    if (contextValuationData && contextValuationData.mode === selectedMode) {
      console.log('Using valuation data from context:', contextValuationData);
      setValuationData(contextValuationData);
      setLoading(false);
      return;
    }
    
    // Otherwise fetch fresh data
    const fetchValuationData = async () => {
      if (!ticker) return;
      
      setLoading(true);
      try {
        const data = await fetchValuation(ticker, selectedMode, currentPrice);
        setValuationData(data);
        console.log('Valuation data loaded:', data);
      } catch (error) {
        console.error('Error fetching valuation:', error);
        toast({
          title: 'Fehler beim Laden',
          description: 'Die Bewertungsdaten konnten nicht geladen werden.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchValuationData();
  }, [ticker, selectedMode, currentPrice, contextValuationData]);

  // Show loading state
  if (loading || !valuationData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const data = {
    startValue: valuationData.components.startValuePerShare,
    growthRate: valuationData.assumptions.growthRatePct,
    terminalRate: valuationData.assumptions.terminalRatePct,
    wacc: valuationData.assumptions.discountRatePct,
    pvPhase1: valuationData.components.pvPhase1,
    pvPhase2: valuationData.components.pvPhase2,
    tangibleBook: valuationData.assumptions.tangibleBookPerShare,
    fairValue: valuationData.fairValuePerShare,
  };
  
  const marginOfSafety = valuationData.marginOfSafetyPct;
  const warnings = valuationData.warnings || [];

  const getMoSStatus = (mos: number): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
    if (mos >= 30) return { label: 'Unterbewertet', variant: 'default' };
    if (mos >= 10) return { label: 'Leicht unterbewertet', variant: 'secondary' };
    if (mos >= 0) return { label: 'Fair', variant: 'secondary' };
    return { label: 'Überbewertet', variant: 'destructive' };
  };

  const mosStatus = getMoSStatus(marginOfSafety);

  const modeConfig = {
    EPS_WO_NRI: {
      label: 'EPS w/o NRI',
      tooltip: 'Gewinn je Aktie ohne Sondereffekte – glättet Ausreißer.',
    },
    FCF_PER_SHARE: {
      label: 'FCF per Share',
      tooltip: 'Freier Cashflow je Aktie (operativer Cash – Investitionen).',
    },
    ADJUSTED_DIVIDEND: {
      label: 'Adjusted Dividend',
      tooltip: 'Dividende + Netto-Aktienrückkäufe je Aktie.',
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Innerer Wert (20-Jahre-Modell)</h2>
        <p className="text-muted-foreground">
          Zwei Phasen, per Share, diskontiert mit WACC. Annahmen serverseitig festgelegt.
        </p>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="text-sm">{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Mode Selection */}
      <Card className="p-4">
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(modeConfig) as BasisMode[]).map((mode) => (
            <TooltipProvider key={mode}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedMode === mode ? 'default' : 'outline'}
                    onClick={() => setSelectedMode(mode)}
                    className="flex items-center gap-2"
                  >
                    {modeConfig[mode].label}
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{modeConfig[mode].tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </Card>

      {/* Summary with Gauge */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Key Metrics */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Aktueller Preis</p>
              <p className="text-3xl font-bold">${currentPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Fair Value ({modeConfig[selectedMode].label})</p>
              <p className="text-4xl font-bold text-primary">${data.fairValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Margin of Safety</p>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold">{marginOfSafety.toFixed(2)}%</p>
                <Badge variant={mosStatus.variant} className="text-base px-3 py-1">
                  {mosStatus.label}
                </Badge>
              </div>
            </div>
            
            {/* Recommendation */}
            <div className="pt-4 border-t">
              {marginOfSafety >= 0 ? (
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-600">Kaufgelegenheit</p>
                    <p className="text-sm text-muted-foreground">
                      Die Aktie handelt {Math.abs(marginOfSafety).toFixed(0)}% unter dem fairen Wert.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-600">Überbewertet</p>
                    <p className="text-sm text-muted-foreground">
                      Die Aktie handelt {Math.abs(marginOfSafety).toFixed(0)}% über dem fairen Wert.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Right: Gauge */}
        <Card className="p-6 flex items-center justify-center">
          <ValuationGauge
            marginOfSafety={marginOfSafety}
            fairValue={data.fairValue}
            currentPrice={currentPrice}
          />
        </Card>
      </div>

      {/* Calculation Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Berechnung (20-Jahre-Modell, 2 Phasen)
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Diskontierung mit WACC über 20 Jahre: 10 Jahre Wachstum, 10 Jahre Terminal-Phase.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h3>
        <div className="space-y-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center py-2 border-b bg-muted/30 px-3 rounded">
              <span className="font-medium">Startwert (per Share)</span>
              <span className="font-bold text-lg">${data.startValue.toFixed(2)}</span>
            </div>
            
            <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium">Phase 1: Wachstum</span>
                  <p className="text-xs text-muted-foreground">10 Jahre @ {data.growthRate.toFixed(1)}% p.a.</p>
                </div>
                <span className="font-bold text-lg">${data.pvPhase1.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Barwert mit WACC {data.wacc.toFixed(1)}% diskontiert
              </p>
            </div>

            <div className="bg-gradient-to-r from-secondary/10 to-transparent p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium">Phase 2: Terminal</span>
                  <p className="text-xs text-muted-foreground">10 Jahre @ {data.terminalRate.toFixed(1)}% p.a.</p>
                </div>
                <span className="font-bold text-lg">${data.pvPhase2.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Konservatives Terminal-Wachstum
              </p>
            </div>

            <div className="flex justify-between items-center py-3 border-t-2 border-b bg-muted/20 px-3 rounded">
              <span className="font-semibold">Summe (PV Phase 1 + Phase 2)</span>
              <span className="font-bold text-xl">${(data.pvPhase1 + data.pvPhase2).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-2 text-muted-foreground px-3">
              <span className="text-sm flex items-center gap-2">
                <Info className="h-3 w-3" />
                Tangible Book per Share (optional)
              </span>
              <span className="text-sm">${data.tangibleBook.toFixed(2)} (nicht einbezogen)</span>
            </div>

            <div className="flex justify-between items-center py-4 border-t-2 border-primary bg-primary/5 px-4 rounded-lg">
              <span className="text-xl font-bold">Fair Value per Share</span>
              <span className="text-3xl font-bold text-primary">${data.fairValue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Assumptions */}
      <Card className="p-6 bg-muted/30">
        <h3 className="text-lg font-semibold mb-4">Annahmen (Serverseitig berechnet)</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">WACC (Diskontierungssatz)</p>
              <p className="text-lg font-bold">{data.wacc.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground">
                CAPM + Buchwert-Schulden
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Wachstumsphase</p>
              <p className="text-lg font-bold">10 Jahre @ {data.growthRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">
                Historischer 5J-CAGR
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Terminal-Phase</p>
              <p className="text-lg font-bold">10 Jahre @ {data.terminalRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">
                Konservatives Terminal-Wachstum
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tangible Book per Share</p>
              <p className="text-lg font-bold">${data.tangibleBook.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                Optional einbeziehbar
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Predictability</p>
              <Badge variant="secondary" className="text-sm">Medium</Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Basierend auf historischer Stabilität
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Datenquelle</p>
              <p className="text-sm font-medium">FMP (10J Historie)</p>
              <p className="text-xs text-muted-foreground">
                Stand: {valuationData.asOf}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
