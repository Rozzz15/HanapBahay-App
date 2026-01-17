# 🔧 Fix All Missing Database Tables

## ❌ Current Issues

Your database is missing several tables that the app expects:

1. ❌ `listing_inquiries` - Tracks property inquiries from tenants
2. ❌ Possibly others (we'll check)

## 🎯 Complete Solution

Follow these steps to fix **all** missing tables at once:

---

## 📋 Step-by-Step Fix

### **STEP 1: Check What's Missing**

1. Go to: https://dkrctrkqhunttrnkqzsu.supabase.co
2. Click **"SQL Editor"** → **"New Query"**
3. Open file: **`check-missing-tables.sql`**
4. Copy all content → Paste in SQL Editor
5. Click **"Run"** ▶️

**This will show:**
- ✅ Tables that exist
- ❌ Tables that are missing

---

### **STEP 2: Create Missing Tables**

#### **Option A: Create listing_inquiries Only (Quick Fix)**

1. Click **"New Query"** in SQL Editor
2. Open file: **`create-missing-tables.sql`**
3. Copy all content → Paste in SQL Editor
4. Click **"Run"** ▶️

**You should see:**
```
✅ listing_inquiries Table Created!
✅ Table structure created
✅ Indexes created
✅ RLS policies created
```

#### **Option B: Recreate Entire Database Schema (Complete Fix)**

If many tables are missing, run the full schema:

1. Click **"New Query"** in SQL Editor
2. Open file: **`supabase-schema.sql`**
3. Copy **all** content (it's a big file!)
4. Paste in SQL Editor
5. Click **"Run"** ▶️

**This will:**
- ✅ Create ALL tables defined in the schema
- ✅ Skip tables that already exist (IF NOT EXISTS)
- ✅ Create indexes and policies
- ✅ Set up proper permissions

⚠️ **Note:** This is safe to run - it won't delete existing data!

---

### **STEP 3: Verify Tables Were Created**

Run this query to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Should see:**
- ✅ listing_inquiries
- ✅ users
- ✅ owner_applications
- ✅ published_listings
- ✅ bookings
- ✅ messages
- ✅ And all other tables

---

### **STEP 4: Test in App**

1. Login as barangay official
2. Go to **"Reports"** or **"Owner Applications"**
3. Should work without errors now! ✅

---

## 🎯 What Each Table Does

### **listing_inquiries**
- Stores detailed inquiry records when tenants contact owners
- Tracks: listing ID, tenant ID, inquiry type, message, timestamp
- Used in: Reports, Analytics, Owner Dashboard

**Structure:**
```sql
id TEXT PRIMARY KEY
listingId TEXT - Which property was inquired about
tenantId TEXT - Who made the inquiry
inquiryType TEXT - 'message', 'booking_request', 'contact'
source TEXT - Where the inquiry came from
message TEXT - Inquiry message content
timestamp TIMESTAMPTZ - When the inquiry was made
createdAt TIMESTAMPTZ - Record creation time
```

---

## 🔍 Why Are Tables Missing?

**Common scenarios:**

1. **Fresh Database**
   - You created a new Supabase project
   - Haven't run the schema script yet
   - Solution: Run `supabase-schema.sql`

2. **Partial Migration**
   - Some tables were created manually
   - Schema file wasn't fully run
   - Solution: Run `create-missing-tables.sql` for specific tables

3. **Old Version**
   - Database created with old schema
   - New features added that need new tables
   - Solution: Run migration scripts for new tables

---

## ⚡ Quick Decision Guide

**How many tables are missing?**

### Just listing_inquiries (1 table)
→ Run `create-missing-tables.sql` (fastest)

### Multiple tables (3+)
→ Run full `supabase-schema.sql` (recommended)

### Not sure
→ Run `check-missing-tables.sql` first to see

---

## 🆘 Troubleshooting

### **Error: "relation already exists"**
- The table already exists
- Skip this step or check if it's actually missing

### **Error: "foreign key constraint"**
- Referenced table doesn't exist (e.g., published_listings)
- Run full schema: `supabase-schema.sql`

### **Error: "permission denied"**
- Check you're logged in as project owner
- Try using service role key

### **Still getting "table not found" after creation**
1. Wait 30 seconds for cache refresh
2. Go to Settings → API → Reset PostgREST Schema Cache
3. Restart your app

---

## 📊 Summary

**For listing_inquiries error:**
1. ✅ Run `create-missing-tables.sql`
2. ✅ Test in app (Reports, Analytics)
3. ✅ Should work now!

**For multiple errors:**
1. ✅ Run `check-missing-tables.sql` to diagnose
2. ✅ Run `supabase-schema.sql` to fix everything
3. ✅ Test all features

---

**Which approach do you want to try?**
1. 🎯 **Quick Fix** - Just create listing_inquiries
2. 🔧 **Complete Fix** - Run full schema
3. 🔍 **Check First** - See what's missing

Let me know and I'll guide you through it!
