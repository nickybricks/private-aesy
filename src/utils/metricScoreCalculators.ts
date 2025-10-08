// Helper functions to calculate scores for each metric

export const calculateROEScore = (value: number | null): { score: number; maxScore: number } => {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value >= 20) return { score: 4, maxScore: 4 };
  if (value >= 15) return { score: 3, maxScore: 4 };
  if (value >= 10) return { score: 2, maxScore: 4 };
  if (value >= 5) return { score: 1, maxScore: 4 };
  return { score: 0, maxScore: 4 };
};

export const calculateROICScore = (value: number | null): { score: number; maxScore: number } => {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value >= 15) return { score: 4, maxScore: 4 };
  if (value >= 12) return { score: 3, maxScore: 4 };
  if (value >= 8) return { score: 2, maxScore: 4 };
  if (value >= 5) return { score: 1, maxScore: 4 };
  return { score: 0, maxScore: 4 };
};

export const calculateOperatingMarginScore = (value: number | null): { score: number; maxScore: number } => {
  if (value === null) return { score: 0, maxScore: 3 };
  if (value >= 20) return { score: 3, maxScore: 3 };
  if (value >= 15) return { score: 2, maxScore: 3 };
  if (value >= 10) return { score: 1, maxScore: 3 };
  return { score: 0, maxScore: 3 };
};

export const calculateNetMarginScore = (value: number | null): { score: number; maxScore: number } => {
  if (value === null) return { score: 0, maxScore: 3 };
  // Value comes as decimal, so convert to percentage
  const percentage = value * 100;
  if (percentage >= 15) return { score: 3, maxScore: 3 };
  if (percentage >= 10) return { score: 2, maxScore: 3 };
  if (percentage >= 5) return { score: 1, maxScore: 3 };
  return { score: 0, maxScore: 3 };
};

export const calculateROAScore = (value: number | null): { score: number; maxScore: number } => {
  if (value === null) return { score: 0, maxScore: 1 };
  if (value >= 8) return { score: 1, maxScore: 1 };
  return { score: 0, maxScore: 1 };
};

export const calculateYearsOfProfitabilityScore = (
  historicalNetIncome: Array<{ year: string | number; value: number; isProfitable?: boolean }> | undefined
): { score: number; maxScore: number } => {
  if (!historicalNetIncome || historicalNetIncome.length === 0) {
    return { score: 0, maxScore: 4 };
  }

  const profitableYears = historicalNetIncome.filter(item => 
    item.isProfitable !== undefined ? item.isProfitable : item.value > 0
  ).length;

  if (profitableYears === 10) return { score: 4, maxScore: 4 };
  if (profitableYears >= 7) return { score: 3, maxScore: 4 };
  if (profitableYears >= 5) return { score: 2, maxScore: 4 };
  if (profitableYears >= 3) return { score: 1, maxScore: 4 };
  return { score: 0, maxScore: 4 };
};
