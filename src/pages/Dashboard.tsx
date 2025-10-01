import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, BarChart3, History, Bookmark } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSavedAnalyses } from '@/hooks/useSavedAnalyses';
import { useWatchlists } from '@/hooks/useWatchlists';
import { Shell, ShellHeader, ShellTitle, ShellDescription, ShellContent } from '@/components/layout/Shell';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { analyses, loading: analysesLoading } = useSavedAnalyses();
  const { watchlists, loading: watchlistsLoading } = useWatchlists();

  const recentAnalyses = analyses.slice(0, 3);
  const topWatchlists = watchlists.slice(0, 3);
  const hasContent = analyses.length > 0 || watchlists.length > 0;

  if (analysesLoading || watchlistsLoading) {
    return (
      <main id="main-content" className="flex-1 overflow-auto bg-background">
        <Shell>
          <ShellHeader>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96" />
          </ShellHeader>
          <ShellContent>
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          </ShellContent>
        </Shell>
      </main>
    );
  }

  return (
    <main id="main-content" className="flex-1 overflow-auto bg-background">
      <Shell>
        <ShellHeader>
          <ShellTitle>Dashboard</ShellTitle>
          <ShellDescription>
            Übersicht über deine Analysen und Watchlists
          </ShellDescription>
        </ShellHeader>

        <ShellContent>
          {!hasContent ? (
            <EmptyState
              icon={TrendingUp}
              title="Willkommen bei Aesy!"
              description="Analysiere Aktien nach bewährten Investmentprinzipien. Starte mit einer Einzelanalyse oder scanne einen ganzen Markt."
              primaryAction={{
                label: 'Aktie analysieren',
                onClick: () => navigate('/analyzer'),
              }}
              secondaryAction={{
                label: 'Markt scannen',
                onClick: () => navigate('/quant'),
              }}
            />
          ) : (
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/analyzer')}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Aktie analysieren</CardTitle>
                        <CardDescription>Detaillierte Einzelanalyse</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/quant')}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Markt scannen</CardTitle>
                        <CardDescription>Quantitative Marktanalyse</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>

              {/* Recent Analyses */}
              {recentAnalyses.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Letzte Analysen
                    </h2>
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => navigate('/saved-analyses')}
                    >
                      Alle anzeigen
                    </Badge>
                  </div>
                  <div className="grid gap-4">
                    {recentAnalyses.map((analysis) => (
                      <Card 
                        key={analysis.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/analyzer?ticker=${analysis.ticker}&loadAnalysis=${analysis.id}`)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{analysis.title}</CardTitle>
                              <CardDescription>
                                {analysis.ticker} · {new Date(analysis.saved_at).toLocaleDateString('de-DE')}
                              </CardDescription>
                            </div>
                            {analysis.analysis_data?.overallRating?.buffettScore && (
                              <Badge variant={
                                analysis.analysis_data.overallRating.buffettScore >= 8 ? 'success' :
                                analysis.analysis_data.overallRating.buffettScore >= 5 ? 'warning' : 'danger'
                              }>
                                {analysis.analysis_data.overallRating.buffettScore}/10
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Watchlists */}
              {topWatchlists.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Bookmark className="h-5 w-5" />
                      Watchlists
                    </h2>
                    <Badge 
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => navigate('/watchlists')}
                    >
                      Alle anzeigen
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {topWatchlists.map((watchlist) => (
                      <Card 
                        key={watchlist.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/watchlists/${watchlist.id}`)}
                      >
                        <CardHeader>
                          <CardTitle className="text-base">{watchlist.name}</CardTitle>
                          {watchlist.description && (
                            <CardDescription className="line-clamp-2">
                              {watchlist.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Erstellt: {new Date(watchlist.created_at).toLocaleDateString('de-DE')}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ShellContent>
      </Shell>
    </main>
  );
};

export default Dashboard;
