
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';

const DEFAULT_FMP_API_KEY = 'uxE1jVMvI8QQen0a4AEpLFTaqf3KQO0y';

const ApiKeyInput: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showInput, setShowInput] = useState<boolean>(false);
  const [useDefaultKey, setUseDefaultKey] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has a saved API key
    const savedKey = localStorage.getItem('fmp_api_key');
    
    if (savedKey) {
      setApiKey(savedKey);
      setUseDefaultKey(false);
    } else {
      // Set default key in localStorage if no user key exists
      localStorage.setItem('fmp_api_key', DEFAULT_FMP_API_KEY);
    }
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('fmp_api_key', apiKey.trim());
      toast({
        title: "API-Schlüssel gespeichert",
        description: "Ihr persönlicher API-Schlüssel wurde gespeichert und wird für zukünftige Anfragen verwendet.",
      });
      setShowInput(false);
    } else {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen gültigen API-Schlüssel ein.",
        variant: "destructive"
      });
    }
  };

  const handleToggleDefaultKey = (checked: boolean) => {
    setUseDefaultKey(checked);
    
    if (checked) {
      localStorage.setItem('fmp_api_key', DEFAULT_FMP_API_KEY);
      toast({
        title: "Standard API-Schlüssel aktiviert",
        description: "Der Standard API-Schlüssel wird jetzt verwendet. Beachten Sie, dass dies Ratenbegrenzungen haben kann.",
      });
    } else {
      if (apiKey.trim() && apiKey !== DEFAULT_FMP_API_KEY) {
        localStorage.setItem('fmp_api_key', apiKey);
      } else {
        setShowInput(true);
      }
    }
  };

  const handleReset = () => {
    localStorage.setItem('fmp_api_key', DEFAULT_FMP_API_KEY);
    setApiKey(DEFAULT_FMP_API_KEY);
    setUseDefaultKey(true);
    toast({
      title: "Zurückgesetzt",
      description: "Der API-Schlüssel wurde auf den Standardwert zurückgesetzt.",
    });
    setShowInput(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="use-default-key"
            checked={useDefaultKey}
            onCheckedChange={handleToggleDefaultKey}
          />
          <Label htmlFor="use-default-key" className="cursor-pointer">Standard API-Schlüssel verwenden</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={16} className="text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Der Standard-Schlüssel ist für alle Benutzer verfügbar, kann aber Nutzungslimits haben. 
                  Für intensive Nutzung empfehlen wir einen eigenen API-Schlüssel.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {!useDefaultKey && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowInput(!showInput)}
          >
            {showInput ? "Verbergen" : "API-Schlüssel ändern"}
          </Button>
        )}
      </div>

      {showInput && (
        <div className="space-y-2">
          <Alert>
            <AlertDescription>
              Geben Sie Ihren persönlichen Financial Modeling Prep API-Schlüssel ein. Sie können einen kostenlosen Schlüssel auf 
              <a href="https://financialmodelingprep.com/developer/docs/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mx-1">
                financialmodelingprep.com
              </a>
              erhalten.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ihr FMP API-Schlüssel"
              className="flex-1"
            />
            <Button onClick={handleSaveKey}>Speichern</Button>
            <Button variant="outline" onClick={handleReset}>Zurücksetzen</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyInput;
