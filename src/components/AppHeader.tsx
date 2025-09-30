
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
    // Navigate to analyzer page first
    navigate('/analyzer');
    // Then trigger the search
    handleSearch(ticker, enableDeepResearch);
  };
  
  return (
    <header className="sticky top-0 z-50 flex items-center gap-4 px-4 py-3 bg-background border-b border-border">
      <Button
        variant="ghost" 
        size="icon"
        onClick={toggleMobileMenu}
        className="md:hidden shrink-0"
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      {/* Logo Placeholder - Desktop only */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold">A</span>
        </div>
        <span className="text-lg font-bold">Aesy</span>
      </div>

      {/* Centered Search Field */}
      <div className="flex-1 max-w-3xl mx-auto">
        <StockSearch onSearch={handleStockSearch} isLoading={isLoading} compact />
      </div>
      
      {/* Spacer for balance */}
      <div className="hidden md:block w-24"></div>
    </header>
  );
};

export default AppHeader;
