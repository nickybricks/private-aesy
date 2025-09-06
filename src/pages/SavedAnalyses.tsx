import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SavedAnalysesPanel } from '@/components/SavedAnalysesPanel';
import { SavedAnalysis } from '@/hooks/useSavedAnalyses';
import { useStock } from '@/context/StockContext';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';

const SavedAnalyses: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLoadAnalysis = async (analysis: SavedAnalysis) => {
    try {
      // Navigate to main page with ticker parameter
      const ticker = analysis.ticker;
      navigate(`/?ticker=${ticker}&loadAnalysis=${analysis.id}`);
      
      toast({
        title: "Analyse geladen",
        description: `${analysis.title} wurde erfolgreich geladen.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler beim Laden",
        description: "Die Analyse konnte nicht geladen werden."
      });
    }
  };

  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="h-full">
        <div className="p-8 w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Gespeicherte Analysen
            </h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre gespeicherten Aktienanalysen und laden Sie diese bei Bedarf wieder.
            </p>
          </div>

          <SavedAnalysesPanel onLoadAnalysis={handleLoadAnalysis} />
        </div>
        
        {/* Footer */}
        <div className="border-t border-border mt-12">
          <div className="w-full">
            <AppFooter />
          </div>
        </div>
      </div>
    </main>
  );
};

export default SavedAnalyses;