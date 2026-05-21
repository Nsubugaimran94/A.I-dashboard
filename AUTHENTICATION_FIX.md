# Authentication Troubleshooting Guide

## Problem: "Invalid Login Credentials" Error

This happens when Supabase cannot authenticate the user. Here are the solutions:

---

## Solution 1: Check Supabase Email Verification Settings

Email verification can block login. Follow these steps:

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Providers**
3. Click on **Email** provider
4. Look for "Confirm email" setting
5. **Disable** "Confirm email" for testing (or set it to "Double confirm email" is optional)
6. Save changes

---

## Solution 2: Use the New Signup/Login Toggle

The app now has a **Sign Up Mode**:

1. On the login page, check the **"Sign Up Mode"** checkbox
2. This switches to **"Create Account"** mode
3. Enter your email and password (min 6 characters)
4. Click **"Create Account"**
5. After successful signup, uncheck the checkbox to return to **Login Mode**
6. Now use the same email and password to login

---

## Solution 3: Create a Test Account in Supabase

You can manually create a test user in Supabase:

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - **Email**: `test@example.com`
   - **Password**: `Test@123` (or your preferred password)
4. Click **"Create user"**
5. Now you can login with these credentials in your app

---

## Solution 4: Verify Database Connection

Make sure your Supabase database is properly set up:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this query to create the trades table:

```sql
CREATE TABLE trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  result FLOAT NOT NULL,
  analysis TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add row-level security
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their trades" ON trades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their trades" ON trades
  FOR DELETE USING (auth.uid() = user_id);
```

---

## Solution 5: Test the Authentication

After making changes:

1. **Create a new account**:
   - Check the "Sign Up Mode" toggle
   - Enter email: `yourtest@example.com`
   - Enter password: `YourPassword123` (min 6 chars)
   - Click "Create Account"

2. **Login**:
   - Uncheck the "Sign Up Mode" toggle
   - Enter the same email and password
   - Click "Login"

3. **Add a trade**:
   - Fill in: Pair (e.g., EUR/USD), P&L ($), Analysis
   - Click "Add Trade"

4. **Refresh the page**:
   - Your trade should still be there!

---

## Debugging Tips

### Check Browser Console
1. Press `F12` to open Developer Tools
2. Go to **Console** tab
3. Try to login
4. Look for error messages - they'll help identify the issue

### Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid login credentials" | User doesn't exist or wrong password | Create account first with Sign Up Mode |
| "Email not confirmed" | Email verification is enabled | Disable email verification in Supabase |
| "Too many login attempts" | Rate limiting | Wait a few minutes and try again |
| "Request failed" | Network/CORS issue | Check Supabase URL is correct |

---

## Contact Supabase Support

If you're still having issues:

1. Check [Supabase Docs](https://supabase.com/docs/guides/auth)
2. Visit [Supabase Community](https://github.com/supabase/supabase/discussions)
3. Contact support through Supabase dashboard

---

## Quick Checklist

- [ ] Supabase project is created
- [ ] Email verification is disabled
- [ ] `trades` table exists with RLS policies
- [ ] I can create an account using Sign Up Mode
- [ ] I can login using the same credentials
- [ ] I can add and view trades
- [ ] Trades persist after page refresh
