import React, { useState, useEffect } from 'react';
import { Plus, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [showNewWatchlistInput, setShowNewWatchlistInput] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const { watchlists, createWatchlist, refetch } = useWatchlists();
  const { user } = useAuth();
  const { toast } = useToast();

  // Reset state when drawer opens
  useEffect(() => {
    if (isOpen) {
      setShowNewWatchlistInput(false);
      setNewWatchlistName('');
      setSelectedWatchlistId('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!user || !stockInfo.price) {
      return;
    }

    // Creating new watchlist
    if (showNewWatchlistInput) {
      if (!newWatchlistName.trim()) {
        toast({
          variant: "destructive",
          title: "Name erforderlich",
          description: "Bitte gib einen Namen für die Watchlist ein."
        });
        return;
      }

      setIsLoading(true);
      try {
        const newWatchlist = await createWatchlist(newWatchlistName.trim());
        if (newWatchlist) {
          await addStockToWatchlist(newWatchlist.id);
          await refetch();
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Fehler beim Erstellen",
          description: error.message
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Add to existing watchlist
    if (!selectedWatchlistId) {
      toast({
        variant: "destructive",
        title: "Watchlist auswählen",
        description: "Bitte wähle eine Watchlist aus oder erstelle eine neue."
      });
      return;
    }

    setIsLoading(true);
    try {
      await addStockToWatchlist(selectedWatchlistId);
    } finally {
      setIsLoading(false);
    }
  };

  const addStockToWatchlist = async (watchlistId: string) => {
    if (!user || !stockInfo.price) return;

    try {
      // Check if stock already exists in the watchlist
      const { data: existingStock } = await supabase
        .from('user_stocks')
        .select('id')
        .eq('user_id', user.id)
        .eq('watchlist_id', watchlistId)
        .eq('symbol', stockInfo.ticker)
        .maybeSingle();

      if (existingStock) {
        toast({
          variant: "destructive",
          title: "Aktie bereits vorhanden",
          description: "Diese Aktie ist bereits in der ausgewählten Watchlist."
        });
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

      // Add stock to watchlist
      const { error } = await supabase
        .from('user_stocks')
        .insert({
          user_id: user.id,
          watchlist_id: watchlistId,
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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Hinzufügen",
        description: error.message
      });
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

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle>Aktie zu Watchlist hinzufügen</DrawerTitle>
            <DrawerDescription>
              {stockInfo.name} ({stockInfo.ticker})
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4">
            {!showNewWatchlistInput ? (
              <>
                {/* Select existing watchlist */}
                <div className="space-y-2">
                  <Label>Watchlist auswählen</Label>
                  <Select 
                    value={selectedWatchlistId} 
                    onValueChange={setSelectedWatchlistId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Watchlist wählen..." />
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

                {/* Button to create new watchlist */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewWatchlistInput(true)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Neue Watchlist erstellen
                </Button>
              </>
            ) : (
              <>
                {/* New watchlist name input */}
                <div className="space-y-2">
                  <Label htmlFor="new-watchlist-name">Name der neuen Watchlist</Label>
                  <Input
                    id="new-watchlist-name"
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                    placeholder="z.B. Tech-Aktien, Dividenden..."
                    autoFocus
                    className="text-base"
                  />
                </div>

                {/* Back to selection */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowNewWatchlistInput(false);
                    setNewWatchlistName('');
                  }}
                  className="w-full"
                >
                  Zurück zur Auswahl
                </Button>
              </>
            )}
          </div>

          <DrawerFooter className="px-0 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={
                isLoading || 
                (!showNewWatchlistInput && !selectedWatchlistId) || 
                (showNewWatchlistInput && !newWatchlistName.trim())
              }
              className="w-full"
            >
              {isLoading ? (
                "Wird hinzugefügt..."
              ) : (
                <>
                  <BookmarkPlus className="mr-2 h-4 w-4" />
                  {showNewWatchlistInput ? 'Erstellen & Hinzufügen' : 'Hinzufügen'}
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)} 
              className="w-full"
            >
              Abbrechen
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};
