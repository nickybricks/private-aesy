
import React, { useState, useEffect } from 'react';
import StockSearch from '@/components/StockSearch';
import StockHeader from '@/components/StockHeader';
import StockChart from '@/components/StockChart';
import FinancialMetrics from '@/components/FinancialMetrics';
import QuantAnalysisTable from '@/components/QuantAnalysisTable';
import OverallRating from '@/components/OverallRating';
import BuffettCriteriaGPT, { DCFData } from '@/components/BuffettCriteriaGPT';
import ExchangeSelector from '@/components/ExchangeSelector';
import { fetchStockInfo, analyzeBuffettCriteria, getOverallRating } from '@/api/stockApi';
import { analyzeStockByBuffettCriteria } from '@/api/quantAnalyzerApi';
import { fetchDCFAdvancedData } from '@/api/dcfAnalysisApi';
import { calculateBuffettDCF } from '@/utils/buffettDCFCalculation';

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

  // This function is now removed as we're using live data only
  // No mock data generation anymore

  useEffect(() => {
    if (selectedStock) {
      setLoading(true);
      
      const loadStockData = async () => {
        try {
          // Use fetchStockInfo instead of fetchStockData
          const stockData = await fetchStockInfo(selectedStock);
          setStock(stockData);
          
          if (stockData) {
            // For stock history, we'll use the analyzeBuffettCriteria to get historical data as well
            const buffettAnalysis = await analyzeBuffettCriteria(selectedStock);
            // Extract the historical data from buffettAnalysis if available
            if (buffettAnalysis && buffettAnalysis.financialMetrics && 
                buffettAnalysis.financialMetrics.historicalData) {
              const historyData = buffettAnalysis.financialMetrics.historicalData;
              setStockHistory(historyData.eps.map((item: any) => ({
                date: item.year.toString(),
                value: item.value
              })));
            }
            
            // Set Buffett criteria from actual API call
            setBuffettCriteria(buffettAnalysis);
            
            // Fetch quant analysis
            const quantData = await analyzeStockByBuffettCriteria(selectedStock);
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
          <StockSearch 
            selectedStock={selectedStock}
            handleSelectStock={handleStockSelect} 
          />
        </div>
        <div className="md:w-1/3">
          <ExchangeSelector 
            selectedExchange={exchange} 
            handleExchangeChange={handleExchangeChange} 
          />
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading stock data...</p>
        </div>
      ) : stock ? (
        <>
          <StockHeader 
            stockData={stock} 
          />
          
          <div className="mt-6">
            <StockChart 
              stockData={stockHistory}
            />
          </div>
          
          <div className="mt-6">
            <FinancialMetrics 
              stockData={stock} 
            />
          </div>
          
          {quantAnalysis && (
            <div className="mt-6">
              <QuantAnalysisTable 
                analysisData={quantAnalysis} 
              />
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
            <OverallRating 
              stockData={stock} 
            />
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
