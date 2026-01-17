# 🔧 Fix "reviewed_at column not found" Error

## ❌ Current Error
When barangay officials try to approve/reject owner applications:
```
Error upserting to owner_applications: 
Could not find the 'reviewed_at' column of 'owner_applications' in the schema cache

Error approving application:
Could not find the 'reviewed_at' column of 'owner_applications' in the schema cache
```

## 🔍 Root Cause

The `owner_applications` table in your **live Supabase database** is missing the `reviewed_at` column.

This happens when:
1. The table was created with an older schema
2. The schema file was updated to include `reviewed_at`
3. But the live database was never updated

**Schema file has it (line 86):**
```sql
reviewed_at TIMESTAMPTZ,
```

**But the live database doesn't have it yet!**

## ✅ Solution

Run a migration to add the missing column to your live database.

---

## 📋 Step-by-Step Fix

### **Step 1: Open Supabase SQL Editor**
1. Go to: https://dkrctrkqhunttrnkqzsu.supabase.co
2. Click **"SQL Editor"** (left sidebar)
3. Click **"New Query"**

### **Step 2: Run the Migration**
1. Open the file: `add-reviewed-at-column.sql`
2. Copy **all** the content
3. Paste into Supabase SQL Editor
4. Click **"Run"** ▶️

### **Step 3: Verify Success**
You should see:
```
✅ Added reviewed_at column to owner_applications
✅ Migration Complete!
```

And a table showing the columns:
```
column_name  | data_type            | is_nullable
reviewed_at  | timestamp with...    | YES
reviewed_by  | uuid                 | YES
status       | text                 | NO
```

### **Step 4: Test in App**
1. Login as a barangay official
2. Go to **"Owner Applications"**
3. Try to approve/reject an application
4. **Should work now!** ✅

---

## 🎯 What the Migration Does

```sql
-- Adds the missing column if it doesn't exist
ALTER TABLE public.owner_applications 
ADD COLUMN reviewed_at TIMESTAMPTZ;
```

**Safe to run multiple times** - checks if column exists first.

---

## 🧪 How to Test

### **Test 1: Approve Application**
1. Login as barangay official
2. View pending owner application
3. Click **"Approve"**
4. Should approve successfully ✅

### **Test 2: Reject Application**
1. View pending owner application
2. Click **"Reject"**
3. Enter reason
4. Should reject successfully ✅

### **Test 3: Check Database**
After approval/rejection, check in Supabase:
```sql
SELECT 
    name, 
    status, 
    reviewed_by, 
    reviewed_at 
FROM owner_applications 
ORDER BY created_at DESC 
LIMIT 5;
```

You should see `reviewed_at` populated with timestamps.

---

## 🔍 Why This Happened

**Scenario:**
1. ✅ You created the database with an old schema (no `reviewed_at`)
2. ✅ Code was updated to use `reviewed_at` in approvals
3. ✅ Schema file was updated to include `reviewed_at`
4. ❌ But the live database was never migrated

**Solution:**
- Run the migration SQL to add the column
- Future tables created with `supabase-schema.sql` will have it automatically

---

## 📝 Files Created

- `add-reviewed-at-column.sql` - Migration script to add the column
- `FIX_REVIEWED_AT_ERROR.md` - This guide

---

## ⚠️ Important

After running the migration:
- ✅ All barangay officials can approve/reject applications
- ✅ The `reviewed_at` timestamp will be recorded
- ✅ No more schema cache errors

---

## 🆘 Troubleshooting

### **Error: "permission denied"**
You might not have permissions to alter tables. Try:
1. Check if you're using the correct Supabase project
2. Make sure you're logged in as the project owner
3. Contact Supabase support if needed

### **Column already exists**
If you see "column already exists", the migration was already run. You can skip this step.

### **Still getting the error after migration**
1. Refresh Supabase schema cache (wait 1-2 minutes)
2. Restart your app
3. Try approving again

---

Run the SQL migration now and your barangay officials will be able to approve owner applications! 🚀
