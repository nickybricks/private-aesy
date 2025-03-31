
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
  const [isObfuscated, setIsObfuscated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Beim ersten Laden der Komponente nach API-Key suchen
    checkForApiKey();
  }, []);

  // Funktion zum Überprüfen des API-Keys im localStorage
  const checkForApiKey = () => {
    try {
      const savedKey = localStorage.getItem('fmp_api_key');
      if (savedKey && savedKey.trim().length > 0) {
        // Wenn ein Key existiert, zeige ihn in obfuskierter Form an
        setApiKey(isObfuscated ? '••••••••••••••••••••••••' : savedKey);
        setIsSaved(true);
        if (!isObfuscated) {
          setIsObfuscated(true);
        }
      } else {
        setApiKey('');
        setIsSaved(false);
        setIsObfuscated(false);
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      setApiKey('');
      setIsSaved(false);
      setIsObfuscated(false);
    }
  };

  const validateApiKey = async (key: string) => {
    try {
      setIsValidating(true);
      // Einfacher Validierungsversuch durch Aufrufen einer FMP API-Endpunkt
      const response = await fetch(`https://financialmodelingprep.com/api/v3/stock/list?apikey=${key}`);
      const data = await response.json();
      
      if (response.status === 200 && Array.isArray(data) && data.length > 0) {
        return true;
      } else if (response.status === 403 || (data && data.error)) {
        return false;
      }
      
      return true; // Bei Unklarheit nehmen wir an, dass der API-Key gültig ist
    } catch (error) {
      console.error('API key validation error:', error);
      // Bei Netzwerkfehlern nehmen wir an, dass der Schlüssel möglicherweise gültig ist
      return true;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey || apiKey.trim() === '' || apiKey === '••••••••••••••••••••••••') {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen gültigen API-Key ein.',
        variant: 'destructive',
      });
      return;
    }

    const trimmedKey = apiKey.trim();
    
    try {
      // Optional: API-Key validieren
      const isValid = await validateApiKey(trimmedKey);
      
      if (!isValid) {
        toast({
          title: 'Ungültiger API-Key',
          description: 'Der eingegebene API-Key scheint ungültig zu sein. Bitte überprüfen Sie ihn und versuchen Sie es erneut.',
          variant: 'destructive',
        });
        return;
      }
      
      localStorage.setItem('fmp_api_key', trimmedKey);
      setIsSaved(true);
      setApiKey('••••••••••••••••••••••••');
      setIsObfuscated(true);
      
      // Benutzerdefiniertes Event auslösen, um andere Komponenten zu benachrichtigen
      window.dispatchEvent(new CustomEvent('fmp_api_key_change', {
        detail: { action: 'save' }
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
  };

  const handleRemoveApiKey = () => {
    try {
      localStorage.removeItem('fmp_api_key');
      setApiKey('');
      setIsSaved(false);
      setIsObfuscated(false);
      
      // Benutzerdefiniertes Event auslösen
      window.dispatchEvent(new CustomEvent('fmp_api_key_change', {
        detail: { action: 'remove' }
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

  const handleInputFocus = () => {
    if (isSaved && isObfuscated) {
      setApiKey('');
      setIsObfuscated(false);
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
              onChange={(e) => {
                setApiKey(e.target.value);
                if (isObfuscated) {
                  setIsObfuscated(false);
                }
              }}
              onFocus={handleInputFocus}
              placeholder="Ihren API-Key hier eingeben"
              className="w-full"
              disabled={isValidating}
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
          <Button variant="outline" onClick={handleRemoveApiKey} disabled={isValidating}>
            API-Key entfernen
          </Button>
        )}
        <Button onClick={handleSaveApiKey} disabled={isValidating}>
          {isValidating ? 'Validiere...' : isSaved ? "API-Key aktualisieren" : "API-Key speichern"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyInput;
