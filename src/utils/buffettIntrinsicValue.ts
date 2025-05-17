
/**
 * Utility for calculating Buffett-compliant intrinsic value based on DCF model
 */

export interface DCFInputData {
  ufcf?: number[];            // Array of forecasted Unlevered Free Cash Flows
  wacc?: number;              // Weighted Average Cost of Capital (as percentage)
  presentTerminalValue?: number; // Present value of terminal value
  netDebt?: number;           // Net Debt (Total Debt - Cash)
  dilutedSharesOutstanding?: number; // Number of diluted shares outstanding
}

export interface IntrinsicValueResult {
  intrinsicValue: number;     // Calculated intrinsic value per share
  enterpriseValue: number;    // Enterprise value (sum of PV UFCFs + terminal value)
  equityValue: number;        // Enterprise value minus net debt
  sumPvUfcf: number;          // Sum of present values of UFCFs
  terminalValuePercentage: number; // Terminal value as percentage of enterprise value
  isValid: true;              // Flag indicating calculation was successful
  details: {                  // Additional calculation details
    pvUfcfs: number[];        // Present values of individual UFCFs
    years: number;            // Number of years in forecast
  };
}

export interface IntrinsicValueError {
  isValid: false;             // Flag indicating calculation failed
  errorMessage: string;       // Reason for failure
  missingInputs: string[];    // List of missing required inputs
}

export type IntrinsicValueCalcResult = IntrinsicValueResult | IntrinsicValueError;

/**
 * Calculate the intrinsic value per share based on Buffett's DCF principles
 * 
 * @param data DCF input data
 * @returns Calculation result or error
 */
export function calculateBuffettIntrinsicValue(data: DCFInputData): IntrinsicValueCalcResult {
  // Validate required inputs
  const missingInputs: string[] = [];
  
  if (!data.ufcf || data.ufcf.length < 5) missingInputs.push("ufcf (mindestens 5 Jahre)");
  if (data.wacc === undefined) missingInputs.push("wacc");
  if (data.presentTerminalValue === undefined) missingInputs.push("presentTerminalValue");
  if (data.netDebt === undefined) missingInputs.push("netDebt");
  if (data.dilutedSharesOutstanding === undefined || data.dilutedSharesOutstanding <= 0) 
    missingInputs.push("dilutedSharesOutstanding");
  
  // Return error if any required inputs are missing
  if (missingInputs.length > 0) {
    return {
      isValid: false,
      errorMessage: "Unzureichende Daten für DCF-Berechnung",
      missingInputs
    };
  }
  
  try {
    // Convert WACC from percentage to decimal
    const waccDecimal = data.wacc! / 100;
    
    // Calculate present value of each year's UFCF
    const pvUfcfs = data.ufcf!.map((yearlyUfcf, index) => {
      const year = index + 1;
      return yearlyUfcf / Math.pow(1 + waccDecimal, year);
    });
    
    // Sum up the present values
    const sumPvUfcf = pvUfcfs.reduce((sum, pv) => sum + pv, 0);
    
    // Calculate enterprise value
    const enterpriseValue = sumPvUfcf + data.presentTerminalValue!;
    
    // Calculate equity value
    const equityValue = enterpriseValue - data.netDebt!;
    
    // Calculate intrinsic value per share
    const intrinsicValue = equityValue / data.dilutedSharesOutstanding!;
    
    // Calculate terminal value percentage
    const terminalValuePercentage = (data.presentTerminalValue! / enterpriseValue) * 100;
    
    return {
      intrinsicValue,
      enterpriseValue,
      equityValue,
      sumPvUfcf,
      terminalValuePercentage,
      isValid: true,
      details: {
        pvUfcfs,
        years: data.ufcf!.length
      }
    };
  } catch (error) {
    return {
      isValid: false,
      errorMessage: "Fehler bei der DCF-Berechnung",
      missingInputs: ["Berechnungsfehler"]
    };
  }
}

/**
 * Evaluate if a stock is overvalued, fair valued or undervalued
 * 
 * @param intrinsicValue Calculated intrinsic value
 * @param currentPrice Current stock price
 * @returns Valuation status and percentage difference
 */
export function evaluateValuation(intrinsicValue: number, currentPrice: number): {
  status: 'undervalued' | 'fairvalued' | 'overvalued';
  percentageDiff: number;
} {
  const percentageDiff = ((currentPrice - intrinsicValue) / intrinsicValue) * 100;
  
  let status: 'undervalued' | 'fairvalued' | 'overvalued';
  
  if (percentageDiff <= -10) {
    status = 'undervalued';
  } else if (percentageDiff >= 10) {
    status = 'overvalued';
  } else {
    status = 'fairvalued';
  }
  
  return { status, percentageDiff };
}

/**
 * Calculate the ideal buy price with a margin of safety
 * 
 * @param intrinsicValue Calculated intrinsic value
 * @param marginOfSafety Margin of safety percentage (e.g., 20 for 20%)
 * @returns Ideal buy price
 */
export function calculateIdealBuyPrice(intrinsicValue: number, marginOfSafety: number = 20): number {
  return intrinsicValue * (1 - marginOfSafety / 100);
}

/**
 * Generate a detailed explanation of the DCF calculation for educational purposes
 * 
 * @param result IntrinsicValueCalcResult object
 * @param currency Currency symbol for formatting
 * @returns Markdown formatted explanation
 */
export function generateDCFExplanation(
  result: IntrinsicValueCalcResult, 
  currency: string
): string {
  if (!result.isValid) {
    const errorResult = result as IntrinsicValueError;
    return `# DCF-Berechnung nicht möglich\n\nFür diese Aktie liegen nicht genügend Finanzdaten vor.\n\n**Fehlende Daten:**\n${errorResult.missingInputs.map(input => `- ${input}`).join('\n')}`;
  }
  
  const data = result as IntrinsicValueResult;
  const formatNumber = (num: number): string => {
    // Format large numbers with appropriate scale
    if (Math.abs(num) >= 1_000_000_000_000) {
      return `${(num / 1_000_000_000_000).toFixed(2)} Billionen ${currency}`;
    }
    if (Math.abs(num) >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(2)} Milliarden ${currency}`;
    }
    if (Math.abs(num) >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)} Millionen ${currency}`;
    }
    return `${num.toFixed(2)} ${currency}`;
  };
  
  return `## DCF-basierte Intrinsic Value Berechnung

**Intrinsic Value pro Aktie: ${data.intrinsicValue.toFixed(2)} ${currency}**

### Berechnungsschritte:

1. **Free Cash Flow (Prognose für ${data.details.years} Jahre) auf Barwert abgezinst:**
${data.details.pvUfcfs.map((pv, i) => `   - Jahr ${i+1}: ${formatNumber(pv)}`).join('\n')}
   - **Summe der abgezinsten FCFs: ${formatNumber(data.sumPvUfcf)}**

2. **Terminal Value (Barwert):**
   - ${formatNumber(data.enterpriseValue - data.sumPvUfcf)} (${data.terminalValuePercentage.toFixed(1)}% des Gesamtwerts)

3. **Enterprise Value:**
   - Summe FCFs + Terminal Value = ${formatNumber(data.enterpriseValue)}

4. **Equity Value:**
   - Enterprise Value - Nettoschulden = ${formatNumber(data.equityValue)}

5. **Intrinsic Value pro Aktie:**
   - Equity Value / Anzahl Aktien = **${data.intrinsicValue.toFixed(2)} ${currency}**

### Buffett's Margin of Safety Prinzip:

Bei einem idealen Kaufpreis mit 20% Sicherheitsmarge sollte man maximal **${(data.intrinsicValue * 0.8).toFixed(2)} ${currency}** zahlen.

Diese Berechnung basiert auf Warren Buffetts DCF-Methode, die auf dem Barwert aller zukünftigen Free Cash Flows basiert. Ein hoher Anteil des Terminal Value am Gesamtwert (hier: ${data.terminalValuePercentage.toFixed(1)}%) deutet auf höhere Unsicherheit hin.`;
}
