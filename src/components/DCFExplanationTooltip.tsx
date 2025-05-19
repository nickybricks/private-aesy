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
import { debugDCFData } from '@/utils/currencyConverter';

export const DCFExplanationTooltip: React.FC<{ dcfData?: DCFData }> = ({ dcfData }) => {
  // Debug DCF data
  React.useEffect(() => {
    console.log('DCFExplanationTooltip rendering with dcfData:', dcfData ? 'present' : 'not present');
    
    if (!dcfData) {
      console.warn('DCFExplanationTooltip: No DCF data available');
      return;
    }

    // Use our enhanced debug function
    debugDCFData(dcfData);
    
    // Additional component-specific debug checks
    if (dcfData.ufcf && dcfData.pvUfcfs) {
      // Check that the lengths match
      if (dcfData.ufcf.length !== dcfData.pvUfcfs.length) {
        console.warn(`DCF ERROR: UFCF length (${dcfData.ufcf.length}) doesn't match PV_UFCF length (${dcfData.pvUfcfs.length})`);
      }
      
      // Check individual cash flow values
      dcfData.ufcf.forEach((cf, index) => {
        if (isNaN(cf)) {
          console.warn(`DCF ERROR: UFCF for year ${index + 1} is NaN`);
        }
      });
      
      dcfData.pvUfcfs.forEach((pv, index) => {
        if (isNaN(pv)) {
          console.warn(`DCF ERROR: PV of UFCF for year ${index + 1} is NaN`);
        }
      });
    }
    
    // Check final calculation steps
    console.log('DCF Calculation Check:');
    console.log(`1. Sum PV UFCFs: ${dcfData.sumPvUfcfs}`);
    console.log(`2. + Terminal Value (PV): ${dcfData.presentTerminalValue}`);
    console.log(`3. = Enterprise Value: ${dcfData.enterpriseValue}`);
    console.log(`4. - Net Debt: ${dcfData.netDebt}`);
    console.log(`5. = Equity Value: ${dcfData.equityValue}`);
    console.log(`6. ÷ Shares: ${dcfData.dilutedSharesOutstanding}`);
    console.log(`7. = Value Per Share: ${dcfData.intrinsicValue}`);
  }, [dcfData]);

  // Wenn keine Daten vorhanden sind, zeige eine Fehlermeldung an
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
            <h4 className="font-semibold mb-1">DCF-Berechnung nicht verfügbar</h4>
            <p className="text-xs">
              Für dieses Wertpapier liegen keine Daten vor, um eine DCF-Berechnung durchzuführen. Ein innerer Wert kann daher nicht ermittelt werden.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Überprüfe, ob erforderliche DCF-Datenfelder verfügbar sind
  const requiredFieldsMissing = !dcfData.ufcf || !dcfData.wacc || 
    dcfData.presentTerminalValue === undefined || 
    dcfData.netDebt === undefined || !dcfData.dilutedSharesOutstanding;

  if (requiredFieldsMissing) {
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
              Für dieses Wertpapier liegen unvollständige DCF-Daten vor. Ein innerer Wert kann nicht zuverlässig berechnet werden. Eine Bewertung nach Buffett-Prinzipien ist aktuell nicht möglich.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Formattierungshilfe
  const formatValue = (value: number): string => {
    if (isNaN(value)) {
      return 'N/A (NaN)';
    }
    
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(2) + ' Mrd';
    } else if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + ' Mio';
    } else {
      return value.toFixed(2);
    }
  };
  
  // Wenn alle Daten vorhanden sind, zeige den vollständigen Tooltip
  return (
    <ClickableTooltip 
      side="right"
      align="start"
      width="md"
      content={
        <div className="space-y-2 max-w-2xl">
          <h4 className="font-semibold">Detaillierte DCF-Berechnung</h4>
          <p>Der innere Wert von <strong>{isNaN(dcfData.intrinsicValue) ? 'N/A (Fehler)' : dcfData.intrinsicValue.toFixed(2)} {dcfData.currency}</strong> wurde mittels dieser DCF-Berechnung ermittelt:</p>
          
          <div className="border border-gray-200 rounded-md p-3 bg-gray-50 mt-2">
            <h5 className="font-medium mb-2">1. Eingabeparameter:</h5>
            <ul className="text-xs space-y-1">
              <li>• WACC (Kapitalkosten): <strong>{isNaN(dcfData.wacc) ? 'N/A (Fehler)' : dcfData.wacc.toFixed(2)}%</strong></li>
              <li>• Nettoverschuldung: <strong>{isNaN(dcfData.netDebt) ? 'N/A (Fehler)' : formatValue(dcfData.netDebt)} {dcfData.currency}</strong></li>
              <li>• Ausstehende Aktien: <strong>{isNaN(dcfData.dilutedSharesOutstanding) ? 'N/A (Fehler)' : formatValue(dcfData.dilutedSharesOutstanding)}</strong></li>
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
            <h5 className="font-medium mb-2">2. Prognose der Free Cashflows:</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="font-medium">Prognostizierte UFCFs:</p>
                <ul className="space-y-1">
                  {dcfData.ufcf.map((cashflow, index) => (
                    <li key={index}>Jahr {index + 1}: <strong>{isNaN(cashflow) ? 'N/A (Fehler)' : formatValue(cashflow)} {dcfData.currency}</strong></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">Abgezinste UFCFs (PV):</p>
                <ul className="space-y-1">
                  {dcfData.pvUfcfs.map((pv, index) => (
                    <li key={index}>Jahr {index + 1}: <strong>{isNaN(pv) ? 'N/A (Fehler)' : formatValue(pv)} {dcfData.currency}</strong></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-md p-3 bg-gray-50 text-xs">
            <h5 className="font-medium mb-2">3. Terminal Value:</h5>
            <p className="mb-2">
              <span className="font-medium">Terminal Value (PV): </span> 
              <strong>{isNaN(dcfData.presentTerminalValue) ? 'N/A (Fehler)' : formatValue(dcfData.presentTerminalValue)} {dcfData.currency}</strong>
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
                <strong>{isNaN(dcfData.sumPvUfcfs) ? 'N/A (Fehler)' : formatValue(dcfData.sumPvUfcfs)} {dcfData.currency}</strong>
              </li>
              <li>
                <span className="font-medium">Enterprise Value = PV(UFCFs) + PV(Terminal): </span>
                <strong>{isNaN(dcfData.enterpriseValue) ? 'N/A (Fehler)' : formatValue(dcfData.enterpriseValue)} {dcfData.currency}</strong>
              </li>
              <li>
                <span className="font-medium">Equity Value = Enterprise Value - Nettoverschuldung: </span>
                <strong>{isNaN(dcfData.equityValue) ? 'N/A (Fehler)' : formatValue(dcfData.equityValue)} {dcfData.currency}</strong>
              </li>
              <li>
                <span className="font-medium">Innerer Wert pro Aktie = Equity Value / Anzahl Aktien: </span>
                <strong>{isNaN(dcfData.intrinsicValue) ? 'N/A (Fehler)' : dcfData.intrinsicValue.toFixed(2)} {dcfData.currency}</strong>
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
