
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { setOpenAiApiKey } from '@/api/openaiApi';
import { useToast } from '@/hooks/use-toast';
import { InfoIcon } from 'lucide-react';

const OpenAiKeyInput: React.FC = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Prüfen, ob bereits ein Key im LocalStorage existiert
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey('••••••••••••••••••••••••');
      setIsSaved(true);
    }
    
    // Event-Listener für Storage-Änderungen hinzufügen
    const handleStorageChange = (e) => {
      if (e.key === 'openai_api_key') {
        const newValue = e.newValue;
        if (newValue) {
          setApiKey('••••••••••••••••••••••••');
          setIsSaved(true);
        } else {
          setApiKey('');
          setIsSaved(false);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSaveKey = () => {
    if (!apiKey || apiKey.trim() === '') {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen API-Key ein.",
        variant: "destructive",
      });
      return;
    }

    // Einfache Validierung für OpenAI API-Keys
    if (!apiKey.startsWith('sk-')) {
      toast({
        title: "Fehler",
        description: "Der API-Key scheint ungültig zu sein. OpenAI API-Keys beginnen mit 'sk-'.",
        variant: "destructive",
      });
      return;
    }

    try {
      setOpenAiApiKey(apiKey.trim());
      toast({
        title: "API-Key gespeichert",
        description: "Ihr OpenAI API-Key wurde erfolgreich gespeichert.",
      });
      setApiKey('••••••••••••••••••••••••');
      setIsSaved(true);
      
      // Storage-Event manuell auslösen
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'openai_api_key',
        newValue: 'set'
      }));
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Der API-Key konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveKey = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    setIsSaved(false);
    
    // Storage-Event manuell auslösen
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'openai_api_key',
      newValue: null
    }));
    
    toast({
      title: 'API-Key entfernt',
      description: 'Ihr OpenAI API-Key wurde entfernt.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>OpenAI API-Key konfigurieren</CardTitle>
        <CardDescription>
          GPT-Integration für erweiterte Buffett-Kriterien-Analyse
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Für eine tiefgreifende Analyse nach Warren Buffetts Kriterien benötigen wir GPT. 
              Bitte fügen Sie Ihren OpenAI API-Key ein, um Zugang zu allen 11 Buffett-Kriterien zu erhalten.
            </p>
          </div>
          <Input
            type="password"
            placeholder={isSaved ? "API-Key gespeichert" : "sk-..."}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-2"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {isSaved && (
          <Button variant="outline" onClick={handleRemoveKey}>
            API-Key entfernen
          </Button>
        )}
        <Button onClick={handleSaveKey} className={isSaved ? "ml-auto" : "w-full"}>
          {isSaved ? "API-Key aktualisieren" : "API-Key speichern"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OpenAiKeyInput;
