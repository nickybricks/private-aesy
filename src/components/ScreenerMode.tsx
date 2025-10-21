import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { QuantAnalysisTable } from '@/components/QuantAnalysisTable';
import { QuantAnalysisResult } from '@/api/quantAnalyzerApi';
import { Filter, X } from 'lucide-react';

interface ScreenerModeProps {
  cachedStocks: QuantAnalysisResult[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const ScreenerMode = ({ cachedStocks, onRefresh, isRefreshing }: ScreenerModeProps) => {
  const [filters, setFilters] = useState({
    minBuffettScore: 0,
    maxPE: 100,
    minROIC: 0,
    minROE: 0,
    minDividendYield: 0,
    minRevenueGrowth: -100,
    minNetMargin: 0,
    sector: 'all',
    searchQuery: ''
  });

  const filteredStocks = useMemo(() => {
    return cachedStocks.filter(stock => {
      if (stock.buffettScore < filters.minBuffettScore) return false;
      if (filters.maxPE < 100 && stock.criteria.pe.value && stock.criteria.pe.value > filters.maxPE) return false;
      if (stock.criteria.roic.value && stock.criteria.roic.value < filters.minROIC) return false;
      if (stock.criteria.roe.value && stock.criteria.roe.value < filters.minROE) return false;
      if (stock.criteria.dividendYield.value && stock.criteria.dividendYield.value < filters.minDividendYield) return false;
      if (stock.criteria.revenueGrowth.value && stock.criteria.revenueGrowth.value < filters.minRevenueGrowth) return false;
      if (stock.criteria.netMargin.value && stock.criteria.netMargin.value < filters.minNetMargin) return false;
      if (filters.sector !== 'all' && stock.sector !== filters.sector) return false;
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
      minBuffettScore: 0,
      maxPE: 100,
      minROIC: 0,
      minROE: 0,
      minDividendYield: 0,
      minRevenueGrowth: -100,
      minNetMargin: 0,
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

          {/* Buffett Score */}
          <div className="space-y-2">
            <Label>Min. Buffett Score: {filters.minBuffettScore}</Label>
            <Slider
              value={[filters.minBuffettScore]}
              onValueChange={([value]) => setFilters({ ...filters, minBuffettScore: value })}
              min={0}
              max={9}
              step={1}
            />
          </div>

          {/* P/E Ratio */}
          <div className="space-y-2">
            <Label>Max. KGV: {filters.maxPE === 100 ? '∞' : filters.maxPE}</Label>
            <Slider
              value={[filters.maxPE]}
              onValueChange={([value]) => setFilters({ ...filters, maxPE: value })}
              min={5}
              max={100}
              step={5}
            />
          </div>

          {/* ROIC */}
          <div className="space-y-2">
            <Label>Min. ROIC: {filters.minROIC}%</Label>
            <Slider
              value={[filters.minROIC]}
              onValueChange={([value]) => setFilters({ ...filters, minROIC: value })}
              min={0}
              max={50}
              step={1}
            />
          </div>

          {/* ROE */}
          <div className="space-y-2">
            <Label>Min. ROE: {filters.minROE}%</Label>
            <Slider
              value={[filters.minROE]}
              onValueChange={([value]) => setFilters({ ...filters, minROE: value })}
              min={0}
              max={50}
              step={1}
            />
          </div>

          {/* Dividend Yield */}
          <div className="space-y-2">
            <Label>Min. Dividendenrendite: {filters.minDividendYield}%</Label>
            <Slider
              value={[filters.minDividendYield]}
              onValueChange={([value]) => setFilters({ ...filters, minDividendYield: value })}
              min={0}
              max={10}
              step={0.5}
            />
          </div>

          {/* Revenue Growth */}
          <div className="space-y-2">
            <Label>Min. Umsatzwachstum: {filters.minRevenueGrowth}%</Label>
            <Slider
              value={[filters.minRevenueGrowth]}
              onValueChange={([value]) => setFilters({ ...filters, minRevenueGrowth: value })}
              min={-100}
              max={100}
              step={5}
            />
          </div>

          {/* Net Margin */}
          <div className="space-y-2">
            <Label>Min. Nettomarge: {filters.minNetMargin}%</Label>
            <Slider
              value={[filters.minNetMargin]}
              onValueChange={([value]) => setFilters({ ...filters, minNetMargin: value })}
              min={0}
              max={50}
              step={1}
            />
          </div>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          {filteredStocks.length} von {cachedStocks.length} Aktien
        </div>
      </Card>

      {/* Results Table */}
      {filteredStocks.length > 0 ? (
        <QuantAnalysisTable results={filteredStocks} />
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
