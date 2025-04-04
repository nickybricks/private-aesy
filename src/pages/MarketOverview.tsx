
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowRight, AlertTriangle, TrendingDown, TrendingUp, Info } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { exchanges, analyzeStockByBuffettCriteria, QuantAnalysisResult } from "@/api/quantAnalyzerApi";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FMP_API_KEY = 'uxE1jVMvI8QQen0a4AEpLFTaqf3KQO0y';

// Market valuation types
interface MarketValuation {
  peRatio: number;
  capeRatio: number;
  buffettIndicator: number;
  marketStatus: 'undervalued' | 'fair' | 'overvalued' | 'extremely-overvalued';
  timestamp: string;
}

// Stock recommendation types based on market conditions
interface RecommendedStocks {
  stockList: QuantAnalysisResult[];
  isLoading: boolean;
  error: any;
}

const MarketOverview = () => {
  const [selectedTab, setSelectedTab] = useState<string>("current");
  
  // Fetch market valuation data
  const { data: marketData, isLoading: marketLoading, error: marketError } = useQuery({
    queryKey: ['marketValuation'],
    queryFn: async () => {
      try {
        // Fetch S&P 500 PE Ratio
        const peResponse = await axios.get(`https://financialmodelingprep.com/api/v3/ratios/SPY?apikey=${FMP_API_KEY}`);
        const peRatio = peResponse.data[0]?.priceEarningsRatio || 0;
        
        // For CAPE ratio (we'll use a simplified calculation based on 10-yr PE)
        // In real-world, this would use more accurate data sources
        const capeRatio = peRatio * 1.2; // Simplified approximation
        
        // Buffett Indicator (Market Cap to GDP ratio)
        // For demo purposes only - would need actual API endpoint in production
        const buffettIndicator = 1.45; // Example value - typically >1.2 is overvalued
        
        // Determine market status
        let marketStatus: 'undervalued' | 'fair' | 'overvalued' | 'extremely-overvalued';
        
        if (peRatio < 15 && buffettIndicator < 0.8) {
          marketStatus = 'undervalued';
        } else if (peRatio < 20 && buffettIndicator < 1.1) {
          marketStatus = 'fair';
        } else if (peRatio < 25 && buffettIndicator < 1.5) {
          marketStatus = 'overvalued';
        } else {
          marketStatus = 'extremely-overvalued';
        }
        
        return {
          peRatio,
          capeRatio,
          buffettIndicator,
          marketStatus,
          timestamp: new Date().toISOString()
        } as MarketValuation;
      } catch (error) {
        console.error("Error fetching market data:", error);
        throw new Error("Failed to load market valuation data");
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
  
  // Fetch recommended stocks based on market conditions
  const { data: stockRecommendations, isLoading: stocksLoading, error: stocksError } = useQuery({
    queryKey: ['recommendedStocks', marketData?.marketStatus],
    queryFn: async () => {
      if (!marketData) return [];
      
      try {
        // Get stocks from certain exchanges based on market status
        let exchangeToUse = 'NYSE';
        let stockLimit = 50;
        
        // Fetch NYSE stocks first
        const stocksResponse = await axios.get(`https://financialmodelingprep.com/api/v3/stock/list?apikey=${FMP_API_KEY}`);
        
        // Filter based on market condition
        let filteredStocks = [];
        const allStocks = stocksResponse.data;
        
        // Create different filter criteria based on market status
        if (marketData.marketStatus === 'extremely-overvalued') {
          // For extremely overvalued markets, be very selective
          filteredStocks = allStocks.filter((stock: any) => 
            stock.exchangeShortName === exchangeToUse && 
            stock.type === 'stock' && 
            !stock.isEtf
          ).slice(0, 15); // Only analyze a small set of stocks
        } else if (marketData.marketStatus === 'overvalued') {
          // For overvalued markets, still be selective
          filteredStocks = allStocks.filter((stock: any) => 
            stock.exchangeShortName === exchangeToUse && 
            stock.type === 'stock' && 
            !stock.isEtf
          ).slice(0, 25);
        } else {
          // For fair or undervalued markets, analyze more stocks
          filteredStocks = allStocks.filter((stock: any) => 
            stock.exchangeShortName === exchangeToUse && 
            stock.type === 'stock' && 
            !stock.isEtf
          ).slice(0, stockLimit);
        }
        
        // Analyze stocks through Buffett criteria
        toast.info(`Analyzing ${filteredStocks.length} stocks based on current market conditions`);
        
        const results = [];
        for (const stock of filteredStocks.slice(0, 10)) { // Limit for demo purposes
          try {
            const analysis = await analyzeStockByBuffettCriteria(stock.symbol);
            if (analysis) {
              results.push(analysis);
            }
          } catch (error) {
            console.error(`Error analyzing ${stock.symbol}:`, error);
          }
        }
        
        // Apply additional filters based on market status
        let recommendedStocks = results;
        
        if (marketData.marketStatus === 'extremely-overvalued') {
          // For extremely overvalued markets, only show stocks with:
          // - High Buffett score (8+)
          // - Low P/E ratio (< 15)
          // - Low debt ratio
          recommendedStocks = results.filter(stock => 
            stock.buffettScore >= 8 && 
            (stock.criteria.pe.value !== null && stock.criteria.pe.value < 15) &&
            (stock.criteria.debtRatio.value !== null && stock.criteria.debtRatio.value < 50)
          );
        } else if (marketData.marketStatus === 'overvalued') {
          // For overvalued markets, slightly less strict
          recommendedStocks = results.filter(stock => 
            stock.buffettScore >= 7 && 
            (stock.criteria.pe.value !== null && stock.criteria.pe.value < 18)
          );
        } else if (marketData.marketStatus === 'fair') {
          // For fair markets, normal Buffett criteria
          recommendedStocks = results.filter(stock => stock.buffettScore >= 6);
        } else if (marketData.marketStatus === 'undervalued') {
          // For undervalued markets, more stocks can be considered
          recommendedStocks = results.filter(stock => stock.buffettScore >= 5);
        }
        
        // Sort by Buffett score (descending)
        return recommendedStocks.sort((a, b) => b.buffettScore - a.buffettScore);
      } catch (error) {
        console.error("Error fetching recommended stocks:", error);
        throw new Error("Failed to load stock recommendations");
      }
    },
    enabled: !!marketData, // Only run this query if market data is available
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
  
  // Helper function to get market status badge color
  const getMarketStatusBadge = (status: string) => {
    switch (status) {
      case 'undervalued':
        return <Badge className="bg-green-500 hover:bg-green-600">Unterbewertet</Badge>;
      case 'fair':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Fair bewertet</Badge>;
      case 'overvalued':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Überbewertet</Badge>;
      case 'extremely-overvalued':
        return <Badge className="bg-red-500 hover:bg-red-600">Stark überbewertet</Badge>;
      default:
        return <Badge>Unbekannt</Badge>;
    }
  };
  
  // Helper function to get stock recommendation styles
  const getScoreBadge = (score: number) => {
    if (score >= 8) return <Badge className="bg-green-500 hover:bg-green-600">{score}/10</Badge>;
    if (score >= 6) return <Badge className="bg-yellow-500 hover:bg-yellow-600">{score}/10</Badge>;
    return <Badge className="bg-red-500 hover:bg-red-600">{score}/10</Badge>;
  };
  
  // Helper function to format values nicely
  const formatValue = (value: number | null, suffix: string = '') => {
    if (value === null) return 'N/A';
    return `${value.toFixed(2)}${suffix}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Navigation />
      
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Marktüberblick & Buffett-Empfehlungen</h1>
        <p className="text-lg text-gray-600 mb-4">
          Analysiere den aktuellen Marktzustand und finde passende Aktien nach Warren Buffetts Kriterien
        </p>
      </div>
      
      {/* Market Valuation Cards */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Aktuelle Marktbewertung</h2>
        
        {marketLoading ? (
          <div className="flex flex-col items-center justify-center p-10">
            <p className="mb-2">Marktdaten werden geladen...</p>
            <Progress value={70} className="w-1/2" />
          </div>
        ) : marketError ? (
          <Card className="bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="mr-2" /> Fehler beim Laden der Marktdaten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Die aktuellen Marktdaten konnten nicht abgerufen werden. Bitte versuchen Sie es später erneut.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            KGV (S&P 500) <Info className="ml-1 h-4 w-4 text-gray-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Das Kurs-Gewinn-Verhältnis des S&P 500 ist ein wichtiger Indikator für die Gesamtmarktbewertung.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">{marketData?.peRatio.toFixed(2)}</span>
                    {marketData && marketData.peRatio > 20 ? (
                      <TrendingUp className="ml-2 text-red-500" />
                    ) : (
                      <TrendingDown className="ml-2 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {marketData && marketData.peRatio > 25 
                      ? "Deutlich über historischem Durchschnitt" 
                      : marketData && marketData.peRatio > 20 
                        ? "Über historischem Durchschnitt" 
                        : "Im Bereich des historischen Durchschnitts"}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            CAPE Ratio <Info className="ml-1 h-4 w-4 text-gray-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Das zyklisch angepasste KGV (Shiller-KGV) berücksichtigt die inflationsbereinigten Gewinne der letzten 10 Jahre.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">{marketData?.capeRatio.toFixed(2)}</span>
                    {marketData && marketData.capeRatio > 24 ? (
                      <TrendingUp className="ml-2 text-red-500" />
                    ) : (
                      <TrendingDown className="ml-2 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {marketData && marketData.capeRatio > 30 
                      ? "Historisch sehr hoch" 
                      : marketData && marketData.capeRatio > 24 
                        ? "Über historischem Durchschnitt" 
                        : "Im Bereich des historischen Durchschnitts"}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            Buffett-Indikator <Info className="ml-1 h-4 w-4 text-gray-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Das Verhältnis der Marktkapitalisierung zum BIP - ein Lieblings-Indikator von Warren Buffett zur Marktbewertung.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold">{(marketData?.buffettIndicator || 0).toFixed(2)}</span>
                    {marketData && marketData.buffettIndicator > 1.2 ? (
                      <TrendingUp className="ml-2 text-red-500" />
                    ) : (
                      <TrendingDown className="ml-2 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {marketData && marketData.buffettIndicator > 1.5 
                      ? "> 150% - Deutlich überbewertet" 
                      : marketData && marketData.buffettIndicator > 1.2 
                        ? "> 120% - Überbewertet" 
                        : "≤ 120% - Im fairen Bereich"}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Gesamtmarkt Status</CardTitle>
                  {getMarketStatusBadge(marketData?.marketStatus || '')}
                </div>
                <CardDescription>
                  Bewertung auf Basis mehrerer Indikatoren
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  {marketData?.marketStatus === 'extremely-overvalued' && (
                    "Der Markt scheint aktuell stark überbewertet zu sein. In solchen Phasen sollten Investoren besonders selektiv vorgehen und nur Aktien mit hervorragenden Fundamentaldaten und niedrigen Bewertungen in Betracht ziehen."
                  )}
                  {marketData?.marketStatus === 'overvalued' && (
                    "Der Markt scheint aktuell überbewertet zu sein. Sicherheitsmargen sind jetzt besonders wichtig - konzentrieren Sie sich auf qualitativ hochwertige Unternehmen mit stabilen Cashflows und vernünftigen Bewertungen."
                  )}
                  {marketData?.marketStatus === 'fair' && (
                    "Der Markt scheint aktuell fair bewertet zu sein. Dies ist eine gute Zeit, um nach Unternehmen zu suchen, die Buffetts Kriterien erfüllen und zu vernünftigen Preisen gehandelt werden."
                  )}
                  {marketData?.marketStatus === 'undervalued' && (
                    "Der Markt scheint aktuell unterbewertet zu sein. Dies könnte eine ausgezeichnete Zeit sein, um qualitativ hochwertige Unternehmen zu attraktiven Preisen zu kaufen. Achten Sie dennoch auf die Fundamentaldaten der einzelnen Unternehmen."
                  )}
                </p>
                
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-2">Empfohlene Strategie:</h4>
                  {marketData?.marketStatus === 'extremely-overvalued' && (
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Nur Aktien mit sehr hohen Buffett-Scores (8-10) in Betracht ziehen</li>
                      <li>Besonders auf niedrige KGVs und geringe Verschuldung achten</li>
                      <li>Defensive Sektoren bevorzugen</li>
                      <li>Marginale Qualitätsunternehmen vermeiden, auch wenn das KGV niedrig erscheint</li>
                    </ul>
                  )}
                  {marketData?.marketStatus === 'overvalued' && (
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Aktien mit Buffett-Scores ab 7 in Betracht ziehen</li>
                      <li>Auf Unternehmen mit nachhaltigen Wettbewerbsvorteilen konzentrieren</li>
                      <li>Auf überdurchschnittliche Profitabilität (ROE {'>'} 15%) achten</li>
                      <li>Starke Bilanz als Absicherung gegen Marktrückgänge bevorzugen</li>
                    </ul>
                  )}
                  {marketData?.marketStatus === 'fair' && (
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Buffett-konforme Unternehmen mit Scores ab 6 betrachten</li>
                      <li>Breit diversifizieren zwischen verschiedenen Sektoren</li>
                      <li>Auf langfristiges Wachstumspotenzial und gutes Management achten</li>
                      <li>Dividendenstarke Unternehmen können attraktiv sein</li>
                    </ul>
                  )}
                  {marketData?.marketStatus === 'undervalued' && (
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Breite Palette von Unternehmen mit Buffett-Scores ab 5 in Betracht ziehen</li>
                      <li>Auch zyklische Unternehmen mit starker Marktposition berücksichtigen</li>
                      <li>Nach temporär unterbewerteten Qualitätsunternehmen suchen</li>
                      <li>Langfristige Perspektive beibehalten und nicht auf kurzfristige Kursgewinne setzen</li>
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Stock Recommendations Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Empfohlene Aktien für aktuelle Marktlage</h2>
          {marketData && (
            <Badge 
              variant="outline" 
              className="text-sm"
            >
              Angepasst für {marketData.marketStatus === 'extremely-overvalued' 
                ? 'stark überbewerteten' 
                : marketData.marketStatus === 'overvalued' 
                  ? 'überbewerteten' 
                  : marketData.marketStatus === 'fair' 
                    ? 'fair bewerteten' 
                    : 'unterbewerteten'} Markt
            </Badge>
          )}
        </div>
        
        <Tabs defaultValue="current" value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="current">Aktuelle Bewertung</TabsTrigger>
            <TabsTrigger value="whatif">Was wäre wenn...</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="mt-4">
            {stocksLoading ? (
              <div className="flex flex-col items-center justify-center p-10">
                <p className="mb-2">Aktienempfehlungen werden geladen...</p>
                <Progress value={65} className="w-1/2" />
              </div>
            ) : stocksError ? (
              <Card className="bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <AlertTriangle className="mr-2" /> Fehler beim Laden der Empfehlungen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Die Aktienempfehlungen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {stockRecommendations && stockRecommendations.length > 0 ? (
                  <>
                    <p className="mb-4">
                      {marketData?.marketStatus === 'extremely-overvalued' && (
                        "Besonders widerstandsfähige Aktien für den aktuell stark überbewerteten Markt:"
                      )}
                      {marketData?.marketStatus === 'overvalued' && (
                        "Qualitätsaktien, die auch in einem überbewerteten Markt attraktiv bleiben:"
                      )}
                      {marketData?.marketStatus === 'fair' && (
                        "Attraktive Buffett-konforme Aktien im aktuell fair bewerteten Markt:"
                      )}
                      {marketData?.marketStatus === 'undervalued' && (
                        "Besonders aussichtsreiche Aktien im aktuell unterbewerteten Markt:"
                      )}
                    </p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left">Symbol</th>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Sektor</th>
                            <th className="px-4 py-2 text-left">Buffett-Score</th>
                            <th className="px-4 py-2 text-left">KGV</th>
                            <th className="px-4 py-2 text-left">ROE (%)</th>
                            <th className="px-4 py-2 text-left">Verschuldung (%)</th>
                            <th className="px-4 py-2 text-left">Div. Rendite (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockRecommendations.map((stock) => (
                            <tr key={stock.symbol} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <a 
                                  href={`https://finance.yahoo.com/quote/${stock.symbol}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-medium"
                                >
                                  {stock.symbol}
                                </a>
                              </td>
                              <td className="px-4 py-3">{stock.name}</td>
                              <td className="px-4 py-3">{stock.sector}</td>
                              <td className="px-4 py-3">
                                <HoverCard>
                                  <HoverCardTrigger>{getScoreBadge(stock.buffettScore)}</HoverCardTrigger>
                                  <HoverCardContent className="w-80">
                                    <h4 className="font-semibold mb-2">Erfüllte Buffett-Kriterien:</h4>
                                    <ul className="space-y-1 text-sm">
                                      {stock.criteria.roe.pass && (
                                        <li className="flex items-center">
                                          <span className="text-green-500 mr-1">✓</span> ROE {'>'} 15% ({formatValue(stock.criteria.roe.value, '%')})
                                        </li>
                                      )}
                                      {stock.criteria.roic.pass && (
                                        <li className="flex items-center">
                                          <span className="text-green-500 mr-1">✓</span> ROIC {'>'} 10% ({formatValue(stock.criteria.roic.value, '%')})
                                        </li>
                                      )}
                                      {stock.criteria.netMargin.pass && (
                                        <li className="flex items-center">
                                          <span className="text-green-500 mr-1">✓</span> Nettomarge {'>'} 10% ({formatValue(stock.criteria.netMargin.value, '%')})
                                        </li>
                                      )}
                                      {stock.criteria.epsGrowth.pass && (
                                        <li className="flex items-center">
                                          <span className="text-green-500 mr-1">✓</span> EPS-Wachstum positiv ({formatValue(stock.criteria.epsGrowth.value, '%')})
                                        </li>
                                      )}
                                      {stock.criteria.revenueGrowth.pass && (
                                        <li className="flex items-center">
                                          <span className="text-green-500 mr-1">✓</span> Umsatzwachstum positiv ({formatValue(stock.criteria.revenueGrowth.value, '%')})
                                        </li>
                                      )}
                                      {stock.criteria.interestCoverage.pass && (
                                        <li className="flex items-center">
                                          <span className="text-green-500 mr-1">✓</span> Zinsdeckung {'>'} 5 ({formatValue(stock.criteria.interestCoverage.value)})
                                        </li>
                                      )}
                                      {stock.criteria.debtRatio.pass && (
                                        <li className="flex items-center">
                                          <span className="text-green-500 mr-1">✓</span> Schuldenquote {'<'} 70% ({formatValue(stock.criteria.debtRatio.value, '%')})
                                        </li>
                                      )}
                                      {stock.criteria.pe.pass && (
                                        <li className="flex items-center">
                                          <span className="text-green-500 mr-1">✓</span> KGV {'<'} 15 ({formatValue(stock.criteria.pe.value)})
                                        </li>
                                      )}
                                      {stock.criteria.pb.pass && (
                                        <li className="flex items-center">
                                          <span className="text-green-500 mr-1">✓</span> KBV {'<'} 1.5/3 ({formatValue(stock.criteria.pb.value)})
                                        </li>
                                      )}
                                      {stock.criteria.dividendYield.pass && (
                                        <li className="flex items-center">
                                          <span className="text-green-500 mr-1">✓</span> Div. Rendite {'>'} 2% ({formatValue(stock.criteria.dividendYield.value, '%')})
                                        </li>
                                      )}
                                    </ul>
                                  </HoverCardContent>
                                </HoverCard>
                              </td>
                              <td className="px-4 py-3">{formatValue(stock.criteria.pe.value)}</td>
                              <td className="px-4 py-3">{formatValue(stock.criteria.roe.value, '%')}</td>
                              <td className="px-4 py-3">{formatValue(stock.criteria.debtRatio.value, '%')}</td>
                              <td className="px-4 py-3">{formatValue(stock.criteria.dividendYield.value, '%')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {stockRecommendations.length === 0 && (
                      <Card className="bg-yellow-50">
                        <CardHeader>
                          <CardTitle className="flex items-center text-yellow-700">
                            <AlertTriangle className="mr-2" /> Keine Aktien gefunden
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p>
                            Bei den aktuellen Marktbedingungen wurden keine Aktien gefunden, die den strengen Auswahlkriterien entsprechen. 
                            Dies kann ein Hinweis auf eine allgemeine Überbewertung sein.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="bg-yellow-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-yellow-700">
                        <AlertTriangle className="mr-2" /> Keine Empfehlungen verfügbar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Aktienempfehlungen sind derzeit nicht verfügbar.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="whatif" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Hypothetische Marktszenarien</CardTitle>
                <CardDescription>
                  Prüfen Sie, wie sich verschiedene Marktszenarien auf die Attraktivität von Aktien auswirken würden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-green-50 border border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-green-800">Bei Marktkorrektur (-20%)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3">Diese Aktien wären bei einer Marktkorrektur besonders attraktiv:</p>
                      <ul className="space-y-2">
                        <li className="flex justify-between items-center p-2 bg-white rounded border border-green-100">
                          <span>Apple (AAPL)</span>
                          <Badge className="bg-green-600">KGV: 20 → 16</Badge>
                        </li>
                        <li className="flex justify-between items-center p-2 bg-white rounded border border-green-100">
                          <span>Microsoft (MSFT)</span>
                          <Badge className="bg-green-600">KGV: 30 → 24</Badge>
                        </li>
                        <li className="flex justify-between items-center p-2 bg-white rounded border border-green-100">
                          <span>Alphabet (GOOGL)</span>
                          <Badge className="bg-green-600">KGV: 25 → 20</Badge>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-red-50 border border-red-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-red-800">Bei weiterer Überhitzung (+15%)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3">Diese Aktien wären auch bei weiterer Marktüberhitzung noch fair bewertet:</p>
                      <ul className="space-y-2">
                        <li className="flex justify-between items-center p-2 bg-white rounded border border-red-100">
                          <span>Berkshire Hathaway (BRK.B)</span>
                          <Badge className="bg-blue-600">KGV: 22 → 25</Badge>
                        </li>
                        <li className="flex justify-between items-center p-2 bg-white rounded border border-red-100">
                          <span>JPMorgan (JPM)</span>
                          <Badge className="bg-blue-600">KGV: 12 → 14</Badge>
                        </li>
                        <li className="flex justify-between items-center p-2 bg-white rounded border border-red-100">
                          <span>Johnson & Johnson (JNJ)</span>
                          <Badge className="bg-blue-600">KGV: 15 → 17</Badge>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold mb-2 text-yellow-800">Hinweis:</h4>
                  <p className="text-sm">
                    Diese Szenarien sind hypothetisch und dienen nur zu Veranschaulichungszwecken. 
                    Echte Marktveränderungen können komplexer sein und andere Auswirkungen haben. 
                    Eine detaillierte Analyse der einzelnen Aktien wird empfohlen.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Link to="/quant-analyzer" className="block">
          <Button className="w-full mt-4">
            Detaillierte Analyse im Buffett-Analyzer durchführen
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      {/* Market Context Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Marktkontext & Investitionsstrategie</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Warren Buffetts Ansatz in verschiedenen Marktphasen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Warren Buffett ist bekannt für seinen disziplinierten Ansatz, unabhängig von der Marktphase. 
              Sein Fokus liegt auf dem intrinsischen Wert eines Unternehmens im Vergleich zu dessen Marktpreis. 
              Dennoch sollte die aktuelle Marktbewertung Einfluss auf Ihre Investitionsstrategie haben:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2">In überbewerteten Märkten:</h4>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Besondere Vorsicht bei der Aktienbewertung walten lassen</li>
                  <li>Höhere Sicherheitsmargen verlangen</li>
                  <li>Cashreserven für zukünftige Gelegenheiten aufbauen</li>
                  <li>Bestehende Positionen kritisch überprüfen</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-2">In unterbewerteten Märkten:</h4>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Aggressiver nach Gelegenheiten suchen</li>
                  <li>Qualitätsunternehmen zu Schnäppchenpreisen erwerben</li>
                  <li>Langfristige Perspektive beibehalten</li>
                  <li>Sich nicht von Marktstimmungen beirren lassen</li>
                </ul>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 italic text-gray-700 my-4">
              "Sei ängstlich, wenn andere gierig sind, und gierig, wenn andere ängstlich sind."
              <footer className="text-right text-sm mt-1">— Warren Buffett</footer>
            </blockquote>
            
            <p>
              Diese Weisheit fasst Buffetts konträre Denkweise gut zusammen. In überbewerteten Märkten ist 
              Vorsicht geboten, während Panikverkäufe und Unterbewertungen Chancen für geduldige Investoren bieten.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketOverview;

