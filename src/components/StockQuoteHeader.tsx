import React, { useState } from 'react';
import { useStock } from '@/context/StockContext';
import { Star, TrendingUp, TrendingDown, Info, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWatchlists } from '@/hooks/useWatchlists';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const StockQuoteHeader: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [watchlistDialogOpen, setWatchlistDialogOpen] = useState(false);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>('');
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  
  const { 
    stockInfo, 
    predictabilityStars,
    financialMetrics,
    buffettCriteria,
    overallRating,
    isLoading,
    hasCriticalDataMissing 
  } = useStock();
  
  const { watchlists, createWatchlist } = useWatchlists();
  const { user } = useAuth();
  const { toast } = useToast();

  if (isLoading || hasCriticalDataMissing || !stockInfo) {
    return null;
  }

  const { name, ticker, price, change, changePercent, currency, marketCap } = stockInfo;
  const isPositive = change !== null && change >= 0;

  // Extract exchange from ticker (e.g., AAPL -> NASDAQ, AAPL.DE -> FWB)
  const getExchange = (ticker: string): string => {
    if (ticker.endsWith('.DE')) return 'FWB';
    if (ticker.endsWith('.L')) return 'LSE';
    if (ticker.endsWith('.PA')) return 'EPA';
    // Default to NASDAQ for US tickers
    return 'NASDAQ';
  };

  const exchange = getExchange(ticker);

  // Get current time in EST
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
    hour12: true
  });

  // Format large numbers
  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    
    if (value >= 1_000_000_000_000) {
      return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
    } else if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    return `$${value.toFixed(2)}`;
  };

  // Format volume
  const formatVolume = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K`;
    }
    return value.toFixed(0);
  };

  // Extract metrics from financialMetrics.metrics array
  const getMetricValue = (metricName: string): number | null => {
    if (!financialMetrics || !financialMetrics.metrics || !Array.isArray(financialMetrics.metrics)) return null;
    const metric = financialMetrics.metrics.find((m: any) => m.name === metricName);
    return metric?.value ?? null;
  };

  const peRatio = getMetricValue('P/E-Verhältnis (KGV)');

  // Render stars
  const renderStars = (stars: number | 'NR', clickable: boolean = false) => {
    if (stars === 'NR') {
      return <span className="text-muted-foreground font-medium">NR</span>;
    }

    const fullStars = Math.floor(stars);
    const hasHalfStar = stars - fullStars >= 0.5;
    const totalStars = 5;

    return (
      <div 
        className={`flex items-center gap-0.5 ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={clickable ? () => setDialogOpen(true) : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={clickable ? (e) => e.key === 'Enter' && setDialogOpen(true) : undefined}
      >
        {Array.from({ length: totalStars }, (_, index) => {
          const starIndex = index + 1;
          let starClass = 'text-muted-foreground/30';
          
          if (starIndex <= fullStars) {
            starClass = 'text-yellow-500 fill-yellow-500';
          } else if (starIndex === fullStars + 1 && hasHalfStar) {
            starClass = 'text-yellow-500 fill-yellow-500/50';
          }
          
          return (
            <Star key={index} size={20} className={starClass} />
          );
        })}
        {clickable && <Info size={14} className="ml-1 text-muted-foreground" />}
      </div>
    );
  };

  const getRatingDescription = (stars: number | 'NR') => {
    if (stars === 'NR') return 'Nicht bewertet';
    if (stars >= 4.5) return 'Sehr vorhersehbar';
    if (stars >= 3.5) return 'Gut vorhersehbar';
    if (stars >= 2.5) return 'Moderat vorhersehbar';
    if (stars >= 1.5) return 'Wenig vorhersehbar';
    return 'Nicht vorhersehbar';
  };

  const handleAddToWatchlist = async () => {
    if (!user || !selectedWatchlistId || !stockInfo?.price) {
      return;
    }

    setIsAddingToWatchlist(true);
    try {
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
        setIsAddingToWatchlist(false);
        return;
      }

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
        analysisDate: new Date().toISOString(),
      };

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

      setWatchlistDialogOpen(false);
      setSelectedWatchlistId('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Hinzufügen",
        description: error.message
      });
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  const handleCreateAndSelect = async () => {
    if (!stockInfo) return;
    try {
      const newWatchlist = await createWatchlist(`${stockInfo.name} Watchlist`);
      if (newWatchlist) {
        setSelectedWatchlistId(newWatchlist.id);
      }
    } catch (error) {
      // Error is handled in createWatchlist
    }
  };

  return (
    <>
      <div className="flex items-start justify-between mb-1.5 sm:mb-2">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Company Logo */}
          {stockInfo.image ? (
            <img 
              src={stockInfo.image} 
              alt={`${name} logo`}
              className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl object-contain bg-muted p-1.5"
              onError={(e) => {
                // Fallback to letter if image fails to load
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-muted flex items-center justify-center text-base sm:text-lg md:text-xl font-bold text-muted-foreground"
            style={{ display: stockInfo.image ? 'none' : 'flex' }}
          >
            {name.charAt(0)}
          </div>
          
          <div>
            <h1 className="text-base sm:text-lg md:text-xl font-bold mb-0.5">{name}</h1>
            <div className="text-[10px] sm:text-xs text-muted-foreground">
              {exchange}:{ticker.replace(/\.(DE|L|PA)$/, '')} (USA) • Ordinary Shares
            </div>
            {stockInfo.isin && (
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                ISIN: {stockInfo.isin}
              </div>
            )}
          </div>
        </div>
        
        {/* Compact Add to Watchlist Button - Right Aligned */}
        {buffettCriteria && financialMetrics && overallRating && (
          <Button
            onClick={() => {
              if (!user) {
                toast({
                  variant: "destructive",
                  title: "Login erforderlich",
                  description: "Bitte melden Sie sich an, um Aktien zu Watchlists hinzuzufügen."
                });
                return;
              }
              setWatchlistDialogOpen(true);
            }}
            variant="default"
            size="sm"
            className="h-7 w-7 min-w-7 max-w-7 p-0 !rounded-full flex-shrink-0"
            title="Zu Watchlist hinzufügen"
          >
            <Plus size={16} />
          </Button>
        )}
      </div>

      {/* Price Section */}
      <div className="mb-1.5 sm:mb-2">
        <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 mb-0.5">
          <span className="text-xl sm:text-2xl md:text-3xl font-bold">
            ${price?.toFixed(2) ?? 'N/A'}
          </span>
          {change !== null && changePercent !== null && (
            <div className={`flex items-center gap-1 text-sm sm:text-base font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp size={14} className="sm:w-4 sm:h-4" /> : <TrendingDown size={14} className="sm:w-4 sm:h-4" />}
              <span>
                {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
        <div className="text-[10px] sm:text-xs text-muted-foreground">
          {currentTime} EST
        </div>
      </div>

      {/* Buffett Predictability Stars */}
      {predictabilityStars && (
        <div className="mb-2 sm:mb-3">
          {renderStars(predictabilityStars.stars, true)}
        </div>
      )}

      {/* Key Metrics Grid - Kompakter auf Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-1.5 text-xs mb-3">
        {stockInfo.foundedYear && (
          <div>
            <div className="text-muted-foreground text-[10px] sm:text-xs">Gründungsjahr:</div>
            <div className="font-semibold text-xs sm:text-sm">{stockInfo.foundedYear}</div>
          </div>
        )}
        
        {stockInfo.ipoDate && (
          <div>
            <div className="text-muted-foreground text-[10px] sm:text-xs">IPO Datum:</div>
            <div className="font-semibold text-xs sm:text-sm">{new Date(stockInfo.ipoDate).toLocaleDateString('de-DE')}</div>
          </div>
        )}
        
        <div>
          <div className="text-muted-foreground text-[10px] sm:text-xs">KGV:</div>
          <div className="font-semibold text-xs sm:text-sm">{peRatio?.toFixed(2) ?? 'N/A'}</div>
        </div>
        
        <div>
          <div className="text-muted-foreground text-[10px] sm:text-xs">Marktkap.:</div>
          <div className="font-semibold text-xs sm:text-sm">{formatNumber(marketCap)}</div>
        </div>
      </div>

      {/* Company Information Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-xs border-t pt-3">
        {stockInfo.ceo && (
          <div>
            <div className="text-muted-foreground text-[10px] sm:text-xs">CEO:</div>
            <div className="font-medium text-xs sm:text-sm">{stockInfo.ceo}</div>
          </div>
        )}
        
        {stockInfo.employees && (
          <div>
            <div className="text-muted-foreground text-[10px] sm:text-xs">Angestellte:</div>
            <div className="font-medium text-xs sm:text-sm">{stockInfo.employees.toLocaleString('de-DE')}</div>
          </div>
        )}
        
        {stockInfo.website && (
          <div>
            <div className="text-muted-foreground text-[10px] sm:text-xs">Website:</div>
            <div className="font-medium text-xs sm:text-sm">
              <a 
                href={stockInfo.website.startsWith('http') ? stockInfo.website : `https://${stockInfo.website}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {stockInfo.website.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </div>
          </div>
        )}
        
        {stockInfo.industry && (
          <div>
            <div className="text-muted-foreground text-[10px] sm:text-xs">Sektor:</div>
            <div className="font-medium text-xs sm:text-sm">{stockInfo.industry}</div>
          </div>
        )}
        
        {stockInfo.country && (
          <div>
            <div className="text-muted-foreground text-[10px] sm:text-xs">Land:</div>
            <div className="font-medium text-xs sm:text-sm">{stockInfo.country}</div>
          </div>
        )}
        
        {stockInfo.address && (
          <div className="col-span-2 lg:col-span-3">
            <div className="text-muted-foreground text-[10px] sm:text-xs">Adresse:</div>
            <div className="font-medium text-xs sm:text-sm">{stockInfo.address}</div>
          </div>
        )}
      </div>

      {/* Stars Explanation Dialog */}
      {predictabilityStars && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="text-yellow-500 fill-yellow-500" size={20} />
                Buffett Predictability Stars - Berechnungsmethode
              </DialogTitle>
              <DialogDescription>
                So wird die Vorhersagbarkeit der Unternehmensgewinne berechnet
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="font-semibold mb-2">Bewertung</h4>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  {renderStars(predictabilityStars.stars)}
                  <span className="text-sm text-muted-foreground">
                    {getRatingDescription(predictabilityStars.stars)}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Zusammenfassung</h4>
                <p className="text-sm text-muted-foreground">
                  {predictabilityStars.explain.summary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Analysezeitraum</h4>
                  <p className="text-sm text-muted-foreground">
                    {predictabilityStars.explain.data_window_years} Jahre
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Methode</h4>
                  <p className="text-sm text-muted-foreground">
                    {predictabilityStars.explain.method}
                  </p>
                </div>
              </div>

              {(predictabilityStars.explain as any).calculation_details && (
                <div>
                  <h4 className="font-semibold mb-2">Berechnungsdetails</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    {Object.entries((predictabilityStars.explain as any).calculation_details).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-2 bg-muted/30 rounded">
                        <span className="font-medium">{key}:</span>
                        <span>{typeof value === 'number' ? (value as number).toFixed(2) : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Bewertungsskala</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />)}</div>
                    <span>≥ 4.5 Sterne: Sehr vorhersehbar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">{Array.from({ length: 4 }, (_, i) => <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />)}</div>
                    <span>≥ 3.5 Sterne: Gut vorhersehbar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">{Array.from({ length: 3 }, (_, i) => <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />)}</div>
                    <span>≥ 2.5 Sterne: Moderat vorhersehbar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">{Array.from({ length: 2 }, (_, i) => <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />)}</div>
                    <span>≥ 1.5 Sterne: Wenig vorhersehbar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">{Array.from({ length: 1 }, (_, i) => <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />)}</div>
                    <span>&lt; 1.5 Sterne: Nicht vorhersehbar</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setDialogOpen(false)} 
                className="w-full"
              >
                Schließen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Watchlist Dialog */}
      {stockInfo && user && (
        <Dialog open={watchlistDialogOpen} onOpenChange={setWatchlistDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aktie zu Watchlist hinzufügen</DialogTitle>
              <DialogDescription>
                Fügen Sie {stockInfo.name} ({stockInfo.ticker}) zu einer Watchlist hinzu.
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
                    {watchlists.map((watchlist) => (
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

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setWatchlistDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleAddToWatchlist}
                disabled={!selectedWatchlistId || isAddingToWatchlist}
              >
                {isAddingToWatchlist ? "Wird hinzugefügt..." : "Hinzufügen"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default StockQuoteHeader;
