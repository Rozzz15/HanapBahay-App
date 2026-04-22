# ✅ ALL FIXES COMPLETE - Comprehensive Test Guide

## 🎯 What Was Fixed

### 1. ✅ Owner Documents Upload Issue
**Problem:** "Supabase is not configured. Please contact support" error when uploading documents during owner signup.

**Root Cause:**
- Environment variables not available at runtime in React Native
- `owner-documents` bucket existed but wasn't public

**Fixes Applied:**
- ✅ Added Supabase credentials to `app.json` (extra field)
- ✅ Updated `supabase-client.ts` to read from multiple sources
- ✅ Updated `supabase-storage-enhanced.ts` with better error handling
- ✅ Made `owner-documents` bucket PUBLIC in Supabase

---

### 2. ✅ Phone Number Not Showing in Personal Details
**Problem:** After creating a new account, the contact number field only shows "+63" in personal details modal.

**Root Cause:**
- Phone number saved to `users` and `tenants` tables during signup
- But `loadPersonalDetails` only checked `personal_details` table (which is empty for new users)
- Fallback to load from `users` and `tenants` tables was missing

**Fixes Applied:**
- ✅ Updated `app/(tabs)/profile.tsx` - Added fallback to load phone from `tenants` table
- ✅ Added additional fallback to load phone from `users` table
- ✅ Now checks multiple sources: `personal_details` → `tenants` → `users`

---

### 3. ✅ Email Not Updating in Owner Profile
**Problem:** Owner changes email in profile settings, but the old email is still used.

**Root Cause:**
- Email update only updated `users` table
- Didn't update `owner_profiles` table in local DB
- Didn't update Supabase cloud tables (`owner_profiles` and `users`)

**Fixes Applied:**
- ✅ Updated `app/(owner)/profile.tsx` - Added import for `supabase`
- ✅ Now updates `owner_profiles` table (local DB)
- ✅ Now updates `owner_profiles` table (Supabase cloud)
- ✅ Now updates `users` table (Supabase cloud)
- ✅ All email changes propagate to all tables

---

## 🚀 Testing Instructions

### STEP 1: Restart Expo (IMPORTANT!)

**Why?** To load the new config from `app.json`

```bash
cd C:\Users\Admin\Desktop\hanapbahay
npx expo start --clear
```

**Wait for:** `✅ Metro waiting on exp://...`

---

## 📱 TEST 1: Owner Document Upload

### Steps:
1. **Open app** → Click "Sign Up"
2. **Select "Owner"** role
3. **Fill the form:**
   ```
   First Name: John
   Last Name: TestOwner
   Email: john.owner.test@example.com
   Phone: +639123456789
   Password: Test1234!
   House #: 123
   Street: Test Street
   Barangay: Burgos
   ```
4. **Upload Documents:**
   - Click "Upload Documents"
   - Select "Government ID"
   - Choose any image
   - Upload at least one more document (Business Permit)
5. **Submit:**
   - Check "I agree to Terms & Conditions"
   - Click "Create Account"

### Expected Results:
```
✅ Console shows: "🔍 Supabase URL check: ✅ Found"
✅ Console shows: "🔍 Supabase Key check: ✅ Found"
✅ Console shows: "📤 Starting upload to Supabase Storage..."
✅ Console shows: "✅ 2 documents uploaded to Supabase Storage"
✅ Account created successfully
✅ Redirected to Owner Dashboard
✅ No error messages!
```

### Verify in Supabase:
1. Go to: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu/storage/buckets/owner-documents
2. You should see uploaded files: `temp_[timestamp]/government_id_0.jpg`, etc.

---

## 📱 TEST 2: Tenant Phone Number (New Account)

### Steps:
1. **Create new tenant account:**
   - Sign Up → Select "Tenant"
   - Name: Jane TestTenant
   - Email: jane.tenant.test@example.com
   - **Phone: +639987654321** ← Important!
   - Password: Test1234!
2. **After signup, go to Profile tab**
3. **Click "Personal Details"**

### Expected Results:
```
✅ Phone number field shows: +639987654321
✅ NOT just "+63"
✅ All fields populated correctly
```

### Console Logs to Look For:
```
📱 Loaded phone from tenant profile: +639987654321
OR
📱 Loaded phone from user record: +639987654321
```

---

## 📱 TEST 3: Tenant Phone Number (Existing Account)

### Steps:
1. **Login as existing tenant** (if phone was not showing before)
2. **Go to Profile → Personal Details**
3. **Check phone number field**

### Expected Results:
```
✅ Phone number now appears (if it was saved during signup)
✅ If still "+63", it means it was never saved (create new account to test)
```

---

## 📱 TEST 4: Owner Email Update

### Steps:
1. **Login as owner** (john.owner.test@example.com from TEST 1)
2. **Go to Owner Profile tab**
3. **Click "Edit Profile"**
4. **Change email:**
   ```
   Current Email: john.owner.test@example.com
   New Email: john.owner.new@example.com
   Confirm Email: john.owner.new@example.com
   ```
5. **Click "Save"**
6. **You'll be logged out**
7. **Login again with NEW email:**
   ```
   Email: john.owner.new@example.com
   Password: Test1234!
   ```

### Expected Results:
```
✅ Profile updated successfully
✅ Console shows: "✅ Updated owner_profiles table"
✅ Console shows: "✅ Updated Supabase owner_profiles"
✅ Console shows: "✅ Updated Supabase users table"
✅ Logged out automatically
✅ Can login with NEW email
✅ Can't login with OLD email anymore
```

### Verify in Database:
Check in Supabase SQL Editor:
```sql
-- Check users table
SELECT id, name, email FROM users 
WHERE email = 'john.owner.new@example.com';

-- Check owner_profiles table
SELECT user_id, business_name, email FROM owner_profiles 
WHERE email = 'john.owner.new@example.com';
```

Both should show the NEW email!

---

## 📱 TEST 5: Complete Flow Test

### Scenario: Create Owner Account → Upload Docs → Update Email

1. **Sign up as owner** (with documents)
2. **Verify documents uploaded**
3. **Go to profile and update email**
4. **Login with new email**
5. **Check if everything still works**

### Expected Results:
```
✅ Account created with documents
✅ Documents visible in Supabase Storage
✅ Email updated successfully
✅ Can login with new email
✅ All data intact (name, documents, etc.)
✅ Owner dashboard loads correctly
```

---

## 🐛 Troubleshooting

### Issue: "Supabase is not configured"
**Fix:**
1. Stop Expo (Ctrl+C)
2. Run: `npx expo start --clear`
3. Make sure console shows: `🔍 Supabase URL check: ✅ Found`

### Issue: Phone still shows "+63"
**Possible Causes:**
1. Old account created before fix (create new account to test)
2. Phone wasn't saved during signup (check signup logs)
3. Cache issue (restart Expo with `--clear`)

**How to Fix:**
1. Create a NEW test account
2. Make sure to enter phone number during signup
3. Check console for: `📱 Loaded phone from...`

### Issue: Email not updating
**Possible Causes:**
1. Supabase import missing (check if error in console)
2. Database permission issue

**Check Console For:**
```
✅ Updated owner_profiles table
✅ Updated Supabase owner_profiles
✅ Updated Supabase users table
```

If any show errors, check the error message.

### Issue: Documents still not uploading
**Verify:**
1. Bucket is PUBLIC: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu/storage/buckets
2. Look for "owner-documents" with "Public" badge
3. If not public, click Settings → Toggle "Public bucket" ON

---

## 📊 Testing Checklist

### Owner Document Upload:
- [ ] Expo restarted with `--clear`
- [ ] Console shows Supabase config found
- [ ] Documents upload without errors
- [ ] Files visible in Supabase Storage
- [ ] Account created successfully
- [ ] No "Supabase is not configured" error

### Phone Number Display:
- [ ] Create new tenant account with phone
- [ ] Phone appears in Personal Details modal
- [ ] Shows full number, not just "+63"
- [ ] Console shows where phone loaded from
- [ ] Can edit and save phone number

### Owner Email Update:
- [ ] Can change email in owner profile
- [ ] All tables updated (check console logs)
- [ ] Logged out after email change
- [ ] Can login with NEW email
- [ ] OLD email no longer works
- [ ] All data intact after email change

---

## 📝 Files Modified

### For Document Upload Fix:
1. `app.json` - Added Supabase credentials to `extra`
2. `utils/supabase-client.ts` - Multi-source config loading
3. `utils/supabase-storage-enhanced.ts` - Better error handling

### For Phone Number Fix:
1. `app/(tabs)/profile.tsx` - Added fallback loading from `tenants` and `users` tables

### For Email Update Fix:
1. `app/(owner)/profile.tsx` - Added Supabase import and updates to all tables

---

## ✅ Success Criteria

**All tests pass if:**
1. ✅ Owner can signup with documents (no errors)
2. ✅ New tenant sees phone number in personal details
3. ✅ Owner can update email and it persists everywhere
4. ✅ No "Supabase is not configured" errors
5. ✅ No "+63" only in phone field for new accounts
6. ✅ Console logs show successful updates

---

## 🎉 After All Tests Pass

**Clean up test accounts:**
```sql
-- Delete test accounts (run in Supabase SQL Editor)
DELETE FROM users WHERE email LIKE '%test%';
DELETE FROM tenants WHERE email LIKE '%test%';
DELETE FROM owner_profiles WHERE email LIKE '%test%';
DELETE FROM owner_applications WHERE email LIKE '%test%';
```

**Clean up temporary files:**
```bash
cd C:\Users\Admin\Desktop\hanapbahay
rm tmp_rovodev_*.sql tmp_rovodev_*.md tmp_rovodev_*.js
```

---

## 📞 Report Results

After testing, let me know:

**✅ SUCCESS:**
"All tests passed! Documents upload, phone shows, email updates work!"

**⚠️ PARTIAL:**
"Test X passed, but Test Y failed with error: [error message]"

**❌ FAILED:**
"Test X failed: [copy full error message from console]"

I'll help debug any issues! 🚀
