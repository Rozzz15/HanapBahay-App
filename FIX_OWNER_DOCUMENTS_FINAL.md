# 🔥 OWNER DOCUMENTS UPLOAD - FINAL FIX

## ✅ Good News: Bucket Exists!
The `owner-documents` bucket is already created in your Supabase project.

## ❌ Bad News: It's Not Public!
All your other buckets are public:
- ✅ property-photos - **Public**
- ✅ property-media - **Public**
- ✅ media-cache - **Public**
- ✅ profile-photos - **Public**
- ✅ property-videos - **Public**
- ✅ property-images - **Public**
- ❌ **owner-documents - NOT Public** ← This is the problem!

---

## 🚀 QUICK FIX (Choose One Method)

### ⚡ Method 1: UI (FASTEST - 30 seconds)

1. **Go to bucket settings:**
   https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu/storage/buckets/owner-documents

2. **Click the ⚙️ Settings (gear) icon** on the right side

3. **Toggle "Public bucket" to ON** ✅

4. **Click "Save"**

**That's it!** The upload should work now.

---

### 🛠️ Method 2: SQL Script (More thorough)

1. **Go to SQL Editor:**
   https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu/sql

2. **Click "New Query"**

3. **Copy and paste this file:**
   `tmp_rovodev_fix_bucket_public.sql`

4. **Click "Run"** (or press Ctrl+Enter)

5. **Wait for success message:**
   ```
   ✅ SUCCESS: owner-documents bucket is now PUBLIC!
   ```

This method also:
- Updates the file size limit to 50MB (you have 10MB currently)
- Adds proper RLS policies for anonymous uploads
- Verifies the configuration

---

## 🧪 After Fixing, Do This:

### Step 1: Restart Expo (Important!)
```bash
cd C:\Users\Admin\Desktop\hanapbahay
npx expo start --clear
```

**Why `--clear`?** It clears the cache and loads the updated config from `app.json`.

### Step 2: Test Owner Signup

1. Open your app
2. Click **"Sign Up"**
3. Select **"Owner"** role
4. Fill in the form
5. Click **"Upload Documents"**
6. Select document type (e.g., "Government ID")
7. Choose images
8. Upload more documents if needed
9. Click **"Create Account"**

### Step 3: Watch the Console Logs

You should now see:
```
🔍 Supabase URL check: ✅ Found
🔍 Supabase Key check: ✅ Found
📤 Starting upload to Supabase Storage...
✅ Documents uploaded successfully!
```

**No more errors!** ✅

---

## 📊 What We Fixed (Summary)

### Code Fixes (Already Applied):
1. ✅ **app.json** - Added Supabase credentials to `extra` field
2. ✅ **supabase-client.ts** - Multi-source config loading (process.env + Constants)
3. ✅ **supabase-storage-enhanced.ts** - Better error messages and config detection

### Configuration Fix (You Need to Do):
1. ⏳ **Make owner-documents bucket PUBLIC** ← Do this now!

---

## 🔍 Why This Happened

When the bucket is **not public**, Supabase requires:
1. Authenticated requests (but signup happens before auth!)
2. Proper RLS policies (which might not exist)
3. Storage API permissions

When the bucket is **public**:
- ✅ Anonymous users can upload during signup
- ✅ Everyone can view the documents (needed for barangay officials)
- ✅ Simpler, more reliable uploads

All your other storage buckets are already public, so this is the right approach!

---

## 📝 Files Created

1. `tmp_rovodev_fix_bucket_public.sql` - Make bucket public + add policies
2. `tmp_rovodev_check_policies.sql` - Check current policies
3. `FIX_OWNER_DOCUMENTS_FINAL.md` - This file

---

## ❓ Still Having Issues?

### Error: "Supabase is not configured"
**Fix:** Restart Expo with `--clear` flag to load new config

### Error: "Permission denied"
**Fix:** Make sure you toggled "Public bucket" to ON

### Error: "Bucket not found"
**Fix:** This shouldn't happen since bucket exists. Check bucket name is exactly `owner-documents`

### Documents upload but error still shows
**Fix:** 
1. Clear Expo cache: `npx expo start --clear`
2. Check console for actual error message
3. Verify bucket is now public in Supabase UI

---

## ✅ Expected Result After Fix

```
User creates owner account
  ↓
Uploads Government ID ✅
  ↓
Uploads Business Permit ✅
  ↓
Uploads other documents ✅
  ↓
Clicks "Create Account"
  ↓
Documents upload to Supabase ✅
  ↓
Account created ✅
  ↓
Redirect to owner dashboard ✅
  ↓
SUCCESS! 🎉
```

---

## 🎯 Do This Now:

1. **Make bucket public** (30 seconds via UI)
2. **Restart Expo** with `--clear` flag
3. **Test owner signup** with document upload
4. **Let me know** if it works! 🚀

The fix is simple - just toggle that bucket to public! 😊
