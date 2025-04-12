
import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { availableTargetCurrencies, exchangeRates } from '@/utils/currencyConverter';

interface DebugApiDataProps {
  stockInfo: any | null;
  buffettCriteria: any | null;
  financialMetrics: any | null;
  overallRating: any | null;
  stockCurrency: string;
  targetCurrency: string;
}

const DebugApiData: React.FC<DebugApiDataProps> = ({
  stockInfo,
  buffettCriteria,
  financialMetrics,
  overallRating,
  stockCurrency,
  targetCurrency
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  if (!stockInfo) {
    return null;
  }
  
  const renderJsonTree = (data: any) => {
    return (
      <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };
  
  return (
    <Card className="mb-10 p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">API Debug Data</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsVisible(!isVisible)}
        >
          {isVisible ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>
      
      {isVisible && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-2 border rounded">
              <h3 className="text-md font-medium mb-2">Currency Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Stock Currency:</strong> {stockCurrency}</p>
                <p><strong>Target Currency:</strong> {targetCurrency}</p>
                <p><strong>Original Price:</strong> {stockInfo.price} {stockCurrency}</p>
                {overallRating && (
                  <>
                    <p><strong>Intrinsic Value:</strong> {overallRating.intrinsicValue} {overallRating.currency}</p>
                    {overallRating.originalIntrinsicValue && (
                      <p><strong>Original Intrinsic Value:</strong> {overallRating.originalIntrinsicValue} {overallRating.originalCurrency}</p>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="p-2 border rounded">
              <h3 className="text-md font-medium mb-2">Exchange Rates</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Available Currencies:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  {availableTargetCurrencies.map(currency => (
                    <li key={currency.code}>
                      {currency.code} ({currency.name})
                    </li>
                  ))}
                </ul>
                <p className="mt-2"><strong>Current Exchange Rates (to EUR):</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  {Object.entries(exchangeRates).map(([code, rate]) => (
                    <li key={code}>
                      1 {code} = {rate} EUR
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="stockInfo">
            <TabsList className="mb-2">
              <TabsTrigger value="stockInfo">Stock Info</TabsTrigger>
              <TabsTrigger value="buffettCriteria">Buffett Criteria</TabsTrigger>
              <TabsTrigger value="financialMetrics">Financial Metrics</TabsTrigger>
              <TabsTrigger value="overallRating">Overall Rating</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stockInfo">
              {renderJsonTree(stockInfo)}
            </TabsContent>
            
            <TabsContent value="buffettCriteria">
              {buffettCriteria ? renderJsonTree(buffettCriteria) : <p>No data available</p>}
            </TabsContent>
            
            <TabsContent value="financialMetrics">
              {financialMetrics ? (
                <Accordion type="single" collapsible>
                  <AccordionItem value="metrics">
                    <AccordionTrigger>Metrics</AccordionTrigger>
                    <AccordionContent>
                      {renderJsonTree(financialMetrics.metrics)}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="historicalData">
                    <AccordionTrigger>Historical Data</AccordionTrigger>
                    <AccordionContent>
                      {renderJsonTree(financialMetrics.historicalData)}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="originalData">
                    <AccordionTrigger>Original Raw Data</AccordionTrigger>
                    <AccordionContent>
                      {renderJsonTree(financialMetrics)}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : <p>No data available</p>}
            </TabsContent>
            
            <TabsContent value="overallRating">
              {overallRating ? renderJsonTree(overallRating) : <p>No data available</p>}
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 p-2 bg-blue-50 rounded text-sm">
            <p>
              <strong>Note:</strong> This debug view displays raw data from the Financial Model Prep API 
              and helps diagnose currency conversion issues. The currency displayed in the 
              <code className="bg-blue-100 px-1 rounded">currency</code> field is what the API reports.
            </p>
          </div>
        </>
      )}
    </Card>
  );
};

export default DebugApiData;
