# Fix Supabase Schema Cache Error

## Problem
Error: `Could not find the 'rejected_at' column of 'bookings' in the schema cache`

This happens because PostgREST (Supabase's API layer) caches the database schema and doesn't know about newly added columns.

## Solution - 3 Methods (Try in Order)

### Method 1: Run NOTIFY Command (FASTEST)
1. Open **Supabase Dashboard** → **SQL Editor**
2. Paste and run:
```sql
NOTIFY pgrst, 'reload schema';
```
3. Wait 5 seconds
4. Try rejecting a booking again

---

### Method 2: Restart PostgREST Service (IF METHOD 1 FAILS)
1. Go to **Supabase Dashboard**
2. Click **Settings** (gear icon)
3. Click **API** tab
4. Click **"Restart PostgREST"** or **"Restart Services"** button
5. Wait 1-2 minutes for service to restart
6. Try rejecting a booking again

---

### Method 3: Alternative - Don't Use rejected_at Field (TEMPORARY FIX)
If the above don't work, we can remove the `rejected_at` field from the code temporarily:

Let me check the code and create a fix that doesn't require the column...

---

## Quick Test
After trying Method 1 or 2, run this SQL to verify the column exists:
```sql
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'bookings' 
    AND column_name = 'rejected_at';
```

**Should return**: One row with "rejected_at"

If it returns nothing, the column wasn't added. Run the migration again.

---

## Which Method to Try?

**Try Method 1 first** - it's the fastest and should work immediately.

If that doesn't work within 1 minute, **try Method 2**.

If both fail, let me know and I'll modify the code to work without these columns.
