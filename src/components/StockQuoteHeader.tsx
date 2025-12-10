import React, { useState, useEffect } from "react";
import { useStock } from "@/context/StockContext";
import { Star, TrendingUp, TrendingDown, Info, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useWatchlists } from "@/hooks/useWatchlists";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { translateCompanyDescription } from "@/services/TranslationService";
import { getCountryName } from "@/utils/countryMapping";

const StockQuoteHeader: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [companyInfoOpen, setCompanyInfoOpen] = useState(false);
  const [watchlistDialogOpen, setWatchlistDialogOpen] = useState(false);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>("");
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [showNewWatchlistInput, setShowNewWatchlistInput] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [translatedDescription, setTranslatedDescription] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);

  const {
    stockInfo,
    predictabilityStars,
    financialMetrics,
    buffettCriteria,
    overallRating,
    isLoading,
    hasCriticalDataMissing,
  } = useStock();

  const { watchlists, createWatchlist } = useWatchlists();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Translate description when stockInfo changes
  useEffect(() => {
    if (stockInfo?.description && stockInfo.ticker) {
      setIsTranslating(true);
      translateCompanyDescription(stockInfo.description, stockInfo.ticker, "de")
        .then((translated) => {
          setTranslatedDescription(translated);
          setIsTranslating(false);
        })
        .catch(() => {
          setTranslatedDescription(stockInfo.description || "");
          setIsTranslating(false);
        });
    }
  }, [stockInfo?.description, stockInfo?.ticker]);

  if (isLoading || hasCriticalDataMissing || !stockInfo) {
    return null;
  }

  const { name, ticker, price, change, changePercent, currency, marketCap } = stockInfo;
  const isPositive = change !== null && change >= 0;

  // Extract exchange from ticker (e.g., AAPL -> NASDAQ, AAPL.DE -> FWB)
  const getExchange = (ticker: string): string => {
    if (ticker.endsWith(".DE")) return "FWB";
    if (ticker.endsWith(".L")) return "LSE";
    if (ticker.endsWith(".PA")) return "EPA";
    // Default to NASDAQ for US tickers
    return "NASDAQ";
  };

  const exchange = getExchange(ticker);

  // Get current time in EST
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/New_York",
    hour12: true,
  });

  // Format numbers with German locale (comma as decimal, dot as thousand separator)
  const formatGermanNumber = (value: number, decimals: number = 2): string => {
    return value.toLocaleString("de-DE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Format large numbers
  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return "N/A";

    if (value >= 1_000_000_000_000) {
      return `$${formatGermanNumber(value / 1_000_000_000_000)}T`;
    } else if (value >= 1_000_000_000) {
      return `$${formatGermanNumber(value / 1_000_000_000)}B`;
    } else if (value >= 1_000_000) {
      return `$${formatGermanNumber(value / 1_000_000)}M`;
    }
    return `$${formatGermanNumber(value)}`;
  };

  // Format volume
  const formatVolume = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return "N/A";

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

  const peRatio = getMetricValue("P/E-Verhältnis (KGV)");

  // Render stars
  const renderStars = (stars: number | "NR", clickable: boolean = false) => {
    if (stars === "NR") {
      return <span className="text-muted-foreground font-medium">NR</span>;
    }

    const fullStars = Math.floor(stars);
    const hasHalfStar = stars - fullStars >= 0.5;
    const totalStars = 5;

    return (
      <div
        className={`flex items-center gap-0.5 ${clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
        onClick={clickable ? () => setDialogOpen(true) : undefined}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={clickable ? (e) => e.key === "Enter" && setDialogOpen(true) : undefined}
      >
        {Array.from({ length: totalStars }, (_, index) => {
          const starIndex = index + 1;
          let starClass = "text-muted-foreground/30";

          if (starIndex <= fullStars) {
            starClass = "text-yellow-500 fill-yellow-500";
          } else if (starIndex === fullStars + 1 && hasHalfStar) {
            starClass = "text-yellow-500 fill-yellow-500/50";
          }

          return <Star key={index} size={20} className={starClass} />;
        })}
        {clickable && <Info size={14} className="ml-1 text-muted-foreground" />}
      </div>
    );
  };

  const getRatingDescription = (stars: number | "NR") => {
    if (stars === "NR") return "Nicht bewertet";
    if (stars >= 4.5) return "Sehr vorhersehbar";
    if (stars >= 3.5) return "Gut vorhersehbar";
    if (stars >= 2.5) return "Moderat vorhersehbar";
    if (stars >= 1.5) return "Wenig vorhersehbar";
    return "Nicht vorhersehbar";
  };

  const handleAddToWatchlist = async () => {
    if (!user || !selectedWatchlistId || !stockInfo?.price) {
      return;
    }

    setIsAddingToWatchlist(true);
    try {
      const { data: existingStock } = await supabase
        .from("user_stocks")
        .select("id")
        .eq("user_id", user.id)
        .eq("watchlist_id", selectedWatchlistId)
        .eq("symbol", stockInfo.ticker)
        .maybeSingle();

      if (existingStock) {
        toast({
          variant: "destructive",
          title: "Aktie bereits vorhanden",
          description: "Diese Aktie ist bereits in der ausgewählten Watchlist.",
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

      const { error } = await supabase.from("user_stocks").insert({
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
        description: `${stockInfo.name} wurde erfolgreich zur Watchlist hinzugefügt.`,
      });

      setWatchlistDialogOpen(false);
      setSelectedWatchlistId("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler beim Hinzufügen",
        description: error.message,
      });
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  const handleCreateAndAddToWatchlist = async () => {
    if (!stockInfo || !newWatchlistName.trim()) return;
    
    setIsAddingToWatchlist(true);
    try {
      const newWatchlist = await createWatchlist(newWatchlistName.trim());
      if (newWatchlist) {
        // Check if stock already exists
        const { data: existingStock } = await supabase
          .from("user_stocks")
          .select("id")
          .eq("user_id", user!.id)
          .eq("watchlist_id", newWatchlist.id)
          .eq("symbol", stockInfo.ticker)
          .maybeSingle();

        if (!existingStock) {
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

          await supabase.from("user_stocks").insert({
            user_id: user!.id,
            watchlist_id: newWatchlist.id,
            symbol: stockInfo.ticker,
            company_name: stockInfo.name,
            analysis_data: analysisSnapshot as any,
            buffett_score: overallRating?.buffettScore || null,
            last_analysis_date: new Date().toISOString(),
          });
        }

        toast({
          title: "Aktie hinzugefügt",
          description: `${stockInfo.name} wurde zur neuen Watchlist "${newWatchlistName}" hinzugefügt.`,
        });

        setWatchlistDialogOpen(false);
        setNewWatchlistName("");
        setShowNewWatchlistInput(false);
        setSelectedWatchlistId("");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error.message,
      });
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  // Reset dialog state when opened
  const handleOpenWatchlistDialog = () => {
    setShowNewWatchlistInput(false);
    setNewWatchlistName("");
    setSelectedWatchlistId("");
    setWatchlistDialogOpen(true);
  };

  return (
    <>
      <div className="flex items-start justify-between mb-1.5 sm:mb-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          {/* Company Logo */}
          {stockInfo.image ? (
            <img
              src={stockInfo.image}
              alt={`${name} logo`}
              className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl object-contain bg-muted p-1.5"
              onError={(e) => {
                // Fallback to letter if image fails to load
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) (fallback as HTMLElement).style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-muted flex items-center justify-center text-base sm:text-lg md:text-xl font-bold text-muted-foreground"
            style={{ display: stockInfo.image ? "none" : "flex" }}
          >
            {name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg md:text-xl font-bold mb-0.5">{name}</h1>

              {/* Compact Add to Watchlist Button - Behind stock name */}
              {buffettCriteria && financialMetrics && overallRating && (
                <Button
                  onClick={() => {
                    if (!user) {
                      toast({
                        variant: "destructive",
                        title: "Login erforderlich",
                        description: "Bitte melden Sie sich an, um Aktien zu Watchlists hinzuzufügen.",
                      });
                      return;
                    }
                    handleOpenWatchlistDialog();
                  }}
                  variant="default"
                  size="sm"
                  className="h-6 w-6 min-w-6 max-w-6 p-0 !rounded-full flex-shrink-0"
                  title="Zu Watchlist hinzufügen"
                >
                  <Plus size={14} />
                </Button>
              )}
            </div>

            <div className="text-[10px] sm:text-xs text-muted-foreground">
              {exchange}:{ticker.replace(/\.(DE|L|PA)$/, "")} (USA) • Ordinary Shares
            </div>
            {stockInfo.isin && (
              <div className="text-[10px] sm:text-xs text-muted-foreground">ISIN: {stockInfo.isin}</div>
            )}
          </div>
        </div>
      </div>

      {/* Price Section */}
      <div className="mb-1.5 sm:mb-2">
        <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 mb-0.5">
          <span className="text-xl sm:text-2xl md:text-3xl font-bold">
            ${price ? formatGermanNumber(price) : "N/A"}
          </span>
          {change !== null && changePercent !== null && (
            <div
              className={`flex items-center gap-1 text-sm sm:text-base font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {isPositive ? (
                <TrendingUp size={14} className="sm:w-4 sm:h-4" />
              ) : (
                <TrendingDown size={14} className="sm:w-4 sm:h-4" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {formatGermanNumber(change)} ({isPositive ? "+" : ""}
                {formatGermanNumber(changePercent)}%)
              </span>
            </div>
          )}
        </div>
        <div className="text-[10px] sm:text-xs text-muted-foreground">{currentTime} EST</div>
      </div>

      {/* Buffett Predictability Stars */}
      {predictabilityStars && <div className="mb-2 sm:mb-3">{renderStars(predictabilityStars.stars, true)}</div>}

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
            <div className="font-semibold text-xs sm:text-sm">
              {new Date(stockInfo.ipoDate).toLocaleDateString("de-DE")}
            </div>
          </div>
        )}

        <div>
          <div className="text-muted-foreground text-[10px] sm:text-xs">KGV:</div>
          <div className="font-semibold text-xs sm:text-sm">{peRatio ? formatGermanNumber(peRatio) : "N/A"}</div>
        </div>

        <div>
          <div className="text-muted-foreground text-[10px] sm:text-xs">Marktkap.:</div>
          <div className="font-semibold text-xs sm:text-sm">{formatNumber(marketCap)}</div>
        </div>
      </div>

      {/* Company Description Section */}
      {(translatedDescription || isTranslating) && (
        <div className="border-t pt-3">
          <div
            className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={() => setCompanyInfoOpen(true)}
          >
            <p className="line-clamp-2">{isTranslating ? "Beschreibung wird übersetzt..." : translatedDescription}</p>
            <span className="text-primary font-medium text-xs mt-1 inline-block">...weiterlesen</span>
          </div>
        </div>
      )}

      {/* Stars Explanation Dialog */}
      {predictabilityStars && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="text-yellow-500 fill-yellow-500" size={20} />
                Buffett Predictability Stars - Berechnungsmethode
              </DialogTitle>
              <DialogDescription>So wird die Vorhersagbarkeit der Unternehmensgewinne berechnet</DialogDescription>
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
                <p className="text-sm text-muted-foreground">{predictabilityStars.explain.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Analysezeitraum</h4>
                  <p className="text-sm text-muted-foreground">{predictabilityStars.explain.data_window_years} Jahre</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Methode</h4>
                  <p className="text-sm text-muted-foreground">{predictabilityStars.explain.method}</p>
                </div>
              </div>

              {(predictabilityStars.explain as any).calculation_details && (
                <div>
                  <h4 className="font-semibold mb-2">Berechnungsdetails</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    {Object.entries((predictabilityStars.explain as any).calculation_details).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-2 bg-muted/30 rounded">
                        <span className="font-medium">{key}:</span>
                        <span>{typeof value === "number" ? (value as number).toFixed(2) : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Bewertungsskala</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <span>≥ 4.5 Sterne: Sehr vorhersehbar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 4 }, (_, i) => (
                        <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <span>≥ 3.5 Sterne: Gut vorhersehbar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 3 }, (_, i) => (
                        <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <span>≥ 2.5 Sterne: Moderat vorhersehbar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 2 }, (_, i) => (
                        <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <span>≥ 1.5 Sterne: Wenig vorhersehbar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 1 }, (_, i) => (
                        <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <span>&lt; 1.5 Sterne: Nicht vorhersehbar</span>
                  </div>
                </div>
              </div>

              <Button onClick={() => setDialogOpen(false)} className="w-full">
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
              {!showNewWatchlistInput ? (
                <>
                  {/* Select existing watchlist */}
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

                  {/* Button to create new watchlist - always visible */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewWatchlistInput(true)}
                    className="w-full flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Neue Watchlist erstellen
                  </Button>
                </>
              ) : (
                <>
                  {/* New watchlist name input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name der neuen Watchlist</label>
                    <input
                      type="text"
                      value={newWatchlistName}
                      onChange={(e) => setNewWatchlistName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newWatchlistName.trim()) {
                          handleCreateAndAddToWatchlist();
                        }
                      }}
                      placeholder="z.B. Tech-Aktien, Dividenden..."
                      autoFocus
                      className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  {/* Back to selection */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowNewWatchlistInput(false);
                      setNewWatchlistName("");
                    }}
                    className="w-full"
                  >
                    Zurück zur Auswahl
                  </Button>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setWatchlistDialogOpen(false)}>
                Abbrechen
              </Button>
              {showNewWatchlistInput ? (
                <Button 
                  onClick={handleCreateAndAddToWatchlist} 
                  disabled={!newWatchlistName.trim() || isAddingToWatchlist}
                >
                  {isAddingToWatchlist ? "Wird erstellt..." : "Erstellen & Hinzufügen"}
                </Button>
              ) : (
                <Button onClick={handleAddToWatchlist} disabled={!selectedWatchlistId || isAddingToWatchlist}>
                  {isAddingToWatchlist ? "Wird hinzugefügt..." : "Hinzufügen"}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Company Information Dialog/Drawer */}
      {isMobile ? (
        <Drawer open={companyInfoOpen} onOpenChange={setCompanyInfoOpen}>
          <DrawerContent className="h-[90vh]">
            <DrawerHeader className="relative border-b"></DrawerHeader>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Full Description */}
              {translatedDescription && (
                <div>
                  <h4 className="font-semibold mb-2">Unternehmensbeschreibung</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{translatedDescription}</p>
                </div>
              )}

              <Separator />

              {/* Company Details */}
              <div>
                <h4 className="font-semibold mb-4">Unternehmensdetails</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {stockInfo.foundedYear && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">Gründungsjahr</div>
                      <div className="font-medium">{stockInfo.foundedYear}</div>
                    </div>
                  )}

                  {stockInfo.ipoDate && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">IPO Datum</div>
                      <div className="font-medium">{new Date(stockInfo.ipoDate).toLocaleDateString("de-DE")}</div>
                    </div>
                  )}

                  {peRatio && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">KGV (P/E Ratio)</div>
                      <div className="font-medium">{formatGermanNumber(peRatio)}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Marktkapitalisierung</div>
                    <div className="font-medium">{formatNumber(marketCap)}</div>
                  </div>

                  {stockInfo.ceo && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">CEO</div>
                      <div className="font-medium">{stockInfo.ceo}</div>
                    </div>
                  )}

                  {stockInfo.employees && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">Angestellte</div>
                      <div className="font-medium">
                        {stockInfo.employees.toLocaleString("de-DE", { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  )}

                  {stockInfo.website && (
                    <div className="col-span-2">
                      <div className="text-muted-foreground text-xs mb-1">Website</div>
                      <div className="font-medium">
                        <a
                          href={
                            stockInfo.website.startsWith("http") ? stockInfo.website : `https://${stockInfo.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {stockInfo.website.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      </div>
                    </div>
                  )}

                  {stockInfo.industry && (
                    <div className="col-span-2">
                      <div className="text-muted-foreground text-xs mb-1">Sektor</div>
                      <div className="font-medium">{stockInfo.industry}</div>
                    </div>
                  )}

                  {stockInfo.country && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">Land</div>
                      <div className="font-medium">{getCountryName(stockInfo.country)}</div>
                    </div>
                  )}

                  {stockInfo.address && (
                    <div className="col-span-2">
                      <div className="text-muted-foreground text-xs mb-1">Adresse</div>
                      <div className="font-medium">{stockInfo.address}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={companyInfoOpen} onOpenChange={setCompanyInfoOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Unternehmensinformationen</DialogTitle>
              <DialogDescription>Detaillierte Informationen über {stockInfo.name}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Full Description */}
              {translatedDescription && (
                <div>
                  <h4 className="font-semibold mb-2">Unternehmensbeschreibung</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{translatedDescription}</p>
                </div>
              )}

              <Separator />

              {/* Company Details */}
              <div>
                <h4 className="font-semibold mb-4">Unternehmensdetails</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {stockInfo.foundedYear && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">Gründungsjahr</div>
                      <div className="font-medium">{stockInfo.foundedYear}</div>
                    </div>
                  )}

                  {stockInfo.ipoDate && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">IPO Datum</div>
                      <div className="font-medium">{new Date(stockInfo.ipoDate).toLocaleDateString("de-DE")}</div>
                    </div>
                  )}

                  {peRatio && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">KGV (P/E Ratio)</div>
                      <div className="font-medium">{formatGermanNumber(peRatio)}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Marktkapitalisierung</div>
                    <div className="font-medium">{formatNumber(marketCap)}</div>
                  </div>

                  {stockInfo.ceo && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">CEO</div>
                      <div className="font-medium">{stockInfo.ceo}</div>
                    </div>
                  )}

                  {stockInfo.employees && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">Angestellte</div>
                      <div className="font-medium">
                        {stockInfo.employees.toLocaleString("de-DE", { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  )}

                  {stockInfo.website && (
                    <div className="col-span-2">
                      <div className="text-muted-foreground text-xs mb-1">Website</div>
                      <div className="font-medium">
                        <a
                          href={
                            stockInfo.website.startsWith("http") ? stockInfo.website : `https://${stockInfo.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {stockInfo.website.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      </div>
                    </div>
                  )}

                  {stockInfo.industry && (
                    <div className="col-span-2">
                      <div className="text-muted-foreground text-xs mb-1">Sektor</div>
                      <div className="font-medium">{stockInfo.industry}</div>
                    </div>
                  )}

                  {stockInfo.country && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">Land</div>
                      <div className="font-medium">{getCountryName(stockInfo.country)}</div>
                    </div>
                  )}

                  {stockInfo.address && (
                    <div className="col-span-2">
                      <div className="text-muted-foreground text-xs mb-1">Adresse</div>
                      <div className="font-medium">{stockInfo.address}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default StockQuoteHeader;
