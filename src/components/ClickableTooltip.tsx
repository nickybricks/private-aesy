
import React, { ReactNode } from 'react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

interface ClickableTooltipProps {
  children: ReactNode;
  content: ReactNode;
  className?: string;
}

export const ClickableTooltip: React.FC<ClickableTooltipProps> = ({ 
  children, 
  content, 
  className 
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className={className}>
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent>
        {content}
      </PopoverContent>
    </Popover>
  );
};
