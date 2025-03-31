
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, AlertTriangle, AlertCircle } from 'lucide-react';
import ApiKeyInput from './ApiKeyInput';
import OpenAiKeyInput from './OpenAiKeyInput';

interface ApiKeyWarningsProps {
  hasApiKey: boolean;
  hasGptApiKey: boolean;
  hasApiKeyError?: boolean;
  isRateLimitError?: boolean;
}

const ApiKeyWarnings: React.FC<ApiKeyWarningsProps> = ({ 
  hasApiKey, 
  hasGptApiKey,
  hasApiKeyError = false,
  isRateLimitError = false
}) => {
  return (
    <>
      {/* API-Key-Fehlermeldung anzeigen, wenn ein Fehler erkannt wurde */}
      {hasApiKeyError && (
        <div className="mb-8 animate-fade-in">
          <Alert variant="destructive" className="mb-4">
            {isRateLimitError ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>
              {isRateLimitError ? 'API-Limit überschritten' : 'API-Key Problem erkannt'}
            </AlertTitle>
            <AlertDescription>
              {isRateLimitError ? (
                <>
                  Das tägliche Limit für kostenlose API-Anfragen wurde erreicht (maximal 250 pro Tag).
                  Das Limit wird täglich um 00:00 Uhr UTC (01:00/02:00 Uhr MEZ/MESZ) zurückgesetzt.
                </>
              ) : (
                <>
                  Es scheint ein Problem mit Ihrem Financial Modeling Prep API-Key zu geben. 
                  Bitte überprüfen Sie Ihren API-Key unten und stellen Sie sicher, dass er gültig ist.
                </>
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
