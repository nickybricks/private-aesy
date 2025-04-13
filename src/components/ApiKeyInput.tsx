
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const ApiKeyInput = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Buffett Benchmark Tool bereit</CardTitle>
        <CardDescription>
          Das Tool ist vollständig konfiguriert und einsatzbereit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 rounded">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="font-medium text-green-800">System bereit</p>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Sie können sofort mit der Analyse von Aktien beginnen. Geben Sie einfach ein Aktiensymbol in das Suchfeld ein.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyInput;
