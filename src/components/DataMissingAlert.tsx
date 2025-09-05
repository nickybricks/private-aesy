
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useStock } from '@/context/StockContext';

const DataMissingAlert: React.FC = () => {
  const { hasCriticalDataMissing, stockInfo } = useStock();

  if (!hasCriticalDataMissing || !stockInfo) {
    return null;
  }

  return (
    <div className="mb-10">
      <Alert className="bg-red-50 border-red-200">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertTitle className="text-red-700">Analyse nicht möglich</AlertTitle>
        <AlertDescription className="text-red-600">
          <p className="mb-3">
            Für {stockInfo.ticker} liegen aktuell nicht genügend Daten für eine vollständige Bewertung vor.
            Die Analyse benötigt mindestens einen aktuellen Kurs und Marktkapitalisierung.
          </p>
          <p>
            Bitte wählen Sie ein anderes Symbol mit vollständigeren Daten, um eine aussagekräftige Analyse nach bewährten Kriterien zu erhalten.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DataMissingAlert;
