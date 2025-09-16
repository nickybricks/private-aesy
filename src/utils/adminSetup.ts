import { supabase } from '@/integrations/supabase/client';

export const makeUserAdmin = async (userEmail: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get user by email (requires admin permissions)
    const { data, error: fetchError } = await supabase.auth.admin.listUsers();
    if (fetchError) throw fetchError;

    const user = data.users.find((u: any) => u.email === userEmail);
    if (!user) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }

    // Check if user already has admin role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (existingRole?.role === 'admin' || existingRole?.role === 'super_admin') {
      return { success: false, error: 'Benutzer ist bereits Admin' };
    }

    // Add admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'admin'
      });

    if (roleError) throw roleError;

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'admin_role_granted',
      table_name: 'user_roles',
      record_id: user.id,
      new_values: { role: 'admin' }
    });

    return { success: true };
  } catch (error) {
    console.error('Error making user admin:', error);
    return { success: false, error: 'Fehler beim Setzen der Admin-Rolle' };
  }
};

// This function should be called from the browser console by a super admin
// to create the first admin user
(window as any).makeUserAdmin = makeUserAdmin;