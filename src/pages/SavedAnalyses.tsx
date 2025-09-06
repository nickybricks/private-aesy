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
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
      </main>

      <AppFooter />
    </div>
  );
};

export default SavedAnalyses;