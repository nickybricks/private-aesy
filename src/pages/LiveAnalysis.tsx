import React, { useState, useMemo, useEffect } from 'react';
import { BarChart3, Calculator, Clock, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import MarketSelector from '@/components/MarketSelector';
import QuantAnalysisTable from '@/components/QuantAnalysisTable';
import { QuantAnalysisResult, marketOptions } from '@/api/quantAnalyzerApi';
import { analyzeMarketWithCache } from '@/api/cachedQuantAnalyzerApi';
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

const stockLimitOptions = [
  { value: 50, label: '50 Aktien (ca. 1 Minute)' },
  { value: 100, label: '100 Aktien (ca. 2 Minuten)' },
  { value: 200, label: '200 Aktien (ca. 3 Minuten)' },
  { value: 500, label: '500 Aktien (ca. 8 Minuten)' },
  { value: 1000, label: '1000 Aktien (ca. 15 Minuten)' },
  { value: 2000, label: '2000 Aktien (ca. 30 Minuten)' },
  { value: 999999, label: 'Alle Aktien' }
];

const LiveAnalysis = () => {
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
  
  useEffect(() => {
    const savedResults = sessionStorage.getItem('liveAnalysisResults');
    const savedHasAnalyzed = sessionStorage.getItem('liveAnalysisHasAnalyzed');
    const savedMarket = sessionStorage.getItem('liveAnalysisMarket');
    const savedSector = sessionStorage.getItem('liveAnalysisSector');
    const savedLimit = sessionStorage.getItem('liveAnalysisLimit');
    
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults);
        const expectedCriteria = ['yearsOfProfitability', 'pe', 'roic', 'roe', 'dividendYield', 'epsGrowth', 'revenueGrowth', 'netDebtToEbitda', 'netMargin'];
        const isValidStructure = parsedResults.length > 0 && parsedResults[0].criteria && 
          expectedCriteria.every((key: string) => parsedResults[0].criteria.hasOwnProperty(key));
        
        if (isValidStructure) {
          setResults(parsedResults);
        } else {
          sessionStorage.removeItem('liveAnalysisResults');
          sessionStorage.removeItem('liveAnalysisHasAnalyzed');
        }
      } catch (e) {
        console.error('Failed to parse saved results:', e);
        sessionStorage.removeItem('liveAnalysisResults');
      }
    }
    
    if (savedHasAnalyzed === 'true' && results.length > 0) {
      setHasAnalyzed(true);
    }
    if (savedMarket) setSelectedMarket(savedMarket);
    if (savedSector) setSelectedSector(savedSector);
    if (savedLimit) setStockLimit(parseInt(savedLimit, 10));
  }, []);
  
  useEffect(() => {
    if (results.length > 0) {
      sessionStorage.setItem('liveAnalysisResults', JSON.stringify(results));
      sessionStorage.setItem('liveAnalysisHasAnalyzed', 'true');
      sessionStorage.setItem('liveAnalysisMarket', selectedMarket);
      sessionStorage.setItem('liveAnalysisSector', selectedSector);
      sessionStorage.setItem('liveAnalysisLimit', stockLimit.toString());
    }
  }, [results, selectedMarket, selectedSector, stockLimit]);
  
  const estimatedTime = useMemo(() => {
    if (stockLimit === 999999) return "ca. 15-30 Minuten";
    const batches = Math.ceil(stockLimit / 50);
    const totalMinutes = batches + (batches - 1);
    if (totalMinutes <= 1) return "ca. 1 Minute";
    if (totalMinutes <= 30) return `ca. ${totalMinutes} Minuten`;
    return `ca. ${Math.round(totalMinutes / 60)} Stunden`;
  }, [stockLimit]);
  
  const handleMarketChange = (value: string) => setSelectedMarket(value);
  const handleSectorChange = (value: string) => setSelectedSector(value);
  const handleStockLimitChange = (value: string) => {
    const numValue = parseInt(value, 10);
    setStockLimit(numValue);
    // Only show warning for large numbers, but NOT for "Alle Aktien" (999999)
    if (numValue >= 1000 && numValue !== 999999) {
      setShowWarningDialog(true);
    }
  };
  
  const startAnalysis = async () => {
    if (!selectedMarket) {
      toast({
        title: "Bitte wählen Sie einen Markt aus",
        description: "Sie müssen zuerst eine Börse oder einen Index auswählen.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setResults([]);
    setProgress(0);
    setCurrentOperation("Starte Analyse...");
    
    try {
      const analysisResults = await analyzeMarketWithCache(
        selectedMarket, 
        stockLimit,
        (progressValue: number, operation: string) => {
          setProgress(progressValue);
          setCurrentOperation(operation);
        }
      );
      
      const filteredResults = selectedSector === 'all' 
        ? analysisResults 
        : analysisResults.filter(result => result.sector === selectedSector);
      
      setResults(filteredResults);
      setHasAnalyzed(true);
      setProgress(100);
      setCurrentOperation("Analyse abgeschlossen");
      
      const selectedMarketOption = marketOptions.find(option => option.id === selectedMarket);
      const marketName = selectedMarketOption ? selectedMarketOption.name : selectedMarket;
      
      toast({
        title: "Analyse abgeschlossen",
        description: `${filteredResults.length} Aktien von ${marketName} wurden analysiert.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Fehler bei der Analyse:', error);
      toast({
        title: "Analyse fehlgeschlagen",
        description: "Bei der Analyse ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="h-full">
        <div className="p-6 w-full max-w-screen-xl mx-auto space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-6 w-6 text-buffett-blue" />
            <h1 className="text-2xl font-semibold">Live-Analyse</h1>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-8">
            <div className="flex items-center mb-4">
              <Calculator className="h-6 w-6 text-buffett-blue mr-2" />
              <h2 className="text-xl font-semibold">Marktanalyse</h2>
            </div>
            
            <div className="space-y-6">
              <MarketSelector selectedMarket={selectedMarket} onMarketChange={handleMarketChange} />
              
              <div className="mb-6">
                <Label htmlFor="sector" className="block text-sm font-medium mb-2">Sektor / Branche</Label>
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
              </div>
              
              <div className="mb-6">
                <Label htmlFor="stockLimit" className="block text-sm font-medium mb-2">Anzahl der Aktien</Label>
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
                <p className="text-sm text-gray-500 mt-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1 inline" />
                  Geschätzte Analysezeit: <span className="font-medium ml-1">{estimatedTime}</span>
                </p>
              </div>
              
              <div>
                <Button 
                  onClick={() => (stockLimit >= 1000 && stockLimit !== 999999) ? setShowWarningDialog(true) : startAnalysis()} 
                  disabled={isLoading}
                  className="bg-buffett-blue hover:bg-blue-700"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {isLoading ? "Analysiere..." : "Markt analysieren"}
                </Button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-8">
              <div className="mb-2 flex justify-between">
                <span className="text-sm font-medium">{currentOperation}</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {(hasAnalyzed || isLoading) && (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <QuantAnalysisTable results={results} isLoading={isLoading} />
            </div>
          )}

          <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Große Datenanalyse</AlertDialogTitle>
                <AlertDialogDescription>
                  Sie haben {stockLimit} Aktien zur Analyse ausgewählt. Dies wird {estimatedTime} dauern.
                  <div className="mt-3">Möchten Sie mit der Analyse fortfahren?</div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={startAnalysis}>Ja, analysieren</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </main>
  );
};

export default LiveAnalysis;
