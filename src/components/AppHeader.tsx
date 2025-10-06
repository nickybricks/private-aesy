import React, { useState } from 'react';
import { Menu, Brain, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StockSearch from './StockSearch';
import { useMobileMenu } from '@/context/MobileMenuContext';
import { useStock } from '@/context/StockContext';

const AppHeader: React.FC = () => {
  const { toggleMobileMenu } = useMobileMenu();
  const { handleSearch, isLoading } = useStock();
  const navigate = useNavigate();
  const [enableDeepResearch, setEnableDeepResearch] = useState(false);
  
  const handleStockSearch = (ticker: string) => {
    navigate('/analyzer');
    handleSearch(ticker, enableDeepResearch);
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-18 bg-background border-b border-border">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-full items-center">
        {/* Left section: Logo area (280px on desktop to match navigation) */}
        <div className="w-[280px] px-6 flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-semibold text-lg">A</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Aesy</span>
          </div>
        </div>

        {/* Right section: Centered Search Field */}
        <div className="flex flex-1 px-6 justify-center">
          <div className="w-full max-w-2xl">
            <StockSearch 
              onSearch={handleStockSearch} 
              isLoading={isLoading} 
              compact 
              enableDeepResearch={enableDeepResearch}
              onDeepResearchChange={setEnableDeepResearch}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="md:hidden h-full flex items-center py-3 px-3">
        <div className="flex items-center gap-2 w-full">
          {/* Burger Menu - Links */}
          <div className="shrink-0">
            <Button
              variant="ghost" 
              size="icon"
              onClick={toggleMobileMenu}
              className="h-9 w-9 p-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Search Field */}
          <div className="flex-1 min-w-0">
            <StockSearch 
              onSearch={handleStockSearch} 
              isLoading={isLoading} 
              compact 
              mobileMode
            />
          </div>
          
          {/* AI Toggle - Kompaktes Layout */}
          <TooltipProvider>
            <div className="shrink-0 flex items-center gap-2 pl-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">
                  KI
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button" 
                      className="focus:outline-none p-0.5 rounded-full hover:bg-accent/50 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[280px] p-3">
                    <div className="space-y-2">
                      <p className="font-semibold text-xs">Deep Research KI-Analyse</p>
                      <p className="text-xs text-muted-foreground">
                        Erweiterte Analyse mit aktuellen Marktdaten, qualitativen Faktoren und KI-gestützter Bewertung.
                      </p>
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium">Credits pro Analyse:</p>
                        <p className="text-xs text-muted-foreground">~5-10 Credits (abhängig von der Datenmenge)</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch
                checked={enableDeepResearch}
                onCheckedChange={setEnableDeepResearch}
                disabled={isLoading}
                className="scale-90"
              />
            </div>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
