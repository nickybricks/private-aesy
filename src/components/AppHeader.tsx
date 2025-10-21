import React, { useState } from 'react';
import { Brain, User, LogOut, Settings, BarChart3, List, Save } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import StockSearch from './StockSearch';
import { useStock } from '@/context/StockContext';
import { useAuth } from '@/hooks/useAuth';

const AppHeader: React.FC = () => {
  const { handleSearch, isLoading } = useStock();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [enableDeepResearch, setEnableDeepResearch] = useState(false);
  
  const handleStockSearch = (ticker: string) => {
    navigate('/analyzer');
    handleSearch(ticker, enableDeepResearch);
  };

  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-18 bg-background border-b border-border">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-full items-center px-6 gap-6">
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
          <Link to="/saved-analyses">
            <Button variant={isActive('/saved-analyses') ? 'secondary' : 'ghost'} size="sm">
              Gespeicherte Analysen
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate('/saved-analyses')}>
              <Save className="h-4 w-4 mr-2" />
              Gespeicherte Analysen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/watchlists')}>
              <List className="h-4 w-4 mr-2" />
              Watchlists
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Mobile Layout */}
      <div className="md:hidden h-full flex items-center py-3 px-3">
        <div className="flex items-center gap-2 w-full">
          {/* Logo */}
          <Link to="/" className="shrink-0">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-semibold">A</span>
            </div>
          </Link>
          
          {/* Search Field */}
          <div className="flex-1 min-w-0">
            <StockSearch 
              onSearch={handleStockSearch} 
              isLoading={isLoading} 
              compact 
              mobileMode
            />
          </div>
          
          {/* Profile Icon */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/analyzer')}>
                Analyzer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/quant')}>
                Boersen Analyzer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/watchlists')}>
                Watchlists
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/saved-analyses')}>
                Gespeicherte Analysen
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
