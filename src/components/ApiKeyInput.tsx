
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

const ApiKeyInput = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API-Zugang konfiguriert</CardTitle>
        <CardDescription>
          Das Buffett Benchmark Tool hat einen integrierten API-Zugang für Financial Modeling Prep.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 rounded">
            <p className="font-medium text-green-800">API-Zugang aktiv</p>
            <p className="text-sm text-green-700">
              Ein funktionierender API-Zugang ist bereits im Tool integriert.
              Sie können sofort mit der Analyse von Aktien beginnen.
            </p>
          </div>
          
          <div className="text-sm text-buffett-subtext border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium mb-2">Informationen zur API:</h4>
            <p>Das Tool verwendet die Financial Modeling Prep API für Finanzdaten.</p>
            <p className="mt-2">
              <a 
                href="https://financialmodelingprep.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-buffett-blue hover:underline flex items-center gap-1"
              >
                Mehr über Financial Modeling Prep <ExternalLink size={14} />
              </a>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyInput;
