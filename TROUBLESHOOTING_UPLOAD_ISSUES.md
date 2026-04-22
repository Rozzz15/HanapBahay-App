# Troubleshooting Upload Issues - Complete Guide

## Problem
When creating an owner account on different devices, the app shows:
**"Failed to upload documents. Please check your internet connection and try again."**

## Root Causes Identified

1. **Missing Storage Bucket**: The `owner-documents` bucket doesn't exist in Supabase
2. **Incorrect RLS Policies**: Anonymous users cannot upload during signup
3. **File System Permissions**: Different devices handle file access differently
4. **Network Issues**: Upload timeout or CORS problems

## Complete Fix Instructions

### STEP 1: Setup Supabase Storage Buckets (CRITICAL)

#### Option A: Manual Setup (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Login and select project: `pslcopwbzlfmuuqwshkx`
3. Click **Storage** in left sidebar
4. Create the following buckets:

**Bucket 1: owner-documents**
- Click **New Bucket**
- Name: `owner-documents`
- Public: ✅ **YES** (checked)
- File size limit: `50 MB`
- Allowed MIME types: `image/jpeg, image/png, image/jpg, application/pdf`
- Click **Create bucket**

**Bucket 2: property-images**
- Name: `property-images`
- Public: ✅ **YES**
- File size limit: `50 MB`
- Allowed MIME types: `image/jpeg, image/png, image/jpg`

**Bucket 3: property-videos**
- Name: `property-videos`
- Public: ✅ **YES**
- File size limit: `100 MB`
- Allowed MIME types: `video/mp4, video/quicktime`

**Bucket 4: profile-photos**
- Name: `profile-photos`
- Public: ✅ **YES**
- File size limit: `10 MB`
- Allowed MIME types: `image/jpeg, image/png`

#### Option B: SQL Script

Run the SQL file `supabase-storage-setup.sql` in your Supabase SQL Editor:
1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy and paste contents of `supabase-storage-setup.sql`
4. Click **Run**

### STEP 2: Configure Storage Policies

1. Go to **Storage** → **Policies** in Supabase Dashboard
2. For each bucket, ensure these policies exist:

**For owner-documents bucket:**
- ✅ Allow INSERT for authenticated users
- ✅ Allow INSERT for anonymous users (IMPORTANT for signup)
- ✅ Allow SELECT for public
- ✅ Allow UPDATE for authenticated users
- ✅ Allow DELETE for authenticated users

If policies don't exist, run the SQL script from `supabase-storage-setup.sql`

### STEP 3: Verify Environment Configuration

Check your `.env` file has correct Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://pslcopwbzlfmuuqwshkx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### STEP 4: Test the Enhanced Upload

The app now uses enhanced upload with:
- ✅ Automatic retry (3 attempts)
- ✅ Network connectivity check
- ✅ Better error messages
- ✅ Sequential upload to avoid overwhelming connection

### STEP 5: Rebuild and Test

```bash
# Clear cache and rebuild
cd Desktop/hanapbahay
npx expo start --clear

# Build new APK/IPA
eas build --platform android --profile preview
```

## Verification Steps

### Test on Device:

1. Install the new build on a test device
2. Open the app and tap "Sign Up"
3. Select "Owner" as account type
4. Fill in all required fields
5. Tap "Upload Business Documents"
6. Select 1-3 images from your gallery
7. Complete the form and tap "Create Account"
8. ✅ Success: Documents should upload and account should be created

### Check in Supabase:

1. Go to **Storage** → **owner-documents**
2. You should see a folder with temp user ID
3. Inside should be your uploaded documents
4. Click on a document to verify it opens

## Common Issues & Solutions

### Issue 1: "Bucket not found"
**Solution:** Create the `owner-documents` bucket in Supabase Dashboard (see Step 1)

### Issue 2: "Not allowed to upload"
**Solution:** Add anonymous INSERT policy to storage.objects (see Step 2)

### Issue 3: "File not found" or "File no longer exists"
**Cause:** Image picker cached file was deleted
**Solution:** The enhanced upload now handles this with retry logic

### Issue 4: "No internet connection"
**Solution:** The enhanced upload now checks connectivity before attempting upload

### Issue 5: Upload works on some devices but not others
**Possible causes:**
- Different Android/iOS versions handle file URIs differently
- Some devices have stricter storage permissions
- Network restrictions on certain devices

**Solution:** The enhanced upload handles both `file://` and `data:` URI formats

### Issue 6: Upload times out
**Solution:** The enhanced upload now:
- Uploads documents sequentially instead of parallel
- Has longer timeout (3 retries with increasing delays)
- Shows progress to user

## Testing Checklist

- [ ] Supabase bucket `owner-documents` exists and is public
- [ ] Storage policies allow anonymous INSERT
- [ ] `.env` has correct Supabase credentials
- [ ] App rebuilt with latest changes
- [ ] Tested on at least 2 different devices
- [ ] Tested with different image sizes (small, medium, large)
- [ ] Tested with poor network connection
- [ ] Verified documents appear in Supabase Storage
- [ ] Owner application appears in database

## Debug Logs to Check

When testing, check the logs for:

```
✅ Using enhanced upload with retry logic
📤 Upload attempt 1/3...
📊 File size: 1234.56 KB
☁️ Uploading to bucket: owner-documents/...
✅ Upload successful on attempt 1
```

If you see errors:
```
❌ Supabase upload error: Bucket not found
```
→ Create the bucket

```
❌ Supabase upload error: not allowed
```
→ Fix RLS policies

```
❌ File does not exist
```
→ Image picker cache issue (retry will handle it)

## Support

If issues persist after following all steps:

1. Check Supabase logs: **Dashboard** → **Logs** → **API Logs**
2. Check device logs: `npx react-native log-android` or `npx react-native log-ios`
3. Verify Supabase project is not paused or over quota
4. Check if you can manually upload a file to the bucket via Supabase Dashboard

## Files Modified

1. ✅ `components/SignUpModal.tsx` - Enhanced error handling
2. ✅ `utils/supabase-storage-enhanced.ts` - New file with retry logic
3. ✅ `supabase-storage-setup.sql` - SQL script for bucket setup

## Next Steps

After fixing:
1. Test thoroughly on multiple devices
2. Monitor Supabase Storage usage
3. Consider adding upload progress indicator to UI
4. Add analytics to track upload success rate
5. Consider compressing images before upload to reduce size

---

**Last Updated:** January 18, 2026
**Status:** Fixed with enhanced upload and retry logic
