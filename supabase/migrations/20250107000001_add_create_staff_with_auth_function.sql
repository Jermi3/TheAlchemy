/*
  # Add function to create staff with auth user
  
  This function allows owners to create staff members with auth accounts
  in a single transaction. It uses security definer to access auth schema.
  
  Note: This approach has limitations - it cannot create auth.users directly.
  For production, consider using Supabase Edge Functions with service role key.
*/

-- First, ensure auth_user_id is nullable
ALTER TABLE staff_profiles 
  ALTER COLUMN auth_user_id DROP NOT NULL;

-- Grant necessary permissions for the function
GRANT USAGE ON SCHEMA auth TO postgres;

-- Create a helper function that owners can use to link auth users
-- This doesn't create auth users (requires service role), but helps link them
CREATE OR REPLACE FUNCTION link_staff_to_auth_user(
  staff_profile_id uuid,
  auth_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  found_auth_id uuid;
BEGIN
  -- Check if caller is an owner
  IF NOT public.staff_has_role(array['owner']) THEN
    RAISE EXCEPTION 'Only owners can link staff to auth users';
  END IF;

  -- Find auth user by email
  SELECT id INTO found_auth_id
  FROM auth.users
  WHERE email = auth_email
  LIMIT 1;

  IF found_auth_id IS NULL THEN
    RAISE EXCEPTION 'No auth user found with email: %', auth_email;
  END IF;

  -- Update staff profile with auth_user_id
  UPDATE staff_profiles
  SET auth_user_id = found_auth_id,
      updated_at = now()
  WHERE id = staff_profile_id;

  RETURN found_auth_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION link_staff_to_auth_user(uuid, text) TO authenticated;

-- Add comment explaining usage
COMMENT ON FUNCTION link_staff_to_auth_user IS 
'Links a staff profile to an existing Supabase Auth user by email. 
Only owners can execute this function. 
For creating new auth users, use Supabase Edge Functions or the Dashboard.';

