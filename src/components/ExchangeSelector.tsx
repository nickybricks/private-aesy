
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
  label?: string;
  description?: string;
}

const ExchangeSelector: React.FC<ExchangeSelectorProps> = ({ 
  selectedExchange, 
  onExchangeChange,
  label = "Börse auswählen",
  description = "Wählen Sie eine Börse aus, um Aktien nach Warren Buffetts Kriterien zu analysieren."
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        <h2 className="text-lg font-medium">{label}</h2>
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
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-gray-500 mt-2">
        {description}
      </p>
    </div>
  );
};

export default ExchangeSelector;
