import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Edit, Trash2, TrendingUp, Calendar, Star } from 'lucide-react';
import { useWatchlists } from '@/hooks/useWatchlists';
import { useWatchlistStats } from '@/hooks/useWatchlistStats';
import { Skeleton } from '@/components/ui/skeleton';

const Watchlists: React.FC = () => {
  const navigate = useNavigate();
  const { watchlists, loading, createWatchlist, updateWatchlist, deleteWatchlist } = useWatchlists();
  const { stats, loading: statsLoading, getTotalStocks, getActiveListsCount } = useWatchlistStats(watchlists.map(w => w.id));
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWatchlist, setEditingWatchlist] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWatchlist(formData.name, formData.description || undefined);
      setFormData({ name: '', description: '' });
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWatchlist) return;
    
    try {
      await updateWatchlist(editingWatchlist.id, {
        name: formData.name,
        description: formData.description || undefined
      });
      setFormData({ name: '', description: '' });
      setIsEditDialogOpen(false);
      setEditingWatchlist(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEdit = (watchlist: any) => {
    setEditingWatchlist(watchlist);
    setFormData({ 
      name: watchlist.name, 
      description: watchlist.description || '' 
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (watchlistId: string) => {
    try {
      await deleteWatchlist(watchlistId);
    } catch (error) {
      // Error handled by hook
    }
  };

  if (loading) {
    return (
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </main>
    );
  }

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

            {/* Create New Watchlist Dialog */}
            {watchlists.length > 0 && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Neue Watchlist
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateSubmit}>
                    <DialogHeader>
                      <DialogTitle>Neue Watchlist erstellen</DialogTitle>
                      <DialogDescription>
                        Erstelle eine neue Watchlist um deine Aktien zu organisieren.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="create-name">Name</Label>
                        <Input
                          id="create-name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="z.B. Tech-Aktien"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="create-description">Beschreibung (Optional)</Label>
                        <Textarea
                          id="create-description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Kurze Beschreibung der Watchlist..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Abbrechen
                      </Button>
                      <Button type="submit">Erstellen</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {watchlists.map((watchlist) => (
              <Card key={watchlist.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/watchlists/${watchlist.id}`)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{watchlist.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(watchlist); }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); handleDelete(watchlist.id); }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  {watchlist.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {watchlist.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{stats[watchlist.id]?.stockCount || 0} Positionen</span>
                    <span>Erstellt: {new Date(watchlist.created_at).toLocaleDateString('de-DE')}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Aktualisiert: {new Date(watchlist.updated_at).toLocaleDateString('de-DE')}
                  </div>
                </CardContent>
              </Card>
            ))}

            {watchlists.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">
                  Noch keine Watchlists erstellt
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Erstelle deine erste Watchlist, um Aktien zu organisieren und zu verfolgen.
                </p>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Erste Watchlist erstellen
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateSubmit}>
                      <DialogHeader>
                        <DialogTitle>Neue Watchlist erstellen</DialogTitle>
                        <DialogDescription>
                          Erstelle eine neue Watchlist um deine Aktien zu organisieren.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="create-name">Name</Label>
                          <Input
                            id="create-name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="z.B. Tech-Aktien"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="create-description">Beschreibung (Optional)</Label>
                          <Textarea
                            id="create-description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Kurze Beschreibung der Watchlist..."
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Abbrechen
                        </Button>
                        <Button type="submit">Erstellen</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Edit Watchlist Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <form onSubmit={handleEditSubmit}>
                <DialogHeader>
                  <DialogTitle>Watchlist bearbeiten</DialogTitle>
                  <DialogDescription>
                    Bearbeite den Namen und die Beschreibung deiner Watchlist.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="z.B. Tech-Aktien"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Beschreibung (Optional)</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Kurze Beschreibung der Watchlist..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingWatchlist(null);
                      setFormData({ name: '', description: '' });
                    }}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit">Speichern</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

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
                      <p className="text-2xl font-bold">{getTotalStocks()}</p>
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
                      <p className="text-2xl font-bold">{getActiveListsCount()}</p>
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