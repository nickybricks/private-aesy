export type IndustryPreset = 
  | 'default'
  | 'software'
  | 'consumer_staples'
  | 'industrial'
  | 'retail'
  | 'pharma';

export interface IndustryScoringConfig {
  netDebtToEbitda: {
    thresholds: number[];
    scores: number[];
  };
  interestCoverage: {
    thresholds: number[];
    scores: number[];
  };
  debtToAssets: {
    thresholds: number[];
    scores: number[];
  };
  currentRatio: {
    thresholds: number[];
    scores: number[];
  };
}

export const INDUSTRY_PRESETS: Record<IndustryPreset, { name: string; config: IndustryScoringConfig }> = {
  default: {
    name: 'Standard (Konservativ)',
    config: {
      netDebtToEbitda: {
        thresholds: [1.0, 1.5, 2.0, 3.0],
        scores: [6, 5, 4, 2, 0]
      },
      interestCoverage: {
        thresholds: [12, 8, 5, 3],
        scores: [6, 5, 3, 1, 0]
      },
      debtToAssets: {
        thresholds: [40, 50],
        scores: [3, 1, 0]
      },
      currentRatio: {
        thresholds: [2.0, 1.5, 1.2],
        scores: [4, 3, 1, 0]
      }
    }
  },
  software: {
    name: 'Software / Media / IT-Services',
    config: {
      netDebtToEbitda: {
        thresholds: [0.5, 1.0, 1.5, 2.0],
        scores: [6, 5, 4, 2, 0]
      },
      interestCoverage: {
        thresholds: [15, 10, 7, 4],
        scores: [6, 5, 3, 1, 0]
      },
      debtToAssets: {
        thresholds: [25, 35, 45],
        scores: [4, 3, 1, 0]
      },
      currentRatio: {
        thresholds: [1.8, 1.4, 1.1],
        scores: [4, 3, 1, 0]
      }
    }
  },
  consumer_staples: {
    name: 'Consumer Staples / Marken (defensiv)',
    config: {
      netDebtToEbitda: {
        thresholds: [1.5, 2.0, 2.5, 3.0],
        scores: [6, 5, 4, 2, 0]
      },
      interestCoverage: {
        thresholds: [10, 7, 5, 3],
        scores: [6, 5, 3, 1, 0]
      },
      debtToAssets: {
        thresholds: [35, 45, 55],
        scores: [4, 3, 1, 0]
      },
      currentRatio: {
        thresholds: [1.5, 1.3, 1.1],
        scores: [4, 3, 1, 0]
      }
    }
  },
  industrial: {
    name: 'Industrie / Produktion',
    config: {
      netDebtToEbitda: {
        thresholds: [1.0, 1.5, 2.0, 3.0],
        scores: [6, 5, 4, 2, 0]
      },
      interestCoverage: {
        thresholds: [12, 8, 5, 3],
        scores: [6, 5, 3, 1, 0]
      },
      debtToAssets: {
        thresholds: [40, 50],
        scores: [3, 1, 0]
      },
      currentRatio: {
        thresholds: [2.0, 1.5, 1.2],
        scores: [4, 3, 1, 0]
      }
    }
  },
  retail: {
    name: 'Handel / Einzelhandel',
    config: {
      netDebtToEbitda: {
        thresholds: [1.0, 1.5, 2.0, 3.0],
        scores: [6, 5, 4, 2, 0]
      },
      interestCoverage: {
        thresholds: [12, 8, 5, 3],
        scores: [6, 5, 3, 1, 0]
      },
      debtToAssets: {
        thresholds: [40, 50],
        scores: [3, 1, 0]
      },
      currentRatio: {
        thresholds: [2.0, 1.5, 1.2],
        scores: [4, 3, 1, 0]
      }
    }
  },
  pharma: {
    name: 'Pharma / Biotechnologie',
    config: {
      netDebtToEbitda: {
        thresholds: [1.0, 1.5, 2.0, 3.0],
        scores: [6, 5, 4, 2, 0]
      },
      interestCoverage: {
        thresholds: [12, 8, 5, 3],
        scores: [6, 5, 3, 1, 0]
      },
      debtToAssets: {
        thresholds: [40, 50],
        scores: [3, 1, 0]
      },
      currentRatio: {
        thresholds: [2.0, 1.5, 1.2],
        scores: [4, 3, 1, 0]
      }
    }
  }
};

export const getScoreFromThresholds = (
  value: number,
  thresholds: number[],
  scores: number[],
  ascending: boolean = false
): number => {
  if (ascending) {
    // For metrics where higher is better (e.g., Interest Coverage, Current Ratio)
    for (let i = 0; i < thresholds.length; i++) {
      if (value >= thresholds[i]) {
        return scores[i];
      }
    }
    return scores[scores.length - 1];
  } else {
    // For metrics where lower is better (e.g., Net Debt/EBITDA, Debt/Assets)
    for (let i = 0; i < thresholds.length; i++) {
      if (value <= thresholds[i]) {
        return scores[i];
      }
    }
    return scores[scores.length - 1];
  }
};
