# Database Migration Guide

This guide explains how to migrate your database schema to a new Supabase instance.

## Overview

The `complete_migration.sql` file contains all the necessary SQL migrations compiled from your existing migrations directory. This single file can be executed on a new Supabase instance to set up the entire database schema.

## What's Included

The migration file creates:

### 1. **Core Tables**
- `menu_items` - Food and beverage items with pricing, categories, and availability
- `variations` - Size/type variations for menu items
- `add_ons` - Optional add-ons for menu items
- `categories` - Menu categories (Hot Coffee, Dim Sum, etc.)
- `payment_methods` - Payment method configurations (GCash, Maya, Bank Transfer)
- `site_settings` - Configurable site settings
- `orders` - Customer orders with status tracking
- `staff_profiles` - Staff user profiles
- `staff_permissions` - Component-level permissions for staff

### 2. **Storage**
- `menu-images` bucket for storing menu item images (5MB limit per file)

### 3. **Security**
- Row Level Security (RLS) policies for all tables
- Public read access for menu data
- Authenticated admin access for management
- Role-based access control for staff

### 4. **Features**
- Discount pricing system with date ranges
- Friendly order codes (e.g., AM-12345)
- Real-time order updates
- Public order tracking by order code
- Staff role hierarchy (owner, manager, staff)

## Prerequisites

Before running the migration:

1. A new Supabase project
2. Access to the Supabase SQL Editor or `psql` connection
3. Admin/service role access to the database

## Migration Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. **Login to your new Supabase project**
   - Go to https://app.supabase.com
   - Select or create your project

2. **Open SQL Editor**
   - Navigate to "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute the migration**
   - Copy the entire contents of `complete_migration.sql`
   - Paste it into the SQL editor
   - Click "Run" or press Ctrl/Cmd + Enter
   - Wait for the execution to complete (should take 10-30 seconds)

4. **Verify the migration**
   - Check the "Table Editor" to ensure all tables were created
   - Check "Authentication" > "Policies" to verify RLS policies
   - Check "Storage" to ensure the `menu-images` bucket was created

### Option 2: Using PostgreSQL CLI

If you prefer using the command line:

```bash
# Get your database connection string from Supabase Dashboard
# Project Settings > Database > Connection String (Direct connection)

# Run the migration
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f complete_migration.sql
```

## Post-Migration Configuration

After running the migration, you need to configure your application:

### 1. Update Payment Methods

Replace the placeholder payment information with your actual details:

```sql
UPDATE payment_methods 
SET 
  account_number = 'YOUR_ACTUAL_NUMBER',
  account_name = 'YOUR_ACTUAL_NAME',
  qr_code_url = 'YOUR_ACTUAL_QR_CODE_URL'
WHERE id = 'gcash';

-- Repeat for 'maya' and 'bank-transfer'
```

### 2. Update Site Settings

Customize your site information:

```sql
UPDATE site_settings 
SET value = 'Your Cafe Name' 
WHERE id = 'site_name';

UPDATE site_settings 
SET value = 'Your description here' 
WHERE id = 'site_description';

UPDATE site_settings 
SET value = 'https://your-logo-url.com/logo.png' 
WHERE id = 'site_logo';
```

### 3. Create Your First Admin User

1. **Create an Auth User:**
   - Go to Supabase Dashboard > Authentication > Users
   - Click "Add User"
   - Enter email and password
   - Copy the user's UUID

2. **Create Staff Profile:**
   ```sql
   INSERT INTO staff_profiles (auth_user_id, email, display_name, role, active)
   VALUES (
     'YOUR_AUTH_USER_UUID',
     'admin@yourdomain.com',
     'Admin Name',
     'owner',
     true
   );
   ```

### 4. Populate Menu Items

You can either:

- **Manually enter items** via the admin dashboard after deployment
- **Or bulk import** using SQL if you have existing data:

```sql
INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url)
VALUES 
  ('Espresso', 'Rich and bold Italian espresso', 80, 'hot-coffee', true, true, 'https://...'),
  ('Cappuccino', 'Espresso with steamed milk foam', 120, 'hot-coffee', true, true, 'https://...')
-- Add more items...
;
```

## Default Categories

The migration includes these pre-configured categories:

- **hot-coffee** - Hot Coffee ☕
- **iced-coffee** - Iced Coffee 🧊
- **non-coffee** - Non-Coffee 🫖
- **food** - Food & Pastries 🥐
- **dim-sum** - Dim Sum 🥟
- **noodles** - Noodles 🍜
- **rice-dishes** - Rice Dishes 🍚
- **beverages** - Beverages 🍵

You can add, edit, or remove categories via the admin dashboard or SQL.

## Troubleshooting

### Error: "relation already exists"

If you see this error, some tables may already exist. The migration uses `IF NOT EXISTS` clauses, so this shouldn't happen unless you've run parts of it before. You can:

1. Drop all tables and start fresh (⚠️ **WARNING: This deletes all data**)
2. Run only the parts that failed

### Error: "permission denied for schema auth"

This means your database user doesn't have access to the auth schema. The migration includes:

```sql
GRANT USAGE ON SCHEMA auth TO postgres;
```

If this doesn't work, you may need to run the migration as the superuser or skip staff-related functions.

### Error: "publication does not exist"

The realtime publication might not exist. Check your Supabase version. For older versions, you might need to create it manually or skip that section.

## Verifying the Migration

Run these queries to verify everything is set up correctly:

```sql
-- Check all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check storage buckets
SELECT * FROM storage.buckets;

-- Check default categories
SELECT * FROM categories ORDER BY sort_order;

-- Check default site settings
SELECT * FROM site_settings;
```

## Rollback

If you need to rollback the migration (⚠️ **WARNING: This will delete all data**):

```sql
-- Drop all tables
DROP TABLE IF EXISTS staff_permissions CASCADE;
DROP TABLE IF EXISTS staff_profiles CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS add_ons CASCADE;
DROP TABLE IF EXISTS variations CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS order_code_seq CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_order_code() CASCADE;
DROP FUNCTION IF EXISTS get_order_status(text) CASCADE;
DROP FUNCTION IF EXISTS is_discount_active(boolean, timestamptz, timestamptz) CASCADE;
DROP FUNCTION IF EXISTS get_effective_price(decimal, decimal, boolean, timestamptz, timestamptz) CASCADE;
DROP FUNCTION IF EXISTS staff_has_role(text[]) CASCADE;
DROP FUNCTION IF EXISTS ensure_staff_permissions() CASCADE;
DROP FUNCTION IF EXISTS link_staff_to_auth_user(uuid, text) CASCADE;

-- Remove storage bucket (via Dashboard or API)
-- Note: Must be done via Dashboard or Supabase API
```

## Support

If you encounter any issues:

1. Check the Supabase Dashboard logs
2. Review the migration file for any environment-specific configurations
3. Ensure your Supabase project is on a compatible version
4. Check the documentation at https://supabase.com/docs

## Migration History

This compiled migration includes all changes from:

- 20250829160942_green_stream.sql - Initial menu system
- 20250829162038_lucky_portal.sql - Availability field
- 20250830082821_peaceful_cliff.sql - Storage bucket
- 20250901005107_calm_pine.sql - Categories
- 20250901015559_frosty_wildflower.sql - Bakehouse items
- 20250901125510_floating_sky.sql - Payment methods
- 20250901155428_raspy_heart.sql - ClickEats items (initial)
- 20250901155550_steep_cake.sql - ClickEats items (complete)
- 20250901160000_order_management.sql - Orders system
- 20250901170000_staff_management.sql - Staff & permissions
- 20250101000000_add_discount_pricing_and_site_settings.sql - Discounts
- 20250102000000_add_cart_item_limit.sql - Cart limit
- 20250107000000_fix_staff_auth_user_id_nullable.sql - Staff fixes
- 20250107000001_add_create_staff_with_auth_function.sql - Staff functions
- 20250107000002_fix_staff_profiles_id_constraint.sql - Constraint fixes
- 20250112000000_add_tip_to_orders.sql - Tips feature

---

**Last Updated:** October 12, 2025  
**Database Version:** PostgreSQL 15+ (Supabase compatible)

