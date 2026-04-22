# ✅ Owner Documents Upload - Issue Fixed

## 🔍 Root Cause Analysis

Your error: **"Upload failed, failed to upload documents. Government ID. Failed to upload after 3 attempts. Supabase is not configured."**

### Issues Found:

1. **Missing Bucket** ❌  
   The `owner-documents` storage bucket does not exist in your Supabase project.

2. **Environment Variables Not Available at Runtime** ❌  
   React Native apps need environment variables in `app.json` under `extra` field, not just in `.env.local`.

3. **Configuration Check Failing** ❌  
   The upload code was checking `process.env` which returned undefined in the mobile app.

---

## ✅ Fixes Applied

### 1. Added Supabase Credentials to `app.json`
```json
"extra": {
  "supabaseUrl": "https://dkrctrkqhunttrnkqzsu.supabase.co",
  "supabaseAnonKey": "eyJhbGci..."
}
```

### 2. Updated `supabase-client.ts`
Now reads from both `process.env` AND `Constants.expoConfig.extra`:
```typescript
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 
  Constants.expoConfig?.extra?.supabaseUrl || 
  "https://your-project.supabase.co";
```

### 3. Updated `supabase-storage-enhanced.ts`
Added fallback configuration loading and better error messages:
```typescript
const Constants = require('expo-constants').default;
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey;

console.log('🔍 Supabase URL check:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('🔍 Supabase Key check:', supabaseKey ? '✅ Found' : '❌ Missing');
```

### 4. Created SQL Script to Setup Bucket
File: `tmp_rovodev_create_owner_docs_bucket.sql`

This script will:
- ✅ Create `owner-documents` bucket (public)
- ✅ Set 50MB file size limit
- ✅ Allow image and PDF uploads
- ✅ Create RLS policies for anonymous and authenticated uploads
- ✅ Allow public read access (for barangay officials)

---

## 🚀 Setup Instructions (Do This Now!)

### Step 1: Create the Storage Bucket

**Go to Supabase SQL Editor:**
https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu/sql

1. Click **"New Query"**
2. Copy ALL contents from: `tmp_rovodev_create_owner_docs_bucket.sql`
3. Paste into the SQL editor
4. Click **"Run"** or press `Ctrl+Enter`
5. Wait for success message: `✅ SUCCESS: owner-documents bucket created!`

### Step 2: Restart Your Expo App

```bash
cd C:\Users\Admin\Desktop\hanapbahay
npx expo start --clear
```

**Important:** Use `--clear` to clear the cache so new config is loaded!

### Step 3: Test Owner Signup

1. Open your app
2. Click **Sign Up**
3. Select **Owner** role
4. Fill in all required fields:
   - Name
   - Email
   - Phone (+63...)
   - Password
   - House Number
   - Street
   - Barangay
5. Click **"Upload Documents"**
6. Select document type (e.g., "Government ID")
7. Pick images from gallery
8. Upload more if needed (Business Permit, Barangay Clearance, etc.)
9. Agree to Terms & Conditions
10. Click **"Create Account"**

### Expected Results:

✅ **Before Submit:**
- Documents show in the list with preview
- No upload errors

✅ **During Submit:**
- Console shows: `🔍 Supabase URL check: ✅ Found`
- Console shows: `🔍 Supabase Key check: ✅ Found`
- Console shows: `📤 Uploading owner verification documents...`
- Console shows: `✅ X documents uploaded to Supabase Storage`

✅ **After Submit:**
- Account created successfully
- Redirected to owner dashboard
- Documents saved in Supabase Storage under `owner-documents/temp_xxxxx/`

---

## 🧪 Verification

### Check if bucket exists:
```bash
node tmp_rovodev_check_bucket.js
```

Should show:
```
✅ owner-documents bucket exists!
   Public: ✅ YES
```

### Check in Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu/storage/buckets
2. You should see `owner-documents` bucket listed
3. Click on it to view uploaded files

---

## 📝 What Changed in Code

### Files Modified:
1. ✅ `app.json` - Added Supabase credentials to `extra` field
2. ✅ `utils/supabase-client.ts` - Multi-source config loading
3. ✅ `utils/supabase-storage-enhanced.ts` - Improved error handling and config loading

### Files Created:
1. `tmp_rovodev_create_owner_docs_bucket.sql` - SQL setup script
2. `tmp_rovodev_SETUP_INSTRUCTIONS.md` - Step-by-step guide
3. `OWNER_DOCUMENTS_BUCKET_FIX_SUMMARY.md` - This file

---

## 🔧 Troubleshooting

### Issue: "Supabase is not configured" still appears

**Solution:**
1. Make sure you ran the SQL script successfully
2. Restart Expo with `--clear` flag
3. Check console logs for config detection
4. Verify credentials in `app.json` match `.env.local`

### Issue: "Bucket not found" error

**Solution:**
1. Run SQL script again in Supabase SQL Editor
2. Or create bucket manually via UI:
   - Storage > New Bucket
   - Name: `owner-documents`
   - Public: ✅ YES
   - File size: 50MB

### Issue: "Upload permission denied"

**Solution:**
1. Verify bucket is set to PUBLIC
2. Check RLS policies were created (run SQL script)
3. Make sure anonymous uploads are allowed

### Issue: Documents upload but not visible in app

**Solution:**
1. Check if URLs are returned correctly
2. Verify bucket is PUBLIC
3. Check network logs in Expo

---

## 📊 Expected Flow After Fix

```
User clicks "Sign Up" > Selects Owner
  ↓
Fills form + uploads documents locally
  ↓
Clicks "Create Account"
  ↓
App checks Supabase config ✅ (now working)
  ↓
Uploads documents to Supabase Storage ✅ (now working)
  ↓
Creates user account in Supabase Auth ✅
  ↓
Creates owner application record ✅
  ↓
Creates barangay notification ✅
  ↓
Success! User redirected to dashboard ✅
```

---

## 📞 If Still Having Issues

1. Check the console logs when uploading
2. Look for these specific messages:
   - `🔍 Supabase URL check: ✅ Found`
   - `🔍 Supabase Key check: ✅ Found`
   - `📤 Uploading owner verification documents...`
3. Share any error messages you see

The fix is now complete on the code side. You just need to create the bucket in Supabase!
