
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import ApiKeyInput from './ApiKeyInput';
import OpenAiKeyInput from './OpenAiKeyInput';

interface ApiKeyWarningsProps {
  hasApiKey: boolean;
  hasGptApiKey: boolean;
}

const ApiKeyWarnings: React.FC<ApiKeyWarningsProps> = ({ hasApiKey, hasGptApiKey }) => {
  return (
    <>
      {!hasApiKey && (
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
      
      {hasApiKey && !hasGptApiKey && (
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
