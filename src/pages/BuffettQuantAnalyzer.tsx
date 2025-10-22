import React, { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { ScreenerMode } from '@/components/ScreenerMode';
import { QuantAnalysisResult } from '@/api/quantAnalyzerApi';
import { getAllCachedStocks, getCacheStats } from '@/api/cachedQuantAnalyzerApi';
import { Card } from "@/components/ui/card";

const BuffettQuantAnalyzer = () => {
  const { toast } = useToast();
  const [cachedStocks, setCachedStocks] = useState<QuantAnalysisResult[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  
  useEffect(() => {
    loadCachedStocks();
  }, []);

  const loadCachedStocks = async () => {
    setIsLoadingCache(true);
    try {
      const [stocks, stats] = await Promise.all([
        getAllCachedStocks(),
        getCacheStats()
      ]);
      setCachedStocks(stocks);
      setCacheStats(stats);
      
      if (stocks.length === 0) {
        toast({
          title: "Keine Aktien im Cache",
          description: "Führen Sie zuerst eine Analyse durch."
        });
      }
    } catch (error) {
      console.error('Error loading cached stocks:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Cache-Daten",
        variant: "destructive"
      });
    } finally {
      setIsLoadingCache(false);
    }
  };


  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="h-full">
        <div className="p-6 w-full space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <Database className="h-6 w-6 text-buffett-blue" />
            <h1 className="text-2xl font-semibold">Screener</h1>
            {cacheStats && (
              <span className="text-sm text-muted-foreground">
                ({cacheStats.total} Aktien)
              </span>
            )}
          </div>

          {isLoadingCache ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Lade Cache-Daten...</p>
            </Card>
          ) : (
            <ScreenerMode
              cachedStocks={cachedStocks}
            />
          )}
        </div>
      </div>
    </main>
  );
};

export default BuffettQuantAnalyzer;

