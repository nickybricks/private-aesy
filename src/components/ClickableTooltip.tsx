
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
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  width?: string;
}

export const ClickableTooltip: React.FC<ClickableTooltipProps> = ({ 
  children, 
  content, 
  className,
  side = "top",
  align = "center",
  width = "auto"
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className={className}>
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className={width !== "auto" ? `w-${width}` : undefined}>
        {content}
      </PopoverContent>
    </Popover>
  );
};
