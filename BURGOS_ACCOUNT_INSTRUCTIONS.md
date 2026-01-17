# 🏛️ BURGOS Account Creation Instructions

## ⚠️ Current Status

The BURGOS barangay official account **failed to create** due to Supabase email rate limit.

**Error:** `email rate limit exceeded`

## ⏰ When to Retry

Supabase rate limits typically reset after:
- **1-2 hours** for normal cases
- **24 hours** for stricter limits

## 🚀 How to Create BURGOS Account

### Option 1: Run the Script Later (Recommended)

Wait 1-2 hours, then run:

```bash
cd Desktop/hanapbahay
node scripts/create-burgos-account.mjs
```

The script will:
- ✅ Check if the account already exists
- ✅ Create the account if it doesn't exist
- ✅ Display the password **ONCE**
- ⚠️ Save the password immediately when shown!

### Option 2: Manual Creation via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"**
4. Enter:
   - Email: `brgy.burgos@hanapbahay.app`
   - Password: (create a secure password)
   - Check "Auto confirm user"
5. After creating, go to **Database** → **Table Editor** → **users** table
6. Click **"Insert"** → **"Insert row"**
7. Fill in:
   ```
   id: [copy the auth user ID]
   email: brgy.burgos@hanapbahay.app
   name: Barangay Burgos Official
   phone: +639171234505
   address: Burgos Street, Lopez, Quezon
   role: brgy_official
   roles: ["brgy_official"]
   barangay: BURGOS
   ```

### Option 3: Try Tomorrow

Simply wait 24 hours and run the script again. This guarantees the rate limit will be reset.

## 📋 BURGOS Account Details

When successfully created, the account will have:

- **Email:** `brgy.burgos@hanapbahay.app`
- **Name:** Barangay Burgos Official
- **Phone:** +639171234505
- **Barangay:** BURGOS
- **Role:** brgy_official
- **Password:** (will be generated and displayed once)

## ✅ Current Accounts

These accounts are already created and working:

1. ✅ RIZAL - brgy.rizal@hanapbahay.app
2. ✅ TALOLONG - brgy.talolong@hanapbahay.app
3. ✅ GOMEZ - brgy.gomez@hanapbahay.app
4. ✅ MAGSAYSAY - brgy.magsaysay@hanapbahay.app
5. ❌ **BURGOS** - brgy.burgos@hanapbahay.app (PENDING - rate limited)
6. ❌ LOPEZ - brgy.lopez@hanapbahay.app (PENDING - rate limited)

## 🔄 Checking If Rate Limit is Cleared

Run this command to test:

```bash
cd Desktop/hanapbahay
node scripts/create-burgos-account.mjs
```

If you see:
- ✅ "Auth account created" → Rate limit cleared! Account created successfully!
- ❌ "email rate limit exceeded" → Still rate limited, wait longer

## 📞 Need Help?

If you need the BURGOS account urgently and can't wait for the rate limit:
- Contact Supabase support to clear the rate limit
- Use a different email temporarily (e.g., `brgy.burgos.temp@hanapbahay.app`)
- Check your Supabase dashboard for rate limit quotas

---

**Created:** January 14, 2026  
**Script Location:** `Desktop/hanapbahay/scripts/create-burgos-account.mjs`
