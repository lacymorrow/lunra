-- =============================================
-- LUNRA Database Schema for Stripe Integration
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- EXISTING TABLES (already created)
-- =============================================

-- Goals table (existing)
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  timeline TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'on-track', 'behind', 'completed', 'paused')),
  due_date TIMESTAMP WITH TIME ZONE,
  sub_goals JSONB DEFAULT '[]'::jsonb,
  completed_sub_goals INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones table (existing)
CREATE TABLE IF NOT EXISTS milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  task TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- NEW TABLES FOR STRIPE INTEGRATION
-- =============================================

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'seedling' CHECK (plan_type IN ('seedling', 'bloom', 'garden')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage metrics table
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  goals_created INTEGER DEFAULT 0,
  goals_limit INTEGER DEFAULT 3, -- Default for seedling plan
  ai_requests_count INTEGER DEFAULT 0,
  ai_requests_limit INTEGER DEFAULT 50, -- Default for seedling plan
  last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Existing indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON milestones(goal_id);

-- New indexes for subscription tables
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_id ON usage_metrics(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Goals policies (existing)
CREATE POLICY IF NOT EXISTS "Users can view their own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- Milestones policies (existing)
CREATE POLICY IF NOT EXISTS "Users can view their own milestones" ON milestones
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM goals WHERE goals.id = milestones.goal_id AND goals.user_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "Users can create milestones for their goals" ON milestones
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM goals WHERE goals.id = milestones.goal_id AND goals.user_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "Users can update their own milestones" ON milestones
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM goals WHERE goals.id = milestones.goal_id AND goals.user_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "Users can delete their own milestones" ON milestones
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM goals WHERE goals.id = milestones.goal_id AND goals.user_id = auth.uid()
  ));

-- Subscription policies
CREATE POLICY IF NOT EXISTS "Users can view their own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to manage subscriptions (for webhooks)
CREATE POLICY IF NOT EXISTS "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Usage metrics policies
CREATE POLICY IF NOT EXISTS "Users can view their own usage metrics" ON usage_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own usage metrics" ON usage_metrics
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to manage usage metrics (for webhooks)
CREATE POLICY IF NOT EXISTS "Service role can manage usage metrics" ON usage_metrics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- TRIGGERS
-- =============================================

-- Update triggers for existing tables
CREATE TRIGGER IF NOT EXISTS update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update triggers for new tables
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_metrics_updated_at
  BEFORE UPDATE ON usage_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS FOR SUBSCRIPTION MANAGEMENT
-- =============================================

-- Function to initialize user subscription on signup
CREATE OR REPLACE FUNCTION initialize_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default subscription
  INSERT INTO subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'seedling', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert default usage metrics
  INSERT INTO usage_metrics (user_id, goals_created, goals_limit, ai_requests_count, ai_requests_limit)
  VALUES (NEW.id, 0, 3, 0, 50)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to initialize subscription when user signs up
CREATE TRIGGER IF NOT EXISTS on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_subscription();

-- =============================================
-- SAMPLE DATA (for testing)
-- =============================================

-- Note: This is for development only, remove in production
-- INSERT INTO auth.users (id, email, created_at) VALUES 
--   ('123e4567-e89b-12d3-a456-426614174000', 'test@example.com', NOW())
-- ON CONFLICT (id) DO NOTHING;