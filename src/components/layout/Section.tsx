import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'flat' | 'subtle' | 'raised';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Section Component - Design Canon v1.0
 * 
 * Varianten:
 * - flat: Keine Elevation, nur Hintergrund
 * - subtle: Leichte Elevation mit border
 * - raised: Card mit Schatten (Standard für wichtige Content-Bereiche)
 * 
 * Padding:
 * - none: 0
 * - sm: p-4
 * - md: p-6 (Standard)
 * - lg: p-8
 */
export const Section: React.FC<SectionProps> = ({ 
  children, 
  className,
  variant = 'flat',
  padding = 'md'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  if (variant === 'raised') {
    return (
      <Card className={cn(paddingClasses[padding], className)}>
        {children}
      </Card>
    );
  }

  if (variant === 'subtle') {
    return (
      <div className={cn(
        'border border-border rounded-2xl bg-background/50',
        paddingClasses[padding],
        className
      )}>
        {children}
      </div>
    );
  }

  // flat
  return (
    <div className={cn(paddingClasses[padding], className)}>
      {children}
    </div>
  );
};

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('mb-6 space-y-2', className)}>
      {children}
    </div>
  );
};

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3' | 'h4';
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  children, 
  className,
  as = 'h2' 
}) => {
  const Component = as;
  
  const sizeClasses = {
    h2: 'text-xl md:text-2xl',
    h3: 'text-lg',
    h4: 'text-base font-semibold'
  };
  
  return (
    <Component className={cn(
      'font-semibold tracking-tight',
      sizeClasses[as],
      className
    )}>
      {children}
    </Component>
  );
};

interface SectionDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionDescription: React.FC<SectionDescriptionProps> = ({ 
  children, 
  className 
}) => {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  );
};
