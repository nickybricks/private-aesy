import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-2xl font-semibold text-foreground mb-3">
        {title}
      </h3>
      
      <p className="text-base text-muted-foreground max-w-prose mb-8">
        {description}
      </p>
      
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {primaryAction && (
          <Button size="lg" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button size="lg" variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};
