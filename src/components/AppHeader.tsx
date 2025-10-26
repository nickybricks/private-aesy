import React, { useState } from 'react';
import { Brain, User, LogOut, Settings, BarChart3, List, X, Briefcase } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import StockSearch from './StockSearch';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/hooks/useAuth';

const AppHeader: React.FC = () => {
  const { handleSearch, isLoading } = useStock();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [enableDeepResearch, setEnableDeepResearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleStockSearch = (ticker: string) => {
    navigate('/analyzer');
    handleSearch(ticker, enableDeepResearch);
  };

  const isActive = (path: string) => location.pathname === path;

  const handleMobileNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-18 bg-background border-b border-border">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-full items-center px-6 gap-6 max-w-screen-xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-semibold text-lg">A</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Aesy</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <Link to="/analyzer">
            <Button variant={isActive('/analyzer') ? 'secondary' : 'ghost'} size="sm">
              Analyzer
            </Button>
          </Link>
          <Link to="/quant">
            <Button variant={isActive('/quant') ? 'secondary' : 'ghost'} size="sm">
              Boersen Analyzer
            </Button>
          </Link>
          <Link to="/watchlists">
            <Button variant={isActive('/watchlists') ? 'secondary' : 'ghost'} size="sm">
              Watchlists
            </Button>
          </Link>
          <Link to="/portfolios">
            <Button 
              variant={isActive('/portfolios') ? 'secondary' : 'ghost'} 
              size="sm"
              disabled
              className="relative opacity-50"
            >
              Portfolios
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">Soon</Badge>
            </Button>
          </Link>
        </nav>

        {/* Search Field - Centered */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-xl">
            <StockSearch 
              onSearch={handleStockSearch} 
              isLoading={isLoading} 
              compact 
              enableDeepResearch={enableDeepResearch}
              onDeepResearchChange={setEnableDeepResearch}
            />
          </div>
        </div>

        {/* Profile Menu */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="icon" className="w-10 h-10 rounded-full bg-primary shrink-0">
                <User className="h-5 w-5 text-primary-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/watchlists')}>
                <List className="h-4 w-4 mr-2" />
                Watchlists
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-50">
                <Briefcase className="h-4 w-4 mr-2" />
                Portfolios
                <Badge variant="secondary" className="ml-auto text-[10px]">Soon</Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="default" onClick={() => navigate('/auth')}>
            Anmelden
          </Button>
        )}
      </div>
      
      {/* Mobile Layout */}
      <div className="md:hidden h-full flex items-center justify-between px-4 gap-3 max-w-screen-xl mx-auto">
        {/* Logo - Links */}
        <Link to="/" className="shrink-0">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground font-semibold">A</span>
          </div>
        </Link>
        
        {/* Search - Mittig zentriert */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-[280px]">
            <StockSearch 
              onSearch={handleStockSearch} 
              isLoading={isLoading} 
              compact 
              mobileMode
            />
          </div>
        </div>
        
        {/* Profile Button - Rechts (blauer Hintergrund!) */}
        {user ? (
          <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DrawerTrigger asChild>
              <Button 
                variant="default" 
                size="icon" 
                className="w-10 h-10 rounded-full bg-primary shrink-0 btn-no-mobile-full"
              >
                <User className="h-5 w-5 text-primary-foreground" />
              </Button>
            </DrawerTrigger>
          
          <DrawerContent className="h-[90vh]">
            {/* Fullscreen Menü mit Wischgeste */}
            <DrawerHeader className="relative border-b">
              {/* Apple-Style X Button oben rechts */}
              <DrawerClose className="absolute right-4 top-4 rounded-full h-10 w-10 bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                <X className="h-5 w-5" />
              </DrawerClose>
              
              <DrawerTitle className="text-left">Menü</DrawerTitle>
            </DrawerHeader>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* Menüpunkte */}
              <nav className="space-y-2">
                <Button 
                  variant="ghost" 
                  onClick={() => handleMobileNavigation('/analyzer')}
                  className="w-full justify-start text-lg h-14"
                >
                  <BarChart3 className="mr-3 h-5 w-5" />
                  Analyzer
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={() => handleMobileNavigation('/quant')}
                  className="w-full justify-start text-lg h-14"
                >
                  <BarChart3 className="mr-3 h-5 w-5" />
                  Boersen Analyzer
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={() => handleMobileNavigation('/watchlists')}
                  className="w-full justify-start text-lg h-14"
                >
                  <List className="mr-3 h-5 w-5" />
                  Watchlists
                </Button>
                
                <Button 
                  variant="ghost" 
                  disabled 
                  className="w-full justify-start text-lg h-14 opacity-50"
                >
                  <Briefcase className="mr-3 h-5 w-5" />
                  Portfolios
                  <Badge variant="secondary" className="ml-auto">Soon</Badge>
                </Button>
                
                <Separator className="my-4" />
                
                {/* Logout Button */}
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start text-lg h-14 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Abmelden
                </Button>
              </nav>
            </div>
          </DrawerContent>
        </Drawer>
        ) : (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => navigate('/auth')}
            className="shrink-0"
          >
            Anmelden
          </Button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
