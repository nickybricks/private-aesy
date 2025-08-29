import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, MoreHorizontal, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWatchlists } from '@/hooks/useWatchlists';
import { useUserStocks } from '@/hooks/useUserStocks';
import { useStockSearch } from '@/hooks/useStockSearch';

const WatchlistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { watchlists } = useWatchlists();
  const { stocks, loading: stocksLoading, addStock, removeStock } = useUserStocks(id!);
  const { searchStocks, searchResults, isSearching } = useStockSearch();
  
  const [activeTab, setActiveTab] = useState('POSITIONEN');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);

  const watchlist = watchlists.find(w => w.id === id);

  const tabs = ['POSITIONEN', 'LIMITS', 'ÄNDERUNGEN', 'NEWS'];

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-search with debouncing
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim().length >= 2) {
        searchStocks(query);
      } else {
        // Clear results if query is too short
        searchStocks('');
      }
    }, 300),
    [searchStocks]
  );

  useEffect(() => {
    debouncedSearch(stockSearchQuery);
  }, [stockSearchQuery, debouncedSearch]);

  const handleStockSearchChange = (value: string) => {
    setStockSearchQuery(value);
  };

  // Debounce utility function
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  const handleAddStock = async (stockData: any) => {
    await addStock({
      symbol: stockData.symbol,
      company_name: stockData.name,
      watchlist_id: id!
    });
    setIsAddStockDialogOpen(false);
    setStockSearchQuery('');
  };

  const handleRemoveStock = async (stockId: string) => {
    await removeStock(stockId);
  };

  const formatPercentage = (value: number) => {
    const formatted = value > 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
    return (
      <span className={value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-muted-foreground'}>
        {formatted}
      </span>
    );
  };

  const formatCurrency = (value: number, currency: string = 'EUR') => {
    return `${value.toFixed(2)} ${currency}`;
  };

  if (!watchlist) {
    return (
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Watchlist nicht gefunden</h1>
            <Button onClick={() => navigate('/watchlists')}>
              Zurück zu Watchlists
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/watchlists')}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-muted-foreground">Meine Watchlist</h1>
              <h2 className="text-2xl font-bold">{watchlist.name}</h2>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Printer className="h-4 w-4" />
            </Button>
            <Dialog open={isAddStockDialogOpen} onOpenChange={setIsAddStockDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full w-12 h-12 p-0">
                  <Plus className="h-6 w-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Wertpapier hinzufügen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      placeholder="Aktien, ETFs oder Fonds suchen (z.B. Apple, AAPL, Vanguard)"
                      value={stockSearchQuery}
                      onChange={(e) => handleStockSearchChange(e.target.value)}
                      className="w-full"
                    />
                    
                    {/* Search Results Dropdown */}
                    {(searchResults.length > 0 || (stockSearchQuery.length >= 2 && !isSearching)) && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
                        {isSearching && (
                          <div className="p-3 text-sm text-muted-foreground">
                            Suche läuft...
                          </div>
                        )}
                        
                        {searchResults.length > 0 && (
                          <>
                            <div className="px-3 py-2 bg-muted/50 border-b border-border">
                              <span className="text-sm font-medium text-muted-foreground">Vorschläge</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                              {searchResults.map((stock, index) => (
                                <div 
                                  key={index} 
                                  className="p-3 cursor-pointer hover:bg-accent transition-colors border-b border-border last:border-b-0" 
                                  onClick={() => handleAddStock(stock)}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium text-foreground">{stock.name}</span>
                                        <span className="text-muted-foreground">({stock.symbol})</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {stock.assetType}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-sm font-medium text-muted-foreground">{stock.exchange}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {stockSearchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                          <div className="p-6 text-center text-muted-foreground">
                            <p>Keine Ergebnisse für "{stockSearchQuery}" gefunden</p>
                            <p className="text-sm mt-1">Versuche es mit einem anderen Suchbegriff</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Wertpapiere"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stocks Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Kurs</TableHead>
                  <TableHead className="text-right">Heute</TableHead>
                  <TableHead className="text-right">Seit Hinzufügen</TableHead>
                  <TableHead className="text-right">Hinzugefügt</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{stock.company_name || stock.symbol}</span>
                          {stock.analysis_data?.assetType && (
                            <Badge variant="outline" className="text-xs">
                              {stock.analysis_data.assetType}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stock.symbol} • {stock.analysis_data?.exchange || 'N/A'}
                          {stock.analysis_data?.isin && (
                            <span className="ml-2">• {stock.analysis_data.isin}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        {stock.analysis_data?.price ? formatCurrency(stock.analysis_data.price, stock.analysis_data.currency || 'EUR') : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {stock.analysis_data?.changePercent ? formatPercentage(stock.analysis_data.changePercent) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {stock.analysis_data?.sinceAddedPercent ? formatPercentage(stock.analysis_data.sinceAddedPercent) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-muted-foreground">
                        {new Date(stock.created_at).toLocaleDateString('de-DE')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleRemoveStock(stock.id)}
                            className="text-destructive"
                          >
                            Aus Watchlist entfernen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStocks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {stocksLoading ? 'Laden...' : 'Keine Wertpapiere in dieser Watchlist'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default WatchlistDetail;