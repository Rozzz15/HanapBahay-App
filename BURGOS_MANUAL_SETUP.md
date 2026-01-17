# 🏛️ Create BURGOS Account Manually

Since the API rate limit is still active, we need to create the BURGOS account manually through the Supabase Dashboard.

## 📋 Step-by-Step Instructions

### **Step 1: Go to Supabase Dashboard**

1. Open: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu
2. Navigate to: **Authentication** → **Users**
3. Click the **"Add User"** button (or "Invite")

---

### **Step 2: Fill in User Details**

Fill in the form with these exact details:

| Field | Value |
|-------|-------|
| **Email** | `brgy.burgos@hanapbahay.app` |
| **Password** | `burgos123` |
| **Auto Confirm User** | ✅ **CHECK THIS BOX** (important!) |

**User Metadata (click "Show metadata" or expand):**

Paste this JSON:

```json
{
  "name": "Barangay Burgos Official",
  "role": "brgy_official",
  "phone": "+639171234505"
}
```

---

### **Step 3: Create the User**

1. Click **"Create user"** or **"Send invitation"**
2. **Copy the User ID** that appears (it's a UUID like `12345678-1234-...`)
3. Keep the Supabase tab open

---

### **Step 4: Add User Profile in Database**

1. Go to: **SQL Editor** → **New Query**
2. Copy this SQL and **replace `PASTE_USER_ID_HERE`** with the UUID you copied:

```sql
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
  'PASTE_USER_ID_HERE',  -- Replace with actual user ID
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
```

3. Click **"Run"**

---

### **Step 5: Verify Account Was Created**

Run this SQL to verify:

```sql
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

You should see:
- ✅ Email: brgy.burgos@hanapbahay.app
- ✅ Name: Barangay Burgos Official
- ✅ Role: brgy_official
- ✅ Barangay: BURGOS
- ✅ Email confirmed: YES

---

## ✅ Login Credentials

After successful creation:

| Field | Value |
|-------|-------|
| **Email** | `brgy.burgos@hanapbahay.app` |
| **Password** | `burgos123` |

---

## 🧪 Test the Account

After creation, run this test:

```bash
cd Desktop/hanapbahay
node scripts/test-all-brgy-accounts.mjs
```

Or create a specific test for BURGOS:

```bash
# Login test
Email: brgy.burgos@hanapbahay.app
Password: burgos123
```

---

## 📝 Why Manual Creation?

- ⚠️ Supabase API has rate limits on `auth.signUp()`
- ✅ Dashboard creation bypasses these limits
- ✅ Same result - fully functional account
- ✅ Can set password directly without email confirmation

---

## 🔄 Alternative: Wait 24 Hours

If you prefer automated creation:
- Wait 24 hours for rate limit to fully reset
- Run: `node scripts/create-burgos-account.mjs`

---

**Need help with any step? Let me know!**
