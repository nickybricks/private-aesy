
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
  const [isUsingDefault, setIsUsingDefault] = useState(true);

  useEffect(() => {
    const savedKey = localStorage.getItem('fmp_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsSaved(true);
      setIsUsingDefault(false);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('fmp_api_key', apiKey.trim());
      setIsSaved(true);
      setIsUsingDefault(false);
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
    setIsUsingDefault(true);
    toast({
      title: 'Eigener API-Key entfernt',
      description: 'Der Standard-API-Key wird jetzt verwendet.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API-Key konfigurieren</CardTitle>
        <CardDescription>
          Das Buffett Benchmark Tool verwendet bereits einen Standard-API-Key für Financial Modeling Prep.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isUsingDefault && !isSaved && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 rounded">
              <p className="font-medium text-green-800">Standard-API-Key aktiv</p>
              <p className="text-sm text-green-700">
                Ein funktionierender API-Key ist bereits konfiguriert. Sie können optional Ihren eigenen API-Key eingeben, 
                wenn Sie mehr API-Anfragen benötigen.
              </p>
            </div>
          )}
          
          <div>
            <label htmlFor="api-key" className="text-sm font-medium mb-2 block">
              Eigener Financial Modeling Prep API-Key (optional)
            </label>
            <Input
              id="api-key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ihren API-Key hier eingeben (optional)"
              className="w-full"
            />
          </div>
          <div className="text-sm text-buffett-subtext border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium mb-2">So erhalten Sie einen eigenen API-Key:</h4>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Besuchen Sie <a href="https://financialmodelingprep.com/register" target="_blank" rel="noopener noreferrer" className="text-buffett-blue hover:underline">financialmodelingprep.com/register</a></li>
              <li>Erstellen Sie ein kostenloses Konto</li>
              <li>Nach der Anmeldung finden Sie Ihren API-Key im Dashboard</li>
              <li>Kopieren Sie den Schlüssel und fügen Sie ihn hier ein</li>
            </ol>
            <p className="mt-2">Der kostenlose Plan ermöglicht bereits einige API-Aufrufe pro Tag.</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {isSaved && (
          <Button variant="outline" onClick={handleRemoveApiKey}>
            Eigenen API-Key entfernen
          </Button>
        )}
        <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
          {isSaved ? 'API-Key aktualisieren' : 'API-Key speichern'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyInput;
