
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { setOpenAiApiKey } from '@/api/openaiApi';
import { useToast } from '@/hooks/use-toast';
import { InfoIcon } from 'lucide-react';

const OpenAiKeyInput: React.FC = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');

  const handleSaveKey = () => {
    if (!apiKey || apiKey.trim() === '') {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen API-Key ein.",
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
      setApiKey('');
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Der API-Key konnte nicht gespeichert werden.",
        variant: "destructive",
      });
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
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-2"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveKey} className="w-full">API-Key speichern</Button>
      </CardFooter>
    </Card>
  );
};

export default OpenAiKeyInput;
