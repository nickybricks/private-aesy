import { supabase } from '@/integrations/supabase/client';

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  currency: string;
}

export const addStockToWatchlist = async (
  stockData: StockData,
  watchlistId: string
): Promise<void> => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if stock already exists in the watchlist
  const { data: existingStock } = await supabase
    .from('user_stocks')
    .select('id')
    .eq('user_id', user.id)
    .eq('watchlist_id', watchlistId)
    .eq('symbol', stockData.symbol)
    .single();

  if (existingStock) {
    throw new Error('Stock already exists in this watchlist');
  }

  // Add the stock to the watchlist
  const { error } = await supabase
    .from('user_stocks')
    .insert([
      {
        user_id: user.id,
        watchlist_id: watchlistId,
        symbol: stockData.symbol,
        company_name: stockData.name,
        analysis_data: {
          price: stockData.price,
          currency: stockData.currency,
          changePercent: 0,
          sinceAddedPercent: 0,
        },
        last_analysis_date: new Date().toISOString(),
      },
    ]);

  if (error) {
    throw error;
  }
};