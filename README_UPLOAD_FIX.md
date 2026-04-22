# 🔧 Upload Fix - Quick Start Guide

## Problem Summary
Owner account creation fails with error: **"Failed to upload documents. Please check your internet connection and try again."**

## ✅ Solution Implemented

I've implemented a comprehensive fix with:
- ✅ Enhanced upload function with automatic retry (3 attempts)
- ✅ Better error messages showing specific issues
- ✅ Network connectivity check before upload
- ✅ Sequential document upload to prevent overwhelming the connection
- ✅ Improved file handling for different devices
- ✅ Detailed logging for debugging

## 🚀 Quick Setup (5 Steps)

### Step 1: Create Storage Buckets in Supabase ⚠️ CRITICAL

1. Go to https://supabase.com/dashboard
2. Login and select project: `pslcopwbzlfmuuqwshkx`
3. Click **Storage** in the left sidebar
4. Click **New Bucket** and create:

   **Bucket 1: `owner-documents`**
   - Name: `owner-documents`
   - Public: ✅ YES (checked)
   - Click **Create bucket**

   **Bucket 2: `property-images`**
   - Name: `property-images`
   - Public: ✅ YES (checked)
   - Click **Create bucket**

   **Bucket 3: `property-videos`**
   - Name: `property-videos`
   - Public: ✅ YES (checked)
   - Click **Create bucket**

   **Bucket 4: `profile-photos`**
   - Name: `profile-photos`
   - Public: ✅ YES (checked)
   - Click **Create bucket**

### Step 2: Set Up Storage Policies

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open the file `supabase-storage-setup.sql` in this directory
4. Copy all its contents and paste into the SQL Editor
5. Click **Run** or press `Ctrl+Enter`
6. Wait for success message: ✅ Query executed successfully

### Step 3: Verify Environment Configuration

Check that your `.env` file has the correct Supabase credentials:

```bash
# .env or .env.local should contain:
EXPO_PUBLIC_SUPABASE_URL=https://pslcopwbzlfmuuqwshkx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ Already configured correctly in your project!

### Step 4: Rebuild the App

```bash
# Clear cache and rebuild
cd Desktop/hanapbahay
npx expo start --clear

# For production build:
eas build --platform android --profile preview
```

### Step 5: Test on Device

1. Install the new build on your test device
2. Open app and tap **Sign Up**
3. Select **Owner** as account type
4. Fill in all required information
5. Tap **Upload Business Documents**
6. Select 1-3 images from gallery
7. Complete form and tap **Create Account**
8. ✅ Documents should upload successfully!

## 📁 Files Created/Modified

### New Files:
- ✅ `utils/supabase-storage-enhanced.ts` - Enhanced upload with retry logic
- ✅ `supabase-storage-setup.sql` - SQL script for bucket setup
- ✅ `UPLOAD_FIX_INSTRUCTIONS.md` - Detailed instructions
- ✅ `TROUBLESHOOTING_UPLOAD_ISSUES.md` - Complete troubleshooting guide
- ✅ `verify-upload-fix.js` - Verification script

### Modified Files:
- ✅ `components/SignUpModal.tsx` - Now uses enhanced upload

## 🔍 Verification Script

Run this to verify everything is set up correctly:

```bash
cd Desktop/hanapbahay
node verify-upload-fix.js
```

Expected output:
```
✅ All checks passed! Your upload fix is ready.
```

## 🎯 What Changed?

### Before:
```typescript
// Old upload - single attempt, poor error messages
uploadedDocuments = await uploadOwnerDocuments(documents, userId);
```

### After:
```typescript
// New enhanced upload with:
// - 3 automatic retries
// - Network connectivity check
// - Better error messages
// - Sequential upload
uploadedDocuments = await uploadOwnerDocumentsEnhanced(documents, userId);
```

## ⚡ Key Improvements

1. **Automatic Retry Logic**: Up to 3 attempts with increasing delays
2. **Network Check**: Verifies internet connection before attempting upload
3. **Better Error Messages**: Shows specific issues (bucket not found, no permission, etc.)
4. **Sequential Upload**: Uploads documents one at a time to prevent overwhelming connection
5. **Enhanced File Handling**: Supports both `file://` and `data:` URI formats
6. **Detailed Logging**: Easy to debug with console logs

## 🐛 Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| "Bucket not found" | Create `owner-documents` bucket in Supabase Dashboard |
| "Not allowed to upload" | Run the SQL script to set up policies |
| "File not found" | Enhanced upload now handles this with retry |
| "No internet connection" | Check device network, enhanced upload verifies this |
| Works on one device but not another | Enhanced upload handles different URI formats |

## 📊 Testing Checklist

Before considering this fixed, verify:

- [ ] All 4 storage buckets exist in Supabase
- [ ] SQL policies script executed successfully
- [ ] `verify-upload-fix.js` passes all checks
- [ ] App rebuilt with new code
- [ ] Tested on at least 2 different devices
- [ ] Documents appear in Supabase Storage after signup
- [ ] Owner application appears in database

## 📖 Additional Documentation

For more detailed information:

1. **UPLOAD_FIX_INSTRUCTIONS.md** - Step-by-step setup guide
2. **TROUBLESHOOTING_UPLOAD_ISSUES.md** - Comprehensive troubleshooting
3. **supabase-storage-setup.sql** - SQL script with comments

## 🆘 Still Having Issues?

1. Check Supabase logs: Dashboard → Logs → API Logs
2. Check device logs: `npx react-native log-android` or `npx react-native log-ios`
3. Verify buckets are public and exist
4. Try manually uploading a file via Supabase Dashboard
5. Check if Supabase project is paused or over quota

## 📞 What to Tell Users

If users report issues:

> "We've identified and fixed the document upload issue. Please update to the latest version of the app. If you still experience problems, please check your internet connection and try again."

## ✨ Success Indicators

You'll know the fix works when you see these logs:

```
✅ Using enhanced upload with retry logic
📤 Uploading 2 owner documents with retry logic...
📄 Uploading document 1/2: Government ID
📤 Upload attempt 1/3...
✅ Upload successful on attempt 1
📄 Uploading document 2/2: Business Permit
✅ Successfully uploaded 2/2 documents
```

---

## 🎉 Next Steps After Fix

1. **Monitor**: Track upload success rate in analytics
2. **Optimize**: Consider image compression before upload
3. **Improve UX**: Add upload progress indicator
4. **Documentation**: Update user guide with document requirements
5. **Testing**: Continue testing on various devices and network conditions

---

**Created:** January 18, 2026  
**Status:** ✅ Ready for testing  
**Priority:** High - Critical for owner onboarding

Need help? Check the troubleshooting guide or the detailed instructions!
