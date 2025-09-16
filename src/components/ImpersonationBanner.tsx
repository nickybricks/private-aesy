import React from 'react';
import { useImpersonation } from '@/hooks/useImpersonation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, X } from 'lucide-react';

const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, impersonatedUserEmail, stopImpersonation } = useImpersonation();

  if (!isImpersonating) return null;

  return (
    <Alert className="border-warning bg-warning/10 mb-4">
      <User className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          <strong>Admin-Modus:</strong> Du siehst die Daten von {impersonatedUserEmail}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={stopImpersonation}
          className="ml-4"
        >
          <X className="h-4 w-4 mr-1" />
          Beenden
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default ImpersonationBanner;