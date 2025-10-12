# Quick Start Migration Guide

This is a condensed guide for quickly migrating your database to a new Supabase instance.

## 🚀 Quick Steps (5 Minutes)

### 1. Run the Migration (2 minutes)

**Via Supabase Dashboard:**
1. Open your Supabase project at https://app.supabase.com
2. Go to **SQL Editor** → **New Query**
3. Copy and paste the entire `complete_migration.sql` file
4. Click **Run** (Ctrl/Cmd + Enter)
5. Wait for "Success" message

### 2. Create Your Admin Account (1 minute)

**Create Auth User:**
1. Go to **Authentication** → **Users** → **Add User**
2. Enter your email and password
3. **Copy the UUID** from the user list

**Create Staff Profile:**
```sql
-- Replace YOUR_UUID and email with your actual values
INSERT INTO staff_profiles (auth_user_id, email, display_name, role, active)
VALUES (
  'YOUR_UUID_HERE',
  'your-email@example.com',
  'Your Name',
  'owner',
  true
);
```

### 3. Configure Payment Methods (2 minutes)

```sql
-- Update GCash
UPDATE payment_methods 
SET 
  account_number = '09XX XXX XXXX',
  account_name = 'Your Business Name',
  qr_code_url = 'https://your-storage.com/gcash-qr.png'
WHERE id = 'gcash';

-- Update Maya
UPDATE payment_methods 
SET 
  account_number = '09XX XXX XXXX',
  account_name = 'Your Business Name',
  qr_code_url = 'https://your-storage.com/maya-qr.png'
WHERE id = 'maya';

-- Update Bank Transfer
UPDATE payment_methods 
SET 
  account_number = 'Account: XXXX-XXXX-XXXX',
  account_name = 'Your Business Name',
  qr_code_url = 'https://your-storage.com/bank-qr.png'
WHERE id = 'bank-transfer';
```

### 4. Update Site Settings

```sql
UPDATE site_settings SET value = 'Your Cafe Name' WHERE id = 'site_name';
UPDATE site_settings SET value = 'Your cafe description' WHERE id = 'site_description';
UPDATE site_settings SET value = 'https://your-logo-url.com/logo.png' WHERE id = 'site_logo';
```

✅ **Done!** Your database is ready. Now deploy your frontend and start adding menu items via the admin dashboard.

---

## 📋 Verification Checklist

After migration, verify these items:

```sql
-- ✅ Check tables were created (should return 10+ tables)
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- ✅ Check categories exist (should return 8 rows)
SELECT COUNT(*) FROM categories;

-- ✅ Check your admin user exists
SELECT * FROM staff_profiles WHERE role = 'owner';

-- ✅ Check payment methods
SELECT id, name, account_name FROM payment_methods;

-- ✅ Check site settings
SELECT id, value FROM site_settings;

-- ✅ Check storage bucket exists
SELECT name FROM storage.buckets WHERE id = 'menu-images';
```

---

## 🔧 Common Issues & Fixes

### Issue: "Cannot connect to database"
**Fix:** Check your database connection string and firewall settings.

### Issue: "Permission denied"
**Fix:** Make sure you're using the correct database password and have admin access.

### Issue: "Staff login not working"
**Fix:** Verify the staff profile's `auth_user_id` matches the UUID from Supabase Auth:
```sql
SELECT sp.email, sp.auth_user_id, au.id as actual_auth_id
FROM staff_profiles sp
LEFT JOIN auth.users au ON sp.email = au.email;
```

### Issue: "Images not uploading"
**Fix:** Check storage policies are created:
```sql
SELECT policyname FROM pg_policies WHERE schemaname = 'storage';
```

---

## 📱 Environment Variables

After migration, update your frontend `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from:
**Supabase Dashboard** → **Settings** → **API**

---

## 🎯 What You Get

After running `complete_migration.sql`, you'll have:

| Feature | Status |
|---------|--------|
| Menu Items System | ✅ Ready (empty, add items via admin) |
| Categories | ✅ Pre-configured (8 categories) |
| Orders System | ✅ Ready for customers |
| Staff Management | ✅ Ready (add your first admin) |
| Payment Methods | ⚠️ Update with real info |
| Site Settings | ⚠️ Update with your branding |
| Image Storage | ✅ Ready (5MB limit) |
| RLS Security | ✅ Configured |
| Order Tracking | ✅ Public tracking enabled |
| Discounts | ✅ Ready to configure |

---

## 🆕 Adding Your First Menu Item

After migration, add items via SQL or admin dashboard:

```sql
INSERT INTO menu_items (
  name, 
  description, 
  base_price, 
  category, 
  popular, 
  available, 
  image_url
)
VALUES (
  'Espresso',
  'Rich and bold Italian espresso',
  80.00,
  'hot-coffee',
  true,
  true,
  'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg'
);
```

**Or use the Admin Dashboard:**
1. Login at your-app.vercel.app/admin
2. Go to "Menu Items" → "Add Item"
3. Fill in the form and save

---

## 🔐 Security Notes

- ✅ Row Level Security (RLS) is enabled on all tables
- ✅ Public users can only read menu data and create orders
- ✅ Only authenticated staff can manage data
- ✅ Role-based permissions for staff members
- ⚠️ Remember to change default payment info
- ⚠️ Keep your service role key secret (never expose in frontend)

---

## 📞 Need Help?

If you encounter issues:

1. Check the full `MIGRATION_GUIDE.md` for detailed explanations
2. Review Supabase logs in the Dashboard
3. Verify your Supabase project is on PostgreSQL 15+
4. Check that realtime is enabled for your project

---

## 🔄 Migrating Between Supabase Projects

**From Project A → Project B:**

1. **Export data from Project A:**
   ```sql
   -- Export menu items
   COPY (SELECT * FROM menu_items) TO '/tmp/menu_items.csv' CSV HEADER;
   -- Repeat for other data you want to migrate
   ```

2. **Run `complete_migration.sql` on Project B**

3. **Import data to Project B:**
   ```sql
   COPY menu_items FROM '/tmp/menu_items.csv' CSV HEADER;
   ```

**Or use Supabase CLI:**
```bash
# Link to project A
supabase link --project-ref PROJECT_A_REF

# Generate a seed file
supabase db dump --data-only > seed.sql

# Link to project B and run migration
supabase link --project-ref PROJECT_B_REF
supabase db reset  # This will run your migrations
```

---

**Total Migration Time:** ~5 minutes  
**Difficulty:** Beginner-friendly  
**Last Updated:** October 12, 2025

