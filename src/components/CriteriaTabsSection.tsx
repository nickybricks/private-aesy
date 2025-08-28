
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BuffettCriteria from '@/components/BuffettCriteria';
import BuffettCriteriaGPT from '@/components/BuffettCriteriaGPT';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useStock } from '@/context/StockContext';

const CriteriaTabsSection: React.FC = () => {
  const { 
    buffettCriteria, 
    activeTab, 
    setActiveTab, 
    gptAvailable,
    hasCriticalDataMissing
  } = useStock();
  
  if (!buffettCriteria || hasCriticalDataMissing) {
    return null;
  }

  return (
    <div className="mb-10">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="standard">Standard-Analyse</TabsTrigger>
          <TabsTrigger value="gpt" disabled={!gptAvailable}>
            {gptAvailable ? 'GPT-Analyse (11 Kriterien)' : 'GPT-Analyse (Nicht verfügbar)'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="standard">
          <BuffettCriteria criteria={buffettCriteria} />
        </TabsContent>
        <TabsContent value="gpt">
          {gptAvailable ? (
            <BuffettCriteriaGPT criteria={buffettCriteria} />
          ) : (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>GPT-Analyse nicht verfügbar</AlertTitle>
              <AlertDescription>
                Bitte konfigurieren Sie Ihren OpenAI API-Key in der Datei src/api/openaiApi.ts, um Zugang zur erweiterten GPT-Analyse zu erhalten.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CriteriaTabsSection;
