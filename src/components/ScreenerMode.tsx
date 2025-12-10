import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import QuantAnalysisTable from '@/components/QuantAnalysisTable';
import { QuantAnalysisResult } from '@/api/quantAnalyzerApi';
import { Plus, X, Minus, Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ScreenerModeProps {
  cachedStocks: QuantAnalysisResult[];
}

// Define all available filters with their configurations
const AVAILABLE_FILTERS = [
  { key: 'searchQuery', label: 'Suche (Symbol/Name)', type: 'search' as const },
  { key: 'sector', label: 'Sektor', type: 'select' as const },
  { key: 'exchange', label: 'Börse', type: 'select' as const },
  { key: 'aesyScore', label: 'Aesy Score', type: 'range' as const, presets: ['0', '5', '8', '10', '12', '14'] },
  { key: 'pe', label: 'KGV', type: 'range' as const, presets: ['5', '10', '15', '20', '25', '30'] },
  { key: 'roic', label: 'ROIC (%)', type: 'range' as const, presets: ['5', '10', '12', '15', '20', '25'] },
  { key: 'roe', label: 'ROE (%)', type: 'range' as const, presets: ['5', '10', '15', '20', '25', '30'] },
  { key: 'dividendYield', label: 'Dividende (%)', type: 'range' as const, presets: ['0', '1', '2', '3', '4', '5'] },
  { key: 'yearsProfit', label: 'Jahre profitabel', type: 'range' as const, presets: ['3', '5', '6', '8', '10'] },
  { key: 'epsGrowth3y', label: 'EPS-Wachstum 3J (%)', type: 'range' as const, presets: ['-10', '0', '5', '10', '15', '20'] },
  { key: 'epsGrowth', label: 'EPS-Wachstum 5J (%)', type: 'range' as const, presets: ['-10', '0', '5', '10', '15', '20'] },
  { key: 'epsGrowth10y', label: 'EPS-Wachstum 10J (%)', type: 'range' as const, presets: ['-5', '0', '5', '10', '15'] },
  { key: 'revenueGrowth3y', label: 'Umsatz-Wachstum 3J (%)', type: 'range' as const, presets: ['-10', '0', '5', '10', '15', '20'] },
  { key: 'revenueGrowth', label: 'Umsatz-Wachstum 5J (%)', type: 'range' as const, presets: ['-10', '0', '5', '10', '15', '20'] },
  { key: 'revenueGrowth10y', label: 'Umsatz-Wachstum 10J (%)', type: 'range' as const, presets: ['-5', '0', '5', '10', '15'] },
  { key: 'netDebtToEbitda', label: 'Verschuldung (NetDebt/EBITDA)', type: 'range' as const, presets: ['-1', '0', '1', '2', '3', '5'] },
  { key: 'netMargin', label: 'Nettomarge (%)', type: 'range' as const, presets: ['0', '5', '10', '15', '20', '25'] },
  { key: 'fcfMargin', label: 'FCF-Marge (%)', type: 'range' as const, presets: ['0', '5', '10', '15', '20', '25'] },
] as const;

type FilterKey = typeof AVAILABLE_FILTERS[number]['key'];

interface FilterValues {
  [key: string]: {
    min?: string;
    max?: string;
    value?: string;
  };
}

export const ScreenerMode = ({ cachedStocks }: ScreenerModeProps) => {
  const isMobile = useIsMobile();
  const [isFilterSelectorOpen, setIsFilterSelectorOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([]);
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  // Extract unique sectors and exchanges from data
  const sectors = useMemo(() => {
    const uniqueSectors = new Set(cachedStocks.map(s => s.sector).filter(Boolean));
    return Array.from(uniqueSectors).sort();
  }, [cachedStocks]);

  const exchanges = useMemo(() => {
    const uniqueExchanges = new Set(cachedStocks.map(s => s.exchange).filter(Boolean));
    return Array.from(uniqueExchanges).sort();
  }, [cachedStocks]);

  // Filter the available filters based on search
  const filteredAvailableFilters = useMemo(() => {
    if (!filterSearch) return AVAILABLE_FILTERS;
    return AVAILABLE_FILTERS.filter(f => 
      f.label.toLowerCase().includes(filterSearch.toLowerCase())
    );
  }, [filterSearch]);

  // Apply filters to stocks
  const filteredStocks = useMemo(() => {
    return cachedStocks.filter(stock => {
      for (const filterKey of activeFilters) {
        const values = filterValues[filterKey];
        if (!values) continue;

        switch (filterKey) {
          case 'searchQuery':
            if (values.value && 
                !stock.symbol.toLowerCase().includes(values.value.toLowerCase()) &&
                !stock.name.toLowerCase().includes(values.value.toLowerCase())) {
              return false;
            }
            break;
          case 'sector':
            if (values.value && values.value !== 'all' && stock.sector !== values.value) {
              return false;
            }
            break;
          case 'exchange':
            if (values.value && values.value !== 'all' && stock.exchange !== values.value) {
              return false;
            }
            break;
          case 'aesyScore':
            if (values.min !== '' && values.min !== undefined && stock.buffettScore < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.buffettScore > parseFloat(values.max)) return false;
            break;
          case 'pe':
            if (values.min !== '' && values.min !== undefined && stock.criteria.pe.value != null && stock.criteria.pe.value < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.criteria.pe.value != null && stock.criteria.pe.value > parseFloat(values.max)) return false;
            break;
          case 'roic':
            if (values.min !== '' && values.min !== undefined && stock.criteria.roic.value != null && stock.criteria.roic.value < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.criteria.roic.value != null && stock.criteria.roic.value > parseFloat(values.max)) return false;
            break;
          case 'roe':
            if (values.min !== '' && values.min !== undefined && stock.criteria.roe.value != null && stock.criteria.roe.value < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.criteria.roe.value != null && stock.criteria.roe.value > parseFloat(values.max)) return false;
            break;
          case 'dividendYield':
            if (values.min !== '' && values.min !== undefined && stock.criteria.dividendYield.value != null && stock.criteria.dividendYield.value < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.criteria.dividendYield.value != null && stock.criteria.dividendYield.value > parseFloat(values.max)) return false;
            break;
          case 'yearsProfit':
            if (values.min !== '' && values.min !== undefined && stock.criteria.yearsOfProfitability.value != null && stock.criteria.yearsOfProfitability.value < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.criteria.yearsOfProfitability.value != null && stock.criteria.yearsOfProfitability.value > parseFloat(values.max)) return false;
            break;
          case 'epsGrowth3y':
            if (values.min !== '' && values.min !== undefined && stock.criteria.epsGrowth.cagr3y != null && stock.criteria.epsGrowth.cagr3y < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.criteria.epsGrowth.cagr3y != null && stock.criteria.epsGrowth.cagr3y > parseFloat(values.max)) return false;
            break;
          case 'epsGrowth':
            if (values.min !== '' && values.min !== undefined && stock.criteria.epsGrowth.value != null && stock.criteria.epsGrowth.value < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.criteria.epsGrowth.value != null && stock.criteria.epsGrowth.value > parseFloat(values.max)) return false;
            break;
          case 'epsGrowth10y':
            if (values.min !== '' && values.min !== undefined && stock.criteria.epsGrowth.cagr10y != null && stock.criteria.epsGrowth.cagr10y < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.criteria.epsGrowth.cagr10y != null && stock.criteria.epsGrowth.cagr10y > parseFloat(values.max)) return false;
            break;
          case 'revenueGrowth3y':
            if (values.min !== '' && values.min !== undefined && stock.criteria.revenueGrowth.cagr3y != null && stock.criteria.revenueGrowth.cagr3y < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.criteria.revenueGrowth.cagr3y != null && stock.criteria.revenueGrowth.cagr3y > parseFloat(values.max)) return false;
            break;
          case 'revenueGrowth':
            if (values.min !== '' && values.min !== undefined && stock.criteria.revenueGrowth.value != null && stock.criteria.revenueGrowth.value < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.criteria.revenueGrowth.value != null && stock.criteria.revenueGrowth.value > parseFloat(values.max)) return false;
            break;
          case 'revenueGrowth10y':
            if (values.min !== '' && values.min !== undefined && stock.criteria.revenueGrowth.cagr10y != null && stock.criteria.revenueGrowth.cagr10y < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.criteria.revenueGrowth.cagr10y != null && stock.criteria.revenueGrowth.cagr10y > parseFloat(values.max)) return false;
            break;
          case 'netDebtToEbitda':
            if (values.min !== '' && values.min !== undefined && stock.criteria.netDebtToEbitda.value != null && stock.criteria.netDebtToEbitda.value < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.criteria.netDebtToEbitda.value != null && stock.criteria.netDebtToEbitda.value > parseFloat(values.max)) return false;
            break;
          case 'netMargin':
            if (values.min !== '' && values.min !== undefined && stock.criteria.netMargin.value != null && stock.criteria.netMargin.value < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.criteria.netMargin.value != null && stock.criteria.netMargin.value > parseFloat(values.max)) return false;
            break;
          case 'fcfMargin':
            if (values.min !== '' && values.min !== undefined && stock.criteria.fcfMargin.value != null && stock.criteria.fcfMargin.value < parseFloat(values.min)) return false;
            if (values.max !== '' && values.max !== undefined && stock.criteria.fcfMargin.value != null && stock.criteria.fcfMargin.value > parseFloat(values.max)) return false;
            break;
        }
      }
      return true;
    });
  }, [cachedStocks, activeFilters, filterValues]);

  // Toggle filter selection
  const toggleFilter = (filterKey: FilterKey) => {
    setActiveFilters(prev => {
      if (prev.includes(filterKey)) {
        return prev.filter(k => k !== filterKey);
      } else {
        return [...prev, filterKey];
      }
    });
  };

  // Remove filter completely
  const removeFilter = (filterKey: FilterKey) => {
    setActiveFilters(prev => prev.filter(k => k !== filterKey));
    setFilterValues(prev => {
      const newValues = { ...prev };
      delete newValues[filterKey];
      return newValues;
    });
  };

  // Reset filter values (keep filter active but clear values)
  const resetFilterValues = (filterKey: FilterKey) => {
    setFilterValues(prev => ({
      ...prev,
      [filterKey]: {}
    }));
  };

  // Update filter value
  const updateFilterValue = (filterKey: FilterKey, field: 'min' | 'max' | 'value', newValue: string) => {
    setFilterValues(prev => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        [field]: newValue
      }
    }));
  };

  // Get filter config
  const getFilterConfig = (key: FilterKey) => {
    return AVAILABLE_FILTERS.find(f => f.key === key);
  };

  // Render filter chip
  const renderFilterChip = (filterKey: FilterKey) => {
    const config = getFilterConfig(filterKey);
    if (!config) return null;

    const values = filterValues[filterKey] || {};

    return (
      <div 
        key={filterKey}
        className="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2 flex-wrap sm:flex-nowrap"
      >
        <span className="text-sm font-medium text-foreground whitespace-nowrap">{config.label}</span>
        
        {config.type === 'search' && (
          <Input
            type="text"
            placeholder="z.B. AAPL"
            value={values.value || ''}
            onChange={(e) => updateFilterValue(filterKey, 'value', e.target.value)}
            className="h-8 w-32 sm:w-40 text-base bg-background"
          />
        )}

        {config.type === 'select' && (
          <Select 
            value={values.value || 'all'} 
            onValueChange={(val) => updateFilterValue(filterKey, 'value', val)}
          >
            <SelectTrigger className="h-8 w-32 sm:w-40 text-base bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="all">Alle</SelectItem>
              {filterKey === 'sector' && sectors.map(sector => (
                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
              ))}
              {filterKey === 'exchange' && exchanges.map(exchange => (
                <SelectItem key={exchange} value={exchange}>{exchange}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {config.type === 'range' && (
          <div className="flex items-center gap-1">
            <Select 
              value={values.min || ''} 
              onValueChange={(val) => updateFilterValue(filterKey, 'min', val === 'none' ? '' : val)}
            >
              <SelectTrigger className="h-8 w-20 text-base bg-background">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                <SelectItem value="none">Min</SelectItem>
                {config.presets.map(preset => (
                  <SelectItem key={preset} value={preset}>{preset}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">–</span>
            <Select 
              value={values.max || ''} 
              onValueChange={(val) => updateFilterValue(filterKey, 'max', val === 'none' ? '' : val)}
            >
              <SelectTrigger className="h-8 w-20 text-base bg-background">
                <SelectValue placeholder="Max" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                <SelectItem value="none">Max</SelectItem>
                {config.presets.map(preset => (
                  <SelectItem key={preset} value={preset}>{preset}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Reset button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => resetFilterValues(filterKey)}
          title="Filter zurücksetzen"
        >
          <Minus className="h-4 w-4" />
        </Button>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
          onClick={() => removeFilter(filterKey)}
          title="Filter entfernen"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Filter selector content (shared between dialog and drawer)
  const filterSelectorContent = (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Filter suchen..."
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          className="pl-10 text-base"
        />
      </div>

      {/* Filter list */}
      <ScrollArea className="h-[300px] sm:h-[400px]">
        <div className="space-y-1 pr-4">
          {filteredAvailableFilters.map(filter => (
            <div 
              key={filter.key}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => toggleFilter(filter.key)}
            >
              <Checkbox 
                checked={activeFilters.includes(filter.key)}
                onCheckedChange={() => toggleFilter(filter.key)}
              />
              <span className="text-sm">{filter.label}</span>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Close button */}
      <Button 
        className="w-full"
        onClick={() => setIsFilterSelectorOpen(false)}
      >
        Fertig ({activeFilters.length} Filter aktiv)
      </Button>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filter Panel */}
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Add Filter Button */}
          {isMobile ? (
            <Drawer open={isFilterSelectorOpen} onOpenChange={setIsFilterSelectorOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto h-11 text-base">
                  <Plus className="h-4 w-4 mr-2" />
                  Filter hinzufügen
                  {activeFilters.length > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                      {activeFilters.length}
                    </span>
                  )}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="bg-background">
                <DrawerHeader>
                  <DrawerTitle>Filter auswählen</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-6">
                  {filterSelectorContent}
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Dialog open={isFilterSelectorOpen} onOpenChange={setIsFilterSelectorOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-10">
                  <Plus className="h-4 w-4 mr-2" />
                  Filter hinzufügen
                  {activeFilters.length > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                      {activeFilters.length}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-background">
                <DialogHeader>
                  <DialogTitle>Filter auswählen</DialogTitle>
                </DialogHeader>
                {filterSelectorContent}
              </DialogContent>
            </Dialog>
          )}

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map(filterKey => renderFilterChip(filterKey))}
            </div>
          )}
        </div>
      </Card>

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
