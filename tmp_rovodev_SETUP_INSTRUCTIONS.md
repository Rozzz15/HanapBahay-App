# 🔧 FIX: Owner Documents Upload Issue

## Problem Found
The `owner-documents` bucket **DOES NOT EXIST** in your Supabase project. That's why you're getting the error:
> "Supabase is not configured. Please contact support."

## Solution (5 minutes)

### Step 1: Create the Bucket in Supabase

**Option A: Using SQL Editor (Recommended)**
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `tmp_rovodev_create_owner_docs_bucket.sql`
5. Click **Run** (or press Ctrl+Enter)
6. You should see: ✅ SUCCESS: owner-documents bucket created!

**Option B: Using Supabase UI**
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu/storage/buckets
2. Click **New Bucket**
3. Enter:
   - Name: `owner-documents`
   - ✅ Check "Public bucket"
   - File size limit: 50 MB
   - Allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp, application/pdf`
4. Click **Create Bucket**
5. Then run the SQL script to add the policies

### Step 2: Restart Your App
```bash
cd C:\Users\Admin\Desktop\hanapbahay
npx expo start --clear
```

### Step 3: Test Owner Signup
1. In your app, click **Sign Up**
2. Select **Owner** role
3. Fill in the form
4. Upload documents (Government ID, Business Permit, etc.)
5. Submit

**Expected Result:**
- ✅ Documents upload successfully
- ✅ Owner application created
- ✅ No more "Supabase is not configured" error

## What We Fixed

1. ✅ **Added Supabase credentials to app.json** - So they're available at runtime
2. ✅ **Improved configuration check** - Now reads from both process.env and Expo Constants
3. ✅ **Created SQL script to setup bucket** - With all necessary policies
4. ✅ **Made bucket PUBLIC** - So uploads work for anonymous users during signup

## Verify the Fix

After running the SQL script, verify the bucket exists:
```bash
node tmp_rovodev_check_bucket.js
```

You should see:
```
✅ owner-documents bucket exists!
   Public: ✅ YES
```

## Troubleshooting

**If still not working:**
1. Make sure you ran the SQL script successfully
2. Restart Expo with `npx expo start --clear`
3. Check the logs when uploading documents
4. Verify you see these logs:
   ```
   🔍 Supabase URL check: ✅ Found
   🔍 Supabase Key check: ✅ Found
   📤 Uploading owner verification documents...
   ```

**If you see "bucket not found":**
- The SQL script didn't run properly
- Try Option B (create via UI) instead

## Files Modified
- ✅ `app.json` - Added Supabase credentials
- ✅ `utils/supabase-client.ts` - Improved config loading
- ✅ `utils/supabase-storage-enhanced.ts` - Added fallback config loading

## Next Steps
After this works, you can:
1. Test uploading multiple document types
2. Verify barangay officials can view the documents
3. Test the complete owner application flow
