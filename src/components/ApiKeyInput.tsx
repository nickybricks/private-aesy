
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink } from 'lucide-react';

const ApiKeyInput = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Lade gespeicherten API-Key beim Start
  useEffect(() => {
    const savedKey = localStorage.getItem('fmp_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsSaved(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('fmp_api_key', apiKey.trim());
      setIsSaved(true);
      toast({
        title: 'API-Key gespeichert',
        description: 'Ihr API-Key wurde erfolgreich gespeichert und wird für alle zukünftigen Anfragen verwendet.',
      });
    } else {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen gültigen API-Key ein.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem('fmp_api_key');
    setApiKey('');
    setIsSaved(false);
    toast({
      title: 'API-Key entfernt',
      description: 'Ihr API-Key wurde entfernt.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API-Key konfigurieren</CardTitle>
        <CardDescription>
          Das Buffett Benchmark Tool benötigt einen gültigen API-Key, um Finanzdaten abzurufen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="api-key" className="text-sm font-medium mb-2 block">
              Financial Modeling Prep API-Key
            </label>
            <Input
              id="api-key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ihren API-Key hier eingeben"
              className="w-full"
            />
          </div>
          <div className="text-sm text-buffett-subtext">
            <p className="mb-2">
              Sie können einen kostenlosen API-Key bei Financial Modeling Prep erhalten:
            </p>
            <a 
              href="https://financialmodelingprep.com/developer/docs/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-buffett-blue hover:underline"
            >
              Zu Financial Modeling Prep gehen <ExternalLink size={14} className="ml-1" />
            </a>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {isSaved && (
          <Button variant="outline" onClick={handleRemoveApiKey}>
            API-Key entfernen
          </Button>
        )}
        <Button onClick={handleSaveApiKey}>
          API-Key speichern
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyInput;
