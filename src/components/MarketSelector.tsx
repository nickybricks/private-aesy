import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { marketOptions } from '@/api/quantAnalyzerApi';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Building2, TrendingUp } from 'lucide-react';

interface MarketSelectorProps {
  selectedMarket: string;
  onMarketChange: (value: string) => void;
}

const MarketSelector: React.FC<MarketSelectorProps> = ({ 
  selectedMarket, 
  onMarketChange 
}) => {
  const selectedOption = marketOptions.find(option => option.id === selectedMarket);
  
  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        <h2 className="text-lg font-medium">Börse / Index auswählen</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="ml-2 rounded-full bg-gray-100 p-1 hover:bg-gray-200 transition-colors">
                <Info className="h-4 w-4 text-gray-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>Wählen Sie eine Börse oder einen Index aus, deren Aktien Sie nach Buffett-Kriterien analysieren möchten.</p>
              <p className="mt-1">Börsen analysieren alle gelisteten Aktien, Indizes nur die Indexbestandteile.</p>
              <p className="mt-1 text-sm text-yellow-600 font-medium">
                Hinweis: Bei ausländischen Märkten werden Werte automatisch in EUR umgerechnet.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Select value={selectedMarket} onValueChange={onMarketChange}>
        <SelectTrigger className="w-full md:w-80">
          <SelectValue placeholder="Börse oder Index auswählen" />
        </SelectTrigger>
        <SelectContent className="bg-background border border-border shadow-lg z-50">
          {/* Börsen Gruppe */}
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center">
            <Building2 className="h-3 w-3 mr-1" />
            BÖRSEN
          </div>
          {marketOptions
            .filter(option => option.type === 'exchange')
            .map(option => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
                {option.currency && option.currency !== 'EUR' && option.currency !== 'USD' && (
                  <span className="ml-2 text-sm text-muted-foreground">({option.currency})</span>
                )}
              </SelectItem>
            ))}
          
          {/* Indizes Gruppe */}
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center border-t border-border mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            INDIZES
          </div>
          {marketOptions
            .filter(option => option.type === 'index')
            .map(option => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
                {option.currency && option.currency !== 'EUR' && option.currency !== 'USD' && (
                  <span className="ml-2 text-sm text-muted-foreground">({option.currency})</span>
                )}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-gray-500 mt-2">
        {selectedOption?.type === 'exchange' ? 'Börse' : selectedOption?.type === 'index' ? 'Index' : 'Markt'} 
        {' '}auswählen für die Buffett-Analyse.
        {selectedOption && selectedOption.currency && 
        selectedOption.currency !== 'EUR' && selectedOption.currency !== 'USD' && (
          <span className="ml-1 text-yellow-600">
            Finanzdaten werden automatisch von {selectedOption.currency} in EUR umgerechnet.
          </span>
        )}
      </p>
    </div>
  );
};

export default MarketSelector;