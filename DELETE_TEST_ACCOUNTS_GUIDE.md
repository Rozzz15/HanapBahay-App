# 🗑️ Complete Guide: Delete All Test Accounts from Supabase

## ⚠️ **WARNING**
This will **DELETE ALL USER DATA** from your database. Only use this in development/testing!

---

## 📋 **Step-by-Step Instructions**

### **Method 1: Using SQL Script (Recommended - Fast)**

#### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com
2. Login to your account
3. Select your **HanapBahay project**

#### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**

#### Step 3: Run the Deletion Script
1. Open the file: `DELETE_ALL_TEST_ACCOUNTS.sql`
2. **Copy ALL the content**
3. **Paste** into Supabase SQL Editor
4. Click **"Run"** or press `Ctrl+Enter`
5. Wait for success message

#### Step 4: Delete from Authentication (IMPORTANT!)
The SQL script only deletes from database tables. You must also delete from Auth:

1. In Supabase Dashboard, click **"Authentication"** in left sidebar
2. Click **"Users"** tab
3. You'll see all registered users
4. **For each user:**
   - Click the **3-dot menu** (⋮) on the right
   - Select **"Delete user"**
   - Confirm deletion
5. Repeat until all users are deleted

---

### **Method 2: Manual Deletion (Slower but Safer)**

If you only want to delete specific test accounts:

#### Step 1: Delete Specific User from Authentication
1. Go to **Authentication → Users**
2. Find the test account email
3. Click **3-dot menu** → **"Delete user"**
4. Confirm deletion

This will automatically cascade delete all related data (bookings, messages, listings, etc.) because of the `ON DELETE CASCADE` foreign key constraints.

---

## 🔍 **Verify Deletion**

### Check if all data is deleted:

```sql
-- Run this in SQL Editor to check counts
SELECT 
  (SELECT COUNT(*) FROM public.users) as users_count,
  (SELECT COUNT(*) FROM public.tenants) as tenants_count,
  (SELECT COUNT(*) FROM public.owners) as owners_count,
  (SELECT COUNT(*) FROM public.personal_details) as personal_details_count,
  (SELECT COUNT(*) FROM public.published_listings) as listings_count,
  (SELECT COUNT(*) FROM public.bookings) as bookings_count;
```

**Expected Result:** All counts should be **0** or show only your real accounts.

---

## 🎯 **After Deletion - Test Sign-Up**

Now you can test with fresh accounts:

### Test Account 1: Basic Tenant
```
Name: Test User One
Email: testuser1@example.com
Phone: +639123456789
Address: Manila City
Gender: Male
Password: test123
```

### Test Account 2: Tenant with Emergency Contacts
```
Name: Test User Two
Email: testuser2@example.com
Phone: +639987654321
Address: Quezon City
Gender: Female
Emergency Contact: John Doe
Emergency Number: +639111222333
Password: test123
```

### Test Account 3: Property Owner
```
Name: Test Owner
Email: testowner@example.com
Phone: +639555666777
Role: Owner
House Number: 123
Street: Main Street
Barangay: RIZAL
Password: test123
```

---

## ✅ **Checklist After Running Script**

- [ ] All database tables cleared
- [ ] Auth users deleted from Authentication tab
- [ ] Verified counts are 0 (or only real accounts remain)
- [ ] Created new test account successfully
- [ ] Personal details pre-filled after sign-up
- [ ] No errors in console

---

## 🚨 **Troubleshooting**

### Issue: "Permission denied" error
**Solution:** Make sure you're logged in as the project owner in Supabase

### Issue: "Foreign key constraint violation"
**Solution:** The SQL script deletes in the correct order. If you get this error, run the script again.

### Issue: Users still appear in Authentication
**Solution:** You must manually delete from Authentication tab. SQL cannot delete auth.users directly.

### Issue: Cannot delete auth users
**Solution:** 
1. Go to Authentication → Policies
2. Temporarily disable any policies blocking deletion
3. Delete users
4. Re-enable policies

---

## 📝 **Quick Reference**

**Delete ALL data:**
```sql
-- Copy from DELETE_ALL_TEST_ACCOUNTS.sql
```

**Delete specific user by email:**
```sql
-- Find user ID
SELECT id FROM auth.users WHERE email = 'test@example.com';

-- Delete from users table (cascades to all related data)
DELETE FROM public.users WHERE email = 'test@example.com';

-- Then delete from Authentication tab in Dashboard
```

**Check remaining data:**
```sql
SELECT table_name, 
       (xpath('/row/count/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT table_name, 
         query_to_xml(format('select count(*) as count from %I.%I', 
                      table_schema, table_name), false, true, '') as xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
) t
ORDER BY row_count DESC;
```

---

## 🎉 **You're Ready!**

After completing these steps:
1. ✅ All test accounts deleted
2. ✅ Database is clean
3. ✅ Ready to test sign-up with pre-filled personal details
4. ✅ Can create as many test accounts as needed

---

**Need help? Let me know if you encounter any issues!** 🚀
