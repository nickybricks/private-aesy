
import React from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  // Function to format JSON data
  const formatData = (data: any) => {
    if (!data) return 'No data available';
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return `Error formatting data: ${error}`;
    }
  };

  return (
    <Card className="p-4 my-6 bg-gray-50 border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Debug: API Data</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-md font-semibold mb-2">Stock Info</h3>
          <ScrollArea className="h-96 rounded bg-white p-2 border border-gray-200">
            <pre className="text-xs">{formatData(stockInfo)}</pre>
          </ScrollArea>
        </div>
        
        <div>
          <h3 className="text-md font-semibold mb-2">Buffett Criteria</h3>
          <ScrollArea className="h-96 rounded bg-white p-2 border border-gray-200">
            <pre className="text-xs">{formatData(buffettCriteria)}</pre>
          </ScrollArea>
        </div>
        
        <div>
          <h3 className="text-md font-semibold mb-2">Financial Metrics</h3>
          <ScrollArea className="h-96 rounded bg-white p-2 border border-gray-200">
            <pre className="text-xs">{formatData(financialMetrics)}</pre>
          </ScrollArea>
        </div>
        
        <div>
          <h3 className="text-md font-semibold mb-2">Overall Rating</h3>
          <ScrollArea className="h-96 rounded bg-white p-2 border border-gray-200">
            <pre className="text-xs">{formatData(overallRating)}</pre>
          </ScrollArea>
        </div>
        
        <div className="md:col-span-2">
          <h3 className="text-md font-semibold mb-2">Raw API Exchange Rates</h3>
          <ScrollArea className="h-48 rounded bg-white p-2 border border-gray-200">
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
        </div>
      </div>
      
      <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
        <p><strong>Hinweis:</strong> Diese Debug-Ansicht zeigt die Rohdaten aus der Financial Modeling Prep API und die verwendeten Wechselkurse.</p>
        <p>Alle in dieser Ansicht angezeigten Werte sind unformatiert und unbearbeitet, um Transparenz über die API-Daten zu bieten.</p>
      </div>
    </Card>
  );
};

export default DebugApiData;
