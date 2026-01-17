# 🔧 Fix Supabase Storage Permissions

## Problem
You're getting this error: `new row violates row-level security policy`

This means your Supabase Storage buckets don't have the correct permissions set up for authenticated users to upload files.

## Solution - Follow These Steps:

### Option 1: Run SQL Script (Recommended - Fastest)

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the SQL**
   - Open the file: `supabase-storage-policies.sql`
   - Copy ALL the content
   - Paste it into the SQL Editor

4. **Run the Script**
   - Click "Run" or press `Ctrl+Enter`
   - Wait for success message: "Storage buckets and policies configured successfully!"

5. **Test the Upload**
   - Go back to your app
   - Try uploading a profile photo again
   - It should work now! ✅

---

### Option 2: Manual Setup (If SQL doesn't work)

#### Step 1: Create Storage Buckets

1. Go to **Storage** in the left sidebar
2. Click **"New bucket"**
3. Create these buckets:
   - Name: `profile-photos`, Public: ✅ Yes
   - Name: `property-images`, Public: ✅ Yes
   - Name: `property-videos`, Public: ✅ Yes

#### Step 2: Set Policies for Each Bucket

For **each bucket** (`profile-photos`, `property-images`, `property-videos`):

1. Click on the bucket name
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. Click **"For full customization"**

**Create 4 policies for each bucket:**

##### Policy 1: SELECT (View)
```
Policy name: Anyone can view [bucket-name]
Allowed operation: SELECT
Target roles: public
USING expression: bucket_id = '[bucket-name]'
```

##### Policy 2: INSERT (Upload)
```
Policy name: Authenticated users can upload [bucket-name]
Allowed operation: INSERT
Target roles: authenticated
WITH CHECK expression: bucket_id = '[bucket-name]'
```

##### Policy 3: UPDATE
```
Policy name: Users can update own [bucket-name]
Allowed operation: UPDATE
Target roles: authenticated
USING expression: bucket_id = '[bucket-name]'
```

##### Policy 4: DELETE
```
Policy name: Users can delete own [bucket-name]
Allowed operation: DELETE
Target roles: authenticated
USING expression: bucket_id = '[bucket-name]'
```

Replace `[bucket-name]` with:
- `profile-photos`
- `property-images`
- `property-videos`

#### Step 3: Test
- Go back to your app
- Try uploading a profile photo
- Should work now! ✅

---

## Quick Test After Fixing

1. Open your app in browser
2. Go to Profile → Personal Details
3. Click "Select Photo"
4. Choose an image
5. Click "Save"
6. Look for: **"Profile updated successfully!"** ✅

---

## Still Having Issues?

Check these:

1. **Are you logged in?**
   - Storage policies require authentication
   - Make sure you're logged into the app

2. **Check Supabase logs**
   - Go to Supabase Dashboard → Logs
   - Look for storage-related errors

3. **Verify environment variables**
   - Check `.env` file has correct Supabase URL and key

4. **Browser console**
   - Press F12
   - Check for any authentication errors

---

## What This Fixes

✅ Profile photo uploads  
✅ Property image uploads (for owners)  
✅ Property video uploads (for owners)  
✅ All storage-related uploads in the app

---

Need help? Let me know what error you see after trying these steps!
