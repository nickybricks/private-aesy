
import React, { useState, useEffect } from 'react';
import StockSearch from '@/components/StockSearch';
import StockHeader from '@/components/StockHeader';
import StockChart from '@/components/StockChart';
import FinancialMetrics from '@/components/FinancialMetrics';
import QuantAnalysisTable from '@/components/QuantAnalysisTable';
import OverallRating from '@/components/OverallRating';
import BuffettCriteriaGPT, { DCFData } from '@/components/BuffettCriteriaGPT';
import ExchangeSelector from '@/components/ExchangeSelector';
import { fetchStock, fetchStockHistory } from '@/api/stockApi';
import { fetchQuantAnalysis } from '@/api/quantAnalyzerApi';
import { fetchDCFAdvancedData } from '@/api/dcfAnalysisApi';
import { calculateBuffettDCF } from '@/utils/buffettDCFCalculation';
import { getMockDCFData } from '@/utils/mockDCFData';

// Updated Buffer criteria interface to include scores
interface BuffettCriterion {
  title: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
  details: string[];
  gptAnalysis?: string | null;
  score?: number;
  maxScore?: number;
}

interface BuffettCriteria {
  businessModel: BuffettCriterion;
  economicMoat: BuffettCriterion;
  financialMetrics: BuffettCriterion;
  financialStability: BuffettCriterion;
  management: BuffettCriterion;
  valuation: BuffettCriterion;
  longTermOutlook: BuffettCriterion;
  rationalBehavior: BuffettCriterion;
  cyclicalBehavior: BuffettCriterion;
  oneTimeEffects: BuffettCriterion;
  turnaround: BuffettCriterion;
}

const Index = () => {
  const [stock, setStock] = useState<any>(null);
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [exchange, setExchange] = useState<string>('US');
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [quantAnalysis, setQuantAnalysis] = useState<any>(null);
  const [buffettCriteria, setBuffettCriteria] = useState<BuffettCriteria | null>(null);
  const [dcfData, setDcfData] = useState<DCFData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  // This is a simplified version of BuffettCriteria for demo purposes
  // In production, these criteria should come from an API or more complex logic
  const generateBuffettCriteria = (stock: any): BuffettCriteria => {
    const generateRandomStatus = () => {
      const statuses = ['pass', 'warning', 'fail'];
      return statuses[Math.floor(Math.random() * statuses.length)] as 'pass' | 'warning' | 'fail';
    };

    const generateRandomDetails = () => {
      const details = [
        'Stabiles Wachstum in den letzten 5 Jahren',
        'Hohe Eigenkapitalrendite',
        'Geringe Verschuldung',
        'Konstante Dividendenpolitik',
        'Starke Marktposition'
      ];
      const numberOfDetails = Math.floor(Math.random() * (details.length + 1)); // Random number between 0 and details.length
      const selectedDetails: string[] = [];
      const availableDetails = [...details]; // Create a copy to avoid modifying the original array

      for (let i = 0; i < numberOfDetails; i++) {
        const randomIndex = Math.floor(Math.random() * availableDetails.length);
        selectedDetails.push(availableDetails[randomIndex]);
        availableDetails.splice(randomIndex, 1); // Remove the selected detail to avoid duplicates
      }

      return selectedDetails;
    };

    return {
      businessModel: {
        title: '1. Verstehbares Geschäftsmodell',
        status: generateRandomStatus(),
        description: 'Das Geschäftsmodell ist einfach zu verstehen und zu analysieren.',
        details: generateRandomDetails()
      },
      economicMoat: {
        title: '2. Dauerhafter Wettbewerbsvorteil',
        status: generateRandomStatus(),
        description: 'Das Unternehmen verfügt über einen nachhaltigen Wettbewerbsvorteil.',
        details: generateRandomDetails()
      },
      financialMetrics: {
        title: '3. Solide Gewinnmargen',
        status: generateRandomStatus(),
        description: 'Das Unternehmen weist solide und stabile Gewinnmargen auf.',
        details: generateRandomDetails()
      },
      financialStability: {
        title: '4. Konservative Finanzierung',
        status: generateRandomStatus(),
        description: 'Das Unternehmen finanziert sich konservativ und hat wenig Schulden.',
        details: generateRandomDetails()
      },
      management: {
        title: '5. Rationales Management',
        status: generateRandomStatus(),
        description: 'Das Management handelt rational und im Interesse der Aktionäre.',
        details: generateRandomDetails()
      },
      valuation: {
        title: '6. Akzeptable Bewertung',
        status: generateRandomStatus(),
        description: 'Die Bewertung des Unternehmens ist im Vergleich zu seinen Fundamentaldaten angemessen.',
        details: generateRandomDetails()
      },
      longTermOutlook: {
        title: '7. Langfristige Perspektive',
        status: generateRandomStatus(),
        description: 'Das Unternehmen hat eine langfristige Perspektive und ist nicht auf kurzfristige Gewinne ausgerichtet.',
        details: generateRandomDetails()
      },
      rationalBehavior: {
        title: '8. Rationales Verhalten',
        status: generateRandomStatus(),
        description: 'Das Unternehmen agiert rational und vermeidet unnötige Risiken.',
        details: generateRandomDetails()
      },
      cyclicalBehavior: {
        title: '9. Keine zyklische Aktie',
        status: generateRandomStatus(),
        description: 'Das Unternehmen ist nicht von Konjunkturzyklen betroffen.',
        details: generateRandomDetails()
      },
      oneTimeEffects: {
        title: '10. Keine One-Time-Effects',
        status: generateRandomStatus(),
        description: 'Das Unternehmen weist keine wiederkehrenden Einmaleffekte auf, die das Ergebnis verzerren.',
        details: generateRandomDetails()
      },
      turnaround: {
        title: '11. Keine Turnarounds',
        status: generateRandomStatus(),
        description: 'Das Unternehmen befindet sich nicht in einer Turnaround-Situation.',
        details: generateRandomDetails()
      }
    };
  };

  useEffect(() => {
    if (selectedStock) {
      setLoading(true);
      
      const loadStockData = async () => {
        try {
          const stockData = await fetchStock(selectedStock, exchange);
          setStock(stockData);
          
          if (stockData) {
            const historyData = await fetchStockHistory(selectedStock);
            setStockHistory(historyData);
            
            // Generate Buffett criteria based on stock data
            const criteria = generateBuffettCriteria(stockData);
            setBuffettCriteria(criteria);
            
            // Fetch quant analysis
            const quantData = await fetchQuantAnalysis(selectedStock);
            setQuantAnalysis(quantData);
            
            // Fetch DCF data
            const fetchDCFData = async () => {
              try {
                const dcfAdvancedData = await fetchDCFAdvancedData(selectedStock);
                
                if (dcfAdvancedData) {
                  const calculatedDCF = calculateBuffettDCF({
                    ufcf: dcfAdvancedData.ufcf,
                    wacc: dcfAdvancedData.wacc,
                    presentTerminalValue: dcfAdvancedData.presentTerminalValue,
                    netDebt: dcfAdvancedData.netDebt,
                    dilutedSharesOutstanding: dcfAdvancedData.dilutedSharesOutstanding,
                    currentPrice: stockData.price,
                    currency: stockData.currency || 'USD'
                  });
                  
                  setDcfData(calculatedDCF);
                } else {
                  // If API call fails, set DCF data with missing inputs
                  setDcfData({
                    intrinsicValue: null,
                    currentPrice: stockData.price,
                    deviation: null,
                    terminalValuePercentage: null,
                    currency: stockData.currency || 'USD',
                    missingInputs: ['API-Daten nicht verfügbar']
                  });
                }
              } catch (error) {
                console.error('Error calculating DCF:', error);
                setDcfData({
                  intrinsicValue: null,
                  currentPrice: stockData.price,
                  deviation: null,
                  terminalValuePercentage: null,
                  currency: stockData.currency || 'USD',
                  missingInputs: ['Berechnungsfehler']
                });
              }
            };
            
            fetchDCFData();
          }
        } catch (error) {
          console.error('Error loading stock data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadStockData();
    }
  }, [selectedStock, exchange]);

  const handleStockSelect = (ticker: string) => {
    setSelectedStock(ticker);
  };

  const handleExchangeChange = (newExchange: string) => {
    setExchange(newExchange);
    // Reset selected stock when changing exchanges
    setSelectedStock('');
    setStock(null);
    setStockHistory([]);
    setQuantAnalysis(null);
    setBuffettCriteria(null);
    setDcfData(undefined);
  };

  return (
    <div className="container mx-auto p-4 max-w-screen-xl">
      <h1 className="text-3xl font-bold mb-6">Buffett Quant Analyzer</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="md:w-2/3">
          <StockSearch onSelect={handleStockSelect} selectedStock={selectedStock} />
        </div>
        <div className="md:w-1/3">
          <ExchangeSelector selectedExchange={exchange} onExchangeChange={handleExchangeChange} />
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading stock data...</p>
        </div>
      ) : stock ? (
        <>
          <StockHeader stock={stock} />
          
          <div className="mt-6">
            <StockChart data={stockHistory} />
          </div>
          
          <div className="mt-6">
            <FinancialMetrics stock={stock} />
          </div>
          
          {quantAnalysis && (
            <div className="mt-6">
              <QuantAnalysisTable data={quantAnalysis} />
            </div>
          )}
          
          {buffettCriteria && (
            <div className="mt-6">
              <BuffettCriteriaGPT 
                criteria={buffettCriteria} 
                dcfData={dcfData} 
              />
            </div>
          )}
          
          <div className="mt-6">
            <OverallRating stock={stock} />
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500">Wählen Sie eine Aktie aus, um die Analyse zu starten.</p>
        </div>
      )}
    </div>
  );
};

export default Index;
