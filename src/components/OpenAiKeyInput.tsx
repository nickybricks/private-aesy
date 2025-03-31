
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { InfoIcon, KeyRound, ShieldCheck } from 'lucide-react';

const OpenAiKeyInput: React.FC = () => {
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
      const savedKey = localStorage.getItem('openai_api_key');
      if (savedKey) {
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

  const handleSaveKey = () => {
    if (!apiKey || apiKey.trim() === '' || apiKey === '••••••••••••••••••••••••') {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen API-Key ein.",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);

    // Einfache Validierung für OpenAI API-Keys
    if (!apiKey.startsWith('sk-')) {
      toast({
        title: "Fehler",
        description: "Der API-Key scheint ungültig zu sein. OpenAI API-Keys beginnen mit 'sk-'.",
        variant: "destructive",
      });
      setIsValidating(false);
      return;
    }

    try {
      localStorage.setItem('openai_api_key', apiKey.trim());
      setApiKey('••••••••••••••••••••••••');
      setIsSaved(true);
      setIsObfuscated(true);
      
      // Benutzerdefiniertes Event auslösen
      window.dispatchEvent(new CustomEvent('openai_api_key_change', {
        detail: { action: 'save' }
      }));
      
      toast({
        title: "API-Key gespeichert",
        description: "Ihr OpenAI API-Key wurde erfolgreich gespeichert.",
      });
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      toast({
        title: "Fehler",
        description: "Der API-Key konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveKey = () => {
    try {
      localStorage.removeItem('openai_api_key');
      setApiKey('');
      setIsSaved(false);
      setIsObfuscated(false);
      
      // Benutzerdefiniertes Event auslösen
      window.dispatchEvent(new CustomEvent('openai_api_key_change', {
        detail: { action: 'remove' }
      }));
      
      toast({
        title: 'API-Key entfernt',
        description: 'Ihr OpenAI API-Key wurde entfernt.',
      });
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      toast({
        title: "Fehler",
        description: "Der API-Key konnte nicht entfernt werden.",
        variant: "destructive",
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
          OpenAI API-Key konfigurieren
        </CardTitle>
        <CardDescription>
          GPT-Integration für erweiterte Buffett-Kriterien-Analyse
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isSaved && (
            <Alert variant="default" className="mb-2 border-green-200 bg-green-50">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">OpenAI API-Key aktiv</AlertTitle>
              <AlertDescription className="text-green-700">
                Ihr OpenAI API-Key ist konfiguriert und bereit für die erweiterte Analyse.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-start space-x-2">
            <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Für eine tiefgreifende Analyse nach Warren Buffetts Kriterien benötigen wir GPT. 
              Bitte fügen Sie Ihren OpenAI API-Key ein, um Zugang zu allen 11 Buffett-Kriterien zu erhalten.
            </p>
          </div>
          <Input
            type={isObfuscated ? "password" : "text"}
            placeholder={isSaved ? "API-Key gespeichert" : "sk-..."}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              if (isObfuscated) {
                setIsObfuscated(false);
              }
            }}
            onFocus={handleInputFocus}
            className="mt-2"
            disabled={isValidating}
          />
          
          <div className="text-xs text-buffett-subtext border p-3 rounded-md bg-gray-50 mt-3">
            <p className="font-medium mb-1">OpenAI API-Keys erhalten:</p>
            <ol className="list-decimal ml-4 space-y-0.5">
              <li>Besuchen Sie <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" className="text-buffett-blue hover:underline">platform.openai.com</a></li>
              <li>Erstellen Sie ein Konto oder melden Sie sich an</li>
              <li>Gehen Sie zu "API Keys" und erstellen Sie einen neuen Schlüssel</li>
            </ol>
            <p className="mt-2 text-amber-700">
              <span className="font-medium">Hinweis:</span> Die OpenAI API ist kostenpflichtig, aber neue Konten erhalten in der Regel ein Startguthaben.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {isSaved && (
          <Button variant="outline" onClick={handleRemoveKey} disabled={isValidating}>
            API-Key entfernen
          </Button>
        )}
        <Button 
          onClick={handleSaveKey} 
          className={isSaved ? "ml-auto" : "w-full"}
          disabled={isValidating}
        >
          {isValidating ? "Validiere..." : (isSaved ? "API-Key aktualisieren" : "API-Key speichern")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OpenAiKeyInput;
