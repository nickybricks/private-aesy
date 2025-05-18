
import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { ClickableTooltip } from './ClickableTooltip';
import { DCFData } from '@/context/StockContextTypes';

export const DCFExplanationTooltip: React.FC<{ dcfData?: DCFData }> = ({ dcfData }) => {
  // If no data provided, show a simplified tooltip
  if (!dcfData) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center">
              <HelpCircle size={14} className="text-gray-500" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="max-w-md p-4 bg-white border-gray-200 shadow-lg">
            <h4 className="font-semibold mb-1">DCF-Berechnung nicht möglich</h4>
            <p className="text-xs">
              Für dieses Wertpapier liegen nicht genügend Daten vor, um eine detaillierte DCF-Berechnung darzustellen.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Check if required DCF data fields are available
  if (!dcfData.ufcf || !dcfData.wacc || dcfData.presentTerminalValue === undefined || 
      dcfData.netDebt === undefined || !dcfData.dilutedSharesOutstanding) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center">
              <HelpCircle size={14} className="text-gray-500" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="max-w-md p-4 bg-white border-gray-200 shadow-lg">
            <h4 className="font-semibold mb-1">DCF-Berechnung nicht möglich</h4>
            <p className="text-xs">
              Für dieses Wertpapier liegen nicht alle nötigen DCF-Daten vor. Eine Bewertung nach Buffett-Prinzipien ist aktuell nicht möglich.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Formatting helper
  const formatValue = (value: number): string => {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(2) + ' Mrd';
    } else if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + ' Mio';
    } else {
      return value.toFixed(2);
    }
  };
  
  return (
    <ClickableTooltip 
      side="right"
      align="start"
      width="md"
      content={
        <div className="space-y-2 max-w-2xl">
          <h4 className="font-semibold">Detaillierte DCF-Berechnung</h4>
          <p>Der innere Wert von <strong>{dcfData.intrinsicValue.toFixed(2)} {dcfData.currency}</strong> wurde mittels dieser DCF-Berechnung ermittelt:</p>
          
          <div className="border border-gray-200 rounded-md p-3 bg-gray-50 mt-2">
            <h5 className="font-medium mb-2">1. Eingabeparameter:</h5>
            <ul className="text-xs space-y-1">
              <li>• WACC (Kapitalkosten): <strong>{dcfData.wacc.toFixed(2)}%</strong></li>
              <li>• Nettoverschuldung: <strong>{formatValue(dcfData.netDebt)} {dcfData.currency}</strong></li>
              <li>• Ausstehende Aktien: <strong>{formatValue(dcfData.dilutedSharesOutstanding)}</strong></li>
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
            <h5 className="font-medium mb-2">2. Prognose der Free Cashflows:</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="font-medium">Prognostizierte UFCFs:</p>
                <ul className="space-y-1">
                  {dcfData.ufcf.map((cashflow, index) => (
                    <li key={index}>Jahr {index + 1}: <strong>{formatValue(cashflow)} {dcfData.currency}</strong></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">Abgezinste UFCFs (PV):</p>
                <ul className="space-y-1">
                  {dcfData.pvUfcfs.map((pv, index) => (
                    <li key={index}>Jahr {index + 1}: <strong>{formatValue(pv)} {dcfData.currency}</strong></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-md p-3 bg-gray-50 text-xs">
            <h5 className="font-medium mb-2">3. Terminal Value:</h5>
            <p className="mb-2">
              <span className="font-medium">Terminal Value (PV): </span> 
              <strong>{formatValue(dcfData.presentTerminalValue)} {dcfData.currency}</strong>
            </p>
            <p>
              Dies repräsentiert den abgezinsten Wert aller zukünftigen Cashflows ab Jahr 6.
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-md p-3 bg-gray-50 text-xs">
            <h5 className="font-medium mb-2">4. Berechnung:</h5>
            <ul className="space-y-2">
              <li>
                <span className="font-medium">Summe aller abgezinsten UFCFs: </span>
                <strong>{formatValue(dcfData.sumPvUfcfs)} {dcfData.currency}</strong>
              </li>
              <li>
                <span className="font-medium">Enterprise Value = PV(UFCFs) + PV(Terminal): </span>
                <strong>{formatValue(dcfData.enterpriseValue)} {dcfData.currency}</strong>
              </li>
              <li>
                <span className="font-medium">Equity Value = Enterprise Value - Nettoverschuldung: </span>
                <strong>{formatValue(dcfData.equityValue)} {dcfData.currency}</strong>
              </li>
              <li>
                <span className="font-medium">Innerer Wert pro Aktie = Equity Value / Anzahl Aktien: </span>
                <strong>{dcfData.intrinsicValue.toFixed(2)} {dcfData.currency}</strong>
              </li>
            </ul>
          </div>
        </div>
      }
    >
      <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center">
        <HelpCircle size={14} className="text-gray-500" />
      </button>
    </ClickableTooltip>
  );
};
