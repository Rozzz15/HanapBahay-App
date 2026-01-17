# 🔧 Password Setup Guide for Barangay Accounts

## Method 1: Send Password Recovery (Supabase Dashboard)

### ⚠️ Problem with This Method:
When you click "Send password recovery", Supabase sends a reset email to the account email (e.g., brgy.rizal@hanapbahay.app). 

**BUT** these are dummy email addresses that don't actually exist! So the email won't be received.

---

## ✅ Method 2: Direct SQL Update (RECOMMENDED)

This is the **fastest and easiest** way to set passwords without needing email access.

### Step-by-Step Instructions:

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu

2. **Open SQL Editor:**
   - Click on **"SQL Editor"** in the left sidebar

3. **Create a New Query:**
   - Click **"New query"**

4. **Copy and paste this SQL:**

```sql
-- Set password for RIZAL
UPDATE auth.users
SET encrypted_password = crypt('vDAKy4JN$Zi5NGHV', gen_salt('bf'))
WHERE email = 'brgy.rizal@hanapbahay.app';

-- Set password for TALOLONG
UPDATE auth.users
SET encrypted_password = crypt('mfd^rdvE!x*y7VJ8', gen_salt('bf'))
WHERE email = 'brgy.talolong@hanapbahay.app';

-- Set password for GOMEZ
UPDATE auth.users
SET encrypted_password = crypt('#5Qqa&s@QHnt0f72', gen_salt('bf'))
WHERE email = 'brgy.gomez@hanapbahay.app';

-- Set password for MAGSAYSAY
UPDATE auth.users
SET encrypted_password = crypt('KdidMtkEqrgITJPd', gen_salt('bf'))
WHERE email = 'brgy.magsaysay@hanapbahay.app';
```

5. **Click "Run"** or press `Ctrl + Enter`

6. **Done!** All 4 accounts now have passwords set.

---

## ✅ Method 3: Set Simple Password for All (EASIEST FOR TESTING)

If you want all accounts to have the same simple password for testing:

```sql
-- Set password 'Brgy@2026!' for ALL barangay accounts
UPDATE auth.users
SET encrypted_password = crypt('Brgy@2026!', gen_salt('bf'))
WHERE email IN (
  'brgy.rizal@hanapbahay.app',
  'brgy.talolong@hanapbahay.app',
  'brgy.gomez@hanapbahay.app',
  'brgy.magsaysay@hanapbahay.app'
);
```

Then you can login to ALL accounts with:
- Password: `Brgy@2026!`

---

## 🧪 Test Your Login

After running the SQL, test login in your app:

**Test Account:**
- Email: `brgy.rizal@hanapbahay.app`
- Password: `vDAKy4JN$Zi5NGHV` (or `Brgy@2026!` if you used Method 3)

---

## 📋 Login Credentials Summary

After setup, you can login with:

| Barangay | Email | Password (Option 1) | Password (Option 2) |
|----------|-------|---------------------|---------------------|
| RIZAL | brgy.rizal@hanapbahay.app | vDAKy4JN$Zi5NGHV | Brgy@2026! |
| TALOLONG | brgy.talolong@hanapbahay.app | mfd^rdvE!x*y7VJ8 | Brgy@2026! |
| GOMEZ | brgy.gomez@hanapbahay.app | #5Qqa&s@QHnt0f72 | Brgy@2026! |
| MAGSAYSAY | brgy.magsaysay@hanapbahay.app | KdidMtkEqrgITJPd | Brgy@2026! |

---

## ✅ Verify Passwords Were Set

Run this query to check if passwords are set:

```sql
SELECT 
  email, 
  created_at,
  CASE WHEN encrypted_password IS NOT NULL THEN '✅ Password Set' ELSE '❌ No Password' END as status
FROM auth.users
WHERE email LIKE 'brgy.%@hanapbahay.app'
ORDER BY email;
```

---

## 🚀 Next Steps

1. ✅ Run the SQL to set passwords
2. ✅ Open your HanapBahay app
3. ✅ Login with one of the accounts above
4. ✅ Test the barangay official dashboard

---

**Need help?** If you get any errors, let me know!
