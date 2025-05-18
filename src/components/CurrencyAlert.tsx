
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { needsCurrencyConversion } from '@/utils/currencyConverter';

interface CurrencyAlertProps {
  reportedCurrency?: string;
  stockCurrency?: string;
}

const CurrencyAlert: React.FC<CurrencyAlertProps> = ({ reportedCurrency, stockCurrency }) => {
  if (!stockCurrency || !reportedCurrency || !needsCurrencyConversion(reportedCurrency, stockCurrency)) {
    return null;
  }

  return (
    <Alert className="mb-4 bg-yellow-50 border-yellow-200">
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
      <AlertTitle className="text-yellow-700">Währungsumrechnung</AlertTitle>
      <AlertDescription className="text-yellow-600">
        Wenn Finanzkennzahlen (z. B. Umsatz, FCF, EBIT) in einer anderen Währung angegeben sind als die Kurswährung der Aktie, werden diese intern auf die Kurswährung umgerechnet.
      </AlertDescription>
    </Alert>
  );
};

export default CurrencyAlert;
