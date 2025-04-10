
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exchanges } from '@/api/quantAnalyzerApi';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from 'lucide-react';

interface ExchangeSelectorProps {
  selectedExchange: string;
  onExchangeChange: (value: string) => void;
}

const ExchangeSelector: React.FC<ExchangeSelectorProps> = ({ 
  selectedExchange, 
  onExchangeChange 
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        <h2 className="text-lg font-medium">Börse auswählen</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="ml-2 rounded-full bg-gray-100 p-1 hover:bg-gray-200 transition-colors">
                <Info className="h-4 w-4 text-gray-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>Wählen Sie eine Börse aus, deren Aktien Sie nach Buffett-Kriterien analysieren möchten.</p>
              <p className="mt-1">Die Analyse berücksichtigt 10 quantitative Kriterien.</p>
              <p className="mt-1 text-sm text-yellow-600 font-medium">
                Hinweis: Bei ausländischen Börsen werden Werte automatisch in EUR umgerechnet.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Select value={selectedExchange} onValueChange={onExchangeChange}>
        <SelectTrigger className="w-full md:w-80">
          <SelectValue placeholder="Börse auswählen" />
        </SelectTrigger>
        <SelectContent>
          {exchanges.map(exchange => (
            <SelectItem key={exchange.id} value={exchange.id}>
              {exchange.name}
              {exchange.currency && exchange.currency !== 'EUR' && exchange.currency !== 'USD' && (
                <span className="ml-2 text-sm text-muted-foreground">({exchange.currency})</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-gray-500 mt-2">
        Wählen Sie eine Börse aus, um Aktien nach Warren Buffetts Kriterien zu analysieren.
        {selectedExchange && (
          <span className="ml-1">
            {exchanges.find(e => e.id === selectedExchange)?.currency && 
            exchanges.find(e => e.id === selectedExchange)?.currency !== 'EUR' && 
            exchanges.find(e => e.id === selectedExchange)?.currency !== 'USD' && (
              <span className="text-yellow-600">
                Finanzdaten werden automatisch von {exchanges.find(e => e.id === selectedExchange)?.currency} 
                in EUR umgerechnet.
              </span>
            )}
          </span>
        )}
      </p>
    </div>
  );
};

export default ExchangeSelector;
