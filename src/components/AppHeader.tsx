
import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StockSearch from './StockSearch';
import { useMobileMenu } from '@/context/MobileMenuContext';

interface AppHeaderProps {
  onSearch: (ticker: string, enableDeepResearch?: boolean) => void;
  isLoading: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onSearch, isLoading }) => {
  const { toggleMobileMenu } = useMobileMenu();
  
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
      
      <div className="flex items-center gap-2 shrink-0">
        <h1 className="text-lg md:text-xl font-bold">Aesy</h1>
      </div>

      <div className="flex-1 max-w-2xl">
        <StockSearch onSearch={onSearch} isLoading={isLoading} compact />
      </div>
    </header>
  );
};

export default AppHeader;
