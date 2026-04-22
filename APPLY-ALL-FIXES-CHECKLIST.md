# 🚨 APPLY ALL FIXES CHECKLIST

## ⚠️ IMPORTANT: I CREATE FILES, YOU MUST APPLY THEM!

The AI assistant (me) can only **CREATE** SQL files. 
**YOU** must manually **APPLY** them to your Supabase database!

---

## 📋 STEP-BY-STEP CHECKLIST

### ✅ Step 1: Fix Login Issue
**File:** `fix-login-issue-URGENT.sql`

**Status:** [ ] Not Applied / [ ] Applied

**How to Apply:**
1. Open Supabase Dashboard (https://supabase.com/dashboard)
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Open `C:\Users\Admin\Desktop\hanapbahay\fix-login-issue-URGENT.sql`
6. Copy ALL the contents
7. Paste into SQL Editor
8. Click "RUN" button
9. Wait for success message
10. **Check this box when done:** [ ]

**What it fixes:** Login/signup working

---

### ✅ Step 2: Fix Security & Tenant Viewing
**File:** `fix-all-warnings-FINAL-SAFE.sql`

**Status:** [ ] Not Applied / [ ] Applied

**How to Apply:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Open `C:\Users\Admin\Desktop\hanapbahay\fix-all-warnings-FINAL-SAFE.sql`
5. Copy ALL the contents
6. Paste into SQL Editor
7. Click "RUN" button
8. Wait for success message
9. **Check this box when done:** [ ]

**What it fixes:** Security warnings, tenant can see listings

---

### ✅ Step 3: Show Listings to Users
**File:** `fix-listings-not-showing-URGENT.sql`

**Status:** [ ] Not Applied / [ ] Applied

**How to Apply:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Open `C:\Users\Admin\Desktop\hanapbahay\fix-listings-not-showing-URGENT.sql`
5. Copy ALL the contents
6. Paste into SQL Editor
7. Click "RUN" button
8. Wait for success message
9. **Check this box when done:** [ ]

**What it fixes:** Listings appearing on dashboard (total listings > 0)

---

### ✅ Step 4: Recalculate Capacity NOW
**File:** `recalculate-capacity-NOW.sql`

**Status:** [ ] Not Applied / [ ] Applied

**How to Apply:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Open `C:\Users\Admin\Desktop\hanapbahay\recalculate-capacity-NOW.sql`
5. Copy ALL the contents
6. Paste into SQL Editor
7. Click "RUN" button
8. Read the output - check BEFORE and AFTER tables
9. **Check this box when done:** [ ]

**What it fixes:** occupied_slots showing correct numbers

---

### ✅ Step 5: Setup Trigger for Future Updates
**File:** `VERIFY-AND-FIX-CAPACITY-COMPLETE.sql`

**Status:** [ ] Not Applied / [ ] Applied

**How to Apply:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Open `C:\Users\Admin\Desktop\hanapbahay\VERIFY-AND-FIX-CAPACITY-COMPLETE.sql`
5. Copy ALL the contents
6. Paste into SQL Editor
7. Click "RUN" button
8. Wait for success message
9. **Check this box when done:** [ ]

**What it fixes:** Automatic capacity updates when bookings change

---

## 🔍 HOW TO VERIFY EACH FIX WORKED

### After Step 1 (Login):
- Try logging in → Should work ✅
- No "Invalid credentials" error ✅

### After Step 2 (Security):
- Check Supabase Advisor → Warnings should be gone ✅

### After Step 3 (Listings Show):
- Check app → Listings appear ✅
- Log message shows "Total listings: X" (not 0) ✅

### After Step 4 (Capacity):
- Check app → Shows "X of Y available" ✅
- Numbers match actual bookings ✅

### After Step 5 (Trigger):
- Create a test booking → Capacity updates automatically ✅

---

## ❌ COMMON MISTAKES

1. **Not actually running the scripts**
   - Fix: Open Supabase, paste script, click RUN

2. **Running in wrong place**
   - Fix: Must be in Supabase SQL Editor, not terminal

3. **Not waiting for completion**
   - Fix: Wait for "Success" or NOTICE messages

4. **Not refreshing the app**
   - Fix: Close and reopen app after applying fixes

5. **Running scripts in wrong order**
   - Fix: Follow the numbered steps above in order

---

## 🎯 QUICK TEST AFTER ALL FIXES

Run this query in Supabase SQL Editor to verify everything:

```sql
-- Check occupied_slots are calculated
SELECT 
    title,
    capacity,
    occupied_slots,
    (capacity - COALESCE(occupied_slots, 0)) as available
FROM published_listings
LIMIT 5;

-- Check trigger exists
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'trigger_update_listing_capacity';

-- Check policies exist
SELECT COUNT(*) 
FROM pg_policies 
WHERE tablename = 'published_listings';
```

**Expected results:**
- occupied_slots shows numbers ✅
- Trigger name appears ✅
- Policy count > 0 ✅

---

## 📞 STILL NOT WORKING?

If you've applied ALL 5 scripts and it's still not working:

1. Check Supabase logs for errors
2. Verify you clicked RUN (not just paste)
3. Check browser console for errors
4. Restart your React Native app completely
5. Clear app cache/data

---

**Created:** 2026-01-18  
**Your responsibility:** Apply these scripts to Supabase!  
**My responsibility:** Create the scripts (DONE ✅)
