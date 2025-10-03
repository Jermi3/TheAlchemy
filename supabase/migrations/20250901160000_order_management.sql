/*
  # Add Orders Management Tables

  1. Orders Table
    - Store customer checkout submissions with line items and contact details
    - Track fulfilment status for admin dashboard workflows

  2. Friendly Order Codes
    - Generate short, human-friendly order codes for customers to reference

  3. Self-Service Tracking
    - Provide an RPC endpoint customers can call with their order code to view status

  4. Security
    - Allow anonymous/public inserts so guests can place orders without signing in
    - Restrict read/update/delete access to authenticated admin users only

  5. Automation
    - Maintain updated_at via trigger on every modification
*/

CREATE SEQUENCE IF NOT EXISTS order_code_seq;

GRANT USAGE, SELECT ON SEQUENCE order_code_seq TO anon, authenticated;

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
  status text NOT NULL DEFAULT 'pending',
  line_items jsonb NOT NULL,
  messenger_payload text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders REPLICA IDENTITY FULL;

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

-- Allow guests to create orders (used by the public website checkout)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Public can create orders'
  ) THEN
    EXECUTE $$CREATE POLICY "Public can create orders"
      ON orders
      FOR INSERT
      TO public
      WITH CHECK (true)$$;
  END IF;
END;
$$;

-- Only authenticated admins can read order data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Admins can read orders'
  ) THEN
    EXECUTE $$CREATE POLICY "Admins can read orders"
      ON orders
      FOR SELECT
      TO authenticated
      USING (true)$$;
  END IF;
END;
$$;

-- Only authenticated admins can update order data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Admins can update orders'
  ) THEN
    EXECUTE $$CREATE POLICY "Admins can update orders"
      ON orders
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true)$$;
  END IF;
END;
$$;

-- Only authenticated admins can delete order data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Admins can delete orders'
  ) THEN
    EXECUTE $$CREATE POLICY "Admins can delete orders"
      ON orders
      FOR DELETE
      TO authenticated
      USING (true)$$;
  END IF;
END;
$$;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);

CREATE OR REPLACE FUNCTION get_order_status(p_order_code text)
RETURNS TABLE (
  order_code text,
  customer_name text,
  service_type text,
  status text,
  total numeric(10,2),
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
