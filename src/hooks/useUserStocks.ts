import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

export interface StockAnalysisData {
  price?: number;
  currency?: string;
  changePercent?: number;
  sinceAddedPercent?: number;
  exchange?: string;
  isin?: string;
}

export interface UserStock extends Omit<Tables<'user_stocks'>, 'analysis_data'> {
  analysis_data?: StockAnalysisData;
}

export const useUserStocks = (watchlistId: string) => {
  const [stocks, setStocks] = useState<UserStock[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStocks = async () => {
    if (!user || !watchlistId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_stocks')
        .select('*')
        .eq('watchlist_id', watchlistId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedStocks: UserStock[] = (data || []).map(stock => ({
        ...stock,
        analysis_data: stock.analysis_data ? (stock.analysis_data as StockAnalysisData) : undefined
      }));
      
      setStocks(transformedStocks);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      toast.error('Fehler beim Laden der Aktien');
    } finally {
      setLoading(false);
    }
  };

  const addStock = async (stockData: {
    symbol: string;
    company_name?: string;
    watchlist_id: string;
  }) => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Simuliere Live-Kursdaten (hier würdest du eine echte API verwenden)
      const mockPriceData = {
        price: Math.random() * 200 + 50, // Zufälliger Preis zwischen 50-250
        currency: 'EUR',
        changePercent: (Math.random() - 0.5) * 10, // Zufällige Änderung zwischen -5% und +5%
        sinceAddedPercent: 0, // Gerade hinzugefügt
        exchange: 'XETRA',
        isin: `DE${Math.random().toString().slice(2, 12)}` // Mock ISIN
      };

      const { data, error } = await supabase
        .from('user_stocks')
        .insert({
          user_id: user.id,
          watchlist_id: stockData.watchlist_id,
          symbol: stockData.symbol,
          company_name: stockData.company_name,
          analysis_data: mockPriceData,
          last_analysis_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      // Transform the new stock data
      const transformedStock: UserStock = {
        ...data,
        analysis_data: data.analysis_data ? (data.analysis_data as StockAnalysisData) : undefined
      };
      
      setStocks(prev => [transformedStock, ...prev]);
      toast.success(`${stockData.symbol} zur Watchlist hinzugefügt`);
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Fehler beim Hinzufügen der Aktie');
    } finally {
      setLoading(false);
    }
  };

  const removeStock = async (stockId: string) => {
    try {
      const { error } = await supabase
        .from('user_stocks')
        .delete()
        .eq('id', stockId);

      if (error) throw error;
      
      setStocks(prev => prev.filter(stock => stock.id !== stockId));
      toast.success('Aktie aus Watchlist entfernt');
    } catch (error) {
      console.error('Error removing stock:', error);
      toast.error('Fehler beim Entfernen der Aktie');
    }
  };

  const updateStockData = async (stockId: string, updateData: Partial<Tables<'user_stocks'>>) => {
    try {
      const { data, error } = await supabase
        .from('user_stocks')
        .update(updateData)
        .eq('id', stockId)
        .select()
        .single();

      if (error) throw error;
      
      // Transform the updated stock data
      const transformedStock: UserStock = {
        ...data,
        analysis_data: data.analysis_data ? (data.analysis_data as StockAnalysisData) : undefined
      };
      
      setStocks(prev => prev.map(stock => 
        stock.id === stockId ? { ...stock, ...transformedStock } : stock
      ));
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Fehler beim Aktualisieren der Aktie');
    }
  };

  // Simuliere Live-Kurs-Updates (alle 30 Sekunden)
  useEffect(() => {
    if (stocks.length === 0) return;

    const interval = setInterval(() => {
      setStocks(prev => prev.map(stock => {
        if (!stock.analysis_data) return stock;
        
        const currentPrice = stock.analysis_data.price || 100;
        const priceChange = (Math.random() - 0.5) * 2; // Kleine Preisänderungen
        const newPrice = Math.max(0.01, currentPrice + priceChange);
        const changePercent = ((newPrice - currentPrice) / currentPrice) * 100;
        
        return {
          ...stock,
          analysis_data: {
            ...stock.analysis_data,
            price: newPrice,
            changePercent: changePercent
          }
        };
      }));
    }, 30000); // Update alle 30 Sekunden

    return () => clearInterval(interval);
  }, [stocks.length]);

  useEffect(() => {
    fetchStocks();
    
    // Setup real-time subscription
    const channel = supabase
      .channel('user_stocks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stocks',
          filter: `watchlist_id=eq.${watchlistId}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchStocks(); // Refetch when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, watchlistId]);

  return {
    stocks,
    loading,
    addStock,
    removeStock,
    updateStockData,
    refetch: fetchStocks
  };
};