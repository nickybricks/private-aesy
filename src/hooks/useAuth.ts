import { useState, useEffect } from 'react';
import { useAuth as useSupabaseAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'customer' | 'admin' | 'super_admin';

interface UseAuthReturn {
  user: any;
  session: any;
  loading: boolean;
  userRole: UserRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasRole: (role: UserRole) => boolean;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const { user, session, loading, signOut } = useSupabaseAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  const fetchUserRole = async () => {
    if (!user) {
      setUserRole(null);
      return;
    }

    try {
      setRoleLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role', { ascending: true }) // super_admin first, then admin, then customer
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user role:', error);
        return;
      }

      setUserRole(data?.role || 'customer');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('customer');
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [user]);

  const hasRole = (role: UserRole): boolean => {
    if (!userRole) return false;
    
    const roleHierarchy = {
      'super_admin': 3,
      'admin': 2,
      'customer': 1
    };

    return roleHierarchy[userRole] >= roleHierarchy[role];
  };

  const refreshRole = async () => {
    await fetchUserRole();
  };

  return {
    user,
    session,
    loading: loading || roleLoading,
    userRole,
    isAdmin: hasRole('admin'),
    isSuperAdmin: hasRole('super_admin'),
    hasRole,
    refreshRole,
    signOut
  };
};