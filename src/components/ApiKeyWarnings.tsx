
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, AlertTriangle, AlertCircle, WifiOff, CheckCircle2 } from 'lucide-react';
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
    if (!errorMessage) return 'unknown';
    
    const errorLower = errorMessage.toLowerCase();
    
    if (isRateLimitError || errorLower.includes('limit') || errorLower.includes('rate limit')) {
      return 'rate_limit';
    } else if (errorLower.includes('network') || errorLower.includes('verbindung') || errorLower.includes('timeout') || errorLower.includes('error fetching')) {
      return 'network';
    } else if (errorLower.includes('ungültig') || errorLower.includes('invalid') || 
               errorLower.includes('falsch') || errorLower.includes('wrong') ||
               errorLower.includes('abgelehnt') || errorLower.includes('denied')) {
      return 'invalid_key';
    } else {
      return 'unknown';
    }
  };
  
  const errorType = determineErrorType();

  // API-Key Erfolgs-Status anzeigen, wenn ein Key vorhanden und kein Fehler existiert
  const showApiKeySuccess = hasApiKey && !hasApiKeyError;

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
                  Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es in einigen Minuten erneut.
                </>
              )}
              
              {errorType === 'invalid_key' && (
                <>
                  Der eingegebene API-Key scheint ungültig zu sein oder wurde vom Dienst abgelehnt.
                  Bitte überprüfen Sie, ob Ihr Financial Modeling Prep API-Key korrekt eingegeben wurde (keine Leerzeichen am Anfang oder Ende).
                </>
              )}
              
              {errorType === 'unknown' && (
                <>
                  Es ist ein Problem mit der API-Verbindung aufgetreten. Dies könnte verschiedene Ursachen haben:
                  <ul className="list-disc ml-5 mt-2">
                    <li>Der API-Key ist möglicherweise falsch oder abgelaufen</li>
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
          
          <ApiKeyInput showErrorState={true} errorType={errorType} />
        </div>
      )}
      
      {/* API-Key Erfolgs-Status anzeigen */}
      {showApiKeySuccess && (
        <div className="mb-6 animate-fade-in">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">API-Key aktiv</AlertTitle>
            <AlertDescription className="text-green-700">
              Ihr Financial Modeling Prep API-Key ist konfiguriert und bereit für die Verwendung.
              <p className="mt-1 text-xs">
                <span className="font-medium">Hinweis:</span> Der kostenlose API-Plan erlaubt maximal 250 Anfragen pro Tag.
              </p>
            </AlertDescription>
          </Alert>
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
