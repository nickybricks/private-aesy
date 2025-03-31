
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, AlertTriangle, AlertCircle, Network, WifiOff } from 'lucide-react';
import ApiKeyInput from './ApiKeyInput';
import OpenAiKeyInput from './OpenAiKeyInput';

interface ApiKeyWarningsProps {
  hasApiKey: boolean;
  hasGptApiKey: boolean;
  hasApiKeyError?: boolean;
  isRateLimitError?: boolean;
  errorMessage?: string;
}

const ApiKeyWarnings: React.FC<ApiKeyWarningsProps> = ({ 
  hasApiKey, 
  hasGptApiKey,
  hasApiKeyError = false,
  isRateLimitError = false,
  errorMessage = ''
}) => {
  // Funktion zur Ermittlung des wahrscheinlichen Fehlergrunds
  const determineErrorType = () => {
    const errorLower = errorMessage.toLowerCase();
    
    if (isRateLimitError || errorLower.includes('limit') || errorLower.includes('rate limit')) {
      return 'rate_limit';
    } else if (errorLower.includes('network') || errorLower.includes('verbindung') || errorLower.includes('timeout')) {
      return 'network';
    } else if (errorLower.includes('ungültig') || errorLower.includes('invalid') || 
               errorLower.includes('falsch') || errorLower.includes('wrong')) {
      return 'invalid_key';
    } else {
      return 'unknown';
    }
  };
  
  const errorType = determineErrorType();

  return (
    <>
      {/* API-Key-Fehlermeldung anzeigen, wenn ein Fehler erkannt wurde */}
      {hasApiKeyError && (
        <div className="mb-8 animate-fade-in">
          <Alert variant="destructive" className="mb-4">
            {errorType === 'rate_limit' && <AlertCircle className="h-4 w-4" />}
            {errorType === 'network' && <WifiOff className="h-4 w-4" />}
            {(errorType === 'invalid_key' || errorType === 'unknown') && <AlertTriangle className="h-4 w-4" />}
            
            <AlertTitle>
              {errorType === 'rate_limit' && 'API-Limit überschritten'}
              {errorType === 'network' && 'Netzwerkfehler'}
              {errorType === 'invalid_key' && 'API-Key ungültig'}
              {errorType === 'unknown' && 'API-Verbindungsproblem'}
            </AlertTitle>
            
            <AlertDescription>
              {errorType === 'rate_limit' && (
                <>
                  Das tägliche Limit für kostenlose API-Anfragen wurde erreicht (maximal 250 pro Tag).
                  Das Limit wird täglich um 00:00 Uhr UTC (01:00/02:00 Uhr MEZ/MESZ) zurückgesetzt.
                </>
              )}
              
              {errorType === 'network' && (
                <>
                  Es scheint ein Netzwerkproblem bei der Verbindung zur Financial Modeling Prep API zu geben.
                  Bitte überprüfen Sie Ihre Internetverbindung oder versuchen Sie es später erneut.
                </>
              )}
              
              {errorType === 'invalid_key' && (
                <>
                  Der eingegebene API-Key scheint ungültig zu sein oder wurde vom Dienst abgelehnt.
                  Bitte überprüfen Sie Ihren Financial Modeling Prep API-Key und stellen Sie sicher, dass er korrekt ist.
                </>
              )}
              
              {errorType === 'unknown' && (
                <>
                  Es ist ein Problem mit der API-Verbindung aufgetreten. Dies könnte verschiedene Ursachen haben:
                  <ul className="list-disc ml-5 mt-2">
                    <li>Der API-Key ist falsch oder abgelaufen</li>
                    <li>Ein temporäres Problem mit dem Financial Modeling Prep Server</li>
                    <li>Ihr Konto hat möglicherweise Einschränkungen</li>
                  </ul>
                </>
              )}
              
              {errorMessage && errorType === 'unknown' && (
                <p className="mt-2 text-sm italic">Fehlermeldung: {errorMessage}</p>
              )}
            </AlertDescription>
          </Alert>
          
          <ApiKeyInput />
        </div>
      )}
      
      {/* Immer den FMP API-Key-Bereich anzeigen, wenn kein Key vorhanden ist */}
      {!hasApiKey && !hasApiKeyError && (
        <div className="mb-8 animate-fade-in">
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>API-Key erforderlich</AlertTitle>
            <AlertDescription>
              Um das Buffett Benchmark Tool nutzen zu können, benötigen Sie einen API-Key von Financial Modeling Prep.
              Bitte konfigurieren Sie Ihren API-Key unten.
            </AlertDescription>
          </Alert>
          
          <ApiKeyInput />
        </div>
      )}
      
      {/* OpenAI API-Key nur anzeigen, wenn FMP-Key vorhanden, aber kein GPT-Key */}
      {hasApiKey && !hasGptApiKey && !hasApiKeyError && (
        <div className="mb-8 animate-fade-in">
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>GPT-Integration (optional)</AlertTitle>
            <AlertDescription>
              Für eine erweiterte Analyse aller 11 Buffett-Kriterien empfehlen wir die Integration mit OpenAI GPT.
              Dies ermöglicht tiefere Einblicke zu den qualitativen Aspekten wie Geschäftsmodell, Management und langfristige Perspektiven.
            </AlertDescription>
          </Alert>
          
          <OpenAiKeyInput />
        </div>
      )}
    </>
  );
};

export default ApiKeyWarnings;
