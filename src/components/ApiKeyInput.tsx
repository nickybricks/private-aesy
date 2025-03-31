
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, AlertTriangle, KeyRound, ShieldCheck } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { validateApiKey } from '@/api/stockApi';

const ApiKeyInput = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isObfuscated, setIsObfuscated] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Beim ersten Laden der Komponente nach API-Key suchen
    checkForApiKey();
    
    // Event-Listener für API-Key-Fehler
    const handleApiKeyError = (event: CustomEvent) => {
      if (event.detail && event.detail.error) {
        setKeyError(event.detail.error);
        setIsSaved(false);
      }
    };
    
    window.addEventListener('fmp_api_key_error', handleApiKeyError as EventListener);
    
    return () => {
      window.removeEventListener('fmp_api_key_error', handleApiKeyError as EventListener);
    };
  }, []);

  // Funktion zum Überprüfen des API-Keys im localStorage
  const checkForApiKey = () => {
    try {
      const savedKey = localStorage.getItem('fmp_api_key');
      if (savedKey) {
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

  const handleSaveApiKey = async () => {
    if (!apiKey || apiKey.trim() === '' || apiKey === '••••••••••••••••••••••••') {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen gültigen API-Key ein.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Validate API key format (basic check)
      if (apiKey.trim().length < 8) {
        toast({
          title: 'Fehler',
          description: 'Der API-Key scheint ungültig zu sein. Bitte überprüfen Sie Ihren Key.',
          variant: 'destructive',
        });
        return;
      }
      
      // Set validating state
      setIsValidating(true);
      setKeyError(null);
      
      // Validate the API key by making a test request
      try {
        const isValid = await validateApiKey(apiKey.trim());
        if (!isValid) {
          setKeyError('Der API-Key scheint ungültig zu sein oder hat keine ausreichenden Berechtigungen.');
          toast({
            title: 'Ungültiger API-Key',
            description: 'Der API-Key konnte nicht validiert werden. Bitte überprüfen Sie, ob der Key korrekt ist und über ausreichende Berechtigungen verfügt.',
            variant: 'destructive',
          });
          setIsValidating(false);
          return;
        }
      } catch (validationError) {
        if (validationError instanceof Error) {
          setKeyError(validationError.message);
          toast({
            title: 'Validierungsfehler',
            description: validationError.message,
            variant: 'destructive',
          });
        } else {
          setKeyError('Unbekannter Fehler bei der API-Key-Validierung');
          toast({
            title: 'Validierungsfehler',
            description: 'Es ist ein unbekannter Fehler bei der Validierung des API-Keys aufgetreten.',
            variant: 'destructive',
          });
        }
        setIsValidating(false);
        return;
      }
      
      localStorage.setItem('fmp_api_key', apiKey.trim());
      setIsSaved(true);
      setApiKey('••••••••••••••••••••••••');
      setIsObfuscated(true);
      setKeyError(null);
      
      // Benutzerdefiniertes Event auslösen, um andere Komponenten zu benachrichtigen
      window.dispatchEvent(new CustomEvent('fmp_api_key_change', {
        detail: { action: 'save' }
      }));
      
      toast({
        title: 'API-Key gespeichert',
        description: 'Ihr API-Key wurde erfolgreich validiert und gespeichert. Er wird für alle zukünftigen Anfragen verwendet.',
      });
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      toast({
        title: 'Fehler',
        description: 'Der API-Key konnte nicht gespeichert werden. Möglicherweise blockiert Ihr Browser das Speichern von Daten.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveApiKey = () => {
    try {
      localStorage.removeItem('fmp_api_key');
      setApiKey('');
      setIsSaved(false);
      setIsObfuscated(false);
      setKeyError(null);
      
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
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          API-Key konfigurieren
        </CardTitle>
        <CardDescription>
          Das Buffett Benchmark Tool benötigt einen gültigen API-Key, um Finanzdaten abzurufen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {keyError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>API-Key Fehler</AlertTitle>
              <AlertDescription>
                <p>{keyError}</p>
                <p className="mt-2">Bitte aktualisieren Sie Ihren API-Key oder registrieren Sie sich für einen neuen unter <a href="https://financialmodelingprep.com/developer/docs/" target="_blank" rel="noopener noreferrer" className="font-medium underline">financialmodelingprep.com</a>.</p>
              </AlertDescription>
            </Alert>
          )}

          {isSaved && !keyError && (
            <Alert variant="default" className="mb-4 border-green-200 bg-green-50">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">API-Key aktiv</AlertTitle>
              <AlertDescription className="text-green-700">
                Ihr API-Key ist konfiguriert und bereit für die Verwendung.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <label htmlFor="api-key" className="text-sm font-medium mb-2 block">
              Financial Modeling Prep API-Key {isValidating && <span className="text-xs text-muted-foreground ml-1">(Validierung läuft...)</span>}
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
            <div className="mt-3 p-2 border border-amber-200 bg-amber-50 rounded text-amber-800">
              <p className="text-xs font-medium">Wichtiger Hinweis:</p>
              <p className="text-xs mt-1">Mit dem kostenlosen Plan sind nur begrenzte API-Aufrufe pro Tag möglich. Falls Sie häufig die Fehlermeldung "API-Limit überschritten" erhalten, erwägen Sie ein Upgrade auf einen bezahlten Plan.</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {isSaved && (
          <Button variant="outline" onClick={handleRemoveApiKey} disabled={isValidating}>
            API-Key entfernen
          </Button>
        )}
        <Button 
          onClick={handleSaveApiKey} 
          className={isSaved ? "" : "w-full"} 
          disabled={isValidating}
        >
          {isValidating ? "Validiere..." : isSaved ? "API-Key aktualisieren" : "API-Key speichern"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyInput;
