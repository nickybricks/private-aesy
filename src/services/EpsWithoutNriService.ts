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

export interface EpsWoNriResult {
  quarters: EpsWoNriQuarter[]; // sorted desc by date
  ttm: { value: number | null; complete: boolean };
  annual: EpsWoNriAnnual[]; // sorted asc by year
  growth: EpsWoNriGrowthRates;
  peWoNri: number | null;
  warnings: string[];
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
  )}?period=quarter&limit=40&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('FMP income statement fetch failed');
  const json = (await res.json()) as FmpIncomeQuarterRaw[];
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

  // Prefer continuing ops; fallback to total net income
  const niCont = pickNumber(q.netIncomeFromContinuingOperations, q.netIncome);
  if (niCont === null) return null;

  const taxRate = effectiveTaxRate(q);

  const unusualPretax = (q.unusualItems ?? 0) + (q.goodwillImpairment ?? 0) + (q.impairmentOfGoodwillAndIntangibleAssets ?? 0);
  const unusualAfterTax = unusualPretax * (1 - taxRate);

  // Remove unusuals from NI to get NI without NRI
  const niWoNri = niCont - unusualAfterTax;
  const epsWoNri = niWoNri / shares;

  return {
    date: dateStr,
    year,
    period: q.period,
    epsWoNri,
    niContOps: niCont,
    unusualsAfterTax: unusualAfterTax,
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

  const ttm = sumLastN(quartersDesc, 4, (q) => q.epsWoNri);

  const annual = buildAnnual(quartersDesc);
  const growth = growthFromAnnual(annual);

  const peWoNri = ttm.value && ttm.value > 0 && currentPrice ? currentPrice / ttm.value : null;

  const warnings: string[] = [];
  if (ttm.value === null || !ttm.complete) warnings.push('TTM unvollständig');

  const anyUnusualAvailable = raw.some(
    (r) =>
      (typeof r.unusualItems === 'number' && r.unusualItems !== 0) ||
      (typeof r.goodwillImpairment === 'number' && r.goodwillImpairment !== 0) ||
      (typeof r.impairmentOfGoodwillAndIntangibleAssets === 'number' && r.impairmentOfGoodwillAndIntangibleAssets !== 0)
  );
  if (!anyUnusualAvailable) warnings.push('Keine Bereinigung vorhanden (Unusuals/Impairments nicht verfügbar)');

  const anySharesMissing = raw.some((r) => !r.weightedAverageShsOutDil || r.weightedAverageShsOutDil <= 0);
  if (anySharesMissing) warnings.push('Verwässerte Aktienanzahl teilweise fehlend – betroffene Quartale ignoriert');

  return { quarters: quartersDesc, ttm, annual, growth, peWoNri, warnings };
}

export const EpsWoNriTexts = {
  tooltip:
    'Gewinn je Aktie ohne Sondereffekte. Zeigt die laufende Ertragskraft stabiler als das rohe EPS.',
  hint:
    'Hinweis: Cashflow je Aktie ist langfristig oft der robustere Indikator; Differenzen prüfen.',
};
