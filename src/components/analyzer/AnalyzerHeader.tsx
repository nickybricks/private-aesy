import React from 'react';
import { Search, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AnalyzerHeaderProps {
  ticker?: string;
  companyName?: string;
  exchange?: string;
  currency?: string;
  afterHours?: boolean;
  onAddToWatchlist?: () => void;
  isOnWatchlist?: boolean;
}

export const AnalyzerHeader: React.FC<AnalyzerHeaderProps> = ({
  ticker,
  companyName,
  exchange,
  currency,
  afterHours = false,
  onAddToWatchlist,
  isOnWatchlist = false
}) => {
  return (
    <header className="sticky top-0 z-50 glass-header">
      <div className="container mx-auto px-6 py-4">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-4 mb-3">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold hidden sm:inline">Aesy</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md hidden md:block">
            {/* Search is handled by StockContext */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Aktie suchen..." 
                className="pl-9"
                disabled
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onAddToWatchlist}
              variant={isOnWatchlist ? "secondary" : "default"}
              size="default"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isOnWatchlist ? 'Auf Watchlist' : 'Watchlist'}
              </span>
            </Button>
          </div>
        </div>

        {/* Exchange Info Row */}
        {ticker && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">
              {exchange}: {ticker}
            </span>
            <span>•</span>
            <span>Real-Time Price</span>
            <span>•</span>
            <span>{currency}</span>
            {afterHours && (
              <>
                <span>•</span>
                <Badge variant="secondary" className="text-xs">
                  After Hours
                </Badge>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
