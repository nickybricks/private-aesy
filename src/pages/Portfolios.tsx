import React from 'react';
import { Shell, ShellHeader, ShellTitle, ShellDescription, ShellContent } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Portfolios: React.FC = () => {
  return (
    <main className="flex-1 overflow-auto bg-background">
      <Shell>
        <ShellHeader>
          <ShellTitle>Portfolios</ShellTitle>
          <ShellDescription>
            Verwalte deine Investment-Portfolios
          </ShellDescription>
        </ShellHeader>

        <ShellContent>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Portfolios kommen bald
              </h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Wir arbeiten gerade an dieser Funktion. Bald kannst du hier deine Investment-Portfolios verwalten, 
                tracken und analysieren.
              </p>
              <Badge variant="secondary" className="text-sm">
                Coming Soon
              </Badge>
            </CardContent>
          </Card>
        </ShellContent>
      </Shell>
    </main>
  );
};

export default Portfolios;
