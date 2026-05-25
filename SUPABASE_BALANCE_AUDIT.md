# SUPABASE BALANCE PERSISTENCE BUG - ROOT CAUSE ANALYSIS

## Root Cause Identified

The balance system has a **fundamental architectural flaw**: 
- **NO dedicated Supabase table for user balance**
- Balance is stored in **localStorage only** (client-side, not persistent)
- Balance calculation is done in-memory but has **no Supabase backend**
- When app initializes, it uses **in-memory state** that can get corrupted

### Why Users Get $100:

1. **Initial state in script.js:**
   ```javascript
   let trades = window.app?.tradeManager?.trades || [];
   let deposits = window.app?.tradeManager?.deposits || [];
   ```
   These arrays start empty, so balance = 0

2. **BUT the EquityCurveChart has a placeholder:**
   ```javascript
   // src/components/EquityCurveChart.js line 116
   balance: 10000  // ← Shows when loading
   ```

3. **AND the app.js initializes BEFORE data loads:**
   - `new TradingDashboardApp()` runs immediately
   - `tradeManager.subscribe()` fires with empty state
   - Balance updates fire multiple times
   - Display can show stale/incorrect values

### Why Balance Duplicates on Refresh:

1. **Multiple update calls:**
   - `updateAccountSize()` called in showDashboard() TWICE (lines 435 + 451)
   - `app.js updateHeaderBalance()` also updates the same element
   - `loadTradesFromSupabase()` triggers more updates via notify()

2. **Race condition:**
   - localStorage read happens before Supabase data loads
   - Stale balance shows first
   - Real data loads second, overwrites with accumulated value

3. **String parsing issue:**
   - Balance stored as string in localStorage: `"0"` or `"100"`
   - Multiple reads/writes can duplicate: `"100" + "100"` → `"100100"` if treated as string

## Critical Architectural Issues

### Issue 1: NO SUPABASE USER BALANCE TABLE
- ❌ Should have `user_balance` table
- ❌ Should have columns: `user_id`, `balance`, `updated_at`
- ❌ Should have DEFAULT `0`
- ❌ Should have Row Level Security policies

### Issue 2: DUPLICATE BALANCE UPDATES
- ❌ `updateAccountSize()` called 2+ times per session
- ❌ `app.js updateHeaderBalance()` also updates
- ❌ No deduplication logic
- ❌ No atomic transactions

### Issue 3: TIMING ISSUES
- ❌ Supabase data loads asynchronously
- ❌ Balance calculated before trades loaded
- ❌ Multiple state subscriptions fire out of order

### Issue 4: LOCALSTORAGE ONLY
- ❌ Balance persists in localStorage, NOT Supabase
- ❌ When user clears browser cache → balance lost
- ❌ Can't access balance from other devices
- ❌ No server-side validation

### Issue 5: NO INITIALIZATION VALIDATION
- ❌ New users signup but balance not explicitly created
- ❌ `initializeUserBalance()` only sets localStorage, no Supabase insert
- ❌ No check if user record exists before loading balance

## Files with Issues

| File | Line | Issue |
|------|------|-------|
| script.js | 70, 89 | localStorage only, no Supabase |
| script.js | 435, 451 | updateAccountSize() called twice |
| script.js | 463 | STARTING_BALANCE = 0 (unused in Supabase) |
| src/app.js | 75 | Separate balance update (duplicate) |
| src/hooks/useTrades.js | 28 | Fallback to 0 from localStorage, no Supabase |
| src/utils/storage.js | 10 | inMemory variable, ephemeral |

## What NEEDS to Happen

1. Create `user_balance` table in Supabase with:
   - `user_id` (UUID, PK)
   - `balance` (DECIMAL, DEFAULT 0)
   - `updated_at` (TIMESTAMP)

2. On signup: INSERT into `user_balance` with balance = 0

3. On login: SELECT balance from `user_balance` 

4. On trade/deposit/withdrawal: UPDATE `user_balance`

5. Remove duplicate update calls

6. Consolidate balance updates to one place

---

## Implementation Plan

✅ Create Supabase schema
✅ Update signup to create user_balance record
✅ Update login to load from Supabase
✅ Remove duplicate updateAccountSize() calls
✅ Remove duplicate app.js updateHeaderBalance()
✅ Consolidate to single source of truth
✅ Add transaction safety
✅ Implement proper error handling
