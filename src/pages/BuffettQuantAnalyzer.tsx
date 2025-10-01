import React, { useState, useMemo } from 'react';
import { BarChart3, Calculator, AlertCircle, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import MarketSelector from '@/components/MarketSelector';
import QuantAnalysisTable from '@/components/QuantAnalysisTable';
import { Shell, ShellHeader, ShellTitle, ShellDescription, ShellContent } from '@/components/layout/Shell';
import { analyzeMarket, QuantAnalysisResult, marketOptions } from '@/api/quantAnalyzerApi';
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Verfügbare Sektoren
const sectors = [
  { id: 'all', name: 'Alle Sektoren' },
  { id: 'Technology', name: 'Technologie' },
  { id: 'Financial Services', name: 'Finanzdienstleistungen' },
  { id: 'Healthcare', name: 'Gesundheitswesen' },
  { id: 'Consumer Cyclical', name: 'Konsumgüter (zyklisch)' },
  { id: 'Industrials', name: 'Industrie' },
  { id: 'Communication Services', name: 'Kommunikationsdienste' },
  { id: 'Consumer Defensive', name: 'Konsumgüter (defensiv)' },
  { id: 'Energy', name: 'Energie' },
  { id: 'Basic Materials', name: 'Grundstoffe' },
  { id: 'Real Estate', name: 'Immobilien' },
  { id: 'Utilities', name: 'Versorgung' }
];

// Optionen für die Anzahl der zu analysierenden Aktien
const stockLimitOptions = [
  { value: 50, label: '50 Aktien (ca. 1 Minute)' },
  { value: 100, label: '100 Aktien (ca. 2 Minuten)' },
  { value: 200, label: '200 Aktien (ca. 3 Minuten)' },
  { value: 500, label: '500 Aktien (ca. 8 Minuten)' },
  { value: 1000, label: '1000 Aktien (ca. 15 Minuten)' },
  { value: 2000, label: '2000 Aktien (ca. 30 Minuten)' }
];

const BuffettQuantAnalyzer = () => {
  const { toast } = useToast();
  const [selectedMarket, setSelectedMarket] = useState('NYSE');
  const [selectedSector, setSelectedSector] = useState('all');
  const [stockLimit, setStockLimit] = useState(100);
  const [results, setResults] = useState<QuantAnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [currentOperation, setCurrentOperation] = useState('');
  
  // Schätzen der Analysezeit basierend auf der Anzahl der Aktien (mit Batch-Verarbeitung)
  const estimatedTime = useMemo(() => {
    const batches = Math.ceil(stockLimit / 50);
    const totalMinutes = batches + (batches - 1); // 1 Minute pro Batch + 1 Minute Wartezeit zwischen Batches
    
    if (totalMinutes <= 1) return "ca. 1 Minute";
    if (totalMinutes <= 3) return `ca. ${totalMinutes} Minuten`;
    if (totalMinutes <= 10) return `ca. ${totalMinutes} Minuten`;
    if (totalMinutes <= 30) return `ca. ${totalMinutes} Minuten`;
    return `ca. ${Math.round(totalMinutes / 60)} Stunden`;
  }, [stockLimit]);
  
  const handleMarketChange = (value: string) => {
    setSelectedMarket(value);
  };
  
  const handleSectorChange = (value: string) => {
    setSelectedSector(value);
  };
  
  const handleStockLimitChange = (value: string) => {
    const numValue = parseInt(value, 10);
    setStockLimit(numValue);
    
    // Zeige Warnung bei großen Datenmengen
    if (numValue >= 1000) {
      setShowWarningDialog(true);
    }
  };
  
  const startAnalysis = async () => {
    if (!selectedMarket) {
      toast({
        title: "Bitte wählen Sie einen Markt aus",
        description: "Sie müssen zuerst eine Börse oder einen Index auswählen, um die Analyse zu starten.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setResults([]);
    setProgress(0);
    setCurrentOperation("Starte Analyse...");
    
    try {
      // Analyse mit dem eingestellten Limit und Progress-Callback
      const analysisResults = await analyzeMarket(
        selectedMarket, 
        stockLimit,
        (progressValue: number, operation: string) => {
          setProgress(progressValue);
          setCurrentOperation(operation);
        }
      );
      
      // Filter nach Sektor, falls nicht "Alle" ausgewählt
      const filteredResults = selectedSector === 'all' 
        ? analysisResults 
        : analysisResults.filter(result => {
            return result.sector === selectedSector;
          });
      
      setResults(filteredResults);
      setHasAnalyzed(true);
      setProgress(100);
      setCurrentOperation("Analyse abgeschlossen");
      
      const selectedMarketOption = marketOptions.find(option => option.id === selectedMarket);
      const marketName = selectedMarketOption ? selectedMarketOption.name : selectedMarket;
      
      toast({
        title: "Analyse abgeschlossen",
        description: `${filteredResults.length} Aktien von ${marketName} wurden nach Buffett-Kriterien analysiert.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Fehler bei der Analyse:', error);
      toast({
        title: "Analyse fehlgeschlagen",
        description: "Bei der Analyse ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main id="main-content" className="flex-1 overflow-auto bg-background">
      <Shell>
        <ShellHeader>
          <ShellTitle>Markt-Scanner</ShellTitle>
          <ShellDescription>Analysiere hunderte Aktien nach quantitativen Kriterien</ShellDescription>
        </ShellHeader>

        <ShellContent>
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Marktanalyse-Konfiguration</h2>
            </div>
            
            <div className="space-y-6">
              {/* Marktauswahl */}
              <div className="space-y-3">
                <Label htmlFor="market" className="text-sm font-medium">Markt auswählen</Label>
                <MarketSelector 
                  selectedMarket={selectedMarket} 
                  onMarketChange={handleMarketChange} 
                />
                <p className="text-xs text-muted-foreground">
                  Analysiert die liquidesten Titel des ausgewählten Index
                </p>
              </div>
              
              {/* Sektorenfilter */}
              <div className="space-y-3">
                <Label htmlFor="sector" className="text-sm font-medium">Sektor (optional)</Label>
                <Select value={selectedSector} onValueChange={handleSectorChange}>
                  <SelectTrigger className="w-full md:w-80" id="sector">
                    <SelectValue placeholder="Sektor auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map(sector => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Schränke die Suche auf eine Branche ein
                </p>
              </div>
              
              {/* Anzahl der Aktien festlegen */}
              <div className="space-y-3">
                <Label htmlFor="stockLimit" className="text-sm font-medium">Anzahl Aktien</Label>
                <Select value={stockLimit.toString()} onValueChange={handleStockLimitChange}>
                  <SelectTrigger className="w-full md:w-80" id="stockLimit">
                    <SelectValue placeholder="Anzahl auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockLimitOptions.map(option => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Geschätzte Dauer:</span>
                  <Badge variant="secondary" className="font-mono">{estimatedTime}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky CTA Bar */}
          <div className="sticky bottom-0 bg-card border-t border-border pt-4 pb-6 -mx-8 px-8 mt-6">
            <Button 
              size="lg"
              onClick={() => stockLimit >= 1000 ? setShowWarningDialog(true) : startAnalysis()} 
              disabled={isLoading || !selectedMarket}
              className="w-full sm:w-auto min-w-[200px]"
            >
              {isLoading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Analysiere...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Jetzt scannen
                </>
              )}
            </Button>
          </div>

          {/* Fortschrittsanzeige während der Analyse */}
          {isLoading && (
            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-8">
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{currentOperation}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Batch-Verarbeitung mit Wartezeiten zwischen API-Calls
                  </p>
                </div>
                <span className="text-2xl font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          )}

          {(hasAnalyzed || isLoading) && (
            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
              <QuantAnalysisTable results={results} isLoading={isLoading} />
            </div>
          )}

          <div className="mt-8 bg-card p-6 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-semibold mb-4">Über den Markt-Scanner</h2>
            <p className="text-muted-foreground mb-4">
              Der Aesy Markt-Scanner bewertet Aktien ausschließlich auf Basis von harten Finanzkennzahlen, 
              gemäß bewährten Investmentprinzipien. Für jedes der 12 Kriterien wird 1 Punkt vergeben, 
              wenn die Aktie den Zielwert erreicht.
            </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Bewertungskriterien:</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>ROE (Eigenkapitalrendite) &gt; 15%</li>
              <li>ROIC (Kapitalrendite) &gt; 10%</li>
              <li>Nettomarge &gt; 10%</li>
              <li>Stabiles EPS-Wachstum (positiv)</li>
              <li>Stabiles Umsatzwachstum (positiv)</li>
              <li>Zinsdeckungsgrad &gt; 5</li>
              <li>Schuldenquote &lt; 70%</li>
              <li>KGV (P/E) &lt; 15</li>
              <li>P/B &lt; 1.5 (oder &lt; 3 bei starker Marge)</li>
              <li>Dividendenrendite &gt; 2%</li>
              <li><strong>Innerer Wert &gt; Aktienkurs</strong></li>
              <li><strong>Innerer Wert mit 20% Sicherheitsmarge &gt; Aktienkurs</strong></li>
            </ul>
          </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-foreground">Bewertungslegende:</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center">
                  <Badge variant="success" className="mr-2">🟢 Kandidat</Badge>
                  <span className="text-sm">Score 9-12: Starke Buffett-Kandidaten</span>
                </li>
                <li className="flex items-center">
                  <Badge variant="warning" className="mr-2">🟡 Beobachten</Badge>
                  <span className="text-sm">Score 6-8: Moderate Buffett-Konformität</span>
                </li>
                <li className="flex items-center">
                  <Badge variant="danger" className="mr-2">🔴 Vermeiden</Badge>
                  <span className="text-sm">Score &lt;6: Nicht Buffett-konform</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="font-semibold mb-2 text-primary">Batch-Verarbeitung</h3>
            <p className="text-sm text-muted-foreground">
              Um API-Limits zu umgehen, läuft die Analyse in Batches von 50 Aktien. 
              Zwischen den Batches wird 65 Sekunden gewartet, um das 300-Calls/Minute-Limit zu respektieren. 
              Dies ermöglicht die Analyse von deutlich mehr Aktien als zuvor.
            </p>
          </div>
        </div>
      </ShellContent>
    </Shell>

      {/* Warnungsdialog für große Analysen */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Große Datenanalyse</AlertDialogTitle>
            <AlertDialogDescription>
              Sie haben {stockLimit} Aktien zur Analyse ausgewählt. Dies wird in mehreren Batches verarbeitet 
              und kann {estimatedTime} dauern.
              
              <div className="mt-3 p-3 bg-warning/10 rounded-lg border border-warning/20 flex items-start gap-2">
                <AlertCircle className="text-warning h-5 w-5 mt-0.5 shrink-0" />
                <span className="text-sm">Die Analyse läuft automatisch in Batches mit Wartezeiten zwischen den API-Calls.</span>
              </div>
              
              <div className="mt-3 text-sm">Möchten Sie mit der Analyse fortfahren?</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={startAnalysis}>Ja, analysieren</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default BuffettQuantAnalyzer;
