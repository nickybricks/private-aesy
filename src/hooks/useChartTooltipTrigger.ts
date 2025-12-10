import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Returns the appropriate tooltip trigger for Recharts based on device type.
 * Mobile devices use 'click' since hover doesn't work on touch screens.
 * Desktop uses 'hover' for better UX.
 */
export const useChartTooltipTrigger = (): 'click' | 'hover' => {
  const isMobile = useIsMobile();
  return isMobile ? 'click' : 'hover';
};
