import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const SaveAnalysisButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { stockInfo, buffettCriteria, financialMetrics, overallRating, dcfData } = useStock();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!stockInfo || !title.trim()) return;

    setIsLoading(true);
    
    // Feature temporarily disabled
    toast({
      title: "Feature wird überarbeitet",
      description: "Die Speicherfunktion wird gerade aktualisiert. Nutze bitte vorerst die Watchlist-Funktion.",
      variant: "default"
    });
    
    setIsOpen(false);
    setTitle('');
    setIsLoading(false);
  };

  // Generate default title
  const generateDefaultTitle = () => {
    if (!stockInfo) return '';
    const date = new Date().toLocaleDateString('de-DE');
    return `${stockInfo.name} (${stockInfo.ticker}) - ${date}`;
  };

  // Don't show button if no analysis data available
  if (!stockInfo || !overallRating) {
    return null;
  }

  // Don't show if user not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => {
          setTitle(generateDefaultTitle());
          setIsOpen(true);
        }}
        className="flex items-center gap-2"
        size="sm"
        variant="outline"
      >
        <Save size={16} />
        Analyse speichern
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analyse speichern</DialogTitle>
            <DialogDescription>
              Speichern Sie die aktuelle Analyse von {stockInfo?.name} ({stockInfo?.ticker}) 
              als Momentaufnahme mit Datum und Uhrzeit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">
                Titel der Analyse
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name für die gespeicherte Analyse..."
                className="mt-1"
              />
            </div>

            {/* Analysis summary */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Aktie:</strong> {stockInfo?.name} ({stockInfo?.ticker})</p>
              <p><strong>Preis:</strong> {stockInfo?.price?.toFixed(2)} {stockInfo?.currency}</p>
              <p><strong>Aesy Score:</strong> {overallRating?.buffettScore}/10</p>
              <p><strong>Datum:</strong> {new Date().toLocaleString('de-DE')}</p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                "Wird gespeichert..."
              ) : (
                <>
                  <Save size={16} />
                  Speichern
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};