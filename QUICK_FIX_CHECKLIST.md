# ✅ Quick Fix Checklist - Owner Upload Issue

## Issue
**"Failed to upload documents. Please check your internet connection and try again."** when creating owner accounts.

## ⚡ Quick Fix (Do These Now!)

### 1️⃣ Create Supabase Storage Buckets (5 minutes)

Go to: https://supabase.com/dashboard/project/pslcopwbzlfmuuqwshkx/storage

Create these 4 buckets (all must be PUBLIC):

```
□ owner-documents     (Public: YES)
□ property-images     (Public: YES)
□ property-videos     (Public: YES)
□ profile-photos      (Public: YES)
```

### 2️⃣ Run SQL Script (2 minutes)

1. Open: https://supabase.com/dashboard/project/pslcopwbzlfmuuqwshkx/sql/new
2. Copy contents of `supabase-storage-setup.sql`
3. Paste and click **Run**
4. Wait for: ✅ Success

### 3️⃣ Rebuild App (5 minutes)

```bash
cd Desktop/hanapbahay
npx expo start --clear
```

### 4️⃣ Test on Device (2 minutes)

1. Create owner account
2. Upload documents
3. Submit form
4. ✅ Should work!

---

## 📋 Verification

Run this to verify setup:
```bash
node verify-upload-fix.js
```

Expected: `✅ All checks passed!`

---

## 🎯 What Got Fixed

- ✅ Enhanced upload with 3 automatic retries
- ✅ Network connectivity check
- ✅ Better error messages
- ✅ Sequential upload (doesn't overwhelm connection)
- ✅ Handles different file formats from different devices

---

## 📄 Files You Need

1. **THIS FILE** - Quick checklist
2. **README_UPLOAD_FIX.md** - Complete guide
3. **supabase-storage-setup.sql** - SQL to run
4. **TROUBLESHOOTING_UPLOAD_ISSUES.md** - If problems persist

---

## 🆘 Still Not Working?

Check:
1. All 4 buckets exist and are PUBLIC
2. SQL script ran without errors
3. App was rebuilt after changes
4. Device has internet connection
5. Supabase project is not paused/over quota

See **TROUBLESHOOTING_UPLOAD_ISSUES.md** for detailed help.

---

**Time to fix:** ~15 minutes  
**Priority:** 🔴 CRITICAL - Blocking owner signups
