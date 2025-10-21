import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import QuantAnalysisTable from '@/components/QuantAnalysisTable';
import { QuantAnalysisResult } from '@/api/quantAnalyzerApi';
import { Filter, X } from 'lucide-react';

interface ScreenerModeProps {
  cachedStocks: QuantAnalysisResult[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const ScreenerMode = ({ cachedStocks, onRefresh, isRefreshing }: ScreenerModeProps) => {
  const [filters, setFilters] = useState({
    minAesyScore: '',
    maxAesyScore: '',
    minPE: '',
    maxPE: '',
    minROIC: '',
    maxROIC: '',
    minROE: '',
    maxROE: '',
    minDividendYield: '',
    maxDividendYield: '',
    minRevenueGrowth: '',
    maxRevenueGrowth: '',
    minNetMargin: '',
    maxNetMargin: '',
    sector: 'all',
    searchQuery: ''
  });

  const filteredStocks = useMemo(() => {
    return cachedStocks.filter(stock => {
      // Aesy Score filter
      if (filters.minAesyScore !== '' && stock.buffettScore < parseFloat(filters.minAesyScore)) return false;
      if (filters.maxAesyScore !== '' && stock.buffettScore > parseFloat(filters.maxAesyScore)) return false;
      
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
      
      // Revenue Growth filter
      if (filters.minRevenueGrowth !== '' && stock.criteria.revenueGrowth.value && stock.criteria.revenueGrowth.value < parseFloat(filters.minRevenueGrowth)) return false;
      if (filters.maxRevenueGrowth !== '' && stock.criteria.revenueGrowth.value && stock.criteria.revenueGrowth.value > parseFloat(filters.maxRevenueGrowth)) return false;
      
      // Net Margin filter
      if (filters.minNetMargin !== '' && stock.criteria.netMargin.value && stock.criteria.netMargin.value < parseFloat(filters.minNetMargin)) return false;
      if (filters.maxNetMargin !== '' && stock.criteria.netMargin.value && stock.criteria.netMargin.value > parseFloat(filters.maxNetMargin)) return false;
      
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

  const resetFilters = () => {
    setFilters({
      minAesyScore: '',
      maxAesyScore: '',
      minPE: '',
      maxPE: '',
      minROIC: '',
      maxROIC: '',
      minROE: '',
      maxROE: '',
      minDividendYield: '',
      maxDividendYield: '',
      minRevenueGrowth: '',
      maxRevenueGrowth: '',
      minNetMargin: '',
      maxNetMargin: '',
      sector: 'all',
      searchQuery: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter Panel */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Filter</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-1" />
              Zurücksetzen
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
              Preise aktualisieren
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <Label>Aesy Score</Label>
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
            <Label>Dividendenrendite (%)</Label>
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
            <Label>Umsatzwachstum (%)</Label>
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
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          {filteredStocks.length} von {cachedStocks.length} Aktien
        </div>
      </Card>

      {/* Results Table */}
      {filteredStocks.length > 0 ? (
        <QuantAnalysisTable results={filteredStocks} isLoading={false} />
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
