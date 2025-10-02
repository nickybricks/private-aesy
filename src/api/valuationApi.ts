import { supabase } from "@/integrations/supabase/client";
import { ValuationMode, ValuationResponse } from "@/types/valuation";

export const fetchValuation = async (
  ticker: string,
  mode: ValuationMode
): Promise<ValuationResponse> => {
  const { data, error } = await supabase.functions.invoke('valuation-20y', {
    body: { ticker, mode }
  });
  
  if (error) throw error;
  return data;
};
