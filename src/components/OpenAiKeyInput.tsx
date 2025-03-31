
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
  const [isObfuscated, setIsObfuscated] = useState(false);

  useEffect(() => {
    // Check if an API key exists in localStorage
    checkForApiKey();
    
    // Add event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'openai_api_key') {
        checkForApiKey();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Function to check for API key in localStorage
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

    // Simple validation for OpenAI API keys
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
      setIsObfuscated(true);
      
      // Manually trigger storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'openai_api_key',
        newValue: 'set'
      }));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      toast({
        title: "Fehler",
        description: "Der API-Key konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveKey = () => {
    try {
      localStorage.removeItem('openai_api_key');
      setApiKey('');
      setIsSaved(false);
      setIsObfuscated(false);
      
      // Manually trigger storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'openai_api_key',
        newValue: null
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
            onChange={(e) => {
              setApiKey(e.target.value);
              if (isObfuscated) {
                setIsObfuscated(false);
              }
            }}
            onFocus={handleInputFocus}
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
