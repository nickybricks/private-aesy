import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  stock_count?: number;
}

export const useWatchlists = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch watchlists with stock counts
  const fetchWatchlists = async () => {
    if (!user) {
      setWatchlists([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch watchlists with stock counts using a LEFT JOIN
      const { data, error } = await supabase
        .from('watchlists')
        .select(`
          *,
          user_stocks(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include stock_count
      const watchlistsWithCounts = (data || []).map(watchlist => ({
        ...watchlist,
        stock_count: watchlist.user_stocks?.[0]?.count || 0,
        user_stocks: undefined // Remove the user_stocks array from the result
      }));
      
      setWatchlists(watchlistsWithCounts);
    } catch (error: any) {
      // Fallback: fetch watchlists without counts if the join fails
      try {
        const { data, error: fallbackError } = await supabase
          .from('watchlists')
          .select('*')
          .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;
        
        // Fetch stock counts separately for each watchlist
        const watchlistsWithCounts = await Promise.all(
          (data || []).map(async (watchlist) => {
            const { count } = await supabase
              .from('user_stocks')
              .select('*', { count: 'exact', head: true })
              .eq('watchlist_id', watchlist.id);
            
            return {
              ...watchlist,
              stock_count: count || 0
            };
          })
        );
        
        setWatchlists(watchlistsWithCounts);
      } catch (fallbackError: any) {
        toast({
          variant: "destructive",
          title: "Fehler beim Laden der Watchlists",
          description: fallbackError.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Create watchlist
  const createWatchlist = async (name: string, description?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('watchlists')
        .insert([
          {
            user_id: user.id,
            name,
            description
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setWatchlists(prev => [data, ...prev]);
      toast({
        title: "Watchlist erstellt",
        description: `"${name}" wurde erfolgreich erstellt.`
      });
      
      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Erstellen der Watchlist",
        description: error.message
      });
      throw error;
    }
  };

  // Update watchlist
  const updateWatchlist = async (id: string, updates: { name?: string; description?: string }) => {
    try {
      const { data, error } = await supabase
        .from('watchlists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setWatchlists(prev => prev.map(w => w.id === id ? data : w));
      toast({
        title: "Watchlist aktualisiert",
        description: "Änderungen wurden erfolgreich gespeichert."
      });
      
      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Aktualisieren der Watchlist",
        description: error.message
      });
      throw error;
    }
  };

  // Delete watchlist
  const deleteWatchlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setWatchlists(prev => prev.filter(w => w.id !== id));
      toast({
        title: "Watchlist gelöscht",
        description: "Die Watchlist wurde erfolgreich gelöscht."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Löschen der Watchlist",
        description: error.message
      });
      throw error;
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchWatchlists();

    const channel = supabase
      .channel('watchlists-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'watchlists',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchWatchlists();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stocks',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchWatchlists(); // Refetch to update stock counts
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    watchlists,
    loading,
    createWatchlist,
    updateWatchlist,
    deleteWatchlist,
    refetch: fetchWatchlists
  };
};