import React from 'react';
import { Menu, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import StockSearch from './StockSearch';
import { useMobileMenu } from '@/context/MobileMenuContext';
import { useStock } from '@/context/StockContext';

const AppHeader: React.FC = () => {
  const { toggleMobileMenu } = useMobileMenu();
  const { handleSearch, isLoading, enableDeepResearch, setEnableDeepResearch } = useStock();
  const navigate = useNavigate();
  
  const handleStockSearch = (ticker: string, enableDeepResearch?: boolean) => {
    navigate('/analyzer');
    handleSearch(ticker, enableDeepResearch);
  };
  
  return (
    <header className="sticky top-0 z-40 h-18 glass-header">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
      >
        Zum Inhalt springen
      </a>
      
      <div className="h-full max-w-[1440px] mx-auto px-4 md:px-8 flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost" 
          size="icon"
          onClick={toggleMobileMenu}
          className="md:hidden shrink-0"
          aria-label="Menü öffnen"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Logo - Desktop only */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-semibold text-lg">A</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Aesy</span>
        </div>

        {/* Centered Search Field */}
        <div className="flex-1 max-w-2xl mx-auto">
          <StockSearch onSearch={handleStockSearch} isLoading={isLoading} compact />
        </div>
        
        {/* AI Toggle with Tooltip - Desktop only */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <div className="flex items-center gap-2">
                <Label htmlFor="ai-toggle" className="text-sm font-medium cursor-pointer">
                  KI-Einschätzung
                </Label>
                <Switch 
                  id="ai-toggle" 
                  checked={enableDeepResearch} 
                  onCheckedChange={setEnableDeepResearch}
                  aria-label="KI-Analyse aktivieren"
                />
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
              </div>
              <TooltipContent className="max-w-xs" side="bottom">
                <p className="text-xs">
                  Nutzt GPT-4 für qualitative Einschätzung des Managements, 
                  Wettbewerbsvorteile und Branchentrends.
                </p>
                <p className="text-xs mt-1 text-muted-foreground">
                  Erfordert API-Key in Profil-Einstellungen.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
