import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ConditionType = 'any' | 'over' | 'under' | 'between' | 'exactly';

interface RangeFilterDropdownProps {
  label: string;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  className?: string;
}

const conditionLabels: Record<ConditionType, string> = {
  any: 'Beliebig',
  over: 'Über',
  under: 'Unter',
  between: 'Zwischen',
  exactly: 'Genau',
};

export function RangeFilterDropdown({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  className,
}: RangeFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [condition, setCondition] = useState<ConditionType>('any');
  const [conditionDropdownOpen, setConditionDropdownOpen] = useState(false);
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update parent filters based on condition
  useEffect(() => {
    switch (condition) {
      case 'any':
        onMinChange('');
        onMaxChange('');
        break;
      case 'over':
        onMinChange(value1);
        onMaxChange('');
        break;
      case 'under':
        onMinChange('');
        onMaxChange(value1);
        break;
      case 'between':
        onMinChange(value1);
        onMaxChange(value2);
        break;
      case 'exactly':
        onMinChange(value1);
        onMaxChange(value1);
        break;
    }
  }, [condition, value1, value2, onMinChange, onMaxChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setConditionDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayValue = () => {
    if (condition === 'any') return 'Beliebig';
    if (condition === 'between' && value1 && value2) return `${value1} - ${value2}`;
    if (condition === 'over' && value1) return `> ${value1}`;
    if (condition === 'under' && value1) return `< ${value1}`;
    if (condition === 'exactly' && value1) return `= ${value1}`;
    return conditionLabels[condition];
  };

  const handleConditionSelect = (newCondition: ConditionType) => {
    setCondition(newCondition);
    setConditionDropdownOpen(false);
    if (newCondition === 'any') {
      setValue1('');
      setValue2('');
    }
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Main trigger - label and value on one line */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 p-2 border border-border rounded-md cursor-pointer hover:bg-accent/50 transition-colors bg-background"
      >
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">{getDisplayValue()}</span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {/* Dropdown content */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-popover border border-border rounded-md shadow-lg z-50 min-w-[280px]">
          <div className="flex flex-wrap items-center gap-2">
            {/* Condition selector */}
            <div className="relative">
              <button
                onClick={() => setConditionDropdownOpen(!conditionDropdownOpen)}
                className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-md bg-background hover:bg-accent/50 transition-colors text-sm"
              >
                {conditionLabels[condition]}
                <ChevronDown className={cn("h-3 w-3 transition-transform", conditionDropdownOpen && "rotate-180")} />
              </button>

              {conditionDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-[60] min-w-[120px]">
                  {(Object.keys(conditionLabels) as ConditionType[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => handleConditionSelect(key)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors",
                        condition === key && "bg-accent"
                      )}
                    >
                      {conditionLabels[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Value inputs based on condition */}
            {(condition === 'over' || condition === 'under' || condition === 'exactly') && (
              <Input
                type="number"
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                className="w-20 h-8 text-sm"
                placeholder="Wert"
              />
            )}

            {condition === 'between' && (
              <>
                <Input
                  type="number"
                  value={value1}
                  onChange={(e) => setValue1(e.target.value)}
                  className="w-16 h-8 text-sm"
                  placeholder="Min"
                />
                <span className="text-muted-foreground text-sm">&</span>
                <Input
                  type="number"
                  value={value2}
                  onChange={(e) => setValue2(e.target.value)}
                  className="w-16 h-8 text-sm"
                  placeholder="Max"
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
