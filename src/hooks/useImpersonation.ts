import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ImpersonationState {
  impersonatedUserId: string | null;
  impersonatedUserEmail: string | null;
  isImpersonating: boolean;
}

export const useImpersonation = () => {
  const [impersonationState, setImpersonationState] = useState<ImpersonationState>({
    impersonatedUserId: null,
    impersonatedUserEmail: null,
    isImpersonating: false
  });
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing impersonation on load
    const stored = sessionStorage.getItem('impersonation_state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setImpersonationState(parsed);
      } catch (error) {
        console.error('Error parsing impersonation state:', error);
        sessionStorage.removeItem('impersonation_state');
      }
    }
  }, []);

  const startImpersonation = async (userId: string, userEmail: string) => {
    try {
      // Log audit trail
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'impersonation_started',
        table_name: 'auth.users',
        record_id: userId,
        new_values: { impersonated_by: (await supabase.auth.getUser()).data.user?.id }
      });

      const newState = {
        impersonatedUserId: userId,
        impersonatedUserEmail: userEmail,
        isImpersonating: true
      };

      setImpersonationState(newState);
      sessionStorage.setItem('impersonation_state', JSON.stringify(newState));

      toast({
        title: "Impersonation gestartet",
        description: `Du siehst jetzt die Daten von ${userEmail}`
      });
    } catch (error) {
      console.error('Error starting impersonation:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Impersonation konnte nicht gestartet werden"
      });
    }
  };

  const stopImpersonation = async () => {
    if (impersonationState.impersonatedUserId) {
      try {
        // Log audit trail
        await supabase.from('audit_logs').insert({
          user_id: impersonationState.impersonatedUserId,
          action: 'impersonation_stopped',
          table_name: 'auth.users',
          record_id: impersonationState.impersonatedUserId
        });
      } catch (error) {
        console.error('Error logging impersonation stop:', error);
      }
    }

    setImpersonationState({
      impersonatedUserId: null,
      impersonatedUserEmail: null,
      isImpersonating: false
    });
    sessionStorage.removeItem('impersonation_state');

    toast({
      title: "Impersonation beendet",
      description: "Du siehst wieder deine eigenen Daten"
    });
  };

  return {
    ...impersonationState,
    startImpersonation,
    stopImpersonation
  };
};