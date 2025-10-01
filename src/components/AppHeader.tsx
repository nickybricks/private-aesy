import React from 'react';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import StockSearch from './StockSearch';
import { useMobileMenu } from '@/context/MobileMenuContext';
import { useStock } from '@/context/StockContext';

const AppHeader: React.FC = () => {
  const { toggleMobileMenu } = useMobileMenu();
  const { handleSearch, isLoading } = useStock();
  const navigate = useNavigate();
  
  const handleStockSearch = (ticker: string, enableDeepResearch?: boolean) => {
    navigate('/analyzer');
    handleSearch(ticker, enableDeepResearch);
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-18 glass-header">
      <div className="h-full px-6 flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost" 
          size="icon"
          onClick={toggleMobileMenu}
          className="md:hidden shrink-0 -ml-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Logo - Always visible, positioned at very left */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-semibold text-lg">A</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Aesy</span>
        </div>

        {/* Centered Search Field */}
        <div className="flex-1 max-w-2xl mx-auto">
          <StockSearch onSearch={handleStockSearch} isLoading={isLoading} compact />
        </div>
        
        {/* Spacer for balance - Desktop only */}
        <div className="hidden md:block w-[120px]"></div>
      </div>
    </header>
  );
};

export default AppHeader;
