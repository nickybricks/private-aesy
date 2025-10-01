
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
          <TabsTrigger value="standard">Standard-Analyse (3 Kriterien)</TabsTrigger>
          <TabsTrigger value="gpt" disabled={!gptAvailable}>
            {gptAvailable ? 'KI-Analyse (11 Kriterien)' : 'KI-Analyse (Nicht verfügbar)'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="standard">
          <BuffettCriteria criteria={buffettCriteria} analysisMode="standard" />
        </TabsContent>
        <TabsContent value="gpt">
          {gptAvailable ? (
            <BuffettCriteriaGPT criteria={buffettCriteria} />
          ) : (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>KI-Analyse nicht verfügbar</AlertTitle>
              <AlertDescription>
                Bitte konfigurieren Sie Ihren API-Key, um Zugang zur erweiterten KI-Analyse zu erhalten.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CriteriaTabsSection;
