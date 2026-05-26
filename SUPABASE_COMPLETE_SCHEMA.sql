-- COMPREHENSIVE SUPABASE SCHEMA FOR TRADING JOURNAL
-- Run this entire script in your Supabase SQL Editor
-- This ensures all financial data is stored with proper numeric types

-- ============================================
-- USER BALANCE TABLE (Single Source of Truth)
-- ============================================
CREATE TABLE IF NOT EXISTS user_balance (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(15,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_balance_user_id ON user_balance(user_id);

ALTER TABLE user_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own balance" ON user_balance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only update their own balance" ON user_balance
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert user balance on signup" ON user_balance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRADES TABLE
-- CRITICAL: profit_loss MUST be DECIMAL/NUMERIC for proper financial calculations
-- ============================================
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair VARCHAR(20) NOT NULL,
  result DECIMAL(15,2), -- DEPRECATED: Use profit_loss instead
  profit_loss DECIMAL(15,2) NOT NULL DEFAULT 0, -- CRITICAL: Numeric P&L amount (+/- values)
  analysis VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_profit_loss CHECK (profit_loss IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(date);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own trades" ON trades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own trades" ON trades
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- DEPOSITS TABLE
-- CRITICAL: amount MUST be DECIMAL/NUMERIC
-- ============================================
CREATE TABLE IF NOT EXISTS deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL, -- CRITICAL: Must be DECIMAL, not TEXT
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_date ON deposits(date);

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own deposits" ON deposits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own deposits" ON deposits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- WITHDRAWALS TABLE
-- CRITICAL: amount MUST be DECIMAL/NUMERIC
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL, -- CRITICAL: Must be DECIMAL, not TEXT
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_date ON withdrawals(date);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- AUTO-CREATE USER BALANCE ON SIGNUP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.create_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_balance (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created ON auth.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_balance();

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify the schema is correct
-- ============================================

-- Check user_balance table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_balance'
ORDER BY ordinal_position;

-- Check trades table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trades'
ORDER BY ordinal_position;

-- Check deposits table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deposits'
ORDER BY ordinal_position;

-- Check withdrawals table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'withdrawals'
ORDER BY ordinal_position;
