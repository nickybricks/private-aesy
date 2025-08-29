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
  assetType?: string;
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

  const getFMPApiKey = async () => {
    const { data, error } = await supabase.functions.invoke('get-fmp-key');
    if (error) throw error;
    return data.apiKey;
  };

  const fetchStockData = async (symbol: string) => {
    try {
      const apiKey = await getFMPApiKey();
      
      // Get current quote
      const quoteResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`
      );
      
      if (!quoteResponse.ok) {
        throw new Error('Failed to fetch stock quote');
      }
      
      const quoteData = await quoteResponse.json();
      const quote = quoteData[0];
      
      if (!quote) {
        throw new Error('Stock not found');
      }
      
      // Get company profile for additional data
      const profileResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`
      );
      
      let exchange = '';
      let currency = 'USD';
      let isin = '';
      let assetType = 'Aktie';
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const profile = profileData[0];
        if (profile) {
          exchange = profile.exchangeShortName || '';
          currency = profile.currency || 'USD';
          isin = profile.isin || '';
          // Determine asset type from profile
          const name = profile.companyName?.toLowerCase() || '';
          const symbol = profile.symbol?.toLowerCase() || '';
          
          if (/etf/i.test(name) || /etf/i.test(symbol)) assetType = 'ETF';
          else if (/fund/i.test(name) || /fund/i.test(symbol)) assetType = 'Fonds';
          else if (/reit/i.test(name) || /reit/i.test(symbol)) assetType = 'REIT';
          else if (/adr/i.test(name) || /adr/i.test(symbol)) assetType = 'ADR';
        }
      }
      
      return {
        price: quote.price,
        currency,
        changePercent: quote.changesPercentage,
        exchange,
        isin,
        assetType
      };
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return null;
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
      
      // Fetch real stock data from FMP API
      const stockInfo = await fetchStockData(stockData.symbol);
      
      const priceData: StockAnalysisData | undefined = stockInfo ? {
        price: stockInfo.price,
        currency: stockInfo.currency,
        changePercent: stockInfo.changePercent,
        sinceAddedPercent: 0, // Will be calculated later
        exchange: stockInfo.exchange,
        isin: stockInfo.isin,
        assetType: stockInfo.assetType
      } : undefined;

      const { data, error } = await supabase
        .from('user_stocks')
        .insert({
          user_id: user.id,
          watchlist_id: stockData.watchlist_id,
          symbol: stockData.symbol,
          company_name: stockData.company_name,
          analysis_data: priceData as any,
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

  // TODO: Implement real-time price updates
  // useEffect(() => {
  //   if (stocks.length === 0) return;
  //   
  //   // Example: WebSocket connection for real-time updates
  //   // const ws = new WebSocket('wss://api.example.com/realtime');
  //   // ws.onmessage = (event) => {
  //   //   const priceUpdate = JSON.parse(event.data);
  //   //   setStocks(prev => prev.map(stock => 
  //   //     stock.symbol === priceUpdate.symbol 
  //   //       ? { ...stock, analysis_data: { ...stock.analysis_data, ...priceUpdate } }
  //   //       : stock
  //   //   ));
  //   // };
  //   // 
  //   // return () => ws.close();
  // }, [stocks.length]);

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