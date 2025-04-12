
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface DebugApiDataProps {
  stockInfo?: any;
  buffettCriteria?: any;
  financialMetrics?: any;
  overallRating?: any;
}

const DebugApiData: React.FC<DebugApiDataProps> = ({
  stockInfo,
  buffettCriteria,
  financialMetrics,
  overallRating
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('stockInfo');

  // Function to format JSON data
  const formatData = (data: any) => {
    if (!data) return 'No data available';
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return `Error formatting data: ${error}`;
    }
  };

  // Extract currency information
  const stockCurrency = stockInfo?.currency || 'Unknown';
  
  // Check if stock is Korean (KRW)
  const isKoreanStock = stockCurrency === 'KRW';
  
  // Check if we have EPS data in financialMetrics
  const hasEpsData = financialMetrics?.eps !== undefined;
  const epsValue = financialMetrics?.eps;
  
  // Check raw metrics for troubleshooting
  const rawMetrics = financialMetrics?.metrics || [];
  const epsMetric = rawMetrics.find((m: any) => m.name.includes('EPS') || m.name.includes('Gewinn pro Aktie'));

  return (
    <Card className={`p-4 my-6 ${isExpanded ? 'bg-gray-50' : 'bg-yellow-50'} border-gray-200 transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Debug: API Data {isKoreanStock && <span className="text-orange-500 text-sm ml-2">(Korean Stock - KRW)</span>}
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {isExpanded ? 'Collapse' : 'Expand'} Debug Panel
        </Button>
      </div>
      
      {isExpanded ? (
        <>
          {isKoreanStock && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex gap-2">
                <AlertTriangle className="text-orange-500 h-5 w-5 mt-1" />
                <div>
                  <h3 className="font-semibold text-orange-700">Korean Won (KRW) Stock Detected</h3>
                  <p className="text-orange-600 text-sm">
                    Korean Won has a very different exchange rate compared to other major currencies 
                    (approximately 1 EUR = 1490 KRW). This can cause conversion issues if not handled properly.
                  </p>
                  {epsMetric && (
                    <div className="mt-2 p-2 bg-white rounded border border-orange-200">
                      <p className="text-sm font-medium">EPS Value:</p>
                      <p className="text-sm">Raw API Value: {epsValue}</p>
                      <p className="text-sm">Displayed Value: {epsMetric.value}</p>
                      <p className="text-sm">Original Value: {epsMetric.originalValue}</p>
                      <p className="text-sm">Original Currency: {epsMetric.originalCurrency || stockCurrency}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="stockInfo">Stock Info</TabsTrigger>
              <TabsTrigger value="buffettCriteria">Buffett Criteria</TabsTrigger>
              <TabsTrigger value="financialMetrics">Financial Metrics</TabsTrigger>
              <TabsTrigger value="overallRating">Overall Rating</TabsTrigger>
              <TabsTrigger value="exchangeRates">Exchange Rates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stockInfo">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 mb-3">
                  <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md">
                    Ticker: <span className="font-semibold">{stockInfo?.ticker || 'N/A'}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md">
                    Name: <span className="font-semibold">{stockInfo?.name || 'N/A'}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md">
                    Exchange: <span className="font-semibold">{stockInfo?.exchange || 'N/A'}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md">
                    Currency: <span className="font-semibold">{stockInfo?.currency || 'N/A'}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md">
                    Country: <span className="font-semibold">{stockInfo?.country || 'N/A'}</span>
                  </div>
                </div>
                <h3 className="text-md font-semibold">Raw Stock API Data:</h3>
                <ScrollArea className="h-96 rounded bg-white p-2 border border-gray-200">
                  <pre className="text-xs">{formatData(stockInfo)}</pre>
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="buffettCriteria">
              <h3 className="text-md font-semibold mb-2">Buffett Criteria Raw Data:</h3>
              <ScrollArea className="h-96 rounded bg-white p-2 border border-gray-200">
                <pre className="text-xs">{formatData(buffettCriteria)}</pre>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="financialMetrics">
              <div className="space-y-4">
                <h3 className="text-md font-semibold">Important Financial Values:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded border border-gray-200">
                    <p className="font-medium">EPS (Earnings Per Share):</p>
                    <p>Raw API Value: {financialMetrics?.eps || 'N/A'}</p>
                    <p>Currency: {stockCurrency}</p>
                  </div>
                  <div className="p-3 bg-white rounded border border-gray-200">
                    <p className="font-medium">ROE (Return on Equity):</p>
                    <p>Value: {financialMetrics?.roe ? (financialMetrics.roe * 100).toFixed(2) + '%' : 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-white rounded border border-gray-200">
                    <p className="font-medium">Net Margin:</p>
                    <p>Value: {financialMetrics?.netMargin ? (financialMetrics.netMargin * 100).toFixed(2) + '%' : 'N/A'}</p>
                  </div>
                </div>
                
                <h3 className="text-md font-semibold">Metrics After Processing:</h3>
                <ScrollArea className="h-60 rounded bg-white p-2 border border-gray-200">
                  <pre className="text-xs">{formatData(financialMetrics?.metrics)}</pre>
                </ScrollArea>
                
                <h3 className="text-md font-semibold">Complete Financial Metrics Raw Data:</h3>
                <ScrollArea className="h-96 rounded bg-white p-2 border border-gray-200">
                  <pre className="text-xs">{formatData(financialMetrics)}</pre>
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="overallRating">
              <h3 className="text-md font-semibold mb-2">Overall Rating Raw Data:</h3>
              <ScrollArea className="h-96 rounded bg-white p-2 border border-gray-200">
                <pre className="text-xs">{formatData(overallRating)}</pre>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="exchangeRates">
              <h3 className="text-md font-semibold mb-2">Exchange Rates Used:</h3>
              <ScrollArea className="h-96 rounded bg-white p-2 border border-gray-200">
                <pre className="text-xs">{formatData(
                  {
                    "USD": 0.92, // 1 USD = 0.92 EUR
                    "EUR": 1.0,  // 1 EUR = 1 EUR
                    "GBP": 1.17, // 1 GBP = 1.17 EUR
                    "JPY": 0.0061, // 1 JPY = 0.0061 EUR
                    "KRW": 0.00067, // 1 KRW = 0.00067 EUR (approx. 1 EUR = 1490 KRW)
                    "CNY": 0.13, // 1 CNY = 0.13 EUR
                    "HKD": 0.12, // 1 HKD = 0.12 EUR
                    "CHF": 1.0, // 1 CHF = 1 EUR
                    "CAD": 0.68, // 1 CAD = 0.68 EUR
                    "AUD": 0.61 // 1 AUD = 0.61 EUR
                  }
                )}</pre>
              </ScrollArea>
              <div className="mt-3 p-3 bg-gray-100 rounded border border-gray-300">
                <h4 className="font-medium">Korean Won (KRW) Exchange Rate:</h4>
                <p>1 KRW = 0.00067 EUR</p>
                <p>1 EUR ≈ 1490 KRW</p>
                <p className="text-sm mt-2">
                  Example: 10,000 KRW ≈ 6.7 EUR<br/>
                  Example: 1,000,000 KRW ≈ 670 EUR
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
            <p><strong>Hinweis:</strong> Diese Debug-Ansicht zeigt die Rohdaten aus der Financial Modeling Prep API und die verwendeten Wechselkurse.</p>
            <p>Alle in dieser Ansicht angezeigten Werte sind unformatiert und unbearbeitet, um Transparenz über die API-Daten zu bieten.</p>
          </div>
        </>
      ) : (
        <div className="p-3 bg-yellow-100 rounded text-yellow-800 text-sm">
          <p>Klicken Sie auf "Expand Debug Panel", um detaillierte API-Daten und Währungsinformationen anzuzeigen.</p>
          <p>Dies kann helfen, Probleme mit der Währungsumrechnung, insbesondere für koreanische Won (KRW), zu identifizieren.</p>
        </div>
      )}
    </Card>
  );
};

export default DebugApiData;
