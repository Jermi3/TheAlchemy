/*
  # Fix staff_profiles.auth_user_id to be nullable
  
  This migration ensures that auth_user_id can be NULL, allowing staff profiles
  to be created before the user signs up with Supabase Auth.
  
  The staff profile can be linked to an auth user later when they complete registration.
*/

-- Remove NOT NULL constraint from auth_user_id if it exists
ALTER TABLE staff_profiles 
  ALTER COLUMN auth_user_id DROP NOT NULL;

-- Ensure the column can accept NULL values (idempotent)
-- This is safe to run multiple times
DO $$
BEGIN
  -- Verify the column exists and is nullable
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'staff_profiles' 
      AND column_name = 'auth_user_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE staff_profiles 
      ALTER COLUMN auth_user_id DROP NOT NULL;
  END IF;
END $$;

