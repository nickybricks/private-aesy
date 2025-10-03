import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2, AlertTriangle, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStock } from '@/context/StockContext';
import { fetchValuation } from '@/services/ValuationService';

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

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Berechnung */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Berechnung</h3>
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground text-sm">Startwert (per Share)</span>
                <span className="font-semibold">${data.startValue.toFixed(2)}</span>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Phase 1 (10J, {data.growthRate}%)</span>
                  <span className="font-semibold text-sm">${data.pvPhase1.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  WACC {data.wacc}%
                </p>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Phase 2 (10J, {data.terminalRate}%)</span>
                  <span className="font-semibold text-sm">${data.pvPhase2.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Terminal {data.terminalRate}%
                </p>
              </div>

              <div className="flex justify-between items-center py-2 border-t border-b">
                <span className="font-semibold text-sm">Summe (PV Phase 1+2)</span>
                <span className="font-bold">${(data.pvPhase1 + data.pvPhase2).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-2 text-muted-foreground">
                <span className="text-xs">+ TBV/Aktie (opt.)</span>
                <span className="text-xs">${data.tangibleBook.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-t-2 border-primary">
                <span className="font-bold">Fair Value</span>
                <span className="text-xl font-bold text-primary">${data.fairValue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Column 2: Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Innerer Wert</h3>
          <div className="space-y-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Aktueller Preis</p>
              <p className="text-2xl font-bold">${currentPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Fair Value pro Aktie</p>
              <p className="text-2xl font-bold text-primary">${data.fairValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sicherheitsmarge</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${
                  marginOfSafety >= 5 ? 'text-green-600 dark:text-green-400' : 
                  marginOfSafety <= -5 ? 'text-red-600 dark:text-red-400' : 
                  'text-muted-foreground'
                }`}>
                  {marginOfSafety.toFixed(1)}%
                </p>
                <Badge variant={mosStatus.variant}>{mosStatus.label}</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Über/Unterbewertung</p>
              <p className={`text-xl font-semibold ${
                currentPrice < data.fairValue ? 'text-green-600 dark:text-green-400' : 
                currentPrice > data.fairValue * 1.05 ? 'text-red-600 dark:text-red-400' : 
                'text-muted-foreground'
              }`}>
                {currentPrice < data.fairValue ? '−' : '+'}{Math.abs(currentPrice - data.fairValue).toFixed(2)} $
              </p>
              <p className={`text-sm ${
                currentPrice < data.fairValue ? 'text-green-600 dark:text-green-400' : 
                currentPrice > data.fairValue * 1.05 ? 'text-red-600 dark:text-red-400' : 
                'text-muted-foreground'
              }`}>
                ({currentPrice < data.fairValue ? '−' : '+'}{Math.abs(((currentPrice - data.fairValue) / data.fairValue) * 100).toFixed(1)}%)
              </p>
            </div>
          </div>
        </Card>

        {/* Column 3: Annahmen */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Annahmen (Read-only)</h3>
          <div className="space-y-4">
            <AssumptionItem 
              label="WACC (Diskontierungssatz)" 
              value={`${data.wacc}%`}
            />
            <AssumptionItem 
              label="Wachstumsphase" 
              value={`10 Jahre @ ${data.growthRate}%`}
            />
            <AssumptionItem 
              label="Terminal-Phase" 
              value={`10 Jahre @ ${data.terminalRate}%`}
            />
            <AssumptionItem 
              label="Tangible Book per Share" 
              value={`$${data.tangibleBook.toFixed(2)}`}
            />
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Predictability</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Edit className="h-3 w-3 text-muted-foreground/40 cursor-not-allowed" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">In diesem Modus nicht bearbeitbar</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge variant="secondary">Medium</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Helper component for assumption items with edit icon
const AssumptionItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-2">
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Edit className="h-3 w-3 text-muted-foreground/40 cursor-not-allowed" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">In diesem Modus nicht bearbeitbar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
    <span className="text-sm font-semibold">{value}</span>
  </div>
);
