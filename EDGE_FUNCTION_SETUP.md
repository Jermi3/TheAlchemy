# Setting Up Staff Creation Edge Function

## Overview

The `create-staff-with-auth` Edge Function allows admins to create complete staff accounts (Supabase Auth user + staff profile) in one action from the admin dashboard.

## Prerequisites

1. **Supabase CLI** installed:
   ```bash
   npm install -g supabase
   ```

2. **Supabase Project** linked:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

## Deploy the Edge Function

### Step 1: Deploy to Supabase

```bash
cd /Users/jeremie/Documents/template-web-1

# Deploy the edge function
npx supabase functions deploy create-staff-with-auth
```

### Step 2: Set Environment Variables (Optional)

If your edge function needs custom environment variables:

```bash
# Set secrets for the edge function
npx supabase secrets set SUPABASE_URL=your-supabase-url
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Note**: The Edge Function automatically has access to these environment variables:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (DO NOT expose this!)

### Step 3: Test the Deployment

```bash
# Check function logs
npx supabase functions logs create-staff-with-auth --tail
```

## How It Works

### Flow Diagram

```
Admin Dashboard (Client)
         ↓
    [Create Staff Button]
         ↓
    Workflow Selection:
    ┌─────────────────┬──────────────────┐
    │ Create Login    │  Invite Only     │
    │ Account         │  (No Login)      │
    └─────────────────┴──────────────────┘
         ↓                     ↓
    Edge Function         Direct Insert
    (Secure)              to staff_profiles
         ↓
    ┌────────────────────┐
    │ 1. Verify caller   │
    │    is Owner        │
    ├────────────────────┤
    │ 2. Create Auth     │
    │    User (Service   │
    │    Role Key)       │
    ├────────────────────┤
    │ 3. Create Staff    │
    │    Profile         │
    ├────────────────────┤
    │ 4. Auto-create     │
    │    Permissions     │
    │    (via trigger)   │
    └────────────────────┘
         ↓
    User can login immediately!
```

### Security Features

✅ **Authorization Check**: Only authenticated owners can call the function  
✅ **Service Role Access**: Uses service role key (never exposed to client)  
✅ **Auto-confirm Email**: New users don't need email verification  
✅ **Rollback on Error**: If staff profile creation fails, auth user is deleted  
✅ **CORS Enabled**: Works from your web app

## API Reference

### Endpoint

```
POST https://your-project.supabase.co/functions/v1/create-staff-with-auth
```

### Headers

```http
Content-Type: application/json
Authorization: Bearer <your-access-token>
```

### Request Body

```json
{
  "email": "newstaff@example.com",
  "password": "securepassword123",
  "displayName": "Jane Doe",
  "role": "staff"
}
```

**Fields**:
- `email` (required): Staff member's email
- `password` (required): Login password (min 6 characters)
- `displayName` (required): Display name for the staff member
- `role` (required): One of `"owner"`, `"manager"`, `"staff"`

### Response (Success)

```json
{
  "staff": {
    "id": "uuid-here",
    "email": "newstaff@example.com",
    "display_name": "Jane Doe",
    "role": "staff",
    "auth_user_id": "auth-uuid-here",
    "active": true,
    "created_at": "2025-01-07T...",
    "updated_at": "2025-01-07T...",
    "permissions": [
      {
        "staff_id": "uuid-here",
        "component": "dashboard",
        "can_view": true,
        "can_manage": false
      },
      // ... more permissions
    ]
  },
  "message": "Staff account created successfully. User can now login with their credentials."
}
```

### Response (Error)

```json
{
  "error": "Error message here"
}
```

**Common Errors**:
- `401 Unauthorized`: Missing or invalid auth token
- `403 Forbidden`: Caller is not an owner
- `400 Bad Request`: Missing required fields or validation failed
- `400 Bad Request`: Email already exists

## Testing

### Test from the UI

1. Login as an owner
2. Go to Admin Dashboard → Staff Management
3. Click "Add Staff"
4. Select "Create Login Account"
5. Fill in the form:
   - Display Name: `Test User`
   - Email: `test@example.com`
   - Role: `Staff`
   - Password: `password123`
6. Click "Create Staff"

✅ **Expected**: Staff created, can login immediately!

### Test with cURL

```bash
# Get your access token from browser dev tools or login
ACCESS_TOKEN="your-access-token-here"
SUPABASE_URL="https://your-project.supabase.co"

curl -X POST \
  "${SUPABASE_URL}/functions/v1/create-staff-with-auth" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{
    "email": "testuser@example.com",
    "password": "testpass123",
    "displayName": "Test User",
    "role": "staff"
  }'
```

### Verify the Creation

1. **Check Auth Users** (Supabase Dashboard → Authentication → Users)
   - Should see new user with confirmed email

2. **Check Staff Profiles** (Supabase Dashboard → Table Editor → staff_profiles)
   - Should see new row with `auth_user_id` linked

3. **Check Permissions** (Supabase Dashboard → Table Editor → staff_permissions)
   - Should see default permissions auto-created

4. **Test Login**
   - Try logging in with the email and password
   - Should access admin dashboard based on permissions

## Troubleshooting

### Error: "Function not found"

**Solution**: Deploy the function:
```bash
npx supabase functions deploy create-staff-with-auth
```

### Error: "Missing authorization header"

**Problem**: Request doesn't include auth token.

**Solution**: Make sure you're logged in and the frontend is sending the Authorization header.

### Error: "Only active owners can create staff accounts"

**Problem**: Calling user is not an owner or is inactive.

**Solution**: 
1. Check your staff profile role in the database
2. Make sure `active = true`

### Error: "Failed to create auth user: Email rate limit exceeded"

**Problem**: Supabase has rate limits on auth user creation.

**Solution**: Wait a few minutes and try again. In production, this is rarely an issue.

### Edge Function Logs

View real-time logs:
```bash
npx supabase functions logs create-staff-with-auth --tail
```

View specific time range:
```bash
npx supabase functions logs create-staff-with-auth --since 1h
```

## Database Migrations Needed

Before using this feature, ensure you've applied the database fix:

```sql
-- Make auth_user_id nullable (if not already done)
ALTER TABLE staff_profiles 
  ALTER COLUMN auth_user_id DROP NOT NULL;
```

Apply via SQL Editor or:
```bash
npx supabase db push
```

## Security Considerations

⚠️ **Important Security Notes**:

1. **Service Role Key**: Never expose this key to client-side code. It's only used in the Edge Function (server-side).

2. **Owner-Only Access**: The function checks that only owners can create staff. This prevents privilege escalation.

3. **Email Confirmation**: We auto-confirm emails to avoid the extra step. Consider adding email verification if this is a security concern for your use case.

4. **Password Strength**: Minimum 6 characters enforced. Consider adding stronger requirements.

5. **Rate Limiting**: Supabase has built-in rate limits. For production, consider adding additional rate limiting.

## Alternative: Manual Creation

If you prefer not to use Edge Functions, you can still create staff manually:

### Option 1: Supabase Dashboard

1. **Create Auth User** (Authentication → Users → Add user)
2. **Get their User ID**
3. **Create Staff Profile** with that `auth_user_id`

### Option 2: Invite-First

1. **Create Staff Profile** with `auth_user_id = NULL`
2. **User signs up** on your signup page
3. **Link accounts** using the `link_staff_to_auth_user()` function

## Summary

✅ **Workflow 1 (Edge Function)**: Create auth user + staff profile in one click  
✅ **Workflow 2 (Invite-Only)**: Create staff profile, user signs up later  
✅ **Workflow 3 (Manual)**: Create auth user first, then link to staff profile

Choose the workflow that best fits your team's needs!

