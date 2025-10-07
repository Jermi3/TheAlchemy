# 🎯 Deploy Edge Function via Supabase Dashboard

## Quick Method (No CLI needed!)

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Login to your account
3. Select your project (`kzmvofreoarbyaxsplto`)

### Step 2: Navigate to Edge Functions

1. Click **"Edge Functions"** in the left sidebar
2. Click **"Create a new function"** button

### Step 3: Create the Function

**Function Name**: `create-staff-with-auth`

**Function Code**: Copy and paste this entire code:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('Create staff with auth function loaded')

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with SERVICE ROLE key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the calling user is authenticated and is an owner
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is an owner
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('staff_profiles')
      .select('role, active')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !callerProfile || callerProfile.role !== 'owner' || !callerProfile.active) {
      return new Response(
        JSON.stringify({ error: 'Only active owners can create staff accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { email, password, displayName, role } = await req.json()

    // Validate input
    if (!email || !password || !displayName || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, displayName, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['owner', 'manager', 'staff'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be owner, manager, or staff' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 1: Create Supabase Auth user
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        display_name: displayName,
      },
    })

    if (createAuthError) {
      console.error('Failed to create auth user:', createAuthError)
      return new Response(
        JSON.stringify({ error: `Failed to create auth user: ${createAuthError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Auth user creation succeeded but no user returned' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Create staff profile
    const { data: staffData, error: createStaffError } = await supabaseAdmin
      .from('staff_profiles')
      .insert({
        email,
        display_name: displayName,
        role,
        auth_user_id: authData.user.id,
        active: true,
      })
      .select()
      .single()

    if (createStaffError) {
      console.error('Failed to create staff profile:', createStaffError)
      
      // Rollback: Delete the auth user we just created
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      } catch (rollbackError) {
        console.error('Failed to rollback auth user:', rollbackError)
      }

      return new Response(
        JSON.stringify({ error: `Failed to create staff profile: ${createStaffError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Fetch the permissions that were auto-created by the trigger
    const { data: permissions, error: permissionsError } = await supabaseAdmin
      .from('staff_permissions')
      .select('*')
      .eq('staff_id', staffData.id)

    if (permissionsError) {
      console.error('Failed to fetch permissions:', permissionsError)
    }

    // Return the created staff profile with permissions
    return new Response(
      JSON.stringify({
        staff: {
          ...staffData,
          permissions: permissions || [],
        },
        message: 'Staff account created successfully. User can now login with their credentials.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 4: Deploy

1. Click **"Deploy function"** or **"Save"**
2. Wait for deployment to complete (usually 10-30 seconds)
3. You should see a success message

### Step 5: Verify Deployment

Run the test script again:

```bash
cd /Users/jeremie/Documents/template-web-1
node test-edge-function.js
```

You should now see:
```
✅ CORS preflight successful!
✅ Function exists!
```

### Step 6: Test in Your App

1. Refresh your admin dashboard
2. Go to Staff Management
3. Click "Add Staff"
4. Select **"Create Login Account"**
5. Fill in:
   - Display Name: `Test User`
   - Email: `test@example.com`
   - Role: `Staff`
   - Password: `test123456`
6. Click "Create Staff"

✅ **Success!** The user can now login immediately.

---

## Alternative: Use CLI (If Dashboard doesn't work)

```bash
# In your own terminal (not in Cursor)
npx supabase login
npx supabase link --project-ref kzmvofreoarbyaxsplto
cd /Users/jeremie/Documents/template-web-1
npx supabase functions deploy create-staff-with-auth --no-verify-jwt
```

---

## Troubleshooting

### "Function appears deployed but still 404"

**Wait 30 seconds** and try again. Edge Functions can take a moment to propagate.

### "Permission denied"

Make sure you're logged in as an owner in your Supabase project.

### "Still not working"

Check the function logs:
1. Supabase Dashboard → Edge Functions
2. Click on `create-staff-with-auth`
3. Click "Logs" tab
4. Look for errors

---

## What Happens After Deployment

✅ Admins can create full staff accounts with login credentials  
✅ No need for manual email/password setup  
✅ New staff can login immediately  
✅ All permissions auto-created  

🎉 **Much better UX for your team!**

