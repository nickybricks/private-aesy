
import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClickableTooltip } from './ClickableTooltip';
import { Info } from 'lucide-react';

interface AppHeaderProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onMobileMenuToggle, isMobileMenuOpen }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-background border-b border-border md:hidden">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost" 
          size="icon"
          onClick={onMobileMenuToggle}
          className="mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Aesy</h1>
          <ClickableTooltip
            content={
              <div className="space-y-2 max-w-md">
                <h4 className="font-medium">Über dieses Tool</h4>
                <p className="text-sm">
                  Aesy analysiert Aktien nach den Investitionsprinzipien von Warren Buffett. 
                  Die DCF-Berechnung des inneren Werts basiert auf realen Finanzdaten der Unternehmen.
                </p>
                <h5 className="font-medium mt-4">Verwendete Daten</h5>
                <ul className="text-xs space-y-1 list-disc pl-4">
                  <li>Free Cash Flows (5-Jahres-Prognose)</li>
                  <li>Gewichtete Kapitalkosten (WACC)</li>
                  <li>Terminal Value ab Jahr 6</li>
                  <li>Netto-Verschuldung</li>
                  <li>Anzahl ausstehender Aktien</li>
                </ul>
              </div>
            }
          >
            <button className="inline-flex items-center justify-center rounded-full w-5 h-5 bg-gray-200 hover:bg-gray-300 transition-colors">
              <Info size={12} className="text-gray-700" />
            </button>
          </ClickableTooltip>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
