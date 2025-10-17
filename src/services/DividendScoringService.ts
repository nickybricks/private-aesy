/**
 * Dividend Scoring Service
 * Provides sector-specific scoring logic for dividend metrics
 */

export type DividendPreset = 
  | 'Software'
  | 'Consumer Staples'
  | 'Industrials'
  | 'RetailLogistics'
  | 'UtilitiesTelecom'
  | 'EnergyMaterials'
  | 'Healthcare'
  | 'Banks'
  | 'Insurance'
  | 'Standard (Nicht-Finanz)';

interface PayoutRatioThresholds {
  excellent: { min: number; max: number };
  good: Array<{ min: number; max: number }>;
  poor: { min: number };
}

interface CAGRThresholds {
  excellent: number;
  good: number;
  acceptable: number;
}

interface PresetConfig {
  payoutRatio: PayoutRatioThresholds;
  cagrThresholds: CAGRThresholds;
  basis: 'FCF' | 'AFFO' | 'NI' | 'NI_normalized';
  description: string;
}

const PRESET_CONFIGS: Record<DividendPreset, PresetConfig> = {
  'Software': {
    payoutRatio: {
      excellent: { min: 0, max: 40 },
      good: [{ min: 40, max: 60 }],
      poor: { min: 60 }
    },
    cagrThresholds: {
      excellent: 6,
      good: 3,
      acceptable: 0
    },
    basis: 'FCF',
    description: 'Software: Niedrige Payout (≤40%), hohes Wachstum (≥6%)'
  },
  
  'Consumer Staples': {
    payoutRatio: {
      excellent: { min: 50, max: 70 },
      good: [
        { min: 35, max: 50 },
        { min: 70, max: 85 }
      ],
      poor: { min: 85 }
    },
    cagrThresholds: {
      excellent: 5,
      good: 3,
      acceptable: 0
    },
    basis: 'FCF',
    description: 'Consumer Staples: Mittlere Payout (50-70%), stabiles Wachstum (≥5%)'
  },
  
  'Industrials': {
    payoutRatio: {
      excellent: { min: 40, max: 60 },
      good: [
        { min: 0, max: 40 },
        { min: 60, max: 75 }
      ],
      poor: { min: 75 }
    },
    cagrThresholds: {
      excellent: 6,
      good: 3,
      acceptable: 0
    },
    basis: 'FCF',
    description: 'Industrials: Ausgeglichene Payout (40-60%), gutes Wachstum (≥6%)'
  },
  
  'RetailLogistics': {
    payoutRatio: {
      excellent: { min: 30, max: 50 },
      good: [
        { min: 0, max: 30 },
        { min: 50, max: 70 }
      ],
      poor: { min: 70 }
    },
    cagrThresholds: {
      excellent: 5,
      good: 2,
      acceptable: 0
    },
    basis: 'FCF',
    description: 'Retail/Logistics: Moderate Payout (30-50%), moderates Wachstum (≥5%)'
  },
  
  'UtilitiesTelecom': {
    payoutRatio: {
      excellent: { min: 65, max: 85 },
      good: [
        { min: 55, max: 65 },
        { min: 85, max: 95 }
      ],
      poor: { min: 95 }
    },
    cagrThresholds: {
      excellent: 3,
      good: 1,
      acceptable: 0
    },
    basis: 'AFFO',
    description: 'Utilities/Telecom: Hohe Payout (65-85%), niedriges Wachstum (≥3%) [AFFO-Basis]'
  },
  
  'EnergyMaterials': {
    payoutRatio: {
      excellent: { min: 30, max: 50 },
      good: [
        { min: 0, max: 30 },
        { min: 50, max: 70 }
      ],
      poor: { min: 70 }
    },
    cagrThresholds: {
      excellent: 4,
      good: 2,
      acceptable: 0
    },
    basis: 'FCF',
    description: 'Energy/Materials: Moderate Payout (30-50%), zyklisches Wachstum (≥4%)'
  },
  
  'Healthcare': {
    payoutRatio: {
      excellent: { min: 30, max: 50 },
      good: [
        { min: 0, max: 30 },
        { min: 50, max: 65 }
      ],
      poor: { min: 65 }
    },
    cagrThresholds: {
      excellent: 6,
      good: 3,
      acceptable: 0
    },
    basis: 'FCF',
    description: 'Healthcare: Moderate Payout (30-50%), hohes Wachstum (≥6%)'
  },
  
  'Banks': {
    payoutRatio: {
      excellent: { min: 35, max: 55 },
      good: [
        { min: 20, max: 35 },
        { min: 55, max: 70 }
      ],
      poor: { min: 70 }
    },
    cagrThresholds: {
      excellent: 5,
      good: 2,
      acceptable: 0
    },
    basis: 'NI_normalized',
    description: 'Banks: Ausgeglichene Payout (35-55%), stabiles Wachstum (≥5%) [NI-Basis]'
  },
  
  'Insurance': {
    payoutRatio: {
      excellent: { min: 35, max: 60 },
      good: [
        { min: 20, max: 35 },
        { min: 60, max: 75 }
      ],
      poor: { min: 75 }
    },
    cagrThresholds: {
      excellent: 5,
      good: 2,
      acceptable: 0
    },
    basis: 'NI',
    description: 'Insurance: Ausgeglichene Payout (35-60%), moderates Wachstum (≥5%) [NI-Basis]'
  },
  
  'Standard (Nicht-Finanz)': {
    payoutRatio: {
      excellent: { min: 40, max: 60 },
      good: [
        { min: 0, max: 40 },
        { min: 60, max: 75 }
      ],
      poor: { min: 75 }
    },
    cagrThresholds: {
      excellent: 6,
      good: 3,
      acceptable: 0
    },
    basis: 'FCF',
    description: 'Standard: Ausgeglichene Payout (40-60%), gutes Wachstum (≥6%)'
  }
};

/**
 * Calculate payout ratio score based on preset-specific thresholds
 * Returns 0-2 points
 */
export function getPayoutRatioScore(ratio: number | null, preset: DividendPreset): number {
  if (ratio === null || ratio < 0) return 0;
  
  const config = PRESET_CONFIGS[preset];
  
  // Check excellent range (2 points)
  if (ratio >= config.payoutRatio.excellent.min && ratio <= config.payoutRatio.excellent.max) {
    return 2;
  }
  
  // Check good ranges (1 point)
  for (const range of config.payoutRatio.good) {
    if (ratio >= range.min && ratio <= range.max) {
      return 1;
    }
  }
  
  // Poor range (0 points)
  return 0;
}

/**
 * Calculate streak score
 * Returns 0-1 points
 */
export function getStreakScore(streak: number): number {
  if (streak >= 10) return 1;
  if (streak >= 5) return 0.66;
  if (streak >= 1) return 0.34;
  return 0; // Cut in last 5 years
}

/**
 * Calculate CAGR score based on preset-specific thresholds
 * Returns 0-1 points
 */
export function getCAGRScore(cagr: number | null, preset: DividendPreset): number {
  if (cagr === null) return 0;
  
  const config = PRESET_CONFIGS[preset];
  
  if (cagr >= config.cagrThresholds.excellent) return 1;
  if (cagr >= config.cagrThresholds.good) return 0.66;
  if (cagr >= config.cagrThresholds.acceptable) return 0.34;
  return 0; // Negative growth
}

/**
 * Calculate total dividend growth score (streak + CAGR)
 * Returns 0-2 points
 */
export function getDividendGrowthScore(
  streak: number,
  cagr: number | null,
  preset: DividendPreset
): number {
  const streakScore = getStreakScore(streak);
  const cagrScore = getCAGRScore(cagr, preset);
  return streakScore + cagrScore;
}

/**
 * Get preset configuration
 */
export function getPresetConfig(preset: DividendPreset): PresetConfig {
  return PRESET_CONFIGS[preset];
}

/**
 * Get all available presets
 */
export function getAllPresets(): DividendPreset[] {
  return Object.keys(PRESET_CONFIGS) as DividendPreset[];
}

/**
 * Check if preset uses non-FCF basis (warning needed)
 */
export function isNonFCFPreset(preset: DividendPreset): boolean {
  const config = PRESET_CONFIGS[preset];
  return config.basis !== 'FCF';
}
