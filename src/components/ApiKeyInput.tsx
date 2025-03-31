
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

  useEffect(() => {
    // Check if an API key exists in localStorage
    checkForApiKey();
    
    // Add event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'fmp_api_key') {
        checkForApiKey();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Function to check for API key in localStorage
  const checkForApiKey = () => {
    try {
      const savedKey = localStorage.getItem('fmp_api_key');
      if (savedKey) {
        setApiKey(savedKey);
        setIsSaved(true);
      } else {
        setApiKey('');
        setIsSaved(false);
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      setApiKey('');
      setIsSaved(false);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      try {
        localStorage.setItem('fmp_api_key', apiKey.trim());
        setIsSaved(true);
        
        // Manually trigger storage event for same-window updates
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'fmp_api_key',
          newValue: apiKey.trim()
        }));
        
        toast({
          title: 'API-Key gespeichert',
          description: 'Ihr API-Key wurde erfolgreich gespeichert und wird für alle zukünftigen Anfragen verwendet.',
        });
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        toast({
          title: 'Fehler',
          description: 'Der API-Key konnte nicht gespeichert werden. Möglicherweise blockiert Ihr Browser das Speichern von Daten.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen gültigen API-Key ein.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveApiKey = () => {
    try {
      localStorage.removeItem('fmp_api_key');
      setApiKey('');
      setIsSaved(false);
      
      // Manually trigger storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'fmp_api_key',
        newValue: null
      }));
      
      toast({
        title: 'API-Key entfernt',
        description: 'Ihr API-Key wurde entfernt.',
      });
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      toast({
        title: 'Fehler',
        description: 'Der API-Key konnte nicht entfernt werden.',
        variant: 'destructive',
      });
    }
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
          <div className="text-sm text-buffett-subtext border p-4 rounded-md bg-gray-50">
            <h4 className="font-medium mb-2">So erhalten Sie einen API-Key:</h4>
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
