import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useStock } from '@/context/StockContext';

export const StartDeepResearchButton: React.FC = () => {
  const { triggerDeepResearch, stockInfo, isLoading } = useStock();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleStartAnalysis = async () => {
    if (!stockInfo?.ticker) return;
    
    setIsAnalyzing(true);
    try {
      await triggerDeepResearch(stockInfo.ticker);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
      <div className="text-center max-w-md">
        <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2 text-gray-900">
          KI-Analyse verfügbar
        </h3>
        <p className="text-gray-600 mb-6">
          Für eine vollständige Bewertung nach Buffetts 11 Kriterien starten Sie die KI-Analyse.
          Diese analysiert qualitative Faktoren wie Geschäftsmodell, Burggraben und Management.
        </p>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isAnalyzing || isLoading}
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analysiere...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  KI-Analyse starten
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>KI-Analyse starten?</AlertDialogTitle>
              <AlertDialogDescription>
                Die KI-Analyse verwendet künstliche Intelligenz, um alle 11 Buffett-Kriterien zu bewerten.
                Dies umfasst qualitative Faktoren wie:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Geschäftsmodell und Verständlichkeit</li>
                  <li>Wirtschaftlicher Burggraben</li>
                  <li>Management-Qualität</li>
                  <li>Langfristige Aussichten</li>
                </ul>
                <p className="mt-3 font-medium">
                  Dies verbraucht zusätzliche Credits. Möchten Sie fortfahren?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleStartAnalysis}>
                Analyse starten
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
