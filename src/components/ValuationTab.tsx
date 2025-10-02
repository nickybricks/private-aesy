import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

type BasisMode = 'EPS_WO_NRI' | 'FCF_PER_SHARE' | 'ADJUSTED_DIVIDEND';

interface ValuationTabProps {
  ticker: string;
  currentPrice: number;
}

export const ValuationTab = ({ ticker, currentPrice }: ValuationTabProps) => {
  const [selectedMode, setSelectedMode] = useState<BasisMode>('EPS_WO_NRI');

  // Mock-Daten für initiale Implementierung
  const mockData = {
    EPS_WO_NRI: {
      startValue: 12.45,
      growthRate: 8.3,
      terminalRate: 4.0,
      wacc: 11.0,
      pvPhase1: 142.18,
      pvPhase2: 89.32,
      tangibleBook: 4.43,
      fairValue: 231.50,
    },
    FCF_PER_SHARE: {
      startValue: 8.92,
      growthRate: 7.5,
      terminalRate: 4.0,
      wacc: 11.0,
      pvPhase1: 101.23,
      pvPhase2: 63.77,
      tangibleBook: 4.43,
      fairValue: 165.00,
    },
    ADJUSTED_DIVIDEND: {
      startValue: 5.12,
      growthRate: 8.3,
      terminalRate: 4.0,
      wacc: 11.0,
      pvPhase1: 57.21,
      pvPhase2: 36.33,
      tangibleBook: 4.43,
      fairValue: 93.53,
    },
  };

  const data = mockData[selectedMode];
  const marginOfSafety = ((data.fairValue - currentPrice) / currentPrice) * 100;

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

      {/* Summary */}
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Aktueller Preis</p>
            <p className="text-2xl font-bold">${currentPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Fair Value</p>
            <p className="text-3xl font-bold text-primary">${data.fairValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Margin of Safety</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{marginOfSafety.toFixed(2)}%</p>
              <Badge variant={mosStatus.variant}>{mosStatus.label}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Calculation Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Berechnung</h3>
        <div className="space-y-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Startwert (per Share)</span>
              <span className="font-semibold">${data.startValue.toFixed(2)}</span>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Phase 1 (10 Jahre, {data.growthRate}% p.a.)</span>
                <span className="font-semibold">${data.pvPhase1.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Diskontiert mit WACC {data.wacc}%
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Phase 2 (10 Jahre, {data.terminalRate}% p.a.)</span>
                <span className="font-semibold">${data.pvPhase2.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Terminal Growth Rate {data.terminalRate}%
              </p>
            </div>

            <div className="flex justify-between items-center py-2 border-t border-b">
              <span className="font-semibold">Summe (PV Phase 1 + Phase 2)</span>
              <span className="font-bold">${(data.pvPhase1 + data.pvPhase2).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-2 text-muted-foreground">
              <span className="text-sm">+ Tangible Book per Share (optional)</span>
              <span className="text-sm">${data.tangibleBook.toFixed(2)} (nicht einbezogen)</span>
            </div>

            <div className="flex justify-between items-center py-3 border-t-2 border-primary">
              <span className="text-lg font-bold">Fair Value per Share</span>
              <span className="text-2xl font-bold text-primary">${data.fairValue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Assumptions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Annahmen (Read-only)</h3>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">WACC (Diskontierungssatz)</span>
            <span className="font-semibold">{data.wacc}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Wachstumsphase</span>
            <span className="font-semibold">10 Jahre @ {data.growthRate}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Terminal-Phase</span>
            <span className="font-semibold">10 Jahre @ {data.terminalRate}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tangible Book per Share</span>
            <span className="font-semibold">${data.tangibleBook.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Predictability</span>
            <Badge variant="secondary">Medium</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
