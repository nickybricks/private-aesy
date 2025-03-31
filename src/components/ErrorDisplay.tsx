
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  // Determine specific error type to provide better guidance
  const isApiKeyError = error.includes('API-Key') || error.includes('apikey');
  const isRateLimitError = error.includes('Rate limit') || error.includes('Limit exceeded');
  const isDataNotFoundError = error.includes('Keine Daten gefunden');
  
  return (
    <Alert variant="destructive" className="mb-6">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Fehler bei der Datenabfrage</AlertTitle>
      <AlertDescription>
        <p>{error}</p>
        <p className="mt-2 text-sm">
          {isApiKeyError ? (
            <>
              Bitte stellen Sie sicher, dass ein gültiger API-Schlüssel verwendet wird. 
              Die Financial Modeling Prep API benötigt einen gültigen API-Schlüssel, den Sie
              unter <a href="https://financialmodelingprep.com/developer/docs/" target="_blank" rel="noopener noreferrer" className="underline">financialmodelingprep.com</a> kostenlos erhalten können.
            </>
          ) : isRateLimitError ? (
            <>
              Sie haben das API-Anfragelimit erreicht. Bei der kostenlosen Version von Financial Modeling Prep 
              gibt es täglich eine begrenzte Anzahl von Anfragen. Bitte versuchen Sie es später erneut oder
              erwägen Sie ein Upgrade des API-Plans.
            </>
          ) : isDataNotFoundError ? (
            'Bitte überprüfen Sie das eingegebene Aktiensymbol. Es konnten keine Daten für dieses Symbol gefunden werden.'
          ) : (
            'Bitte überprüfen Sie Ihre Internetverbindung und API-Schlüssel oder versuchen Sie es später erneut.'
          )}
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default ErrorDisplay;
