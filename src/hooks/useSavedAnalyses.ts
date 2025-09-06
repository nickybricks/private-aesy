import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SavedAnalysis {
  id: string;
  user_id: string;
  title: string;
  ticker: string;
  company_name: string;
  analysis_data: any;
  saved_at: string;
  created_at: string;
  updated_at: string;
}

export const useSavedAnalyses = () => {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAnalyses = async () => {
    if (!user) {
      setAnalyses([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Laden",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysis = async (
    title: string,
    ticker: string,
    companyName: string,
    analysisData: any
  ) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Anmeldung erforderlich",
        description: "Sie müssen angemeldet sein, um Analysen zu speichern."
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('saved_analyses')
        .insert({
          user_id: user.id,
          title,
          ticker: ticker.toUpperCase(),
          company_name: companyName,
          analysis_data: analysisData,
          saved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Analyse gespeichert",
        description: `${title} wurde erfolgreich gespeichert.`
      });

      await fetchAnalyses(); // Refresh list
      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Speichern",
        description: error.message
      });
      return null;
    }
  };

  const deleteAnalysis = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_analyses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Analyse gelöscht",
        description: "Die Analyse wurde erfolgreich gelöscht."
      });

      await fetchAnalyses(); // Refresh list
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Löschen",
        description: error.message
      });
    }
  };

  const updateAnalysisTitle = async (id: string, newTitle: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_analyses')
        .update({ title: newTitle })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Titel aktualisiert",
        description: "Der Titel wurde erfolgreich geändert."
      });

      await fetchAnalyses(); // Refresh list
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Aktualisieren",
        description: error.message
      });
    }
  };

  useEffect(() => {
    fetchAnalyses();

    // Set up real-time subscription
    const channel = supabase
      .channel('saved_analyses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_analyses',
          filter: user ? `user_id=eq.${user.id}` : undefined
        },
        () => {
          fetchAnalyses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    analyses,
    loading,
    saveAnalysis,
    deleteAnalysis,
    updateAnalysisTitle,
    refetch: fetchAnalyses
  };
};