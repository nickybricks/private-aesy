
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { availableTargetCurrencies, getCurrencySymbol } from '@/utils/currencyConverter';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency = 'EUR',
  onCurrencyChange
}) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="currency-selector" className="text-sm font-medium text-buffett-subtext whitespace-nowrap">
        Zielwährung:
      </label>
      <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
        <SelectTrigger id="currency-selector" className="w-40">
          <SelectValue placeholder="Währung wählen" />
        </SelectTrigger>
        <SelectContent>
          {availableTargetCurrencies.map(currency => (
            <SelectItem key={currency.code} value={currency.code}>
              {getCurrencySymbol(currency.code)} {currency.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CurrencySelector;
