# Database Migration Files

This directory contains all necessary files for migrating your database schema to a new Supabase instance.

## 📁 Migration Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `complete_migration.sql` | **Main migration file** - Creates entire database schema | Run once on new Supabase instance |
| `MIGRATION_GUIDE.md` | **Detailed guide** - Comprehensive instructions and troubleshooting | Read first for understanding |
| `MIGRATION_QUICK_START.md` | **Quick reference** - Fast setup in ~5 minutes | Use for quick deployment |
| `rollback_migration.sql` | **Rollback script** - Removes all tables and data | Use to reset database |

## 🎯 Quick Decision Guide

**"I need to set up a new database quickly"**  
→ Use `MIGRATION_QUICK_START.md`

**"I want to understand everything before migrating"**  
→ Read `MIGRATION_GUIDE.md` first

**"I made a mistake and need to start over"**  
→ Run `rollback_migration.sql` then `complete_migration.sql`

**"I just need the SQL file"**  
→ Use `complete_migration.sql` directly

## 📊 Database Schema Overview

### Tables Created

```
menu_items (11 columns)
├── variations (4 columns)
└── add_ons (5 columns)

categories (7 columns)

payment_methods (8 columns)

site_settings (5 columns)

orders (17 columns)

staff_profiles (7 columns)
└── staff_permissions (6 columns)
```

### Storage Buckets

- `menu-images` - For storing menu item images (5MB limit)

### Key Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Real-time subscriptions for orders
- ✅ Public order tracking by order code
- ✅ Discount pricing with date ranges
- ✅ Role-based staff permissions
- ✅ Automatic order code generation (AM-XXXXX)
- ✅ Configurable site settings
- ✅ Multiple payment methods support

## 🚀 Typical Migration Workflow

```
1. Read MIGRATION_QUICK_START.md (2 min)
   ↓
2. Run complete_migration.sql (30 sec)
   ↓
3. Create admin user (1 min)
   ↓
4. Update payment methods (2 min)
   ↓
5. Update site settings (1 min)
   ↓
6. Deploy frontend & test (5 min)
   ↓
✅ Done! (~11 minutes total)
```

## 🔧 Maintenance Commands

### Check Migration Status

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Count records in each table
SELECT 
  'menu_items' as table_name, COUNT(*) as count FROM menu_items
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'staff_profiles', COUNT(*) FROM staff_profiles;
```

### Export Current Schema

```bash
# Export schema only (no data)
pg_dump -s "YOUR_DATABASE_URL" > schema_backup.sql

# Export data only
pg_dump -a "YOUR_DATABASE_URL" > data_backup.sql

# Export everything
pg_dump "YOUR_DATABASE_URL" > full_backup.sql
```

### Backup Before Migration

```sql
-- Create backup tables
CREATE TABLE menu_items_backup AS SELECT * FROM menu_items;
CREATE TABLE orders_backup AS SELECT * FROM orders;
-- etc...
```

## 🎨 Customization

After running the migration, customize these settings:

### Required Updates
- [ ] Payment methods (GCash, Maya, Bank Transfer)
- [ ] Site name and description
- [ ] Logo image URL
- [ ] Admin user account

### Optional Updates
- [ ] Category names and icons
- [ ] Currency settings
- [ ] Cart item limit
- [ ] Discount pricing rules

## 📋 Pre-Migration Checklist

Before running `complete_migration.sql`:

- [ ] Supabase project is created
- [ ] Database is empty or you have backups
- [ ] You have admin/service role access
- [ ] You've read the migration guide
- [ ] You have your connection details ready

## 🔒 Security Considerations

### What's Secure Out of the Box
✅ RLS enabled on all tables  
✅ Public can only read menus and create orders  
✅ Staff must be authenticated to manage data  
✅ Owner role required for staff management  
✅ Storage policies restrict uploads to authenticated users  

### What You Need to Configure
⚠️ Create strong passwords for staff accounts  
⚠️ Update default payment information  
⚠️ Keep service role key secret (server-side only)  
⚠️ Review and test all RLS policies  
⚠️ Enable email confirmations for auth users  

## 🐛 Common Issues

### Issue: Migration fails partway through
**Solution:** Run `rollback_migration.sql` then try again

### Issue: Can't login after creating staff profile
**Solution:** Verify `auth_user_id` matches the UUID in auth.users

### Issue: Images won't upload
**Solution:** Check storage policies exist and bucket is public

### Issue: Orders not appearing in real-time
**Solution:** Verify realtime is enabled in Supabase settings

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Management](https://supabase.com/docs/guides/storage)

## 🔄 Version History

| Date | Version | Changes |
|------|---------|---------|
| Oct 12, 2025 | 1.0 | Initial compiled migration |
| | | Includes all migrations through 20250112000000 |
| | | Staff management, orders, discounts, tips |

## 📞 Support

If you encounter issues:

1. Check the detailed `MIGRATION_GUIDE.md`
2. Review Supabase dashboard logs
3. Verify your PostgreSQL version (15+ required)
4. Check the troubleshooting section in guides

## 🎓 Understanding the Migration

### What Each Section Does

**Section 1: Utility Functions**
- Creates helper functions used by multiple tables
- Sets up automatic timestamp updates

**Section 2: Menu System**
- Creates tables for menu items, variations, and add-ons
- Sets up RLS policies for public reading and admin management

**Section 3: Categories**
- Creates category system with pre-configured options
- Links categories to menu items

**Section 4: Storage**
- Sets up image storage bucket
- Configures upload and access policies

**Section 5: Payment Methods**
- Creates payment configuration table
- Adds default payment options (must be updated)

**Section 6: Site Settings**
- Creates configurable settings table
- Adds default values for customization

**Section 7: Discount System**
- Adds discount pricing functions
- Supports time-based discounts

**Section 8: Orders System**
- Creates orders table with friendly codes
- Sets up real-time subscriptions
- Adds public order tracking function

**Section 9: Staff Management**
- Creates staff profiles and permissions
- Implements role-based access control
- Sets up owner/manager/staff hierarchy

## ✅ Post-Migration Verification

Run this verification script after migration:

```sql
-- Comprehensive verification
DO $$
DECLARE
  tables_count INTEGER;
  functions_count INTEGER;
  policies_count INTEGER;
  buckets_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO tables_count
  FROM information_schema.tables 
  WHERE table_schema = 'public';
  
  -- Count custom functions
  SELECT COUNT(*) INTO functions_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public';
  
  -- Count RLS policies
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  -- Count storage buckets
  SELECT COUNT(*) INTO buckets_count
  FROM storage.buckets 
  WHERE id = 'menu-images';
  
  -- Display results
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION VERIFICATION RESULTS';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables created: % (expected: 8+)', tables_count;
  RAISE NOTICE 'Functions created: % (expected: 8+)', functions_count;
  RAISE NOTICE 'RLS policies created: % (expected: 20+)', policies_count;
  RAISE NOTICE 'Storage buckets created: % (expected: 1)', buckets_count;
  RAISE NOTICE '============================================';
  
  -- Check if migration was successful
  IF tables_count >= 8 AND functions_count >= 8 AND policies_count >= 20 THEN
    RAISE NOTICE '✅ MIGRATION SUCCESSFUL';
  ELSE
    RAISE NOTICE '⚠️  MIGRATION MAY BE INCOMPLETE';
  END IF;
  RAISE NOTICE '============================================';
END $$;
```

---

## 🏁 Getting Started

**New to database migrations?** Start here:

1. Read `MIGRATION_QUICK_START.md` (5 min read)
2. Run `complete_migration.sql` in Supabase SQL Editor
3. Follow the post-migration configuration steps
4. Deploy your application and test

**Need detailed explanations?** 

Read `MIGRATION_GUIDE.md` for comprehensive documentation with troubleshooting.

---

**Last Updated:** October 12, 2025  
**Compatible With:** Supabase (PostgreSQL 15+)  
**Migration Version:** 1.0

