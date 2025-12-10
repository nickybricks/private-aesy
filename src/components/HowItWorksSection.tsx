import React from 'react';
import { Search, Sparkles, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HowItWorksSectionProps {
  className?: string;
  variant?: 'default' | 'compact';
}

const steps = [
  {
    icon: Search,
    title: 'Aktie suchen',
    description: 'Suche nach Aktien aus US-Börsen wie NYSE, NASDAQ und OTC Markets.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
  },
  {
    icon: Sparkles,
    title: 'Mit oder ohne KI',
    description: 'Unsere KI analysiert qualitative Kriterien wie Wettbewerbsvorteile, Management-Qualität und Marktposition.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    iconColor: 'text-violet-400',
  },
  {
    icon: BarChart3,
    title: 'Bewertung erhalten',
    description: 'Wir analysieren die Aktie nach Buffett-Kriterien und vergeben entsprechende Punktzahlen.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-400',
  },
];

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ 
  className,
  variant = 'default' 
}) => {
  return (
    <section className={cn('py-12 md:py-16', className)}>
      <div className="text-center mb-10 md:mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
          So funktioniert's
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          In drei einfachen Schritten zur professionellen Aktienanalyse
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              'group relative overflow-hidden rounded-3xl p-6 md:p-8',
              'bg-background/40 backdrop-blur-xl',
              'border border-white/10',
              'shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
              'hover:shadow-[0_16px_48px_rgba(0,0,0,0.16)]',
              'transition-all duration-500 ease-out',
              'hover:scale-[1.02] hover:-translate-y-1'
            )}
          >
            {/* Liquid glass gradient overlay */}
            <div
              className={cn(
                'absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-500',
                'bg-gradient-to-br',
                step.gradient
              )}
            />
            
            {/* Glass reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50" />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Step number */}
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-xs font-medium text-muted-foreground border border-white/20">
                {index + 1}
              </div>
              
              {/* Icon container */}
              <div className={cn(
                'w-14 h-14 md:w-16 md:h-16 rounded-2xl mb-5',
                'bg-white/10 backdrop-blur-sm',
                'border border-white/20',
                'flex items-center justify-center',
                'shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]',
                'group-hover:scale-110 transition-transform duration-500'
              )}>
                <step.icon className={cn('w-7 h-7 md:w-8 md:h-8', step.iconColor)} />
              </div>

              <h3 className="text-lg md:text-xl font-semibold mb-2 tracking-tight">
                {step.title}
              </h3>
              
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Bottom glow effect */}
            <div className={cn(
              'absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px',
              'bg-gradient-to-r from-transparent via-white/30 to-transparent',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-500'
            )} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorksSection;
