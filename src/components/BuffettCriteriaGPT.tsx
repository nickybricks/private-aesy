
import React, { useState, useEffect } from 'react';
import { openAIAnalyze } from '../api/openaiApi';
import { generateDCFExplanation } from '../utils/buffettIntrinsicValue';
import ReactMarkdown from 'react-markdown';
import { 
  calculateBuffettIntrinsicValue, 
  evaluateValuation, 
  calculateIdealBuyPrice,
  DCFInputData
} from '../utils/buffettIntrinsicValue';

interface DCFData {
  ufcf?: number[];
  wacc?: number;
  presentTerminalValue?: number;
  netDebt?: number;
  dilutedSharesOutstanding?: number;
}

const BuffettCriteriaGPT = ({ 
  criteria, 
  stockPrice, 
  currency = 'USD',  // Default to USD if not provided
  dcfData = null  // Optional DCF data for intrinsic value calculation
}) => {
  const [gptAnalysis, setGptAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [intrinsicValueData, setIntrinsicValueData] = useState(null);

  useEffect(() => {
    if (criteria) {
      setIsLoading(true);
      openAIAnalyze(criteria)
        .then(response => {
          console.log('GPT Analysis Response:', response);
          setGptAnalysis(response);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching GPT analysis:', err);
          setError(err.message || 'Fehler beim Abrufen der GPT-Analyse');
          setIsLoading(false);
        });
    }
  }, [criteria]);

  // Calculate intrinsic value when dcfData is available
  useEffect(() => {
    if (dcfData) {
      try {
        const calcResult = calculateBuffettIntrinsicValue(dcfData as DCFInputData);
        
        if (calcResult.isValid) {
          const valuation = stockPrice ? 
            evaluateValuation(calcResult.intrinsicValue, stockPrice) : 
            { status: 'unknown', percentageDiff: 0 };
            
          const idealBuyPrice = calculateIdealBuyPrice(calcResult.intrinsicValue, 20); // 20% margin of safety
          
          setIntrinsicValueData({
            intrinsicValue: calcResult.intrinsicValue,
            valuation: valuation,
            idealBuyPrice: idealBuyPrice,
            terminalValuePercentage: calcResult.terminalValuePercentage,
            years: calcResult.details.years
          });
        }
      } catch (err) {
        console.error('Error calculating intrinsic value:', err);
      }
    }
  }, [dcfData, stockPrice]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-buffett-subtext">GPT analysiert die Aktie nach Buffett-Kriterien...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Fehler bei der GPT-Analyse</h3>
        <p className="text-red-600">{error}</p>
        <p className="mt-2 text-sm text-red-500">
          Bitte überprüfen Sie Ihren OpenAI API-Key und versuchen Sie es erneut.
        </p>
      </div>
    );
  }

  // Format currency values
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // For percentages
  const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('de-DE', { 
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      {gptAnalysis && (
        <>
          <h2 className="text-xl font-semibold mb-4">Erweiterte Buffett-Kriterienanalyse</h2>
          
          {/* Intrinsic Value Section */}
          {intrinsicValueData && (
            <div className="mb-6 border-b pb-4 border-gray-200">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Buffett DCF-Bewertung</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Innerer Wert pro Aktie (DCF):</p>
                    <p className="text-2xl font-bold text-buffett-blue">
                      {formatCurrency(intrinsicValueData.intrinsicValue)}
                    </p>
                    
                    {stockPrice && (
                      <>
                        <p className="text-sm text-gray-500 mt-2 mb-1">Aktueller Kurs:</p>
                        <p className="text-xl">
                          {formatCurrency(stockPrice)}
                        </p>
                      </>
                    )}
                    
                    {intrinsicValueData.valuation && intrinsicValueData.valuation.status !== 'unknown' && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-1">Abweichung:</p>
                        <p className={`text-lg font-medium ${
                          intrinsicValueData.valuation.status === 'undervalued' ? 'text-green-600' :
                          intrinsicValueData.valuation.status === 'overvalued' ? 'text-red-600' : 
                          'text-blue-600'
                        }`}>
                          {intrinsicValueData.valuation.percentageDiff > 0 ? '+' : ''}
                          {intrinsicValueData.valuation.percentageDiff.toFixed(1)}% 
                          ({
                            intrinsicValueData.valuation.status === 'undervalued' ? 'Unterbewertet' :
                            intrinsicValueData.valuation.status === 'overvalued' ? 'Überbewertet' : 
                            'Fair bewertet'
                          })
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Idealer Kaufpreis (20% Sicherheitsmarge):</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(intrinsicValueData.idealBuyPrice)}
                    </p>
                    
                    <p className="text-sm text-gray-500 mt-2 mb-1">Terminal Value-Anteil:</p>
                    <p className="text-lg">
                      {formatPercentage(intrinsicValueData.terminalValuePercentage)}
                    </p>
                    
                    <p className="text-sm text-gray-500 mt-2">
                      Berechnungsbasis: {intrinsicValueData.years} Jahre UFCF + Terminal Value
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="prose max-w-none">
            <ReactMarkdown>{gptAnalysis}</ReactMarkdown>
          </div>
        </>
      )}
    </div>
  );
};

export default BuffettCriteriaGPT;
