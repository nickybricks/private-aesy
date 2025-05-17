
import { DCFData } from '@/components/BuffettCriteriaGPT';

interface DCFInputData {
  ufcf: number[] | null;
  wacc: number | null;
  presentTerminalValue: number | null;
  netDebt: number | null;
  dilutedSharesOutstanding: number | null;
  currentPrice: number | null;
  currency: string;
}

export function calculateBuffettDCF(data: DCFInputData): DCFData {
  const missingInputs: string[] = [];

  // Check for required inputs
  if (!data.ufcf || data.ufcf.length < 5) {
    missingInputs.push("Prognostizierte UFCF für min. 5 Jahre");
  }
  
  if (data.wacc === null) {
    missingInputs.push("Gewichtete durchschnittliche Kapitalkosten (WACC)");
  }
  
  if (data.presentTerminalValue === null) {
    missingInputs.push("Abgezinster Terminal Value");
  }
  
  if (data.netDebt === null) {
    missingInputs.push("Netto-Verschuldung (Net Debt)");
  }
  
  if (data.dilutedSharesOutstanding === null || data.dilutedSharesOutstanding <= 0) {
    missingInputs.push("Anzahl ausstehender Aktien");
  }

  // If any required data is missing, return error object
  if (missingInputs.length > 0) {
    return {
      intrinsicValue: null,
      currentPrice: data.currentPrice,
      deviation: null,
      terminalValuePercentage: null,
      currency: data.currency,
      missingInputs
    };
  }

  try {
    // 1. Calculate present value of UFCFs for years 1-5
    const presentValueUFCFs = data.ufcf!.map((cashflow, index) => {
      const year = index + 1;
      // Use WACC as decimal (e.g., 9.87% should be used as 0.0987)
      const waccDecimal = data.wacc! / 100;
      return cashflow / Math.pow(1 + waccDecimal, year);
    });

    // 2. Sum present values of UFCFs
    const sumPvUfcf = presentValueUFCFs.reduce((sum, pv) => sum + pv, 0);

    // 3. Calculate Enterprise Value
    const enterpriseValue = sumPvUfcf + data.presentTerminalValue!;

    // 4. Calculate Equity Value
    const equityValue = enterpriseValue - data.netDebt!;

    // 5. Calculate Intrinsic Value per Share
    const intrinsicValue = equityValue / data.dilutedSharesOutstanding!;

    // 6. Calculate deviation from current price
    let deviation = null;
    if (data.currentPrice && data.currentPrice > 0) {
      deviation = ((data.currentPrice - intrinsicValue) / intrinsicValue) * 100;
    }

    // 7. Calculate Terminal Value percentage
    const terminalValuePercentage = Math.round((data.presentTerminalValue! / enterpriseValue) * 100);

    return {
      intrinsicValue,
      currentPrice: data.currentPrice,
      deviation,
      terminalValuePercentage,
      currency: data.currency,
      missingInputs: null
    };
  } catch (error) {
    console.error("Error calculating DCF:", error);
    return {
      intrinsicValue: null,
      currentPrice: data.currentPrice,
      deviation: null,
      terminalValuePercentage: null,
      currency: data.currency,
      missingInputs: ["Berechnungsfehler aufgetreten"]
    };
  }
}
