import axios from 'axios';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';

/**
 * Buffett Predictability Stars Service
 * Calculates 1-5 star predictability rating based on 10-year stability of:
 * - Revenue per Share (RPS)
 * - EBITDA per Share (EPSA_EBITDA)
 */

export interface PredictabilityInput {
  ticker: string;
  timeseries: {
    years: number[];
    rps: number[];            // revenue per share
    ebitda_ps: number[];      // EBITDA per share
    operating_income: number[];
    diluted_shares: number[];
  };
  meta: {
    fy_end_month: number;
    currency: string;
    sector?: string;
  };
  options?: {
    universe_scores?: number[];
    min_years?: number;
    use_quantile_mapping?: boolean;
  };
}

export interface PredictabilityResult {
  ticker: string;
  stars: number | 'NR';
  score: {
    composite: number;
    trend_r2: { rps: number; ebitda_ps: number };
    rmse_ln: { rps: number; ebitda_ps: number };
    sigma_growth: { rps: number; ebitda_ps: number };
    penalties: { outlier: number; break: number };
    percentile?: number;
  };
  flags: {
    has_operating_loss: boolean;
    on_watch: boolean;
    watch_reasons: string[];
  };
  explain: {
    summary: string;
    method: string;
    data_window_years: number;
  };
  version: string;
  timestamp_utc: string;
}

interface RegressionResult {
  r2: number;
  rmse: number;
  residuals: number[];
  slope: number;
  intercept: number;
}

interface GrowthAnalysis {
  rates: number[];
  sigma: number;
  hasOutliers: boolean;
}

interface StructuralBreakTest {
  hasBreak: boolean;
  breakPoint?: number;
  pValue?: number;
}

export class PredictabilityStarsService {
  private static readonly MIN_YEARS = 10;
  private static readonly VERSION = 'predictability-stars-1.0.0';
  
  // Percentile thresholds for star mapping (based on study data)
  private static readonly STAR_THRESHOLDS = {
    5.0: 96.7,   // Top 3.3%
    4.5: 93.8,   // Next 2.9%
    4.0: 90.1,   // Next 3.7%
    3.5: 86.8,   // Next 3.3%
    3.0: 83.5,   // Next 3.3% 
    2.5: 79.8,   // Next 3.7%
    2.0: 76.5,   // Next 3.3%
    1.0: 0       // Bottom ~23.5%
  };

  /**
   * Fetch 10+ years of financial data needed for predictability analysis
   */
  public static async fetchPredictabilityData(ticker: string): Promise<PredictabilityInput> {
    console.log(`Fetching predictability data for ${ticker}`);
    
    try {
      const standardizedTicker = ticker.trim().toUpperCase();
      
      // Fetch extended historical data (12 years for buffer)
      const [incomeData, profileData] = await Promise.all([
        axios.get(`https://financialmodelingprep.com/api/v3/income-statement/${standardizedTicker}`, {
          params: { 
            period: 'annual',
            limit: 12,
            apikey: DEFAULT_FMP_API_KEY 
          }
        }),
        axios.get(`https://financialmodelingprep.com/api/v3/profile/${standardizedTicker}`, {
          params: { apikey: DEFAULT_FMP_API_KEY }
        })
      ]);

      const income = incomeData.data;
      const profile = profileData.data[0];

      if (!income?.length || income.length < this.MIN_YEARS) {
        throw new Error(`Insufficient historical data: ${income?.length || 0} years, minimum ${this.MIN_YEARS} required`);
      }

      // Sort by year descending (most recent first) and take up to 12 years
      const sortedIncome = income
        .filter((d: any) => d.date && d.revenue && d.weightedAverageShsOutDil)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 12);

      if (sortedIncome.length < this.MIN_YEARS) {
        throw new Error(`Insufficient valid data points: ${sortedIncome.length} years after filtering`);
      }

      // Extract time series data
      const years = sortedIncome.map((d: any) => new Date(d.date).getFullYear());
      const rps = sortedIncome.map((d: any) => d.revenue / d.weightedAverageShsOutDil);
      const ebitda_ps = sortedIncome.map((d: any) => (d.ebitda || 0) / d.weightedAverageShsOutDil);
      const operating_income = sortedIncome.map((d: any) => d.operatingIncome || 0);
      const diluted_shares = sortedIncome.map((d: any) => d.weightedAverageShsOutDil);

      const input: PredictabilityInput = {
        ticker: standardizedTicker,
        timeseries: {
          years: years.reverse(), // Oldest first for trend analysis
          rps: rps.reverse(),
          ebitda_ps: ebitda_ps.reverse(),
          operating_income: operating_income.reverse(),
          diluted_shares: diluted_shares.reverse()
        },
        meta: {
          fy_end_month: 12, // Assume December year-end
          currency: profile?.currency || 'USD',
          sector: profile?.sector
        },
        options: {
          min_years: this.MIN_YEARS,
          use_quantile_mapping: true
        }
      };

      console.log('Predictability data fetched:', {
        ticker: standardizedTicker,
        years: input.timeseries.years.length,
        yearRange: `${input.timeseries.years[0]}-${input.timeseries.years[input.timeseries.years.length-1]}`,
        avgRPS: (rps.reduce((a, b) => a + b, 0) / rps.length).toFixed(2),
        avgEBITDA_PS: (ebitda_ps.reduce((a, b) => a + b, 0) / ebitda_ps.length).toFixed(2)
      });

      return input;
    } catch (error) {
      console.error('Error fetching predictability data:', error);
      throw error;
    }
  }

  /**
   * Perform linear regression on log-transformed data
   * Returns R², RMSE, residuals, slope, intercept
   */
  private static linearRegressionLog(values: number[]): RegressionResult {
    // Filter out non-positive values and log transform
    const validIndices: number[] = [];
    const logValues: number[] = [];
    
    values.forEach((val, idx) => {
      if (val > 0) {
        validIndices.push(idx);
        logValues.push(Math.log(val));
      }
    });

    if (logValues.length < 3) {
      return {
        r2: 0,
        rmse: Infinity,
        residuals: [],
        slope: 0,
        intercept: 0
      };
    }

    const n = logValues.length;
    const x = validIndices.map(i => i + 1); // Time index starting from 1
    const y = logValues;

    // Calculate regression coefficients
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate predictions and residuals
    const predictions = x.map(xi => intercept + slope * xi);
    const residuals = y.map((yi, i) => yi - predictions[i]);

    // Calculate R² and RMSE
    const yMean = sumY / n;
    const totalSumSquares = y.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0);
    const residualSumSquares = residuals.reduce((sum, res) => sum + res ** 2, 0);
    
    const r2 = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
    const rmse = Math.sqrt(residualSumSquares / n);

    return {
      r2: Math.max(0, Math.min(1, r2)), // Clamp between 0 and 1
      rmse,
      residuals,
      slope,
      intercept
    };
  }

  /**
   * Analyze growth rate volatility and detect outliers
   */
  private static analyzeGrowthRates(values: number[]): GrowthAnalysis {
    if (values.length < 2) {
      return { rates: [], sigma: 0, hasOutliers: false };
    }

    // Calculate year-over-year growth rates
    const growthRates: number[] = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i-1] > 0) {
        const growth = (values[i] / values[i-1]) - 1;
        // Winsorize extreme values (cap at ±200%)
        const clampedGrowth = Math.max(-2, Math.min(2, growth));
        growthRates.push(clampedGrowth);
      }
    }

    if (growthRates.length === 0) {
      return { rates: [], sigma: 0, hasOutliers: false };
    }

    // Calculate standard deviation
    const mean = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    const variance = growthRates.reduce((sum, rate) => sum + (rate - mean) ** 2, 0) / growthRates.length;
    const sigma = Math.sqrt(variance);

    // Detect outliers (|z-score| > 3)
    const hasOutliers = growthRates.some(rate => Math.abs((rate - mean) / (sigma || 1)) > 3);

    return {
      rates: growthRates,
      sigma,
      hasOutliers
    };
  }

  /**
   * Simple structural break test (Chow test approximation)
   * Tests for one break point in the middle third of the series
   */
  private static testStructuralBreak(values: number[]): StructuralBreakTest {
    if (values.length < 8) {
      return { hasBreak: false };
    }

    // Test break point around the middle
    const n = values.length;
    const breakPoint = Math.floor(n / 2);
    
    // Split series
    const firstHalf = values.slice(0, breakPoint);
    const secondHalf = values.slice(breakPoint);

    // Run regression on each half
    const reg1 = this.linearRegressionLog(firstHalf);
    const reg2 = this.linearRegressionLog(secondHalf);
    const regFull = this.linearRegressionLog(values);

    // Simple test: significant difference in R² or slopes
    const r2Diff = Math.abs(reg1.r2 - reg2.r2);
    const slopeDiff = Math.abs(reg1.slope - reg2.slope);
    
    // Heuristic thresholds
    const hasBreak = r2Diff > 0.3 || slopeDiff > 0.5 || 
                     (regFull.r2 > 0.7 && (reg1.r2 < 0.4 || reg2.r2 < 0.4));

    return {
      hasBreak,
      breakPoint: hasBreak ? breakPoint : undefined,
      pValue: hasBreak ? 0.03 : 0.8 // Simplified p-value approximation
    };
  }

  /**
   * Normalize score using min-max within universe (simplified)
   */
  private static normalizeScore(value: number, universeValues?: number[]): number {
    if (!universeValues || universeValues.length === 0) {
      // Fallback: assume reasonable bounds for financial volatility
      const minVal = 0;
      const maxVal = value > 1 ? value * 1.5 : 1;
      return Math.max(0, Math.min(1, 1 - (value - minVal) / (maxVal - minVal)));
    }

    const min = Math.min(...universeValues);
    const max = Math.max(...universeValues);
    
    if (max === min) return 0.5;
    
    return Math.max(0, Math.min(1, 1 - (value - min) / (max - min)));
  }

  /**
   * Map composite score to star rating using percentile thresholds
   */
  private static mapScoreToStars(score: number, universeScores?: number[]): { stars: number; percentile?: number } {
    let percentile: number | undefined;
    
    if (universeScores && universeScores.length > 0) {
      // Calculate percentile rank
      const sorted = [...universeScores].sort((a, b) => a - b);
      const rank = sorted.filter(s => s <= score).length;
      percentile = (rank / sorted.length) * 100;
      
      // Map percentile to stars
      for (const [stars, threshold] of Object.entries(this.STAR_THRESHOLDS).sort((a, b) => b[1] - a[1])) {
        if (percentile >= threshold) {
          return { stars: parseFloat(stars), percentile };
        }
      }
    } else {
      // Fallback: direct score mapping
      if (score >= 0.88) return { stars: 5.0 };
      if (score >= 0.82) return { stars: 4.5 };
      if (score >= 0.75) return { stars: 4.0 };
      if (score >= 0.68) return { stars: 3.5 };
      if (score >= 0.60) return { stars: 3.0 };
      if (score >= 0.50) return { stars: 2.5 };
      if (score >= 0.40) return { stars: 2.0 };
    }
    
    return { stars: 1.0, percentile };
  }

  /**
   * Check for "Predictability Watch" conditions
   */
  private static checkWatchConditions(
    data: PredictabilityInput,
    rpsRegression: RegressionResult,
    ebitdaRegression: RegressionResult
  ): { on_watch: boolean; watch_reasons: string[] } {
    const reasons: string[] = [];
    
    // Check recent residual spikes (last 2 years if available)
    const recentYears = Math.min(2, data.timeseries.years.length);
    if (recentYears >= 2) {
      const recentRpsResiduals = rpsRegression.residuals.slice(-recentYears);
      const recentEbitdaResiduals = ebitdaRegression.residuals.slice(-recentYears);
      
      const avgAbsResidualRps = recentRpsResiduals.reduce((sum, r) => sum + Math.abs(r), 0) / recentRpsResiduals.length;
      const avgAbsResidualEbitda = recentEbitdaResiduals.reduce((sum, r) => sum + Math.abs(r), 0) / recentEbitdaResiduals.length;
      
      const allAbsResidualsRps = rpsRegression.residuals.map(r => Math.abs(r));
      const allAbsResidualsEbitda = ebitdaRegression.residuals.map(r => Math.abs(r));
      
      const avgHistoricalRps = allAbsResidualsRps.reduce((a, b) => a + b, 0) / allAbsResidualsRps.length;
      const avgHistoricalEbitda = allAbsResidualsEbitda.reduce((a, b) => a + b, 0) / allAbsResidualsEbitda.length;
      
      if (avgAbsResidualRps > avgHistoricalRps * 2 || avgAbsResidualEbitda > avgHistoricalEbitda * 2) {
        reasons.push('residual_spike');
      }
    }
    
    // Check recent variance jump
    const recentGrowthWindow = Math.min(3, data.timeseries.rps.length - 1);
    if (recentGrowthWindow >= 2) {
      const recentRps = data.timeseries.rps.slice(-recentGrowthWindow - 1);
      const recentEbitda = data.timeseries.ebitda_ps.slice(-recentGrowthWindow - 1);
      
      const recentRpsGrowth = this.analyzeGrowthRates(recentRps);
      const recentEbitdaGrowth = this.analyzeGrowthRates(recentEbitda);
      
      const historicalRpsGrowth = this.analyzeGrowthRates(data.timeseries.rps);
      const historicalEbitdaGrowth = this.analyzeGrowthRates(data.timeseries.ebitda_ps);
      
      if (recentRpsGrowth.sigma > historicalRpsGrowth.sigma * 1.5 || 
          recentEbitdaGrowth.sigma > historicalEbitdaGrowth.sigma * 1.5) {
        reasons.push('variance_jump');
      }
    }
    
    return {
      on_watch: reasons.length > 0,
      watch_reasons: reasons
    };
  }

  /**
   * Main calculation method for Predictability Stars
   */
  public static async calculatePredictabilityStars(ticker: string): Promise<PredictabilityResult> {
    console.log(`Calculating Predictability Stars for ${ticker}`);
    
    try {
      // 1. Fetch data
      const data = await this.fetchPredictabilityData(ticker);
      
      // 2. Check minimum data requirements
      if (data.timeseries.years.length < this.MIN_YEARS) {
        return {
          ticker,
          stars: 'NR',
          score: {
            composite: 0,
            trend_r2: { rps: 0, ebitda_ps: 0 },
            rmse_ln: { rps: 0, ebitda_ps: 0 },
            sigma_growth: { rps: 0, ebitda_ps: 0 },
            penalties: { outlier: 0, break: 0 }
          },
          flags: {
            has_operating_loss: false,
            on_watch: false,
            watch_reasons: []
          },
          explain: {
            summary: `Nicht genügend Daten: ${data.timeseries.years.length} Jahre verfügbar, ${this.MIN_YEARS} erforderlich.`,
            method: this.VERSION,
            data_window_years: data.timeseries.years.length
          },
          version: this.VERSION,
          timestamp_utc: new Date().toISOString()
        };
      }

      // 3. Check for operating losses (immediate 1-star)
      const hasOperatingLoss = data.timeseries.operating_income.some(income => income < 0);
      
      if (hasOperatingLoss) {
        return {
          ticker,
          stars: 1.0,
          score: {
            composite: 0,
            trend_r2: { rps: 0, ebitda_ps: 0 },
            rmse_ln: { rps: 0, ebitda_ps: 0 },
            sigma_growth: { rps: 0, ebitda_ps: 0 },
            penalties: { outlier: 0, break: 0 }
          },
          flags: {
            has_operating_loss: true,
            on_watch: false,
            watch_reasons: []
          },
          explain: {
            summary: 'Nicht vorhersehbar: Mindestens ein operatives Verlustjahr erkannt.',
            method: this.VERSION,
            data_window_years: data.timeseries.years.length
          },
          version: this.VERSION,
          timestamp_utc: new Date().toISOString()
        };
      }

      // 4. Check for non-positive values that would break log analysis
      const hasInvalidRps = data.timeseries.rps.some(val => val <= 0);
      const hasInvalidEbitda = data.timeseries.ebitda_ps.some(val => val <= 0);
      
      if (hasInvalidRps || hasInvalidEbitda) {
        return {
          ticker,
          stars: 1.0,
          score: {
            composite: 0,
            trend_r2: { rps: 0, ebitda_ps: 0 },
            rmse_ln: { rps: 0, ebitda_ps: 0 },
            sigma_growth: { rps: 0, ebitda_ps: 0 },
            penalties: { outlier: 0, break: 0 }
          },
          flags: {
            has_operating_loss: false,
            on_watch: false,
            watch_reasons: []
          },
          explain: {
            summary: 'Nicht vorhersehbar: Negative oder null Werte in Umsatz/EBITDA pro Aktie.',
            method: this.VERSION,
            data_window_years: data.timeseries.years.length
          },
          version: this.VERSION,
          timestamp_utc: new Date().toISOString()
        };
      }

      // 5. Perform regression analysis
      const rpsRegression = this.linearRegressionLog(data.timeseries.rps);
      const ebitdaRegression = this.linearRegressionLog(data.timeseries.ebitda_ps);

      // 6. Analyze growth volatility
      const rpsGrowth = this.analyzeGrowthRates(data.timeseries.rps);
      const ebitdaGrowth = this.analyzeGrowthRates(data.timeseries.ebitda_ps);

      // 7. Test for structural breaks
      const rpsBreakTest = this.testStructuralBreak(data.timeseries.rps);
      const ebitdaBreakTest = this.testStructuralBreak(data.timeseries.ebitda_ps);

      // 8. Calculate component scores
      const S_trend = 0.5 * rpsRegression.r2 + 0.5 * ebitdaRegression.r2;
      
      const maxSigma = Math.max(rpsGrowth.sigma, ebitdaGrowth.sigma);
      const S_smooth = this.normalizeScore(maxSigma);
      
      const maxRmse = Math.max(rpsRegression.rmse, ebitdaRegression.rmse);
      const S_resid = this.normalizeScore(maxRmse);

      // 9. Apply penalties
      const P_outlier = (rpsGrowth.hasOutliers || ebitdaGrowth.hasOutliers) ? 0.1 : 0;
      const P_break = (rpsBreakTest.hasBreak || ebitdaBreakTest.hasBreak) ? 0.2 : 0;

      // 10. Calculate composite score
      const S_raw = 0.4 * S_trend + 0.35 * S_smooth + 0.25 * S_resid;
      const S = Math.max(0, S_raw - P_outlier - P_break);

      // 11. Map to stars
      const { stars, percentile } = this.mapScoreToStars(S, data.options?.universe_scores);

      // 12. Check watch conditions
      const watchCheck = this.checkWatchConditions(data, rpsRegression, ebitdaRegression);

      // 13. Generate summary
      let summary = '';
      if (stars >= 4) {
        summary = 'Sehr stabile 10J-Entwicklung mit geringer Varianz';
      } else if (stars >= 3) {
        summary = 'Stabile Trends mit moderater Vorhersagbarkeit';
      } else if (stars >= 2) {
        summary = 'Moderate Stabilität mit erhöhter Volatilität';
      } else {
        summary = 'Niedrige Vorhersagbarkeit aufgrund hoher Varianz oder Strukturbrüchen';
      }
      
      if (watchCheck.on_watch) {
        summary += '; jüngste Abweichungen beobachtet';
      }

      const result: PredictabilityResult = {
        ticker,
        stars: typeof stars === 'number' ? stars : 1.0,
        score: {
          composite: S,
          trend_r2: { 
            rps: rpsRegression.r2, 
            ebitda_ps: ebitdaRegression.r2 
          },
          rmse_ln: { 
            rps: rpsRegression.rmse, 
            ebitda_ps: ebitdaRegression.rmse 
          },
          sigma_growth: { 
            rps: rpsGrowth.sigma, 
            ebitda_ps: ebitdaGrowth.sigma 
          },
          penalties: { 
            outlier: P_outlier, 
            break: P_break 
          },
          percentile
        },
        flags: {
          has_operating_loss: false,
          on_watch: watchCheck.on_watch,
          watch_reasons: watchCheck.watch_reasons
        },
        explain: {
          summary,
          method: 'log-linear trend + variance + residuals + structural break tests',
          data_window_years: data.timeseries.years.length
        },
        version: this.VERSION,
        timestamp_utc: new Date().toISOString()
      };

      console.log(`Predictability Stars calculation completed for ${ticker}:`, {
        stars: result.stars,
        composite: S.toFixed(3),
        trend_r2: `RPS: ${rpsRegression.r2.toFixed(3)}, EBITDA: ${ebitdaRegression.r2.toFixed(3)}`,
        volatility: `RPS: ${rpsGrowth.sigma.toFixed(3)}, EBITDA: ${ebitdaGrowth.sigma.toFixed(3)}`,
        penalties: `Outlier: ${P_outlier}, Break: ${P_break}`,
        on_watch: watchCheck.on_watch
      });

      return result;
      
    } catch (error) {
      console.error(`Predictability Stars calculation failed for ${ticker}:`, error);
      
      return {
        ticker,
        stars: 'NR',
        score: {
          composite: 0,
          trend_r2: { rps: 0, ebitda_ps: 0 },
          rmse_ln: { rps: 0, ebitda_ps: 0 },
          sigma_growth: { rps: 0, ebitda_ps: 0 },
          penalties: { outlier: 0, break: 0 }
        },
        flags: {
          has_operating_loss: false,
          on_watch: false,
          watch_reasons: []
        },
        explain: {
          summary: `Berechnung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
          method: this.VERSION,
          data_window_years: 0
        },
        version: this.VERSION,
        timestamp_utc: new Date().toISOString()
      };
    }
  }
}