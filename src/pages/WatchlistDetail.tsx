import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
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
import { Shell, ShellContent } from '@/components/layout/Shell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';

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

  const tabs = ['POSITIONEN', 'NEWS'];

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStockSearch = async () => {
    if (stockSearchQuery.trim()) {
      await searchStocks(stockSearchQuery);
    }
  };

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
      <span className={value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : 'text-muted-foreground'}>
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
        <Shell>
          <Section variant="subtle" className="text-center py-16">
            <h2 className="text-xl font-medium mb-4">Watchlist nicht gefunden</h2>
            <Button onClick={() => navigate('/watchlists')}>
              Zurück zu Watchlists
            </Button>
          </Section>
        </Shell>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-background">
      <Shell>
        <PageHeader
          title={watchlist.name}
          subtitle="Meine Watchlist"
          backLink="/watchlists"
          action={
            <Dialog open={isAddStockDialogOpen} onOpenChange={setIsAddStockDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="rounded-full h-12 w-12">
                  <Plus className="h-6 w-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Aktie hinzufügen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Aktien suchen (z.B. Apple, AAPL, US0378331005)"
                      value={stockSearchQuery}
                      onChange={(e) => setStockSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleStockSearch()}
                    />
                    <Button onClick={handleStockSearch} disabled={isSearching}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {searchResults.map((stock, index) => (
                        <Card key={index} className="cursor-pointer hover:bg-accent" onClick={() => handleAddStock(stock)}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-medium">{stock.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {stock.symbol} • {stock.exchange}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatCurrency(stock.price, stock.currency)}</p>
                                {stock.change && (
                                  <p className="text-sm">{formatPercentage(stock.change)}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        <ShellContent>
          {/* Tabs */}
          <div className="border-b border-border mb-6">
            <nav className="flex gap-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => tab !== 'NEWS' && setActiveTab(tab)}
                  className={`whitespace-nowrap border-b-2 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : tab === 'NEWS'
                      ? 'border-transparent text-muted-foreground cursor-default opacity-60'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  {tab === 'NEWS' ? 'NEWS (soon)' : tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Aktien durchsuchen..."
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
                          <div className="font-medium">{stock.company_name || stock.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {stock.symbol} • {stock.analysis_data?.exchange || 'N/A'}
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
                        <span className="text-muted-foreground text-sm">
                          {new Date(stock.created_at).toLocaleDateString('de-DE')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
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
                        {stocksLoading ? 'Lädt...' : 'Keine Aktien in dieser Watchlist'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </ShellContent>
      </Shell>
    </main>
  );
};

export default WatchlistDetail;