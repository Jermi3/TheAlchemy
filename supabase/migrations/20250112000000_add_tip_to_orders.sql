-- Add tip column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip numeric(10,2) DEFAULT 0;

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_order_status(text);

-- Create the get_order_status function with tip included
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

