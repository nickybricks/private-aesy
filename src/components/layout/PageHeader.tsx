import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader Component - Design Canon v1.0
 * 
 * Verwendung: Einheitlicher Seiten-Header mit optionalem Back-Button und Action-Bereich
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backLink,
  action,
  className
}) => {
  const navigate = useNavigate();

  return (
    <div className={cn('mb-8', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {backLink && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(backLink)}
              aria-label="Zurück"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            {subtitle && (
              <p className="text-sm text-muted-foreground mb-1">{subtitle}</p>
            )}
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {title}
            </h1>
          </div>
        </div>
        {action && (
          <div className="flex items-center gap-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};
