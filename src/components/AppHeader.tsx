import React, { useState } from 'react';
import { Menu, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import StockSearch from './StockSearch';
import { useMobileMenu } from '@/context/MobileMenuContext';
import { useStock } from '@/context/StockContext';
import { SidebarTrigger } from '@/components/ui/sidebar';

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
        {/* Left section: Logo area with Sidebar Trigger */}
        <div className="w-[280px] px-6 flex items-center gap-3 shrink-0">
          <SidebarTrigger className="h-9 w-9" />
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
          {/* Sidebar Trigger - Mobile */}
          <div className="shrink-0">
            <SidebarTrigger className="h-9 w-9" />
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
          
          {/* AI Toggle - wie Desktop Version */}
          <div className="shrink-0 flex items-center gap-2 ml-2">
            <div className="flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-primary" />
              <Label htmlFor="deep-research-mobile" className="text-2xs font-medium cursor-pointer whitespace-nowrap">
                AI Analyse
              </Label>
            </div>
            <Switch
              id="deep-research-mobile"
              checked={enableDeepResearch}
              onCheckedChange={setEnableDeepResearch}
              disabled={isLoading}
              className="scale-75"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
