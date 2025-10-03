-- Add cart_item_limit to site_settings table
INSERT INTO site_settings (id, value, type, description) VALUES
  ('cart_item_limit', '50', 'number', 'Maximum number of items allowed in customer cart')
ON CONFLICT (id) DO NOTHING;
