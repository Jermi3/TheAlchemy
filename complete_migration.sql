-- ============================================================================
-- COMPLETE DATABASE MIGRATION FOR THEALCHEMY
-- ============================================================================
-- This file compiles all necessary SQL migrations for setting up the database
-- in a new Supabase instance. Execute this file in order.
-- ============================================================================

-- ============================================================================
-- SECTION 1: UTILITY FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Create updated_at trigger function (used by multiple tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- SECTION 2: CORE MENU MANAGEMENT SYSTEM
-- ============================================================================

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  base_price decimal(10,2) NOT NULL,
  category text NOT NULL,
  popular boolean DEFAULT false,
  available boolean DEFAULT true,
  image_url text,
  discount_price decimal(10,2),
  discount_start_date timestamptz,
  discount_end_date timestamptz,
  discount_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create variations table
CREATE TABLE IF NOT EXISTS variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create add_ons table
CREATE TABLE IF NOT EXISTS add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on menu tables
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read menu items"
  ON menu_items FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can read variations"
  ON variations FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can read add-ons"
  ON add_ons FOR SELECT TO public USING (true);

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can manage menu items"
  ON menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage variations"
  ON variations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage add-ons"
  ON add_ons FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create trigger for menu_items updated_at
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for menu items
CREATE INDEX IF NOT EXISTS idx_menu_items_discount_active ON menu_items(discount_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_discount_dates ON menu_items(discount_start_date, discount_end_date);

-- ============================================================================
-- SECTION 3: CATEGORIES MANAGEMENT
-- ============================================================================

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '☕',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT TO public USING (active = true);

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can manage categories"
  ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create updated_at trigger for categories
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (id, name, icon, sort_order, active) VALUES
  ('hot-coffee', 'Hot Coffee', '☕', 1, true),
  ('iced-coffee', 'Iced Coffee', '🧊', 2, true),
  ('non-coffee', 'Non-Coffee', '🫖', 3, true),
  ('food', 'Food & Pastries', '🥐', 4, true),
  ('dim-sum', 'Dim Sum', '🥟', 5, true),
  ('noodles', 'Noodles', '🍜', 6, true),
  ('rice-dishes', 'Rice Dishes', '🍚', 7, true),
  ('beverages', 'Beverages', '🍵', 8, true)
ON CONFLICT (id) DO NOTHING;

-- Add foreign key constraint to menu_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'menu_items_category_fkey'
  ) THEN
    ALTER TABLE menu_items 
    ADD CONSTRAINT menu_items_category_fkey 
    FOREIGN KEY (category) REFERENCES categories(id);
  END IF;
END $$;

-- ============================================================================
-- SECTION 4: STORAGE FOR MENU IMAGES
-- ============================================================================

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Allow public read access to menu images
CREATE POLICY "Public read access for menu images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'menu-images');

-- Allow authenticated users to upload menu images
CREATE POLICY "Authenticated users can upload menu images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Allow authenticated users to update menu images
CREATE POLICY "Authenticated users can update menu images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'menu-images');

-- Allow authenticated users to delete menu images
CREATE POLICY "Authenticated users can delete menu images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'menu-images');

-- ============================================================================
-- SECTION 5: PAYMENT METHODS MANAGEMENT
-- ============================================================================

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id text PRIMARY KEY,
  name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  qr_code_url text NOT NULL,
  active boolean DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read active payment methods"
  ON payment_methods FOR SELECT TO public USING (active = true);

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can manage payment methods"
  ON payment_methods FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create updated_at trigger for payment_methods
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment methods (update with your actual information)
INSERT INTO payment_methods (id, name, account_number, account_name, qr_code_url, sort_order, active) VALUES
  ('gcash', 'GCash', '09XX XXX XXXX', 'M&C Bakehouse', 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', 1, true),
  ('maya', 'Maya (PayMaya)', '09XX XXX XXXX', 'M&C Bakehouse', 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', 2, true),
  ('bank-transfer', 'Bank Transfer', 'Account: 1234-5678-9012', 'M&C Bakehouse', 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', 3, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 6: SITE SETTINGS
-- ============================================================================

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id text PRIMARY KEY,
  value text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read site settings"
  ON site_settings FOR SELECT TO public USING (true);

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can manage site settings"
  ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create updated_at trigger for site_settings
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default site settings
INSERT INTO site_settings (id, value, type, description) VALUES
  ('site_name', 'Beracah Cafe', 'text', 'The name of the cafe/restaurant'),
  ('site_logo', 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', 'image', 'The logo image URL for the site'),
  ('site_description', 'Welcome to Beracah Cafe - Your perfect coffee destination', 'text', 'Short description of the cafe'),
  ('currency', 'PHP', 'text', 'Currency symbol for prices'),
  ('currency_code', 'PHP', 'text', 'Currency code for payments'),
  ('cart_item_limit', '50', 'number', 'Maximum number of items allowed in customer cart')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 7: DISCOUNT PRICING HELPER FUNCTIONS
-- ============================================================================

-- Create function to check if discount is active
CREATE OR REPLACE FUNCTION is_discount_active(
  discount_active boolean,
  discount_start_date timestamptz,
  discount_end_date timestamptz
)
RETURNS boolean AS $$
BEGIN
  IF NOT discount_active THEN
    RETURN false;
  END IF;
  
  IF discount_start_date IS NULL AND discount_end_date IS NULL THEN
    RETURN discount_active;
  END IF;
  
  RETURN (
    (discount_start_date IS NULL OR now() >= discount_start_date) AND
    (discount_end_date IS NULL OR now() <= discount_end_date)
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get effective price (discounted or regular)
CREATE OR REPLACE FUNCTION get_effective_price(
  base_price decimal,
  discount_price decimal,
  discount_active boolean,
  discount_start_date timestamptz,
  discount_end_date timestamptz
)
RETURNS decimal AS $$
BEGIN
  IF is_discount_active(discount_active, discount_start_date, discount_end_date) AND discount_price IS NOT NULL THEN
    RETURN discount_price;
  END IF;
  
  RETURN base_price;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 8: ORDERS MANAGEMENT
-- ============================================================================

-- Create order code sequence
CREATE SEQUENCE IF NOT EXISTS order_code_seq;
GRANT USAGE, SELECT ON SEQUENCE order_code_seq TO anon, authenticated;

-- Create function to generate friendly order codes
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS text AS $$
DECLARE
  alphabet constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  candidate text;
  token text;
BEGIN
  LOOP
    token := '';
    FOR i IN 1..5 LOOP
      token := token || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
    END LOOP;

    candidate := 'AM-' || token;

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM orders WHERE order_code = candidate
    );
  END LOOP;

  RETURN candidate;
END;
$$ LANGUAGE plpgsql;

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text UNIQUE NOT NULL DEFAULT generate_order_code(),
  customer_name text NOT NULL,
  contact_number text NOT NULL,
  service_type text NOT NULL,
  table_number text,
  address text,
  landmark text,
  pickup_time text,
  notes text,
  payment_method text NOT NULL,
  total numeric(10,2) NOT NULL,
  tip numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  line_items jsonb NOT NULL,
  messenger_payload text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS and realtime
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders REPLICA IDENTITY FULL;

-- Add orders to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE orders';
  END IF;
END;
$$;

-- Create policies for orders
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Public can create orders'
  ) THEN
    CREATE POLICY "Public can create orders"
      ON orders FOR INSERT TO public WITH CHECK (true);
  END IF;
END;
$policy$;

DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Admins can read orders'
  ) THEN
    CREATE POLICY "Admins can read orders"
      ON orders FOR SELECT TO authenticated USING (true);
  END IF;
END;
$policy$;

DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Admins can update orders'
  ) THEN
    CREATE POLICY "Admins can update orders"
      ON orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END;
$policy$;

DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Admins can delete orders'
  ) THEN
    CREATE POLICY "Admins can delete orders"
      ON orders FOR DELETE TO authenticated USING (true);
  END IF;
END;
$policy$;

-- Create trigger for orders updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);

-- Create function for public order status tracking
CREATE OR REPLACE FUNCTION get_order_status(p_order_code text)
RETURNS TABLE (
  order_code text,
  customer_name text,
  service_type text,
  status text,
  total numeric(10,2),
  tip numeric(10,2),
  table_number text,
  pickup_time text,
  created_at timestamptz,
  updated_at timestamptz,
  line_items jsonb
) AS $$
  SELECT
    o.order_code,
    o.customer_name,
    o.service_type,
    o.status,
    o.total,
    o.tip,
    o.table_number,
    o.pickup_time,
    o.created_at,
    o.updated_at,
    o.line_items
  FROM orders o
  WHERE o.order_code = p_order_code
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_order_status(text) TO anon, authenticated;

-- ============================================================================
-- SECTION 9: STAFF MANAGEMENT
-- ============================================================================

-- Create staff_profiles table
CREATE TABLE IF NOT EXISTS staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for staff_profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_profiles_email ON staff_profiles(email);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_auth_user_id ON staff_profiles(auth_user_id);

-- Create staff_permissions table
CREATE TABLE IF NOT EXISTS staff_permissions (
  staff_id uuid REFERENCES staff_profiles(id) ON DELETE CASCADE,
  component text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_manage boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_permissions_component_check CHECK (
    component IN ('dashboard', 'items', 'orders', 'categories', 'payments', 'settings', 'staff')
  ),
  PRIMARY KEY (staff_id, component)
);

-- Enable RLS on staff tables
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;

-- Create helper function to check staff role
CREATE OR REPLACE FUNCTION public.staff_has_role(roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM staff_profiles sp
    WHERE sp.auth_user_id = auth.uid()
      AND sp.active
      AND sp.role = ANY(roles)
  );
$$;

REVOKE ALL ON FUNCTION public.staff_has_role(text[]) FROM public;
GRANT EXECUTE ON FUNCTION public.staff_has_role(text[]) TO authenticated;

-- Create function to ensure staff permissions on insert
CREATE OR REPLACE FUNCTION public.ensure_staff_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO staff_permissions (staff_id, component, can_view, can_manage)
  SELECT NEW.id AS staff_id,
         component,
         component IN ('dashboard', 'items', 'orders', 'categories', 'payments', 'settings'),
         component IN ('items', 'orders', 'categories', 'payments', 'settings')
  FROM unnest(ARRAY['dashboard', 'items', 'orders', 'categories', 'payments', 'settings', 'staff']) AS component
  ON CONFLICT (staff_id, component) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger for staff permissions
DROP TRIGGER IF EXISTS ensure_staff_permissions_after_insert ON staff_profiles;
CREATE TRIGGER ensure_staff_permissions_after_insert
  AFTER INSERT ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_staff_permissions();

-- Create updated_at triggers for staff tables
CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_permissions_updated_at
  BEFORE UPDATE ON staff_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create policies for staff_profiles
CREATE POLICY "Staff can view profiles"
  ON staff_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can update their own profile"
  ON staff_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Owners manage staff profiles"
  ON staff_profiles FOR ALL TO authenticated
  USING (public.staff_has_role(ARRAY['owner']))
  WITH CHECK (public.staff_has_role(ARRAY['owner']));

-- Create policies for staff_permissions
CREATE POLICY "Staff can view permissions"
  ON staff_permissions FOR SELECT TO authenticated
  USING (
    public.staff_has_role(ARRAY['owner','manager'])
    OR EXISTS (
      SELECT 1
      FROM staff_profiles sp
      WHERE sp.id = staff_permissions.staff_id
        AND sp.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Owners manage staff permissions"
  ON staff_permissions FOR ALL TO authenticated
  USING (public.staff_has_role(ARRAY['owner']))
  WITH CHECK (public.staff_has_role(ARRAY['owner']));

-- Grant permissions for staff functions
GRANT USAGE ON SCHEMA auth TO postgres;

-- Create function to link staff to auth user
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
  IF NOT public.staff_has_role(ARRAY['owner']) THEN
    RAISE EXCEPTION 'Only owners can link staff to auth users';
  END IF;

  SELECT id INTO found_auth_id
  FROM auth.users
  WHERE email = auth_email
  LIMIT 1;

  IF found_auth_id IS NULL THEN
    RAISE EXCEPTION 'No auth user found with email: %', auth_email;
  END IF;

  UPDATE staff_profiles
  SET auth_user_id = found_auth_id,
      updated_at = now()
  WHERE id = staff_profile_id;

  RETURN found_auth_id;
END;
$$;

GRANT EXECUTE ON FUNCTION link_staff_to_auth_user(uuid, text) TO authenticated;

COMMENT ON FUNCTION link_staff_to_auth_user IS 
'Links a staff profile to an existing Supabase Auth user by email. 
Only owners can execute this function. 
For creating new auth users, use Supabase Edge Functions or the Dashboard.';

-- Ensure owners have staff management permissions
INSERT INTO staff_permissions (staff_id, component, can_view, can_manage)
SELECT sp.id, 'staff' AS component, true, true
FROM staff_profiles sp
WHERE sp.role = 'owner'
ON CONFLICT (staff_id, component) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Summary of what was created:
-- 1. Menu management system (menu_items, variations, add_ons)
-- 2. Categories system with default categories
-- 3. Storage bucket for menu images
-- 4. Payment methods management
-- 5. Site settings with default values
-- 6. Discount pricing functions
-- 7. Orders management with order tracking
-- 8. Staff management with role-based permissions
-- 9. All necessary RLS policies and triggers
-- 10. Helper functions for operations

-- Next steps:
-- 1. Update payment_methods with your actual account information
-- 2. Update site_settings with your actual business information
-- 3. Create your first owner/admin user in Supabase Auth
-- 4. Create a staff_profile for that user
-- 5. Populate menu_items with your actual menu

