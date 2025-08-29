import React, { useState } from 'react';
import { Plus, MoreVertical, Star, TrendingUp, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';

interface Watchlist {
  id: string;
  name: string;
  description?: string;
  positions: number;
  createdAt: string;
  updatedAt: string;
}

const Watchlists = () => {
  const { toast } = useToast();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([
    {
      id: '1',
      name: 'Buffett Favorites',
      description: 'Aktien nach Warren Buffetts Prinzipien',
      positions: 7,
      createdAt: '06.06.2025',
      updatedAt: '06.06.2025'
    },
    {
      id: '2', 
      name: 'Tech Giants',
      description: 'Große Technologie-Unternehmen',
      positions: 5,
      createdAt: '01.12.2024',
      updatedAt: '24.01.2025'
    },
    {
      id: '3',
      name: 'Dividenden Champions', 
      description: 'Aktien mit konstanten Dividenden',
      positions: 12,
      createdAt: '24.01.2025',
      updatedAt: '24.01.2025'
    },
    {
      id: '4',
      name: 'Value Picks 2025',
      positions: 0,
      createdAt: '24.01.2025',
      updatedAt: '24.01.2025'
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistDescription, setNewWatchlistDescription] = useState('');

  const handleCreateWatchlist = () => {
    if (!newWatchlistName.trim()) {
      toast({
        title: "Name erforderlich",
        description: "Bitte geben Sie einen Namen für die Watchlist ein.",
        variant: "destructive"
      });
      return;
    }

    const now = new Date().toLocaleDateString('de-DE');
    const newWatchlist: Watchlist = {
      id: Date.now().toString(),
      name: newWatchlistName.trim(),
      description: newWatchlistDescription.trim() || undefined,
      positions: 0,
      createdAt: now,
      updatedAt: now
    };

    setWatchlists([newWatchlist, ...watchlists]);
    setNewWatchlistName('');
    setNewWatchlistDescription('');
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Watchlist erstellt",
      description: `"${newWatchlist.name}" wurde erfolgreich erstellt.`,
      variant: "default"
    });
  };

  const handleDeleteWatchlist = (id: string, name: string) => {
    setWatchlists(watchlists.filter(w => w.id !== id));
    toast({
      title: "Watchlist gelöscht",
      description: `"${name}" wurde erfolgreich gelöscht.`,
      variant: "default"
    });
  };

  const handleRenameWatchlist = (id: string) => {
    // Placeholder für Umbenennung
    toast({
      title: "Feature kommt bald",
      description: "Die Umbenennung von Watchlists wird bald verfügbar sein.",
      variant: "default"
    });
  };

  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="h-full">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Watchlists
              </h1>
              <p className="text-muted-foreground">
                Verwalten Sie Ihre Aktien-Watchlists und behalten Sie interessante Titel im Blick
              </p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-5 w-5" />
                  Neue Watchlist
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Neue Watchlist erstellen</DialogTitle>
                  <DialogDescription>
                    Erstellen Sie eine neue Watchlist für Ihre Aktienauswahl.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newWatchlistName}
                      onChange={(e) => setNewWatchlistName(e.target.value)}
                      placeholder="z.B. Meine Favoriten"
                      className="w-full"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Beschreibung (optional)</Label>
                    <Textarea
                      id="description"
                      value={newWatchlistDescription}
                      onChange={(e) => setNewWatchlistDescription(e.target.value)}
                      placeholder="Beschreiben Sie den Zweck dieser Watchlist..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleCreateWatchlist}>
                    Erstellen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button className="border-primary text-primary whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium">
                  MEINE WATCHLISTS
                </button>
              </nav>
            </div>
          </div>

          {/* Watchlists Grid */}
          <div className="grid gap-4">
            {watchlists.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine Watchlists vorhanden</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Erstellen Sie Ihre erste Watchlist, um interessante Aktien zu sammeln und zu verfolgen.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Erste Watchlist erstellen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              watchlists.map((watchlist) => (
                <Card key={watchlist.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {watchlist.name}
                          </h3>
                          <Badge variant="secondary" className="shrink-0">
                            {watchlist.positions} {watchlist.positions === 1 ? 'Position' : 'Positionen'}
                          </Badge>
                        </div>
                        
                        {watchlist.description && (
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {watchlist.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Hinzugefügt: {watchlist.createdAt}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>Update: {watchlist.updatedAt}</span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRenameWatchlist(watchlist.id)}>
                            Umbenennen
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteWatchlist(watchlist.id, watchlist.name)}
                            className="text-red-600"
                          >
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Stats */}
          {watchlists.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{watchlists.length}</p>
                      <p className="text-sm text-muted-foreground">Watchlists</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {watchlists.reduce((sum, w) => sum + w.positions, 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Gesamte Positionen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {watchlists.filter(w => w.positions > 0).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Aktive Listen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Watchlists;