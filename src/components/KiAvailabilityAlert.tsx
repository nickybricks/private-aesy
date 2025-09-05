
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface KiAvailabilityAlertProps {
  gptAvailable: boolean;
}

const KiAvailabilityAlert: React.FC<KiAvailabilityAlertProps> = ({ gptAvailable }) => {
  if (gptAvailable) {
    return null;
  }

  return (
    <div className="mb-8 animate-fade-in">
      <Alert className="mb-4 bg-yellow-50 border-yellow-200">
        <InfoIcon className="h-4 w-4 text-yellow-500" />
        <AlertTitle className="text-yellow-700">KI-Analyse konfigurieren</AlertTitle>
        <AlertDescription className="text-yellow-600">
          Die KI-API ist noch nicht vollständig konfiguriert. Bitte stellen Sie sicher, dass alle erforderlichen API-Keys konfiguriert sind.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default KiAvailabilityAlert;
