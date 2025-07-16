import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LineChart, 
  BarChart3, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronRight,
  FolderOpen 
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Watchlist {
  id: string;
  name: string;
  description?: string;
  stocks: string[];
  createdAt: Date;
}

export function AppSidebar() {
  const location = useLocation();
  const { toast } = useToast();
  const [watchlists, setWatchlists] = useState<Watchlist[]>(() => {
    const saved = localStorage.getItem('watchlists');
    return saved ? JSON.parse(saved) : [];
  });
  const [expandedWatchlist, setExpandedWatchlist] = useState<string | null>(null);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistDescription, setNewWatchlistDescription] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const saveWatchlists = (updatedWatchlists: Watchlist[]) => {
    setWatchlists(updatedWatchlists);
    localStorage.setItem('watchlists', JSON.stringify(updatedWatchlists));
  };

  const createWatchlist = () => {
    if (!newWatchlistName.trim()) return;

    const newWatchlist: Watchlist = {
      id: Date.now().toString(),
      name: newWatchlistName.trim(),
      description: newWatchlistDescription.trim(),
      stocks: [],
      createdAt: new Date()
    };

    saveWatchlists([...watchlists, newWatchlist]);
    setNewWatchlistName('');
    setNewWatchlistDescription('');
    setCreateDialogOpen(false);
    
    toast({
      title: "Watchlist erstellt",
      description: `"${newWatchlist.name}" wurde erfolgreich erstellt.`,
    });
  };

  const deleteWatchlist = (id: string) => {
    const updatedWatchlists = watchlists.filter(w => w.id !== id);
    saveWatchlists(updatedWatchlists);
    
    toast({
      title: "Watchlist gelöscht",
      description: "Die Watchlist wurde erfolgreich gelöscht.",
    });
  };

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    {
      title: "Buffett Benchmark",
      url: "/",
      icon: LineChart,
    },
    {
      title: "Quant Analyzer",
      url: "/quant-analyzer",
      icon: BarChart3,
    },
  ];

  return (
    <Sidebar className="w-80" collapsible="none">
      <SidebarContent>
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-2 ${
                          isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Profile */}
        <SidebarGroup>
          <SidebarGroupLabel>Profil</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `flex items-center gap-2 ${
                        isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                      }`
                    }
                  >
                    <Settings className="h-4 w-4" />
                    <span>Einstellungen</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Watchlists */}
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel>Meine Watchlists</SidebarGroupLabel>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue Watchlist erstellen</DialogTitle>
                  <DialogDescription>
                    Erstellen Sie eine neue Watchlist für Ihre Aktien.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newWatchlistName}
                      onChange={(e) => setNewWatchlistName(e.target.value)}
                      placeholder="z.B. Tech Aktien"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Beschreibung (optional)</Label>
                    <Textarea
                      id="description"
                      value={newWatchlistDescription}
                      onChange={(e) => setNewWatchlistDescription(e.target.value)}
                      placeholder="Eine kurze Beschreibung..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={createWatchlist} disabled={!newWatchlistName.trim()}>
                    Erstellen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <SidebarGroupContent>
            {watchlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <FolderOpen className="h-8 w-8 mb-2" />
                <p className="text-sm">Keine Watchlists vorhanden</p>
                <p className="text-xs">Erstellen Sie Ihre erste Watchlist</p>
              </div>
            ) : (
              <SidebarMenu>
                {watchlists.map((watchlist) => (
                  <SidebarMenuItem key={watchlist.id}>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between group">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 justify-start gap-2 h-8"
                          onClick={() => setExpandedWatchlist(
                            expandedWatchlist === watchlist.id ? null : watchlist.id
                          )}
                        >
                          {expandedWatchlist === watchlist.id ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          <span className="truncate">{watchlist.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({watchlist.stocks.length})
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteWatchlist(watchlist.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {expandedWatchlist === watchlist.id && (
                        <div className="ml-5 space-y-1">
                          {watchlist.stocks.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2">
                              Keine Aktien hinzugefügt
                            </p>
                          ) : (
                            watchlist.stocks.map((stock) => (
                              <Button
                                key={stock}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start h-7 text-xs"
                              >
                                {stock}
                              </Button>
                            ))
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-7 text-xs text-muted-foreground"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Aktie hinzufügen
                          </Button>
                        </div>
                      )}
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}