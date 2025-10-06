import React, { useMemo, useState } from 'react';
import { useStock } from '@/context/StockContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MetricRow {
  name: string;
  key: string;
  criterion: string;
  value: number | boolean | null;
  deviation: number | null;
  status: 'pass' | 'fail' | 'neutral';
  threshold: number | string | null;
  isPercentage: boolean;
  isBoolean: boolean;
}

const MetricsComparisonTable: React.FC = () => {
  const { financialMetrics, stockInfo } = useStock();
  const [showOnlyFailed, setShowOnlyFailed] = useState(false);
  const [sortByWorst, setSortByWorst] = useState(true);

  // Hilfsfunktionen für Formatierung
  const formatNumber = (value: number | null, decimals: number = 2): string => {
    if (value === null || isNaN(value)) return '–';
    return value.toLocaleString('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatPercent = (value: number | null, decimals: number = 2): string => {
    if (value === null || isNaN(value)) return '–';
    return `${formatNumber(value, decimals)} %`;
  };

  const formatDeviation = (deviation: number | null): string => {
    if (deviation === null) return '–';
    const sign = deviation >= 0 ? '+' : '';
    return `${sign}${formatPercent(deviation * 100, 1)}`;
  };

  // Extrahiere Werte aus financialMetrics.metrics Array
  const getMetricValue = (metricName: string): number | null => {
    if (!financialMetrics?.metrics) return null;
    const metric = financialMetrics.metrics.find(m => 
      m.name.toLowerCase().includes(metricName.toLowerCase())
    );
    return metric?.value ?? null;
  };

  // Berechne Abweichung basierend auf Kriterium
  const calculateDeviation = (
    actual: number | null,
    threshold: number | string | null,
    criterion: string
  ): number | null => {
    if (actual === null || threshold === null || criterion === '–') return null;
    
    const T = typeof threshold === 'string' ? parseFloat(threshold) : threshold;
    if (isNaN(T)) return null;

    if (criterion.includes('>=') || criterion.includes('>')) {
      return (actual - T) / Math.abs(T);
    } else if (criterion.includes('<=') || criterion.includes('<')) {
      return (T - actual) / Math.abs(T);
    }
    
    return null;
  };

  // Prüfe Status basierend auf Kriterium
  const checkStatus = (
    actual: number | boolean | null,
    threshold: number | string | null,
    criterion: string
  ): 'pass' | 'fail' | 'neutral' => {
    if (criterion === '–') return 'neutral';
    if (actual === null) return 'neutral';

    if (typeof actual === 'boolean') {
      return actual ? 'pass' : 'fail';
    }

    if (threshold === null) return 'neutral';
    const T = typeof threshold === 'string' ? parseFloat(threshold) : threshold;
    if (isNaN(T)) return 'neutral';

    if (criterion.includes('>=')) {
      return actual >= T ? 'pass' : 'fail';
    } else if (criterion.includes('>')) {
      return actual > T ? 'pass' : 'fail';
    } else if (criterion.includes('<=')) {
      return actual <= T ? 'pass' : 'fail';
    } else if (criterion.includes('<')) {
      return actual < T ? 'pass' : 'fail';
    }

    return 'neutral';
  };

  // Definiere die Metriken-Reihen
  const metricRows: MetricRow[] = useMemo(() => {
    const rows: MetricRow[] = [
      {
        name: 'ROE (10J Ø)',
        key: 'ROE_10J_avg',
        criterion: '>= 15%',
        threshold: 15,
        isPercentage: true,
        isBoolean: false,
        value: getMetricValue('ROE'),
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'Nettomarge (10J Ø)',
        key: 'Nettomarge_10J_avg',
        criterion: '>= 15%',
        threshold: 15,
        isPercentage: true,
        isBoolean: false,
        value: getMetricValue('Nettomarge'),
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'EPS-Wachstum (CAGR)',
        key: 'EPS_CAGR',
        criterion: '>= 10%',
        threshold: 10,
        isPercentage: true,
        isBoolean: false,
        value: getMetricValue('EPS-Wachstum'),
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'P/E (KGV)',
        key: 'PE',
        criterion: '< 25',
        threshold: 25,
        isPercentage: false,
        isBoolean: false,
        value: getMetricValue('KGV'),
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'P/B (KBV)',
        key: 'PB',
        criterion: '< 3',
        threshold: 3,
        isPercentage: false,
        isBoolean: false,
        value: getMetricValue('KBV'),
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'P/CF',
        key: 'PCF',
        criterion: '< 15',
        threshold: 15,
        isPercentage: false,
        isBoolean: false,
        value: getMetricValue('P/CF'),
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'Dividendenrendite',
        key: 'DivRendite',
        criterion: '–',
        threshold: null,
        isPercentage: true,
        isBoolean: false,
        value: getMetricValue('Dividendenrendite'),
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'Verschuldungsgrad (D/E)',
        key: 'DtoE',
        criterion: '< 0.5',
        threshold: 0.5,
        isPercentage: false,
        isBoolean: false,
        value: getMetricValue('Verschuldungsgrad'),
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'Netto-Schulden/EBITDA',
        key: 'NetDebt_to_EBITDA',
        criterion: '< 2',
        threshold: 2,
        isPercentage: false,
        isBoolean: false,
        value: getMetricValue('EBITDA'),
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'Current Ratio',
        key: 'CurrentRatio',
        criterion: '> 1.5',
        threshold: 1.5,
        isPercentage: false,
        isBoolean: false,
        value: getMetricValue('Current Ratio'),
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'Quick Ratio',
        key: 'QuickRatio',
        criterion: '> 1.0',
        threshold: 1.0,
        isPercentage: false,
        isBoolean: false,
        value: getMetricValue('Quick Ratio'),
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'Zinsdeckungsgrad',
        key: 'Zinsdeckungsgrad',
        criterion: '> 5',
        threshold: 5,
        isPercentage: false,
        isBoolean: false,
        value: getMetricValue('Zinsdeckungsgrad'),
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'OCF-Qualität (5J Ø)',
        key: 'OCF_Qualität_5J',
        criterion: '>= 1.0',
        threshold: 1.0,
        isPercentage: false,
        isBoolean: false,
        value: getMetricValue('OCF-Qualität'),
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'FCF-Marge (5J Ø)',
        key: 'FCF_Marge_5J',
        criterion: '>= 7%',
        threshold: 7,
        isPercentage: true,
        isBoolean: false,
        value: getMetricValue('FCF-Marge'),
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'FCF nie negativ (5J)',
        key: 'FCF_nie_negativ',
        criterion: '= TRUE',
        threshold: null,
        isPercentage: false,
        isBoolean: true,
        value: null, // TODO: Implement boolean check
        deviation: null,
        status: 'neutral',
      },
      {
        name: 'Capex-Quote (10J Ø)',
        key: 'CapexQuote_10J_avg',
        criterion: '–',
        threshold: null,
        isPercentage: true,
        isBoolean: false,
        value: getMetricValue('Capex-Quote'),
        deviation: null,
        status: 'neutral',
      },
    ];

    // Berechne Abweichung und Status für jede Reihe
    return rows.map(row => {
      const deviation = row.isBoolean 
        ? (row.value === true ? 0 : 1)
        : calculateDeviation(row.value as number | null, row.threshold, row.criterion);
      
      const status = checkStatus(row.value, row.threshold, row.criterion);

      return {
        ...row,
        deviation,
        status,
      };
    });
  }, [financialMetrics]);

  // Filtern und Sortieren
  const displayedRows = useMemo(() => {
    let filtered = metricRows;

    // Filter: Nur fehlgeschlagene anzeigen
    if (showOnlyFailed) {
      filtered = filtered.filter(row => row.status === 'fail');
    }

    // Sortierung: Rot zuerst, dann größte Abweichung
    if (sortByWorst) {
      filtered = [...filtered].sort((a, b) => {
        // Rot zuerst
        if (a.status === 'fail' && b.status !== 'fail') return -1;
        if (a.status !== 'fail' && b.status === 'fail') return 1;

        // Bei gleichem Status: größte negative Abweichung zuerst
        if (a.deviation !== null && b.deviation !== null) {
          return a.deviation - b.deviation;
        }

        return 0;
      });
    }

    return filtered;
  }, [metricRows, showOnlyFailed, sortByWorst]);

  if (!stockInfo) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          Bitte suchen Sie zunächst nach einer Aktie, um die Finanzkennzahlen zu sehen.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Steuerung */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={showOnlyFailed ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowOnlyFailed(!showOnlyFailed)}
          >
            Nur Rot zeigen
          </Button>
          <Button
            variant={sortByWorst ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortByWorst(!sortByWorst)}
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Sortierung: {sortByWorst ? 'Rot zuerst' : 'Standard'}
          </Button>
          <div className="ml-auto text-sm text-muted-foreground">
            {displayedRows.length} von {metricRows.length} Kennzahlen
          </div>
        </div>
      </Card>

      {/* Tabelle */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Kennzahl</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Kriterium</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 cursor-help">
                          % Abweichung
                          <Info className="h-3 w-3" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Zeigt die prozentuale Abweichung vom Zielwert:
                          <br />• Positiv = besser als Ziel
                          <br />• Negativ = schlechter als Ziel
                          <br />
                          <br />Formel je nach Kriterium:
                          <br />• ≥ / &gt;: (Wert - Ziel) / Ziel
                          <br />• ≤ / &lt;: (Ziel - Wert) / Ziel
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {showOnlyFailed 
                      ? 'Alle Kriterien erfüllt! 🎉' 
                      : 'Keine Daten verfügbar'}
                  </td>
                </tr>
              ) : (
                displayedRows.map((row, index) => (
                  <tr
                    key={row.key}
                    className={`border-b transition-colors hover:bg-muted/50 ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    } ${row.value === null ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {row.isBoolean
                        ? row.value === true
                          ? 'TRUE'
                          : row.value === false
                          ? 'FALSE'
                          : '–'
                        : row.isPercentage
                        ? formatPercent(row.value as number | null)
                        : formatNumber(row.value as number | null)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-muted-foreground">
                      {row.criterion}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {row.criterion === '–' ? (
                        <span className="text-muted-foreground">–</span>
                      ) : (
                        <span
                          className={
                            row.deviation === null
                              ? 'text-muted-foreground'
                              : row.deviation >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }
                        >
                          {formatDeviation(row.deviation)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.status === 'neutral' || row.criterion === '–' ? (
                        <span className="text-muted-foreground">–</span>
                      ) : (
                        <Badge
                          variant={row.status === 'pass' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {row.status === 'pass' ? '✓' : '✗'}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legende */}
      <Card className="p-4 bg-muted/30">
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Legende:</strong></p>
          <p>• <Badge variant="default" className="text-xs mx-1">✓</Badge> = Kriterium erfüllt</p>
          <p>• <Badge variant="destructive" className="text-xs mx-1">✗</Badge> = Kriterium nicht erfüllt</p>
          <p>• <span className="text-muted-foreground">–</span> = Informativ (kein Zielwert)</p>
          <p>• Graue Zeilen = Fehlende Daten</p>
        </div>
      </Card>
    </div>
  );
};

export default MetricsComparisonTable;
