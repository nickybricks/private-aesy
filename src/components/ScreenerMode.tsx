import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import QuantAnalysisTable from '@/components/QuantAnalysisTable';
import { QuantAnalysisResult } from '@/api/quantAnalyzerApi';
import { Filter, ChevronDown } from 'lucide-react';

interface ScreenerModeProps {
  cachedStocks: QuantAnalysisResult[];
}

export const ScreenerMode = ({ cachedStocks }: ScreenerModeProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    minAesyScore: '',
    maxAesyScore: '',
    minYearsProfit: '',
    maxYearsProfit: '',
    minPE: '',
    maxPE: '',
    minROIC: '',
    maxROIC: '',
    minROE: '',
    maxROE: '',
    minDividendYield: '',
    maxDividendYield: '',
    minEpsGrowth3y: '',
    maxEpsGrowth3y: '',
    minEpsGrowth: '',
    maxEpsGrowth: '',
    minEpsGrowth10y: '',
    maxEpsGrowth10y: '',
    minRevenueGrowth3y: '',
    maxRevenueGrowth3y: '',
    minRevenueGrowth: '',
    maxRevenueGrowth: '',
    minRevenueGrowth10y: '',
    maxRevenueGrowth10y: '',
    minNetDebtToEbitda: '',
    maxNetDebtToEbitda: '',
    minNetMargin: '',
    maxNetMargin: '',
    minFcfMargin: '',
    maxFcfMargin: '',
    sector: 'all',
    searchQuery: ''
  });

  const filteredStocks = useMemo(() => {
    return cachedStocks.filter(stock => {
      // Aesy Score filter
      if (filters.minAesyScore !== '' && stock.buffettScore < parseFloat(filters.minAesyScore)) return false;
      if (filters.maxAesyScore !== '' && stock.buffettScore > parseFloat(filters.maxAesyScore)) return false;
      
      // Years of Profitability filter
      if (filters.minYearsProfit !== '' && stock.criteria.yearsOfProfitability.value && stock.criteria.yearsOfProfitability.value < parseFloat(filters.minYearsProfit)) return false;
      if (filters.maxYearsProfit !== '' && stock.criteria.yearsOfProfitability.value && stock.criteria.yearsOfProfitability.value > parseFloat(filters.maxYearsProfit)) return false;
      
      // PE filter
      if (filters.minPE !== '' && stock.criteria.pe.value && stock.criteria.pe.value < parseFloat(filters.minPE)) return false;
      if (filters.maxPE !== '' && stock.criteria.pe.value && stock.criteria.pe.value > parseFloat(filters.maxPE)) return false;
      
      // ROIC filter
      if (filters.minROIC !== '' && stock.criteria.roic.value && stock.criteria.roic.value < parseFloat(filters.minROIC)) return false;
      if (filters.maxROIC !== '' && stock.criteria.roic.value && stock.criteria.roic.value > parseFloat(filters.maxROIC)) return false;
      
      // ROE filter
      if (filters.minROE !== '' && stock.criteria.roe.value && stock.criteria.roe.value < parseFloat(filters.minROE)) return false;
      if (filters.maxROE !== '' && stock.criteria.roe.value && stock.criteria.roe.value > parseFloat(filters.maxROE)) return false;
      
      // Dividend Yield filter
      if (filters.minDividendYield !== '' && stock.criteria.dividendYield.value && stock.criteria.dividendYield.value < parseFloat(filters.minDividendYield)) return false;
      if (filters.maxDividendYield !== '' && stock.criteria.dividendYield.value && stock.criteria.dividendYield.value > parseFloat(filters.maxDividendYield)) return false;
      
      // EPS Growth 3Y filter
      if (filters.minEpsGrowth3y !== '' && stock.criteria.epsGrowth.cagr3y && stock.criteria.epsGrowth.cagr3y < parseFloat(filters.minEpsGrowth3y)) return false;
      if (filters.maxEpsGrowth3y !== '' && stock.criteria.epsGrowth.cagr3y && stock.criteria.epsGrowth.cagr3y > parseFloat(filters.maxEpsGrowth3y)) return false;
      
      // EPS Growth 5Y filter
      if (filters.minEpsGrowth !== '' && stock.criteria.epsGrowth.value && stock.criteria.epsGrowth.value < parseFloat(filters.minEpsGrowth)) return false;
      if (filters.maxEpsGrowth !== '' && stock.criteria.epsGrowth.value && stock.criteria.epsGrowth.value > parseFloat(filters.maxEpsGrowth)) return false;
      
      // EPS Growth 10Y filter
      if (filters.minEpsGrowth10y !== '' && stock.criteria.epsGrowth.cagr10y && stock.criteria.epsGrowth.cagr10y < parseFloat(filters.minEpsGrowth10y)) return false;
      if (filters.maxEpsGrowth10y !== '' && stock.criteria.epsGrowth.cagr10y && stock.criteria.epsGrowth.cagr10y > parseFloat(filters.maxEpsGrowth10y)) return false;
      
      // Revenue Growth 3Y filter
      if (filters.minRevenueGrowth3y !== '' && stock.criteria.revenueGrowth.cagr3y && stock.criteria.revenueGrowth.cagr3y < parseFloat(filters.minRevenueGrowth3y)) return false;
      if (filters.maxRevenueGrowth3y !== '' && stock.criteria.revenueGrowth.cagr3y && stock.criteria.revenueGrowth.cagr3y > parseFloat(filters.maxRevenueGrowth3y)) return false;
      
      // Revenue Growth 5Y filter
      if (filters.minRevenueGrowth !== '' && stock.criteria.revenueGrowth.value && stock.criteria.revenueGrowth.value < parseFloat(filters.minRevenueGrowth)) return false;
      if (filters.maxRevenueGrowth !== '' && stock.criteria.revenueGrowth.value && stock.criteria.revenueGrowth.value > parseFloat(filters.maxRevenueGrowth)) return false;
      
      // Revenue Growth 10Y filter
      if (filters.minRevenueGrowth10y !== '' && stock.criteria.revenueGrowth.cagr10y && stock.criteria.revenueGrowth.cagr10y < parseFloat(filters.minRevenueGrowth10y)) return false;
      if (filters.maxRevenueGrowth10y !== '' && stock.criteria.revenueGrowth.cagr10y && stock.criteria.revenueGrowth.cagr10y > parseFloat(filters.maxRevenueGrowth10y)) return false;
      
      // Net Debt to EBITDA filter
      if (filters.minNetDebtToEbitda !== '' && stock.criteria.netDebtToEbitda.value && stock.criteria.netDebtToEbitda.value < parseFloat(filters.minNetDebtToEbitda)) return false;
      if (filters.maxNetDebtToEbitda !== '' && stock.criteria.netDebtToEbitda.value && stock.criteria.netDebtToEbitda.value > parseFloat(filters.maxNetDebtToEbitda)) return false;
      
      // Net Margin filter
      if (filters.minNetMargin !== '' && stock.criteria.netMargin.value && stock.criteria.netMargin.value < parseFloat(filters.minNetMargin)) return false;
      if (filters.maxNetMargin !== '' && stock.criteria.netMargin.value && stock.criteria.netMargin.value > parseFloat(filters.maxNetMargin)) return false;
      
      // FCF Margin filter
      if (filters.minFcfMargin !== '' && stock.criteria.fcfMargin.value && stock.criteria.fcfMargin.value < parseFloat(filters.minFcfMargin)) return false;
      if (filters.maxFcfMargin !== '' && stock.criteria.fcfMargin.value && stock.criteria.fcfMargin.value > parseFloat(filters.maxFcfMargin)) return false;
      
      // Sector filter
      if (filters.sector !== 'all' && stock.sector !== filters.sector) return false;
      
      // Search filter
      if (filters.searchQuery && !stock.symbol.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
          !stock.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      
      return true;
    });
  }, [cachedStocks, filters]);

  const sectors = useMemo(() => {
    const uniqueSectors = new Set(cachedStocks.map(s => s.sector));
    return Array.from(uniqueSectors).sort();
  }, [cachedStocks]);


  return (
    <div className="space-y-6">
      {/* Filter Panel */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <Card className="p-6">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Filter</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {/* Search */}
              <div className="space-y-2">
                <Label>Suche (Symbol/Name)</Label>
                <Input
                  placeholder="z.B. AAPL"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                />
              </div>

              {/* Sector */}
              <div className="space-y-2">
                <Label>Sektor</Label>
                <Select value={filters.sector} onValueChange={(value) => setFilters({ ...filters, sector: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Sektoren</SelectItem>
                    {sectors.map(sector => (
                      <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aesy Score */}
              <div className="space-y-2">
                <Label>Aesy Score (0-14)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minAesyScore}
                    onChange={(e) => setFilters({ ...filters, minAesyScore: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxAesyScore}
                    onChange={(e) => setFilters({ ...filters, maxAesyScore: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* P/E Ratio */}
              <div className="space-y-2">
                <Label>KGV</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPE}
                    onChange={(e) => setFilters({ ...filters, minPE: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPE}
                    onChange={(e) => setFilters({ ...filters, maxPE: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* ROIC */}
              <div className="space-y-2">
                <Label>ROIC (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minROIC}
                    onChange={(e) => setFilters({ ...filters, minROIC: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxROIC}
                    onChange={(e) => setFilters({ ...filters, maxROIC: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* ROE */}
              <div className="space-y-2">
                <Label>ROE (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minROE}
                    onChange={(e) => setFilters({ ...filters, minROE: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxROE}
                    onChange={(e) => setFilters({ ...filters, maxROE: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Dividend Yield */}
              <div className="space-y-2">
                <Label>Dividende (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minDividendYield}
                    onChange={(e) => setFilters({ ...filters, minDividendYield: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxDividendYield}
                    onChange={(e) => setFilters({ ...filters, maxDividendYield: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Revenue Growth */}
              <div className="space-y-2">
                <Label>Umsatz-Wachstum (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minRevenueGrowth}
                    onChange={(e) => setFilters({ ...filters, minRevenueGrowth: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxRevenueGrowth}
                    onChange={(e) => setFilters({ ...filters, maxRevenueGrowth: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Years of Profitability */}
              <div className="space-y-2">
                <Label>Jahre profitabel</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minYearsProfit}
                    onChange={(e) => setFilters({ ...filters, minYearsProfit: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxYearsProfit}
                    onChange={(e) => setFilters({ ...filters, maxYearsProfit: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* EPS Growth 3Y */}
              <div className="space-y-2">
                <Label>EPS-Wachstum 3J (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minEpsGrowth3y}
                    onChange={(e) => setFilters({ ...filters, minEpsGrowth3y: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxEpsGrowth3y}
                    onChange={(e) => setFilters({ ...filters, maxEpsGrowth3y: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* EPS Growth 5Y */}
              <div className="space-y-2">
                <Label>EPS-Wachstum 5J (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minEpsGrowth}
                    onChange={(e) => setFilters({ ...filters, minEpsGrowth: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxEpsGrowth}
                    onChange={(e) => setFilters({ ...filters, maxEpsGrowth: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* EPS Growth 10Y */}
              <div className="space-y-2">
                <Label>EPS-Wachstum 10J (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minEpsGrowth10y}
                    onChange={(e) => setFilters({ ...filters, minEpsGrowth10y: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxEpsGrowth10y}
                    onChange={(e) => setFilters({ ...filters, maxEpsGrowth10y: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Revenue Growth 3Y */}
              <div className="space-y-2">
                <Label>Umsatz-Wachstum 3J (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minRevenueGrowth3y}
                    onChange={(e) => setFilters({ ...filters, minRevenueGrowth3y: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxRevenueGrowth3y}
                    onChange={(e) => setFilters({ ...filters, maxRevenueGrowth3y: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Revenue Growth 10Y */}
              <div className="space-y-2">
                <Label>Umsatz-Wachstum 10J (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minRevenueGrowth10y}
                    onChange={(e) => setFilters({ ...filters, minRevenueGrowth10y: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxRevenueGrowth10y}
                    onChange={(e) => setFilters({ ...filters, maxRevenueGrowth10y: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Net Debt to EBITDA */}
              <div className="space-y-2">
                <Label>Verschuldung (NetDebt/EBITDA)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minNetDebtToEbitda}
                    onChange={(e) => setFilters({ ...filters, minNetDebtToEbitda: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxNetDebtToEbitda}
                    onChange={(e) => setFilters({ ...filters, maxNetDebtToEbitda: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Net Margin */}
              <div className="space-y-2">
                <Label>Nettomarge (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minNetMargin}
                    onChange={(e) => setFilters({ ...filters, minNetMargin: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxNetMargin}
                    onChange={(e) => setFilters({ ...filters, maxNetMargin: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* FCF Margin */}
              <div className="space-y-2">
                <Label>FCF-Marge (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minFcfMargin}
                    onChange={(e) => setFilters({ ...filters, minFcfMargin: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxFcfMargin}
                    onChange={(e) => setFilters({ ...filters, maxFcfMargin: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Results Table */}
      {filteredStocks.length > 0 ? (
        <QuantAnalysisTable 
          results={filteredStocks} 
          isLoading={false}
        />
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Keine Aktien gefunden, die den Filter-Kriterien entsprechen.
          </p>
        </Card>
      )}
    </div>
  );
};
