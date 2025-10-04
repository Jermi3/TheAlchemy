import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import type {
  AdminComponentKey,
  StaffPermission,
  StaffProfile,
  StaffRole,
} from '../types';

type StaffProfileRow = Database['public']['Tables']['staff_profiles']['Row'];
type StaffPermissionRow = Database['public']['Tables']['staff_permissions']['Row'];

const ADMIN_COMPONENTS: AdminComponentKey[] = [
  'dashboard',
  'items',
  'orders',
  'categories',
  'payments',
  'settings',
  'staff',
];

const mapRowsToProfile = (
  profile: StaffProfileRow,
  permissions: StaffPermissionRow[],
): StaffProfile => ({
  id: profile.id,
  authUserId: profile.auth_user_id,
  email: profile.email,
  displayName: profile.display_name,
  role: profile.role,
  active: profile.active,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
  permissions: ADMIN_COMPONENTS.map<StaffPermission>((component) => {
    const row = permissions.find((permission) => permission.component === component);
    return {
      component,
      canView: row?.can_view ?? false,
      canManage: row?.can_manage ?? false,
    };
  }),
});

const fetchProfilePermissions = async (staffId: string) => {
  const { data, error } = await supabase
    .from('staff_permissions')
    .select('*')
    .eq('staff_id', staffId);

  if (error) throw error;
  return data ?? [];
};

export const useStaffAccess = () => {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const user = sessionData.session?.user;
      if (!user) {
        setProfile(null);
        setError(null);
        return;
      }

      const { data: profileRow, error: profileError } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileRow) {
        setProfile(null);
        setError('No staff profile found for this account.');
        return;
      }

      const permissions = await fetchProfilePermissions(profileRow.id);
      setProfile(mapRowsToProfile(profileRow, permissions));
      setError(null);
    } catch (err) {
      console.error('Failed to load staff profile', err);
      setError(err instanceof Error ? err.message : 'Failed to load staff profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const canView = useCallback(
    (component: AdminComponentKey) => {
      if (!profile) return false;
      return (
        profile.active &&
        profile.permissions.some(
          (permission) => permission.component === component && permission.canView,
        )
      );
    },
    [profile],
  );

  const canManage = useCallback(
    (component: AdminComponentKey) => {
      if (!profile) return false;
      return (
        profile.active &&
        profile.permissions.some(
          (permission) => permission.component === component && permission.canManage,
        )
      );
    },
    [profile],
  );

  const accessibleComponents = useMemo(
    () =>
      profile?.permissions
        .filter((permission) => permission.canView)
        .map((permission) => permission.component) ?? [],
    [profile],
  );

  return {
    profile,
    loading,
    error,
    canView,
    canManage,
    accessibleComponents,
    refresh: loadProfile,
  };
};

interface CreateStaffPayload {
  email: string;
  displayName: string;
  role: StaffRole;
  authUserId?: string;
}

interface UpdateStaffPayload {
  displayName?: string;
  role?: StaffRole;
  active?: boolean;
  authUserId?: string | null;
}

interface UpdatePermissionPayload {
  canView?: boolean;
  canManage?: boolean;
}

export const useStaffManagement = () => {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const { data: profiles, error: profilesError } = await supabase
        .from('staff_profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (profilesError) throw profilesError;

      const profileRows = profiles ?? [];
      if (profileRows.length === 0) {
        setStaff([]);
        setError(null);
        return;
      }

      const { data: permissions, error: permissionsError } = await supabase
        .from('staff_permissions')
        .select('*')
        .in(
          'staff_id',
          profileRows.map((profile) => profile.id),
        );

      if (permissionsError) throw permissionsError;

      const permissionRows = permissions ?? [];
      const mapped = profileRows.map((profileRow) => {
        const rows = permissionRows.filter((row) => row.staff_id === profileRow.id);
        return mapRowsToProfile(profileRow, rows);
      });

      setStaff(mapped);
      setError(null);
    } catch (err) {
      console.error('Failed to load staff list', err);
      setError(err instanceof Error ? err.message : 'Failed to load staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const createStaff = useCallback(
    async ({ email, displayName, role, authUserId }: CreateStaffPayload) => {
      setUpdating('create');
      try {
        const { data, error: insertError } = await supabase
          .from('staff_profiles')
          .insert({
            email,
            display_name: displayName,
            role,
            auth_user_id: authUserId ?? null,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const permissions = await fetchProfilePermissions(data.id);
        const newProfile = mapRowsToProfile(data, permissions);
        setStaff((prev) => [...prev, newProfile]);
        setError(null);
        return newProfile;
      } catch (err) {
        console.error('Failed to create staff member', err);
        setError(err instanceof Error ? err.message : 'Failed to create staff member');
        throw err;
      } finally {
        setUpdating(null);
      }
    },
    [],
  );

  const updateStaff = useCallback(
    async (staffId: string, updates: UpdateStaffPayload) => {
      setUpdating(staffId);
      try {
        const payload: Database['public']['Tables']['staff_profiles']['Update'] = {};

        if (typeof updates.displayName !== 'undefined') {
          payload.display_name = updates.displayName;
        }
        if (typeof updates.role !== 'undefined') {
          payload.role = updates.role;
        }
        if (typeof updates.active !== 'undefined') {
          payload.active = updates.active;
        }
        if (updates.authUserId !== undefined) {
          payload.auth_user_id = updates.authUserId;
        }

        const { data, error: updateError } = await supabase
          .from('staff_profiles')
          .update(payload)
          .eq('id', staffId)
          .select()
          .single();

        if (updateError) throw updateError;

        const permissions = await fetchProfilePermissions(data.id);
        const updated = mapRowsToProfile(data, permissions);
        setStaff((prev) => prev.map((profile) => (profile.id === staffId ? updated : profile)));
        setError(null);
        return updated;
      } catch (err) {
        console.error('Failed to update staff member', err);
        setError(err instanceof Error ? err.message : 'Failed to update staff member');
        throw err;
      } finally {
        setUpdating(null);
      }
    },
    [],
  );

  const updatePermission = useCallback(
    async (
      staffId: string,
      component: AdminComponentKey,
      updates: UpdatePermissionPayload,
    ) => {
      setUpdating(`${staffId}:${component}`);
      try {
        const payload: Database['public']['Tables']['staff_permissions']['Insert'] = {
          staff_id: staffId,
          component,
        };

        if (typeof updates.canView !== 'undefined') {
          payload.can_view = updates.canView;
        }
        if (typeof updates.canManage !== 'undefined') {
          payload.can_manage = updates.canManage;
        }

        const { data, error: upsertError } = await supabase
          .from('staff_permissions')
          .upsert(payload)
          .select()
          .single();

        if (upsertError) throw upsertError;

        setStaff((prev) =>
          prev.map((profile) => {
            if (profile.id !== staffId) return profile;
            const existing = profile.permissions.find((p) => p.component === component);
            const updatedPermission: StaffPermission = {
              component,
              canView: updates.canView ?? existing?.canView ?? false,
              canManage: updates.canManage ?? existing?.canManage ?? false,
            };
            const permissions = profile.permissions.some((p) => p.component === component)
              ? profile.permissions.map((p) =>
                  p.component === component ? updatedPermission : p,
                )
              : [...profile.permissions, updatedPermission];
            return { ...profile, permissions };
          }),
        );
        setError(null);
        return data;
      } catch (err) {
        console.error('Failed to update staff permission', err);
        setError(err instanceof Error ? err.message : 'Failed to update staff permission');
        throw err;
      } finally {
        setUpdating(null);
      }
    },
    [],
  );

  const deleteStaff = useCallback(async (staffId: string) => {
    setUpdating(staffId);
    try {
      const { error: deleteError } = await supabase
        .from('staff_profiles')
        .delete()
        .eq('id', staffId);

      if (deleteError) throw deleteError;

      setStaff((prev) => prev.filter((profile) => profile.id !== staffId));
      setError(null);
    } catch (err) {
      console.error('Failed to delete staff member', err);
      setError(err instanceof Error ? err.message : 'Failed to delete staff member');
      throw err;
    } finally {
      setUpdating(null);
    }
  }, []);

  return {
    staff,
    loading,
    error,
    updating,
    refresh: loadStaff,
    createStaff,
    updateStaff,
    updatePermission,
    deleteStaff,
  };
};

export const availableComponents = ADMIN_COMPONENTS;
