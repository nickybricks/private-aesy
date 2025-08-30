import React, { useState } from 'react';
import { Plus, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWatchlists, Watchlist } from '@/hooks/useWatchlists';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FinancialMetricsData, OverallRatingData, DCFData } from '@/context/StockContextTypes';

interface AddToWatchlistButtonProps {
  stockInfo: {
    name: string;
    ticker: string;
    price: number | null;
    currency: string;
    marketCap: number | null;
    intrinsicValue: number | null;
    dcfData?: DCFData;
  };
  buffettCriteria: any;
  financialMetrics: FinancialMetricsData | null;
  overallRating: OverallRatingData | null;
}

export const AddToWatchlistButton: React.FC<AddToWatchlistButtonProps> = ({
  stockInfo,
  buffettCriteria,
  financialMetrics,
  overallRating,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { watchlists, createWatchlist } = useWatchlists();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAddToWatchlist = async () => {
    if (!user || !selectedWatchlistId || !stockInfo.price) {
      return;
    }

    setIsLoading(true);
    try {
      // Check if stock already exists in the watchlist
      const { data: existingStock } = await supabase
        .from('user_stocks')
        .select('id')
        .eq('user_id', user.id)
        .eq('watchlist_id', selectedWatchlistId)
        .eq('symbol', stockInfo.ticker)
        .maybeSingle();

      if (existingStock) {
        toast({
          variant: "destructive",
          title: "Aktie bereits vorhanden",
          description: "Diese Aktie ist bereits in der ausgewählten Watchlist."
        });
        setIsLoading(false);
        return;
      }

      // Create analysis snapshot
      const analysisSnapshot = {
        price: stockInfo.price,
        currency: stockInfo.currency,
        marketCap: stockInfo.marketCap,
        intrinsicValue: stockInfo.intrinsicValue,
        changePercent: 0,
        sinceAddedPercent: 0,
        buffettCriteria: buffettCriteria ? JSON.parse(JSON.stringify(buffettCriteria)) : null,
        financialMetrics: financialMetrics ? JSON.parse(JSON.stringify(financialMetrics)) : null,
        overallRating: overallRating ? JSON.parse(JSON.stringify(overallRating)) : null,
        dcfData: stockInfo.dcfData ? JSON.parse(JSON.stringify(stockInfo.dcfData)) : null,
        analysisDate: new Date().toISOString(),
      };

      // Add stock to watchlist with complete analysis data
      const { error } = await supabase
        .from('user_stocks')
        .insert({
          user_id: user.id,
          watchlist_id: selectedWatchlistId,
          symbol: stockInfo.ticker,
          company_name: stockInfo.name,
          analysis_data: analysisSnapshot as any,
          buffett_score: overallRating?.buffettScore || null,
          last_analysis_date: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Aktie hinzugefügt",
        description: `${stockInfo.name} wurde erfolgreich zur Watchlist hinzugefügt.`
      });

      setIsOpen(false);
      setSelectedWatchlistId('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Hinzufügen",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAndSelect = async () => {
    try {
      const newWatchlist = await createWatchlist(`${stockInfo.name} Watchlist`);
      if (newWatchlist) {
        setSelectedWatchlistId(newWatchlist.id);
      }
    } catch (error) {
      // Error is handled in createWatchlist
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
        size="sm"
      >
        <BookmarkPlus size={16} />
        Zu Watchlist hinzufügen
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktie zu Watchlist hinzufügen</DialogTitle>
            <DialogDescription>
              Fügen Sie {stockInfo.name} ({stockInfo.ticker}) zu einer Watchlist hinzu. 
              Die aktuelle Analyse wird als Momentaufnahme gespeichert.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Watchlist auswählen</label>
              <Select value={selectedWatchlistId} onValueChange={setSelectedWatchlistId}>
                <SelectTrigger>
                  <SelectValue placeholder="Watchlist auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {watchlists.map((watchlist: Watchlist) => (
                    <SelectItem key={watchlist.id} value={watchlist.id}>
                      {watchlist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {watchlists.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Sie haben noch keine Watchlists erstellt.
                </p>
                <Button
                  variant="outline"
                  onClick={handleCreateAndSelect}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Plus size={16} />
                  Neue Watchlist erstellen
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleAddToWatchlist}
              disabled={!selectedWatchlistId || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                "Wird hinzugefügt..."
              ) : (
                <>
                  <BookmarkPlus size={16} />
                  Hinzufügen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};