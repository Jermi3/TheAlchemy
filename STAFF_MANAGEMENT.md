# Staff Management Guide

## Overview

This system supports role-based access control (RBAC) with three staff roles:
- **Owner**: Full access to everything, including staff management
- **Manager**: Can manage operations but cannot manage other staff
- **Staff**: Limited access based on assigned component permissions

## Adding New Staff Members

There are **TWO workflows** for creating staff members:

---

### Workflow 1: Invite-First (Recommended for New Users)

**Use this when:** The person doesn't have a Supabase Auth account yet.

#### Steps:

1. **In Admin Dashboard** → Staff Management → "Add Staff"
2. Fill in:
   - Display Name: `John Doe`
   - Email: `john@example.com`
   - Role: `staff` / `manager` / `owner`
   - Auth User ID: **Leave blank**
3. Click "Create Staff"

✅ **Result**: Staff profile created with `auth_user_id = NULL`

4. **User signs up** using Supabase Auth (via your login page or Supabase Dashboard)
   - They create an account with the email `john@example.com`
   - Supabase generates an `auth.users.id` for them

5. **Link the accounts**:
   - Option A: Admin manually updates the staff profile with the user's `auth_user_id`
   - Option B: Use the `link_staff_to_auth_user()` database function

```sql
-- Run in Supabase SQL Editor
SELECT link_staff_to_auth_user(
  '<staff_profile_id>'::uuid,
  'john@example.com'
);
```

✅ **User can now login** and access the admin dashboard based on their permissions!

---

### Workflow 2: Link Existing Auth User

**Use this when:** The person already has a Supabase Auth account.

#### Steps:

1. **Get the user's Auth User ID**:
   - Go to Supabase Dashboard → Authentication → Users
   - Find the user by email
   - Copy their User ID (UUID format)

2. **In Admin Dashboard** → Staff Management → "Add Staff"
3. Fill in:
   - Display Name: `Jane Smith`
   - Email: `jane@example.com`
   - Role: `staff` / `manager` / `owner`
   - Auth User ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890` ← Paste the UUID
4. Click "Create Staff"

✅ **Result**: Staff profile immediately linked to auth account

✅ **User can login right away** with their existing credentials!

---

## Important Notes

### Security Considerations

⚠️ **DO NOT** try to create Supabase Auth users from client-side code!
- The admin API requires a service role key
- Service role keys should NEVER be exposed to the browser
- This is why we don't have a "Create new login" option in the UI

### Creating Auth Users

To create a new Supabase Auth user, use one of these methods:

#### Method 1: Supabase Dashboard (Easiest)
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Invite user" or "Add user"
3. Enter email and password
4. User is created with confirmed email

#### Method 2: Sign Up Page (Self-Service)
- Direct the user to your app's sign-up page
- They create their own account
- Then link it to their staff profile (Workflow 1)

#### Method 3: Supabase Edge Function (Advanced)
Create an Edge Function with service role access to automate user creation:

```typescript
// supabase/functions/create-staff-with-auth/index.ts
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service role key
)

Deno.serve(async (req) => {
  const { email, password, displayName, role } = await req.json()
  
  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  
  if (authError) return new Response(JSON.stringify({ error: authError }), { status: 400 })
  
  // Create staff profile
  const { data: staffData, error: staffError } = await supabaseAdmin
    .from('staff_profiles')
    .insert({
      email,
      display_name: displayName,
      role,
      auth_user_id: authData.user.id,
    })
    .select()
    .single()
  
  if (staffError) return new Response(JSON.stringify({ error: staffError }), { status: 400 })
  
  return new Response(JSON.stringify({ staff: staffData }), { status: 200 })
})
```

---

## Database Schema

### staff_profiles Table

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| auth_user_id | uuid | **Yes** | Links to auth.users(id) |
| email | text | No | Staff email (unique) |
| display_name | text | No | Display name |
| role | text | No | 'owner', 'manager', or 'staff' |
| active | boolean | No | Account status |
| created_at | timestamptz | No | Creation timestamp |
| updated_at | timestamptz | No | Last update timestamp |

**Key Point**: `auth_user_id` is **NULLABLE** to support invite-first workflow!

### staff_permissions Table

| Column | Type | Description |
|--------|------|-------------|
| staff_id | uuid | References staff_profiles(id) |
| component | text | 'dashboard', 'items', 'orders', etc. |
| can_view | boolean | Read access |
| can_manage | boolean | Write access |

---

## Permissions Matrix

### Default Permissions (Auto-Created)

When a new staff member is created, they automatically receive:

| Component | View | Manage |
|-----------|------|--------|
| dashboard | ✅ | ❌ |
| items | ✅ | ✅ |
| orders | ✅ | ✅ |
| categories | ✅ | ✅ |
| payments | ✅ | ✅ |
| settings | ✅ | ✅ |
| staff | ❌ | ❌ |

**Note**: Staff component is NOT enabled by default. Only owners should have staff management access.

---

## Troubleshooting

### Error: "null value in column auth_user_id violates not-null constraint"

**Problem**: Your database still has the NOT NULL constraint on `auth_user_id`.

**Solution**: Run the migration to make it nullable:

```bash
# Apply the database migration
npx supabase db push
```

Or manually in Supabase SQL Editor:

```sql
ALTER TABLE staff_profiles 
  ALTER COLUMN auth_user_id DROP NOT NULL;
```

### Error: "insert or update violates foreign key constraint"

**Problem**: Trying to insert an `auth_user_id` that doesn't exist in `auth.users`.

**Solution**: 
- Either leave `auth_user_id` blank (null)
- Or use a valid UUID from an existing Supabase Auth user

### Staff Profile Created But Can't Login

**Problem**: Staff profile exists but `auth_user_id` is null.

**Solution**: Link the profile to an auth user:

```sql
-- Find the staff profile
SELECT id, email, auth_user_id FROM staff_profiles WHERE email = 'user@example.com';

-- Link to auth user by email
SELECT link_staff_to_auth_user(
  '<staff_profile_id>'::uuid,
  'user@example.com'
);
```

---

## Testing Both Workflows

### Test Workflow 1 (Invite-First)

```sql
-- 1. Create staff profile without auth
INSERT INTO staff_profiles (email, display_name, role, auth_user_id)
VALUES ('test1@example.com', 'Test User 1', 'staff', NULL);

-- 2. Verify it was created
SELECT * FROM staff_profiles WHERE email = 'test1@example.com';

-- 3. User signs up (via UI or Supabase Dashboard)
-- 4. Link them
SELECT link_staff_to_auth_user(
  (SELECT id FROM staff_profiles WHERE email = 'test1@example.com'),
  'test1@example.com'
);

-- 5. Verify link
SELECT id, email, auth_user_id FROM staff_profiles WHERE email = 'test1@example.com';
```

### Test Workflow 2 (Link Existing)

```sql
-- 1. Create auth user first (via Supabase Dashboard or sign-up page)
-- Get their auth.users.id

-- 2. Create staff profile with auth_user_id
INSERT INTO staff_profiles (email, display_name, role, auth_user_id)
VALUES ('test2@example.com', 'Test User 2', 'staff', '<auth_user_id_here>');

-- 3. Verify
SELECT id, email, auth_user_id FROM staff_profiles WHERE email = 'test2@example.com';

-- User can login immediately!
```

---

## Summary

✅ **Invite-First**: Create staff profile → User signs up → Link accounts  
✅ **Link Existing**: Create auth user → Create staff profile with auth_user_id

❌ **DO NOT**: Try to create auth users from client-side JavaScript (security risk!)

🔒 **Key Insight**: Making `auth_user_id` nullable allows flexible onboarding while maintaining security.

---

## Next Steps

1. Apply the database migrations:
   ```bash
   cd /Users/jeremie/Documents/template-web-1
   npx supabase db push
   ```

2. Test creating a staff member with the "Leave blank" option

3. Create a Supabase Auth user via the Dashboard

4. Link them using the `link_staff_to_auth_user()` function

5. Verify the user can login and see the admin dashboard!

