import React from 'react';
import { cn } from '@/lib/utils';

interface ShellProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-[1440px]',
  full: 'max-w-full',
};

export const Shell: React.FC<ShellProps> = ({ 
  children, 
  className,
  maxWidth = 'xl'
}) => {
  return (
    <div className={cn(
      'w-full mx-auto px-4 md:px-8 py-8',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
};

interface ShellHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const ShellHeader: React.FC<ShellHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('mb-8 space-y-2', className)}>
      {children}
    </div>
  );
};

interface ShellTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const ShellTitle: React.FC<ShellTitleProps> = ({ children, className }) => {
  return (
    <h1 className={cn('text-3xl md:text-4xl font-semibold tracking-tight', className)}>
      {children}
    </h1>
  );
};

interface ShellDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const ShellDescription: React.FC<ShellDescriptionProps> = ({ children, className }) => {
  return (
    <p className={cn('text-base text-muted-foreground', className)}>
      {children}
    </p>
  );
};

interface ShellContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ShellContent: React.FC<ShellContentProps> = ({ children, className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
    </div>
  );
};

interface ShellFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ShellFooter: React.FC<ShellFooterProps> = ({ children, className }) => {
  return (
    <div className={cn('mt-8 pt-8 border-t border-border', className)}>
      <p className="text-xs text-muted-foreground/60">
        {children}
      </p>
    </div>
  );
};
