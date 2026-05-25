-- CREATE USER_BALANCE TABLE IN SUPABASE
-- Run this SQL in your Supabase SQL Editor

-- Create user_balance table
CREATE TABLE IF NOT EXISTS user_balance (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(15,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_balance_user_id ON user_balance(user_id);

-- Enable Row Level Security
ALTER TABLE user_balance ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own balance
CREATE POLICY "Users can only view their own balance" ON user_balance
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only update their own balance
CREATE POLICY "Users can only update their own balance" ON user_balance
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Allow system to insert new user balance on signup
CREATE POLICY "System can insert user balance on signup" ON user_balance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-create user_balance on new user signup
-- This is optional but helps ensure every user has a balance record
CREATE OR REPLACE FUNCTION public.create_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_balance (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth.users
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_balance();

-- Verify table creation
SELECT * FROM user_balance LIMIT 1;
