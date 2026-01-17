# 🔧 Monthly Rent Fix - Complete Guide

## 🐛 Problem Identified

**Issue:** Monthly rent shows as ₱0 even when you entered an amount.

**Root Cause:** Database column name mismatch
- Code was using: `monthlyRent` (camelCase)
- Database expects: `monthly_rent` (snake_case)

---

## ✅ What Was Fixed

**File:** `app/(owner)/create-listing.tsx` (Line 571-572)

**Before:**
```typescript
monthlyRent: parseFloat(formData.monthlyRent),
```

**After:**
```typescript
monthly_rent: parseFloat(formData.monthlyRent), // Fixed: Use snake_case for database
monthlyRent: parseFloat(formData.monthlyRent), // Keep camelCase for compatibility
```

Now the code saves the amount to **both** column names to ensure compatibility.

---

## 🔄 Fix Existing Listings

If you already created listings with ₱0 rent, you need to update them in the database.

### **Option 1: Using Supabase Dashboard (Easiest)**

1. Go to: https://app.supabase.com
2. Select your project
3. Go to: **SQL Editor**
4. Copy and paste this SQL:

```sql
-- Fix existing listings with 0 monthly_rent
UPDATE published_listings
SET monthly_rent = price
WHERE (monthly_rent = 0 OR monthly_rent IS NULL) 
  AND price > 0;

-- Verify the fix
SELECT id, title, monthly_rent, price
FROM published_listings
ORDER BY created_at DESC;
```

5. Click **Run**
6. Check if `monthly_rent` now shows the correct values

### **Option 2: Manually Update Each Listing**

1. Go to Supabase Dashboard → **Table Editor**
2. Select **published_listings** table
3. Find your listing (the one with ₱0)
4. Click on the row to edit
5. Find the `monthly_rent` column
6. Enter the correct amount (e.g., 15000)
7. Save

---

## 🧪 Test the Fix

### **Create a New Test Listing:**

1. In your app, go to **Create Listing**
2. Fill in details:
   - Property Type: Any
   - Rental Type: Any
   - **Monthly Rent: ₱5,000** (or any amount)
3. Complete all steps and publish
4. Go to **My Listings**
5. **Check:** Does it show ₱5,000 instead of ₱0?

### **Expected Result:**
✅ Monthly rent displays correctly: **₱5,000**
❌ Before fix: **₱0**

---

## 📊 Verify in Database

1. Go to Supabase Dashboard
2. **Table Editor** → **published_listings**
3. Find your newest listing
4. Check columns:
   - `monthly_rent` should have: `5000`
   - `price` should have: `5000`
   - `monthlyRent` might also have: `5000`

---

## 🎯 Summary

### **What Changed:**
- ✅ Code now saves to `monthly_rent` (correct database column)
- ✅ Also saves to `monthlyRent` (for backward compatibility)
- ✅ Also saves to `price` (used by tenant dashboard)

### **What to Do:**
1. ✅ Code is fixed (already done)
2. ⏳ Fix existing listings (run SQL script)
3. ✅ Test new listing creation
4. ✅ Verify amounts display correctly

---

## 🚀 No Restart Needed!

The fix is in the code, so new listings will work immediately. Just need to:
1. Fix old listings in database (SQL script)
2. Test by creating a new listing

---

**Need help?** Let me know which option you want to use to fix existing listings!
