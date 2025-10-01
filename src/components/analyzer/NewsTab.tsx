import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const NewsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <CardTitle>Nachrichten & Analysen</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Coming Soon Message */}
          <div className="text-center py-12">
            <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Kommt bald</h3>
            <p className="text-muted-foreground mb-6">
              Wir arbeiten daran, Ihnen die neuesten Nachrichten und Analysen zu liefern.
            </p>
          </div>

          {/* Skeleton Placeholders */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-20 w-20 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
