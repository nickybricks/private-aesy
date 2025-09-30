import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMobileMenu } from '@/context/MobileMenuContext';

const PageHeader: React.FC = () => {
  const { toggleMobileMenu } = useMobileMenu();
  
  return (
    <header className="sticky top-0 z-50 flex items-center gap-3 px-3 py-2 bg-background border-b border-border">
      <Button
        variant="ghost" 
        size="icon"
        onClick={toggleMobileMenu}
        className="md:hidden shrink-0 h-9 w-9"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </header>
  );
};

export default PageHeader;
