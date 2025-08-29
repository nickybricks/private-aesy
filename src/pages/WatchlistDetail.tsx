import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Search, MoreVertical, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useWatchlists } from '@/hooks/useWatchlists';
import { useToast } from '@/hooks/use-toast';

interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  currency: string;
  dailyChange: number;
  dailyChangePercent: number;
  totalChange: number;
  totalChangePercent: number;
  addedAt: string;
  exchange: string;
  ticker: string;
}

const WatchlistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { watchlists } = useWatchlists();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
  const [newStockSymbol, setNewStockSymbol] = useState('');
  const [stocks, setStocks] = useState<Stock[]>([
    {
      id: '1',
      symbol: 'SK HYNIX GDR 144A/REGS 1',
      name: 'US78392B1070 / A1JWRE',
      price: 165.00,
      currency: 'EUR',
      dailyChange: 1.00,
      dailyChangePercent: 0.61,
      totalChange: 19.00,
      totalChangePercent: 13.01,
      addedAt: '06.06.2025',
      exchange: 'Frankfurt',
      ticker: '10:36:14'
    },
    {
      id: '2',
      symbol: 'NVR',
      name: 'US62944T1051 / 888265',
      price: 6950.00,
      currency: 'EUR',
      dailyChange: 50.00,
      dailyChangePercent: 0.72,
      totalChange: 700.00,
      totalChangePercent: 11.20,
      addedAt: '07.06.2025',
      exchange: 'Tradegate',
      ticker: 'gestern'
    },
    {
      id: '3',
      symbol: 'Merck & Co.',
      name: 'US58933Y1055 / A0YD8Q',
      price: 71.30,
      currency: 'EUR',
      dailyChange: 0.10,
      dailyChangePercent: 0.14,
      totalChange: -0.60,
      totalChangePercent: -0.83,
      addedAt: '11.07.2025',
      exchange: 'Tradegate',
      ticker: '10:41:51'
    }
  ]);

  const watchlist = watchlists.find(w => w.id === id);

  if (!watchlist) {
    return (
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-8 max-w-7xl mx-auto">
          <p>Watchlist nicht gefunden</p>
        </div>
      </main>
    );
  }

  const handleAddStock = () => {
    if (!newStockSymbol.trim()) {
      toast({
        title: "Symbol erforderlich",
        description: "Bitte geben Sie ein Aktien-Symbol ein.",
        variant: "destructive"
      });
      return;
    }

    // Simulierte neue Aktie (in der Realität würde hier eine API-Abfrage stattfinden)
    const newStock: Stock = {
      id: Date.now().toString(),
      symbol: newStockSymbol.toUpperCase(),
      name: `${newStockSymbol.toUpperCase()} Corp.`,
      price: 0,
      currency: 'EUR',
      dailyChange: 0,
      dailyChangePercent: 0,
      totalChange: 0,
      totalChangePercent: 0,
      addedAt: new Date().toLocaleDateString('de-DE'),
      exchange: 'Tradegate',
      ticker: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    };

    setStocks([newStock, ...stocks]);
    setNewStockSymbol('');
    setIsAddStockDialogOpen(false);
    
    toast({
      title: "Aktie hinzugefügt",
      description: `${newStockSymbol.toUpperCase()} wurde zur Watchlist hinzugefügt.`,
    });
  };

  const handleRemoveStock = (stockId: string, stockSymbol: string) => {
    setStocks(stocks.filter(s => s.id !== stockId));
    toast({
      title: "Aktie entfernt",
      description: `${stockSymbol} wurde aus der Watchlist entfernt.`,
    });
  };

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatChange = (change: number, percent: number) => {
    const isPositive = change >= 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const sign = isPositive ? '+' : '';
    
    return (
      <div className={`${color} text-right`}>
        <div className="font-medium">{sign}{percent.toFixed(2)}%</div>
        <div className="text-sm">{sign}{change.toFixed(2)}</div>
      </div>
    );
  };

  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="h-full">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/watchlists')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Meine Watchlist
                </h1>
                <p className="text-muted-foreground font-semibold">
                  {watchlist.name}
                </p>
              </div>
            </div>

            <Dialog open={isAddStockDialogOpen} onOpenChange={setIsAddStockDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-full h-14 w-14">
                  <Plus className="h-6 w-6" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Aktie hinzufügen</DialogTitle>
                  <DialogDescription>
                    Fügen Sie eine neue Aktie zu Ihrer Watchlist hinzu.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="stock-symbol">Aktien-Symbol</Label>
                    <Input
                      id="stock-symbol"
                      value={newStockSymbol}
                      onChange={(e) => setNewStockSymbol(e.target.value)}
                      placeholder="z.B. AAPL, MSFT, GOOGL"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddStockDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleAddStock}>Hinzufügen</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="positionen" className="mb-6">
            <TabsList className="grid w-full grid-cols-4 md:w-auto md:grid-cols-4">
              <TabsTrigger value="positionen">POSITIONEN</TabsTrigger>
              <TabsTrigger value="limits">LIMITS</TabsTrigger>
              <TabsTrigger value="aenderungen">ÄNDERUNGEN</TabsTrigger>
              <TabsTrigger value="news">NEWS</TabsTrigger>
            </TabsList>

            <TabsContent value="positionen">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Aktien"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Stocks Table */}
              <Card>
                <CardContent className="p-0">
                  {filteredStocks.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr className="border-b">
                            <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                            <th className="text-right p-4 font-medium text-muted-foreground">Kurs</th>
                            <th className="text-right p-4 font-medium text-muted-foreground">Heute</th>
                            <th className="text-right p-4 font-medium text-muted-foreground">Seit Hinzufügen</th>
                            <th className="text-right p-4 font-medium text-muted-foreground">Hinzugefügt</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStocks.map((stock) => (
                            <tr key={stock.id} className="border-b hover:bg-muted/20">
                              <td className="p-4">
                                <div>
                                  <div className="font-medium">{stock.symbol}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {stock.name} • {stock.ticker} • {stock.exchange}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                <div className="font-medium">{stock.price.toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">{stock.currency}</div>
                              </td>
                              <td className="p-4">
                                {formatChange(stock.dailyChange, stock.dailyChangePercent)}
                              </td>
                              <td className="p-4">
                                {formatChange(stock.totalChange, stock.totalChangePercent)}
                              </td>
                              <td className="p-4 text-right text-sm text-muted-foreground">
                                {stock.addedAt}
                              </td>
                              <td className="p-4">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      onClick={() => handleRemoveStock(stock.id, stock.symbol)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Entfernen
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-muted-foreground mb-4">
                        {searchQuery ? 'Keine Aktien gefunden' : 'Noch keine Aktien in dieser Watchlist'}
                      </p>
                      {!searchQuery && (
                        <Button onClick={() => setIsAddStockDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Erste Aktie hinzufügen
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="limits">
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Limits-Funktion wird bald verfügbar sein.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="aenderungen">
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Änderungen-Übersicht wird bald verfügbar sein.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="news">
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">News-Feed wird bald verfügbar sein.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
};

export default WatchlistDetail;