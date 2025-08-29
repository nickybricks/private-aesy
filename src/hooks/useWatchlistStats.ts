import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface WatchlistStats {
  [watchlistId: string]: {
    stockCount: number;
  };
}

export const useWatchlistStats = (watchlistIds: string[]) => {
  const [stats, setStats] = useState<WatchlistStats>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStats = async () => {
    if (!user || watchlistIds.length === 0) {
      setStats({});
      setLoading(false);
      return;
    }

    try {
      // Fetch stock counts for all watchlists
      const { data, error } = await supabase
        .from('user_stocks')
        .select('watchlist_id')
        .in('watchlist_id', watchlistIds);

      if (error) throw error;

      // Count stocks per watchlist
      const counts: WatchlistStats = {};
      watchlistIds.forEach(id => {
        counts[id] = { stockCount: 0 };
      });

      data?.forEach(stock => {
        if (counts[stock.watchlist_id]) {
          counts[stock.watchlist_id].stockCount++;
        }
      });

      setStats(counts);
    } catch (error) {
      console.error('Error fetching watchlist stats:', error);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user, watchlistIds.join(',')]);

  // Setup realtime subscription
  useEffect(() => {
    if (!user || watchlistIds.length === 0) return;

    const channel = supabase
      .channel('watchlist-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stocks',
          filter: `watchlist_id=in.(${watchlistIds.join(',')})`
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, watchlistIds.join(',')]);

  const getTotalStocks = () => {
    return Object.values(stats).reduce((total, stat) => total + stat.stockCount, 0);
  };

  const getActiveListsCount = () => {
    return Object.values(stats).filter(stat => stat.stockCount > 0).length;
  };

  return {
    stats,
    loading,
    getTotalStocks,
    getActiveListsCount,
    refetch: fetchStats
  };
};