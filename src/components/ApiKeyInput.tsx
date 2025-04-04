
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const ApiKeyInput = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API-Key Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="h-6 w-6" />
          <span className="font-medium">Der API-Key ist bereits konfiguriert</span>
        </div>
        <p className="mt-4 text-sm text-buffett-subtext">
          Dieser Schlüssel ermöglicht den Zugriff auf Finanzdaten von Financial Modeling Prep.
          Sie müssen nichts weiter tun, um das Buffett Benchmark Tool zu nutzen.
        </p>
      </CardContent>
    </Card>
  );
};

export default ApiKeyInput;
