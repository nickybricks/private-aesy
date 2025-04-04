
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exchanges } from '@/api/quantAnalyzerApi';

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
      <h2 className="text-lg font-medium mb-2">Börse auswählen</h2>
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
        Wählen Sie eine Börse aus, um Aktien nach Warren Buffetts Kriterien zu analysieren.
      </p>
    </div>
  );
};

export default ExchangeSelector;
