-- ============================================================================
-- ROLLBACK MIGRATION SCRIPT
-- ============================================================================
-- ⚠️  WARNING: This script will DELETE ALL DATA and DROP ALL TABLES
-- ⚠️  Only use this if you want to completely reset your database
-- ⚠️  There is NO UNDO for this operation
-- ============================================================================

-- Before running this script, make sure you:
-- 1. Have backed up any data you want to keep
-- 2. Understand that this will delete EVERYTHING
-- 3. Are certain you want to proceed

-- Uncomment the line below to enable the rollback
-- DO $$ BEGIN RAISE NOTICE 'Rollback is enabled'; END $$;

-- ============================================================================
-- SECTION 1: DROP TABLES
-- ============================================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS staff_permissions CASCADE;
DROP TABLE IF EXISTS staff_profiles CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS add_ons CASCADE;
DROP TABLE IF EXISTS variations CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;

-- ============================================================================
-- SECTION 2: DROP SEQUENCES
-- ============================================================================

DROP SEQUENCE IF EXISTS order_code_seq CASCADE;

-- ============================================================================
-- SECTION 3: DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_order_code() CASCADE;
DROP FUNCTION IF EXISTS get_order_status(text) CASCADE;
DROP FUNCTION IF EXISTS is_discount_active(boolean, timestamptz, timestamptz) CASCADE;
DROP FUNCTION IF EXISTS get_effective_price(decimal, decimal, boolean, timestamptz, timestamptz) CASCADE;
DROP FUNCTION IF EXISTS staff_has_role(text[]) CASCADE;
DROP FUNCTION IF EXISTS ensure_staff_permissions() CASCADE;
DROP FUNCTION IF EXISTS link_staff_to_auth_user(uuid, text) CASCADE;

-- ============================================================================
-- SECTION 4: DROP STORAGE POLICIES
-- ============================================================================

-- Drop storage policies for menu-images bucket
DROP POLICY IF EXISTS "Public read access for menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu images" ON storage.objects;

-- ============================================================================
-- SECTION 5: DROP STORAGE BUCKETS
-- ============================================================================

-- Note: Storage buckets cannot be dropped via SQL
-- You must delete the 'menu-images' bucket manually via:
-- 1. Supabase Dashboard → Storage → menu-images → Delete bucket
-- 2. Or use the Supabase Management API

-- Alternatively, you can empty the bucket with SQL:
DELETE FROM storage.objects WHERE bucket_id = 'menu-images';

-- Then delete the bucket record (this might fail if files still exist):
DELETE FROM storage.buckets WHERE id = 'menu-images';

-- ============================================================================
-- SECTION 6: REMOVE REALTIME PUBLICATION (if needed)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS orders';
  END IF;
END;
$$;

-- ============================================================================
-- SECTION 7: CLEAN UP ORPHANED AUTH USERS (OPTIONAL)
-- ============================================================================

-- ⚠️  WARNING: This will delete auth users that were created for staff
-- ⚠️  Only uncomment if you want to remove these users as well

-- List auth users before deleting (for safety)
-- SELECT id, email, created_at FROM auth.users;

-- Delete auth users (CAREFUL!)
-- DELETE FROM auth.users WHERE email LIKE '%@yourdomain.com';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- After rollback, verify everything is deleted:

-- Should return 0 tables (or only system tables)
SELECT COUNT(*) as remaining_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Should return 0 functions
SELECT COUNT(*) as remaining_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'update_updated_at_column',
    'generate_order_code',
    'get_order_status',
    'is_discount_active',
    'get_effective_price',
    'staff_has_role',
    'ensure_staff_permissions',
    'link_staff_to_auth_user'
  );

-- Should return 0 or just system buckets
SELECT COUNT(*) as remaining_buckets
FROM storage.buckets 
WHERE id = 'menu-images';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ROLLBACK COMPLETED';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'All tables, functions, and sequences have been dropped.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Manually delete the menu-images bucket via Dashboard if it still exists';
  RAISE NOTICE '2. Review auth.users and delete staff users if needed';
  RAISE NOTICE '3. Run complete_migration.sql to set up the database again';
  RAISE NOTICE '============================================================================';
END $$;

