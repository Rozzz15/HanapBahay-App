# 🚀 BURGOS Account - Quick Manual Setup Guide

## ⏱️ Estimated Time: 3 minutes

Follow these steps to create the BURGOS barangay official account manually through Supabase Dashboard.

---

## 📋 **Step 1: Create Auth User** (2 minutes)

### 1.1 Go to Supabase Dashboard
Open this link: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu

### 1.2 Navigate to Users
- Click **"Authentication"** in the left sidebar
- Click **"Users"** tab
- Click the **"Add User"** button (top right)

### 1.3 Fill in the Form

| Field | Value | Notes |
|-------|-------|-------|
| **Email** | `brgy.burgos@hanapbahay.app` | Copy exactly |
| **Password** | `burgos123` | Copy exactly |
| **Auto Confirm User** | ✅ **CHECK THIS BOX** | Very important! |

### 1.4 Add User Metadata (Optional but Recommended)

Click **"Show metadata"** or expand the metadata section, then paste:

```json
{
  "name": "Barangay Burgos Official",
  "role": "brgy_official",
  "phone": "+639171234505"
}
```

### 1.5 Create the User
- Click **"Create user"** or **"Send magic link"** button
- Wait for confirmation message
- ✅ **IMPORTANT:** Copy the **User ID** (UUID) that appears
  - It looks like: `12345678-abcd-1234-abcd-123456789012`
  - You'll need this in Step 2!

---

## 📋 **Step 2: Add User Profile** (1 minute)

### 2.1 Go to SQL Editor
- Click **"SQL Editor"** in the left sidebar
- Click **"New query"** button

### 2.2 Paste This SQL

**IMPORTANT:** Replace `PASTE_USER_ID_HERE` with the UUID you copied in Step 1.5

```sql
-- Create BURGOS user profile
INSERT INTO public.users (
  id,
  email,
  name,
  phone,
  address,
  role,
  roles,
  barangay,
  created_at,
  updated_at
) VALUES (
  'PASTE_USER_ID_HERE',  -- ⚠️ REPLACE THIS with the UUID from Step 1.5
  'brgy.burgos@hanapbahay.app',
  'Barangay Burgos Official',
  '+639171234505',
  'Burgos Street, Lopez, Quezon',
  'brgy_official',
  ARRAY['brgy_official'],
  'BURGOS',
  NOW(),
  NOW()
);

-- Verify it was created
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.barangay,
  au.email_confirmed_at
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id::text
WHERE u.email = 'brgy.burgos@hanapbahay.app';
```

### 2.3 Run the SQL
- Click **"Run"** or press `Ctrl + Enter`
- You should see:
  - First query: `Success` (1 row inserted)
  - Second query: Shows the BURGOS account details

---

## ✅ **Step 3: Verify & Test**

### 3.1 Verify in Supabase
The verification query (Step 2.2) should show:

| Field | Value | Status |
|-------|-------|--------|
| email | brgy.burgos@hanapbahay.app | ✅ |
| name | Barangay Burgos Official | ✅ |
| role | brgy_official | ✅ |
| barangay | BURGOS | ✅ |
| email_confirmed_at | (timestamp) | ✅ |

### 3.2 Test Login via Script

Open PowerShell/Terminal and run:

```bash
cd Desktop/hanapbahay
node scripts/test-all-brgy-accounts.mjs
```

This will test all 5 accounts (including BURGOS).

---

## 🔑 **Login Credentials**

After successful creation:

| Field | Value |
|-------|-------|
| **Email** | `brgy.burgos@hanapbahay.app` |
| **Password** | `burgos123` |
| **Role** | Barangay Official |
| **Barangay** | BURGOS |

---

## ⚠️ **Common Issues & Solutions**

### Issue 1: "User already exists"
- **Solution:** The account was already created. Just do Step 2 with the existing user ID.

### Issue 2: Can't find User ID after creating
- **Solution:** 
  1. Go to Authentication → Users
  2. Find `brgy.burgos@hanapbahay.app`
  3. Click on the email
  4. Copy the ID from the user details

### Issue 3: SQL error "duplicate key value"
- **Solution:** The profile already exists. Run this to check:
```sql
SELECT * FROM public.users WHERE email = 'brgy.burgos@hanapbahay.app';
```

### Issue 4: Login fails with "Invalid credentials"
- **Solution:** The password might be wrong. Reset it:
```sql
UPDATE auth.users
SET encrypted_password = crypt('burgos123', gen_salt('bf'))
WHERE email = 'brgy.burgos@hanapbahay.app';
```

---

## 📞 **Need Help?**

If you encounter any issues:
1. Check the User ID was copied correctly (Step 1.5)
2. Verify the email is exact: `brgy.burgos@hanapbahay.app`
3. Make sure "Auto Confirm User" was checked
4. Run the test script to verify

---

## ✅ **Success Checklist**

- [ ] Created auth user via Dashboard
- [ ] Copied User ID
- [ ] Ran SQL to create profile
- [ ] Verified account in database
- [ ] Tested login successfully

---

**Once completed, you'll have 5/6 barangay accounts working!**

Only LOPEZ will remain (can create later or when rate limit clears).
