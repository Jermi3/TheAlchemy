-- Fix auth_user_id to be nullable
ALTER TABLE staff_profiles 
  ALTER COLUMN auth_user_id DROP NOT NULL;
