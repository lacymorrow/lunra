-- Enable an extension for creating UUIDs if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create customers table to link Supabase users to Stripe customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY, -- User ID from Supabase auth.users
  stripe_customer_id TEXT UNIQUE, -- Stripe Customer ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.customers IS 'Stores mapping between Supabase users and Stripe customer IDs.';

-- Create products table to store product information from Stripe
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, -- Product ID from Stripe
  active BOOLEAN,
  name TEXT,
  description TEXT,
  image TEXT, -- URL to product image
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.products IS 'Stores product information from Stripe.';

-- Create prices table to store price information from Stripe
CREATE TABLE IF NOT EXISTS prices (
  id TEXT PRIMARY KEY, -- Price ID from Stripe
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  active BOOLEAN,
  description TEXT,
  unit_amount BIGINT, -- Amount in the smallest currency unit (e.g., cents)
  currency TEXT CHECK (char_length(currency) = 3),
  type TEXT CHECK (type IN ('one_time', 'recurring')),
  interval TEXT, -- e.g., 'month', 'year'
  interval_count INTEGER,
  trial_period_days INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE public.prices IS 'Stores price information for products from Stripe.';

-- Create subscriptions table to store user subscription details
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY, -- Subscription ID from Stripe
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  status TEXT, -- e.g., 'active', 'trialing', 'past_due', 'canceled', 'unpaid'
  metadata JSONB,
  price_id TEXT REFERENCES prices(id),
  quantity INTEGER,
  cancel_at_period_end BOOLEAN,
  created TIMESTAMP WITH TIME ZONE NOT NULL, -- Timestamp from Stripe
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL, -- Timestamp from Stripe
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL, -- Timestamp from Stripe
  ended_at TIMESTAMP WITH TIME ZONE, -- Timestamp from Stripe
  cancel_at TIMESTAMP WITH TIME ZONE, -- Timestamp from Stripe
  canceled_at TIMESTAMP WITH TIME ZONE, -- Timestamp from Stripe
  trial_start TIMESTAMP WITH TIME ZONE, -- Timestamp from Stripe
  trial_end TIMESTAMP WITH TIME ZONE, -- Timestamp from Stripe
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL, -- Local record creation
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL  -- Local record update
);
COMMENT ON TABLE public.subscriptions IS 'Stores user subscription details from Stripe.';

-- Add RLS policies for the new tables
-- Customers: Users can only see their own customer record.
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual read access to customers" ON customers FOR SELECT USING (auth.uid() = id);

-- Products: Allow all authenticated users to read product information.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to products" ON products FOR SELECT TO authenticated USING (true);

-- Prices: Allow all authenticated users to read price information.
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to prices" ON prices FOR SELECT TO authenticated USING (true);

-- Subscriptions: Users can only see their own subscriptions.
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual read access to subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);


-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prices_updated_at
  BEFORE UPDATE ON prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
