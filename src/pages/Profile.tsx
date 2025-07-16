import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Settings, Key, Globe } from 'lucide-react';

const Profile = () => {
  const { toast } = useToast();
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('openai-api-key') || '');
  const [preferredCurrency, setPreferredCurrency] = useState(() => localStorage.getItem('preferred-currency') || 'EUR');

  const handleSaveApiKey = () => {
    if (openaiKey.trim()) {
      localStorage.setItem('openai-api-key', openaiKey.trim());
      toast({
        title: "API Key gespeichert",
        description: "Ihr OpenAI API Key wurde erfolgreich gespeichert.",
      });
    } else {
      localStorage.removeItem('openai-api-key');
      toast({
        title: "API Key entfernt",
        description: "Der OpenAI API Key wurde entfernt.",
      });
    }
  };

  const handleSaveCurrency = () => {
    localStorage.setItem('preferred-currency', preferredCurrency);
    toast({
      title: "Währung gespeichert",
      description: `Bevorzugte Währung wurde auf ${preferredCurrency} gesetzt.`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Profileinstellungen
        </h1>
        <p className="text-muted-foreground mt-2">
          Verwalten Sie Ihre API-Keys und persönlichen Einstellungen
        </p>
      </div>

      <div className="space-y-6">
        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Verwalten Sie Ihre API-Schlüssel für externe Services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSaveApiKey}>
                  Speichern
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Benötigt für erweiterte GPT-Analysen. Wird lokal in Ihrem Browser gespeichert.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Allgemeine Einstellungen
            </CardTitle>
            <CardDescription>
              Ihre persönlichen Präferenzen für die Anwendung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Bevorzugte Währung</Label>
              <div className="flex gap-2">
                <select
                  id="currency"
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="GBP">GBP (British Pound)</option>
                  <option value="CHF">CHF (Swiss Franc)</option>
                </select>
                <Button onClick={handleSaveCurrency}>
                  Speichern
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Standardwährung für Aktienanalysen und Berechnungen
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Storage Info */}
        <Card>
          <CardHeader>
            <CardTitle>Datenspeicherung</CardTitle>
            <CardDescription>
              Informationen zur lokalen Datenspeicherung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                • API Keys werden verschlüsselt in Ihrem Browser gespeichert
              </p>
              <p>
                • Watchlists werden lokal in Ihrem Browser gespeichert
              </p>
              <p>
                • Keine Daten werden an externe Server übertragen
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;