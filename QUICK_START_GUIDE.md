# 🚀 Quick Start Guide - Owner Documents Migration

## ⚡ 3-Step Setup

### Step 1: Create Supabase Bucket (2 minutes)
1. Open Supabase Dashboard
2. Go to **Storage** section
3. Click **New Bucket**
4. Enter name: `owner-documents`
5. Check ☑ **Public bucket**
6. Click **Create**

### Step 2: Set Policies (1 minute)
1. In Supabase Dashboard, go to **SQL Editor**
2. Open `setup-owner-documents-bucket.sql` and copy ALL contents
3. Paste into SQL Editor
4. Click **Run**
5. ✅ Should see: "✅ Storage policies created successfully!"

**Note**: If you get an error, the SQL file has been updated to fix it.

### Step 3: Verify Setup (30 seconds)
```bash
cd Desktop/hanapbahay
node verify-supabase-setup.js
```

✅ Should see: **"ALL CHECKS PASSED!"**

---

## 🧪 Quick Test

1. **Sign Up**: Create owner account with 2 documents
2. **Check Storage**: Go to Supabase → Storage → owner-documents → See files
3. **View in App**: Log in as barangay → See documents

---

## ✅ What Changed?

### Before
```javascript
// OLD: AsyncStorage (unreliable)
await AsyncStorage.setItem('owner_verification', JSON.stringify(docs));
```

### After
```javascript
// NEW: Supabase Cloud (reliable)
const uploadedDocs = await uploadOwnerDocuments(docs, userId);
```

---

## 📊 Benefits

| Before (AsyncStorage) | After (Supabase) |
|----------------------|------------------|
| ❌ Data loss issues | ✅ 100% reliable |
| ❌ Platform-specific | ✅ Works everywhere |
| ❌ Not backed up | ✅ Auto-backed up |
| ❌ Complex cleanup | ✅ Auto-managed |

---

## 🔍 Verify It Works

### Console Logs (Success)
```
✅ 2 documents uploaded to Supabase Storage
✅ Found 2 documents (already uploaded to Supabase Storage)
✅ Owner application created in Supabase
```

### Console Logs (Error)
```
❌ Failed to upload documents
[Shows: "Upload Failed - Check internet connection"]
```

---

## 📚 Full Documentation

- **Complete Guide**: `ASYNCSTORAGE_REMOVAL_COMPLETE.md`
- **Summary**: `MIGRATION_COMPLETE_SUMMARY.md`
- **SQL Setup**: `setup-owner-documents-bucket.sql`
- **Verification**: `verify-supabase-setup.js`

---

## 🆘 Troubleshooting

**Problem**: Upload fails during sign-up  
**Fix**: Run `node verify-supabase-setup.js`

**Problem**: Documents don't show in barangay view  
**Fix**: Check bucket is set to **Public** in Supabase

**Problem**: "Bucket not found"  
**Fix**: Create `owner-documents` bucket in Supabase Dashboard

---

## ✅ Done!

Your app now uses **Supabase Cloud Storage** for all owner documents.

No more AsyncStorage! 🎉
