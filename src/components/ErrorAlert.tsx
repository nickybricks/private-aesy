
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useStock } from '@/context/StockContext';

const ErrorAlert: React.FC = () => {
  const { error } = useStock();

  if (!error) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Fehler bei der Datenabfrage</AlertTitle>
      <AlertDescription>
        <p>{error}</p>
        <p className="mt-2 text-sm">
          {error.includes('API-Key') ? (
            <>
              Bitte stellen Sie sicher, dass ein gültiger API-Schlüssel verwendet wird. 
              Es wird ein gültiger API-Schlüssel für den Zugriff auf Finanzdaten benötigt.
            </>
          ) : (
            'Bitte überprüfen Sie das eingegebene Aktiensymbol oder versuchen Sie es später erneut.'
          )}
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default ErrorAlert;
