
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Calculator } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import ExchangeSelector from '@/components/ExchangeSelector';
import QuantAnalysisTable from '@/components/QuantAnalysisTable';
import { analyzeExchange, QuantAnalysisResult } from '@/api/quantAnalyzerApi';

const BuffettQuantAnalyzer = () => {
  const { toast } = useToast();
  const [selectedExchange, setSelectedExchange] = useState('NYSE');
  const [results, setResults] = useState<QuantAnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  
  const handleExchangeChange = (value: string) => {
    setSelectedExchange(value);
  };
  
  const handleAnalyzeExchange = async () => {
    if (!selectedExchange) {
      toast({
        title: "Bitte wählen Sie eine Börse aus",
        description: "Sie müssen zuerst eine Börse auswählen, um die Analyse zu starten.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setResults([]);
    try {
      // Analyse mit erhöhtem Limit für mehr Aktien
      const analysisResults = await analyzeExchange(selectedExchange, 200);
      setResults(analysisResults);
      setHasAnalyzed(true);
      
      toast({
        title: "Analyse abgeschlossen",
        description: `${analysisResults.length} Aktien von ${selectedExchange} wurden nach Buffett-Kriterien analysiert.`,
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
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <header className="mb-8">
        <div className="flex items-center mb-2">
          <Link to="/" className="text-buffett-blue hover:text-blue-700 mr-4 flex items-center">
            <ArrowLeft className="h-5 w-5 mr-1" />
            Zurück
          </Link>
          <h1 className="text-3xl font-bold">Buffett Quant Analyzer</h1>
        </div>
        <p className="text-buffett-subtext">
          Quantitative Aktienanalyse nach Warren Buffetts Investmentprinzipien
        </p>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-8">
        <div className="flex items-center mb-4">
          <Calculator className="h-6 w-6 text-buffett-blue mr-2" />
          <h2 className="text-xl font-semibold">Börsenanalyse</h2>
        </div>
        
        <div className="space-y-6">
          <ExchangeSelector 
            selectedExchange={selectedExchange} 
            onExchangeChange={handleExchangeChange} 
          />
          
          <div>
            <Button 
              onClick={handleAnalyzeExchange} 
              disabled={isLoading}
              className="bg-buffett-blue hover:bg-blue-700"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {isLoading ? "Analysiere..." : "Börse analysieren"}
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Die Analyse kann je nach Anzahl der Aktien einige Momente dauern.
            </p>
          </div>
        </div>
      </div>

      {(hasAnalyzed || isLoading) && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <QuantAnalysisTable results={results} isLoading={isLoading} />
        </div>
      )}

      <div className="mt-8 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Über den Quant Analyzer</h2>
        <p className="text-gray-600 mb-4">
          Der Buffett Quant Analyzer bewertet Aktien ausschließlich auf Basis von harten Finanzkennzahlen, 
          gemäß den Prinzipien von Warren Buffett. Für jedes der 10 Buffett-Kriterien wird 1 Punkt vergeben, 
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
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Bewertungslegende:</h3>
            <ul className="pl-6 text-gray-600 space-y-2">
              <li className="flex items-center">
                <Badge className="bg-green-100 text-green-800 mr-2">🟢 Kandidat</Badge>
                <span>Score 7-10: Starke Buffett-Kandidaten</span>
              </li>
              <li className="flex items-center">
                <Badge className="bg-yellow-100 text-yellow-800 mr-2">🟡 Beobachten</Badge>
                <span>Score 5-6: Moderate Buffett-Konformität</span>
              </li>
              <li className="flex items-center">
                <Badge className="bg-red-100 text-red-800 mr-2">🔴 Vermeiden</Badge>
                <span>Score &lt;5: Nicht Buffett-konform</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <footer className="mt-12 pt-8 border-t border-gray-200 text-buffett-subtext text-sm text-center">
        <p>
          Buffett Quant Analyzer - Quantitative Analyse nach Warren Buffetts Prinzipien
        </p>
        <p className="mt-1 text-xs">
          Datenquelle: Financial Modeling Prep API
        </p>
      </footer>
    </div>
  );
};

export default BuffettQuantAnalyzer;
