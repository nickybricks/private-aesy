import { supabase } from '@/integrations/supabase/client';

// Types from FMP (subset, add fallbacks for missing fields)
interface FmpIncomeQuarterRaw {
  date: string; // e.g. "2025-06-30"
  calendarYear?: string; // e.g. "2025"
  period?: string; // e.g. "Q4"
  netIncome?: number;
  netIncomeFromContinuingOperations?: number;
  incomeBeforeTax?: number;
  incomeTaxExpense?: number;
  unusualItems?: number; // may be +/-, pretax
  goodwillImpairment?: number; // pretax
  impairmentOfGoodwillAndIntangibleAssets?: number; // pretax
  weightedAverageShsOutDil?: number; // diluted shares
  eps?: number;
  epsdiluted?: number;
}

export interface EpsWoNriQuarter {
  date: string; // ISO date
  year: number;
  period?: string;
  epsWoNri: number; // per share
  niContOps: number; // after tax
  unusualsAfterTax: number; // total unusuals (incl. impairments) after tax (can be +/-)
  dilutedShares: number;
}

export interface EpsWoNriAnnual {
  year: number;
  epsWoNri: number; // sum of 4 quarters in that year
  quarters: number; // number of quarters used
}

export interface EpsWoNriGrowthRates {
  cagr3y: number | null;
  cagr5y: number | null;
  cagr10y: number | null;
}

export interface EpsWoNriDiagnostics {
  eps_wonri_ttm: number | null;
  eps_gaap_ttm: number | null;
  nri_adjustment_ttm: number | null;
  ttm_complete: boolean;
  nri_data_missing: boolean;
}

export interface EpsWoNriResult {
  quarters: EpsWoNriQuarter[]; // sorted desc by date
  ttm: { value: number | null; complete: boolean };
  annual: EpsWoNriAnnual[]; // sorted asc by year
  growth: EpsWoNriGrowthRates;
  peWoNri: number | null;
  warnings: string[];
  diagnostics: EpsWoNriDiagnostics;
}

async function getFmpApiKey(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('get-fmp-key');
  if (error) throw error;
  return data.apiKey as string;
}

async function fetchQuarterlyIncomeStatements(ticker: string): Promise<FmpIncomeQuarterRaw[]> {
  const apiKey = await getFmpApiKey();
  const url = `https://financialmodelingprep.com/api/v3/income-statement/${encodeURIComponent(
    ticker
  )}?period=quarter&limit=120&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('FMP income statement fetch failed');
  const json = (await res.json()) as FmpIncomeQuarterRaw[];
  
  console.log('📊 EPS w/o NRI: FMP API Response', {
    ticker,
    url: url.replace(apiKey, 'REDACTED'),
    quartersReceived: Array.isArray(json) ? json.length : 0,
    latestQuarter: Array.isArray(json) && json[0] ? {
      date: json[0].date,
      netIncome: json[0].netIncome,
      netIncomeFromContinuingOperations: json[0].netIncomeFromContinuingOperations,
      unusualItems: json[0].unusualItems,
      goodwillImpairment: json[0].goodwillImpairment,
      impairmentOfGoodwillAndIntangibleAssets: json[0].impairmentOfGoodwillAndIntangibleAssets,
      shares: json[0].weightedAverageShsOutDil
    } : null
  });
  
  return Array.isArray(json) ? json : [];
}

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

function effectiveTaxRate(q: FmpIncomeQuarterRaw): number {
  const preTax = q.incomeBeforeTax ?? null;
  const tax = q.incomeTaxExpense ?? null;
  if (!preTax || !tax || preTax === 0) return 0.21; // fallback 21%
  const rate = tax / preTax;
  if (!isFinite(rate) || rate < 0) return 0.21;
  return clamp(rate, 0, 0.5); // defensive cap
}

function pickNumber(...vals: Array<number | undefined>): number | null {
  for (const v of vals) {
    if (typeof v === 'number' && isFinite(v)) return v;
  }
  return null;
}

function computeQuarter(q: FmpIncomeQuarterRaw): EpsWoNriQuarter | null {
  const dateStr = q.date;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear();

  const shares = q.weightedAverageShsOutDil ?? null;
  if (!shares || shares <= 0) return null; // skip invalid

  // New simplified calculation: netIncomeFromContinuingOperations / diluted shares
  const niContOps = q.netIncomeFromContinuingOperations ?? null;
  if (niContOps === null) return null;

  const epsWoNri = niContOps / shares;

  console.log('🔢 EPS w/o NRI: Computing Quarter (Simplified)', {
    date: dateStr,
    year,
    period: q.period,
    inputs: {
      netIncomeFromContinuingOps: niContOps.toFixed(2),
      dilutedShares: shares
    },
    calculated: {
      epsWoNri: epsWoNri.toFixed(4)
    }
  });

  return {
    date: dateStr,
    year,
    period: q.period,
    epsWoNri,
    niContOps: niContOps,
    unusualsAfterTax: 0, // No longer calculated, kept for type compatibility
    dilutedShares: shares,
  };
}

function sumLastN<T>(arr: T[], n: number, selector: (x: T) => number): { value: number | null; complete: boolean } {
  if (arr.length < n) return { value: null, complete: false };
  const slice = arr.slice(0, n); // assuming arr sorted DESC (most recent first)
  const valid = slice.every((x) => Number.isFinite(selector(x)));
  const total = slice.reduce((acc, x) => acc + selector(x), 0);
  return { value: valid ? total : null, complete: valid };
}

function buildAnnual(quartersDesc: EpsWoNriQuarter[]): EpsWoNriAnnual[] {
  // group by calendar year using all quarters within that year
  const map = new Map<number, { sum: number; count: number }>();
  quartersDesc.forEach((q) => {
    const entry = map.get(q.year) ?? { sum: 0, count: 0 };
    entry.sum += q.epsWoNri;
    entry.count += 1;
    map.set(q.year, entry);
  });

  const annual = Array.from(map.entries())
    .map(([year, v]) => ({ year, epsWoNri: v.sum, quarters: v.count }))
    .filter((y) => y.quarters >= 4) // require full year
    .sort((a, b) => a.year - b.year);

  return annual;
}

function cagr(start: number, end: number, years: number): number | null {
  if (years <= 0) return null;
  if (!(start > 0) || !(end > 0)) return null; // defensive (no div by 0 / negatives)
  const r = Math.pow(end / start, 1 / years) - 1;
  return isFinite(r) ? r : null;
}

function growthFromAnnual(annualAsc: EpsWoNriAnnual[]): EpsWoNriGrowthRates {
  const n = annualAsc.length;
  const last = annualAsc[n - 1]?.epsWoNri;

  const takeStart = (years: number) => (n >= years + 1 ? annualAsc[n - 1 - years]?.epsWoNri : undefined);

  const c3 = last !== undefined && takeStart(3) !== undefined ? cagr(takeStart(3) as number, last as number, 3) : null;
  const c5 = last !== undefined && takeStart(5) !== undefined ? cagr(takeStart(5) as number, last as number, 5) : null;
  const c10 = last !== undefined && takeStart(10) !== undefined ? cagr(takeStart(10) as number, last as number, 10) : null;

  return { cagr3y: c3, cagr5y: c5, cagr10y: c10 };
}

export async function calculateEpsWithoutNri(ticker: string, currentPrice?: number): Promise<EpsWoNriResult> {
  const raw = await fetchQuarterlyIncomeStatements(ticker);

  // FMP returns DESC by date (latest first) – keep it, filter invalid
  const quartersDesc = raw
    .map(computeQuarter)
    .filter((q): q is EpsWoNriQuarter => !!q)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  console.log('📈 EPS w/o NRI: Processing Complete', {
    ticker,
    totalQuarters: quartersDesc.length,
    validQuarters: quartersDesc.filter(q => q.epsWoNri > 0).length,
    dateRange: quartersDesc.length > 0 ? {
      from: quartersDesc[quartersDesc.length - 1].date,
      to: quartersDesc[0].date
    } : null
  });

  const ttm = sumLastN(quartersDesc, 4, (q) => q.epsWoNri);
  
  console.log('📊 EPS w/o NRI: TTM Calculation', {
    value: ttm.value?.toFixed(4),
    complete: ttm.complete,
    quarters: quartersDesc.slice(0, 4).map(q => ({
      date: q.date,
      epsWoNri: q.epsWoNri.toFixed(4)
    }))
  });

  const annual = buildAnnual(quartersDesc);
  
  console.log('📅 EPS w/o NRI: Annual Data', {
    yearsAvailable: annual.length,
    annual: annual.map(a => ({
      year: a.year,
      epsWoNri: a.epsWoNri.toFixed(4),
      quarters: a.quarters
    }))
  });
  
  const growth = growthFromAnnual(annual);
  
  console.log('📈 EPS w/o NRI: Growth Rates', {
    cagr3y: growth.cagr3y ? `${(growth.cagr3y * 100).toFixed(2)}%` : null,
    cagr5y: growth.cagr5y ? `${(growth.cagr5y * 100).toFixed(2)}%` : null,
    cagr10y: growth.cagr10y ? `${(growth.cagr10y * 100).toFixed(2)}%` : null
  });

  const peWoNri = ttm.value && ttm.value > 0 && currentPrice ? currentPrice / ttm.value : null;

  const warnings: string[] = [];
  if (ttm.value === null || !ttm.complete) warnings.push('TTM unvollständig');

  const anyContOpsAvailable = raw.some((r) => typeof r.netIncomeFromContinuingOperations === 'number');
  if (!anyContOpsAvailable) warnings.push('Net Income from Continuing Operations nicht verfügbar');

  const anySharesMissing = raw.some((r) => !r.weightedAverageShsOutDil || r.weightedAverageShsOutDil <= 0);
  if (anySharesMissing) warnings.push('Verwässerte Aktienanzahl teilweise fehlend – betroffene Quartale ignoriert');

  // Calculate diagnostics
  const nri_adjustment_ttm = quartersDesc.length >= 4 
    ? quartersDesc.slice(0, 4).reduce((sum, q) => sum + (q.unusualsAfterTax / q.dilutedShares), 0)
    : null;

  const eps_gaap_ttm = raw.length >= 4
    ? raw.slice(0, 4).reduce((sum, r) => {
        const eps = r.epsdiluted ?? r.eps ?? 0;
        return sum + eps;
      }, 0)
    : null;

  const diagnostics: EpsWoNriDiagnostics = {
    eps_wonri_ttm: ttm.value,
    eps_gaap_ttm,
    nri_adjustment_ttm,
    ttm_complete: ttm.complete,
    nri_data_missing: !anyContOpsAvailable,
  };

  console.log('🔍 EPS w/o NRI: Diagnostics', {
    eps_wonri_ttm: diagnostics.eps_wonri_ttm?.toFixed(4),
    eps_gaap_ttm: diagnostics.eps_gaap_ttm?.toFixed(4),
    nri_adjustment_ttm: diagnostics.nri_adjustment_ttm?.toFixed(4),
    ttm_complete: diagnostics.ttm_complete,
    nri_data_missing: diagnostics.nri_data_missing,
    warnings
  });

  return { quarters: quartersDesc, ttm, annual, growth, peWoNri, warnings, diagnostics };
}

export const EpsWoNriTexts = {
  tooltip:
    'EPS w/o NRI (TTM): Gewinn je Aktie aus fortgeführten Geschäftsbereichen (Net Income from Continuing Operations). Die letzten 4 Quartale werden aufsummiert; je Quartal durch verwässerte Aktienzahl geteilt.',
  hint:
    'Hinweis: Diese Kennzahl basiert auf Net Income from Continuing Operations und blendet diskontinuierliche Geschäftsbereiche aus.',
};
