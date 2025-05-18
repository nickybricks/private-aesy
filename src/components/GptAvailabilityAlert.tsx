
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface GptAvailabilityAlertProps {
  gptAvailable: boolean;
}

const GptAvailabilityAlert: React.FC<GptAvailabilityAlertProps> = ({ gptAvailable }) => {
  if (gptAvailable) {
    return null;
  }

  return (
    <div className="mb-8 animate-fade-in">
      <Alert className="mb-4 bg-yellow-50 border-yellow-200">
        <InfoIcon className="h-4 w-4 text-yellow-500" />
        <AlertTitle className="text-yellow-700">OpenAI API-Key konfigurieren</AlertTitle>
        <AlertDescription className="text-yellow-600">
          Der OpenAI API-Key in der Datei <code className="bg-yellow-100 px-1 py-0.5 rounded">src/api/openaiApi.ts</code> ist noch nicht konfiguriert.
          Bitte öffnen Sie die Datei und ersetzen Sie den Platzhalter 'IHR-OPENAI-API-KEY-HIER' mit Ihrem tatsächlichen OpenAI API-Key.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default GptAvailabilityAlert;
