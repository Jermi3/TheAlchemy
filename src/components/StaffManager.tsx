import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCircle,
} from 'lucide-react';
import { availableComponents, useStaffManagement } from '../hooks/useStaff';
import type { AdminComponentKey, StaffRole } from '../types';

type StaffManagerProps = {
  onBack: () => void;
  canManage: boolean;
};

const componentLabels: Record<AdminComponentKey, string> = {
  dashboard: 'Dashboard',
  items: 'Menu Items',
  orders: 'Orders',
  categories: 'Categories',
  payments: 'Payments',
  settings: 'Site Settings',
  staff: 'Staff Management',
};

const roleOptions: { label: string; value: StaffRole; description: string }[] = [
  { label: 'Owner', value: 'owner', description: 'Full access to everything' },
  { label: 'Manager', value: 'manager', description: 'Manage operations but not staff' },
  { label: 'Staff', value: 'staff', description: 'Limited to assigned components' },
];

const StaffManager: React.FC<StaffManagerProps> = ({ onBack, canManage }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [createAuthUser, setCreateAuthUser] = useState(true);
  const [formState, setFormState] = useState({
    email: '',
    displayName: '',
    role: 'staff' as StaffRole,
    authUserId: '',
    password: '',
  });

  const {
    staff,
    loading,
    error,
    updating,
    refresh,
    createStaff,
    updateStaff,
    updatePermission,
    deleteStaff,
  } = useStaffManagement();

  const isSubmitting = updating === 'create';

  const sortedStaff = useMemo(() => {
    const priority = { owner: 0, manager: 1, staff: 2 } satisfies Record<StaffRole, number>;
    return [...staff].sort((a, b) => {
      if (priority[a.role] !== priority[b.role]) {
        return priority[a.role] - priority[b.role];
      }
      return a.displayName.localeCompare(b.displayName);
    });
  }, [staff]);

  const resetForm = () => {
    setFormState({ email: '', displayName: '', role: 'staff', authUserId: '', password: '' });
    setCreateAuthUser(true);
  };

  const handleCreateStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage) return;

    if (!formState.email || !formState.displayName) {
      alert('Email and display name are required');
      return;
    }

    // Validate based on workflow
    if (createAuthUser && !formState.password) {
      alert('Password is required when creating a new login account');
      return;
    }

    if (createAuthUser && formState.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      await createStaff({
        email: formState.email,
        displayName: formState.displayName,
        role: formState.role,
        authUserId: formState.authUserId.trim() || undefined,
        createAuthUser,
        password: formState.password || undefined,
      });
      resetForm();
      setFormOpen(false);
    } catch (err) {
      console.error('Create staff error', err);
      alert(err instanceof Error ? err.message : 'Failed to create staff member');
    }
  };

  const handleRoleChange = async (staffId: string, nextRole: StaffRole) => {
    if (!canManage) return;
    try {
      await updateStaff(staffId, { role: nextRole });
    } catch (err) {
      console.error('Role update failed', err);
    }
  };

  const handleActiveToggle = async (staffId: string, nextActive: boolean) => {
    if (!canManage) return;
    try {
      await updateStaff(staffId, { active: nextActive });
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  const togglePermission = async (
    staffId: string,
    component: AdminComponentKey,
    field: 'view' | 'manage',
    currentValue: boolean,
  ) => {
    if (!canManage) return;
    try {
      await updatePermission(staffId, component, {
        canView: field === 'view' ? !currentValue : undefined,
        canManage: field === 'manage' ? !currentValue : undefined,
      });
    } catch (err) {
      console.error('Permission update failed', err);
    }
  };

  const handleDelete = async (staffId: string, role: StaffRole) => {
    if (!canManage) return;
    if (role === 'owner') {
      alert('Owner accounts cannot be deleted.');
      return;
    }

    if (!confirm('Remove this staff account? This action cannot be undone.')) return;

    try {
      await deleteStaff(staffId);
    } catch (err) {
      console.error('Delete staff failed', err);
    }
  };

  const renderPermissionToggle = (
    staffId: string,
    component: AdminComponentKey,
    type: 'view' | 'manage',
    value: boolean,
    disabled: boolean,
  ) => (
    <label className="inline-flex items-center space-x-2 text-sm text-alchemy-cream/70">
      <input
        type="checkbox"
        checked={value}
        disabled={disabled || !canManage}
        onChange={() => togglePermission(staffId, component, type, value)}
        className="rounded border-white/20 bg-white/10 text-alchemy-gold focus:ring-alchemy-gold"
      />
      <span>{type === 'view' ? 'View' : 'Manage'}</span>
    </label>
  );

  return (
    <div className="min-h-screen bg-alchemy-night text-alchemy-cream">
      <div className="bg-alchemy-night/80 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-alchemy-cream/70 hover:text-alchemy-gold transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
              <h1 className="text-2xl font-playfair font-semibold text-alchemy-gold">Staff Management</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => refresh()}
                className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 text-alchemy-cream hover:bg-white/20 transition-colors duration-200 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {
                  setFormOpen((prev) => !prev);
                  if (!formOpen) resetForm();
                }}
                disabled={!canManage}
                className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-alchemy-gold via-alchemy-copper to-alchemy-gold text-alchemy-night font-semibold hover:from-alchemy-copper hover:to-alchemy-gold transition-colors duration-200 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                <span>Add Staff</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {formOpen && (
          <div className="alchemy-panel border border-white/10 rounded-3xl px-6 py-8">
            <div className="flex items-center space-x-3 mb-6">
              <ShieldCheck className="h-5 w-5 text-alchemy-gold" />
              <div>
                <h2 className="text-lg font-semibold text-alchemy-gold">Invite Staff Member</h2>
                <p className="text-sm text-alchemy-cream/70">
                  Staff gain access once their email is linked to a Supabase Auth user.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-alchemy-cream">Display Name *</label>
                <input
                  type="text"
                  value={formState.displayName}
                  onChange={(event) => setFormState((prev) => ({ ...prev, displayName: event.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-alchemy-cream focus:ring-2 focus:ring-alchemy-gold focus:border-transparent"
                  placeholder="e.g. Jane Doe"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-alchemy-cream">Email *</label>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-alchemy-cream focus:ring-2 focus:ring-alchemy-gold focus:border-transparent"
                  placeholder="name@example.com"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-alchemy-cream">Role</label>
                <select
                  value={formState.role}
                  onChange={(event) => setFormState((prev) => ({
                    ...prev,
                    role: event.target.value as StaffRole,
                  }))}
                  className="w-full px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-alchemy-cream focus:ring-2 focus:ring-alchemy-gold focus:border-transparent"
                  disabled={isSubmitting}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value} className="text-black">
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-alchemy-cream/60">
                  {roleOptions.find((option) => option.value === formState.role)?.description}
                </p>
              </div>

              {/* Workflow Selection */}
              <div className="md:col-span-2 space-y-3 border-t border-white/10 pt-4">
                <label className="text-sm font-medium text-alchemy-cream">Account Creation Method</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                    <input
                      type="radio"
                      checked={createAuthUser}
                      onChange={() => setCreateAuthUser(true)}
                      className="mt-1 text-alchemy-gold focus:ring-alchemy-gold"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-alchemy-cream">Create Login Account</div>
                      <div className="text-xs text-alchemy-cream/60 mt-1">
                        Create a full account with email & password. User can login immediately.
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                    <input
                      type="radio"
                      checked={!createAuthUser}
                      onChange={() => setCreateAuthUser(false)}
                      className="mt-1 text-alchemy-gold focus:ring-alchemy-gold"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-alchemy-cream">Invite Only</div>
                      <div className="text-xs text-alchemy-cream/60 mt-1">
                        Create profile without login. User signs up separately later.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Conditional Fields Based on Workflow */}
              {createAuthUser ? (
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-alchemy-cream">Password *</label>
                  <input
                    type="password"
                    value={formState.password}
                    onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-alchemy-cream focus:ring-2 focus:ring-alchemy-gold focus:border-transparent"
                    placeholder="Create a secure password (min 6 characters)"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    minLength={6}
                  />
                  <p className="text-xs text-alchemy-cream/60">
                    This user will be able to login with their email and this password immediately after creation.
                  </p>
                </div>
              ) : (
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-alchemy-cream flex items-center space-x-2">
                    <span>Auth User ID</span>
                    <span className="text-xs text-alchemy-cream/50">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formState.authUserId}
                    onChange={(event) => setFormState((prev) => ({ ...prev, authUserId: event.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-alchemy-cream focus:ring-2 focus:ring-alchemy-gold focus:border-transparent"
                    placeholder="Enter existing Supabase Auth User ID (or leave blank)"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-alchemy-cream/60">
                    Leave blank to create an invite-only profile, or enter an existing Supabase Auth User ID to link them.
                  </p>
                </div>
              )}

              <div className="md:col-span-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setFormOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg border border-white/15 text-alchemy-cream/80 hover:bg-white/10"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !canManage}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-alchemy-gold via-alchemy-copper to-alchemy-gold text-alchemy-night font-semibold flex items-center space-x-2 hover:from-alchemy-copper hover:to-alchemy-gold disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Create Staff</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="alchemy-panel border border-white/10 rounded-3xl p-12 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-3 text-alchemy-cream/70">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading staff members...</span>
            </div>
          </div>
        ) : sortedStaff.length === 0 ? (
          <div className="alchemy-panel border border-dashed border-white/20 rounded-3xl p-12 text-center text-alchemy-cream/70">
            <div className="flex flex-col items-center space-y-3">
              <UserCircle className="h-10 w-10 text-alchemy-cream/40" />
              <p>No staff members yet.</p>
              <p className="text-sm">Use "Add Staff" to invite team members.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedStaff.map((member) => {
              const isOwner = member.role === 'owner';
              const cardUpdating = typeof updating === 'string' && updating.startsWith(member.id);

              return (
                <div
                  key={member.id}
                  className="alchemy-panel border border-white/10 rounded-3xl p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-semibold text-alchemy-gold">{member.displayName}</h3>
                        {isOwner && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-alchemy-gold/20 text-alchemy-gold">
                            Owner
                          </span>
                        )}
                        {!member.active && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-white/10 text-alchemy-cream/70">
                            Suspended
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-alchemy-cream/70">
                        <Mail className="h-4 w-4" />
                        <span>{member.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <select
                        value={member.role}
                        onChange={(event) => handleRoleChange(member.id, event.target.value as StaffRole)}
                        disabled={!canManage || isOwner || cardUpdating}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm text-alchemy-cream focus:ring-2 focus:ring-alchemy-gold focus:border-transparent disabled:opacity-60"
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value} className="text-black">
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <label className="inline-flex items-center space-x-2 text-sm text-alchemy-cream/70">
                        <input
                          type="checkbox"
                          checked={member.active}
                          onChange={() => handleActiveToggle(member.id, !member.active)}
                          disabled={!canManage || isOwner || cardUpdating}
                          className="rounded border-white/20 bg-white/10 text-alchemy-gold focus:ring-alchemy-gold"
                        />
                        <span>Active</span>
                      </label>

                      <button
                        onClick={() => handleDelete(member.id, member.role)}
                        disabled={!canManage || isOwner || cardUpdating}
                        className="p-2 rounded-lg border border-white/10 text-alchemy-cream/60 hover:text-red-400 hover:border-red-400 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {availableComponents.map((component) => {
                      const permission = member.permissions.find((p) => p.component === component);
                      const disableManage = isOwner && component === 'staff';

                      return (
                        <div
                          key={component}
                          className="rounded-xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="text-sm font-medium text-alchemy-cream mb-3">
                            {componentLabels[component]}
                          </div>
                          <div className="flex items-center space-x-4">
                            {renderPermissionToggle(
                              member.id,
                              component,
                              'view',
                              permission?.canView ?? false,
                              cardUpdating || (isOwner && component === 'staff'),
                            )}
                            {renderPermissionToggle(
                              member.id,
                              component,
                              'manage',
                              permission?.canManage ?? false,
                              cardUpdating || disableManage,
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManager;
