/*
  # Fix staff_profiles id foreign key constraint
  
  The id column should NOT have a foreign key constraint.
  Only auth_user_id should reference auth.users(id).
  
  This migration drops the incorrect constraint on the id column.
*/

-- Drop the incorrect foreign key constraint on id column
ALTER TABLE staff_profiles 
  DROP CONSTRAINT IF EXISTS staff_profiles_id_fkey;

-- Ensure auth_user_id has the correct foreign key constraint
-- (This should already exist, but we'll make sure)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'staff_profiles_auth_user_id_fkey'
      AND table_name = 'staff_profiles'
  ) THEN
    ALTER TABLE staff_profiles 
      ADD CONSTRAINT staff_profiles_auth_user_id_fkey 
      FOREIGN KEY (auth_user_id) 
      REFERENCES auth.users(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- Verify the table structure
DO $$
DECLARE
  constraints_count INTEGER;
BEGIN
  -- Count foreign key constraints on staff_profiles
  SELECT COUNT(*) INTO constraints_count
  FROM information_schema.table_constraints
  WHERE table_name = 'staff_profiles'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%_id_fkey';
  
  -- Log the result
  RAISE NOTICE 'Foreign key constraints on staff_profiles.id: %', constraints_count;
END $$;

