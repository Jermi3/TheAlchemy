# 🚀 Deploy Edge Function - Quick Guide

## Problem Diagnosis

✅ **Test Complete!** The Edge Function is **NOT deployed** yet.

```
Status: 404 Not Found
Message: "Requested function was not found"
```

## Solution: Deploy the Edge Function

### Step 1: Login to Supabase

```bash
npx supabase login
```

This will open a browser window. Login with your Supabase account.

### Step 2: Link Your Project

```bash
npx supabase link --project-ref kzmvofreoarbyaxsplto
```

When prompted, enter your database password (from your Supabase project settings).

### Step 3: Deploy the Edge Function

```bash
npx supabase functions deploy create-staff-with-auth --no-verify-jwt
```

You should see output like:
```
Deploying create-staff-with-auth (project ref: kzmvofreoarbyaxsplto)
✓ Deployed create-staff-with-auth
```

### Step 4: Test Again

Run the test script to verify:
```bash
node test-edge-function.js
```

You should now see:
```
✅ CORS preflight successful!
✅ Function exists!
```

### Step 5: Try Creating Staff

1. Go to your Admin Dashboard
2. Staff Management → Add Staff
3. Select "Create Login Account"
4. Fill in the form and submit

✅ **It should work now!**

---

## Alternative: Deploy via Supabase Dashboard

If CLI deployment doesn't work, you can deploy manually:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Edge Functions" in the sidebar
4. Click "Deploy new function"
5. Upload the files from `supabase/functions/create-staff-with-auth/`

---

## Troubleshooting

### "Access token not provided"
**Solution**: Run `npx supabase login` first

### "Project not linked"
**Solution**: Run `npx supabase link --project-ref kzmvofreoarbyaxsplto`

### "Database password required"
**Find it here**:
1. Supabase Dashboard → Project Settings
2. Database → Connection string
3. Use the password you set when creating the project

### Still getting 404?
**Check**:
1. Run `npx supabase functions list` to see deployed functions
2. Check Supabase Dashboard → Edge Functions to see if it's there

---

## What the Edge Function Does

Once deployed, it allows admins to:
- Create Supabase Auth users (with service role key - secure!)
- Create staff profiles
- Link them together
- All in one API call

Without it, you can only use the "Invite Only" workflow.

