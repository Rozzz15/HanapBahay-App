# ✅ Storage Setup Checklist

Use this checklist while setting up storage in Supabase Dashboard.

---

## 📦 PART 1: Create Buckets

Go to: https://app.supabase.com → Your Project → **Storage** → **New Bucket**

### Bucket 1: property-images
- [ ] Name: `property-images`
- [ ] Public: ✅ **YES**
- [ ] File size limit: `5242880` (5MB)
- [ ] MIME types: `image/jpeg,image/jpg,image/png,image/webp`
- [ ] Click **Create bucket**

### Bucket 2: property-videos
- [ ] Name: `property-videos`
- [ ] Public: ✅ **YES**
- [ ] File size limit: `52428800` (50MB)
- [ ] MIME types: `video/mp4,video/quicktime,video/x-msvideo`
- [ ] Click **Create bucket**

### Bucket 3: owner-documents
- [ ] Name: `owner-documents`
- [ ] Public: ❌ **NO**
- [ ] File size limit: `10485760` (10MB)
- [ ] MIME types: `image/jpeg,image/jpg,image/png,application/pdf`
- [ ] Click **Create bucket**

### Bucket 4: profile-photos
- [ ] Name: `profile-photos`
- [ ] Public: ✅ **YES**
- [ ] File size limit: `2097152` (2MB)
- [ ] MIME types: `image/jpeg,image/jpg,image/png,image/webp`
- [ ] Click **Create bucket**

---

## 🔐 PART 2: Configure Policies

### For: property-images
Click bucket → **Policies** → **New Policy**

- [ ] Policy 1: Upload (INSERT, authenticated, `bucket_id = 'property-images'`)
- [ ] Policy 2: Read (SELECT, anon + authenticated, `bucket_id = 'property-images'`)
- [ ] Policy 3: Update (UPDATE, authenticated, `bucket_id = 'property-images'`)
- [ ] Policy 4: Delete (DELETE, authenticated, `bucket_id = 'property-images'`)

### For: property-videos
- [ ] Policy 1: Upload (INSERT, authenticated, `bucket_id = 'property-videos'`)
- [ ] Policy 2: Read (SELECT, anon + authenticated, `bucket_id = 'property-videos'`)
- [ ] Policy 3: Update (UPDATE, authenticated, `bucket_id = 'property-videos'`)
- [ ] Policy 4: Delete (DELETE, authenticated, `bucket_id = 'property-videos'`)

### For: profile-photos
- [ ] Policy 1: Upload (INSERT, authenticated, `bucket_id = 'profile-photos'`)
- [ ] Policy 2: Read (SELECT, anon + authenticated, `bucket_id = 'profile-photos'`)
- [ ] Policy 3: Update (UPDATE, authenticated, `bucket_id = 'profile-photos'`)
- [ ] Policy 4: Delete (DELETE, authenticated, `bucket_id = 'profile-photos'`)

### For: owner-documents (PRIVATE)
- [ ] Policy 1: Upload (INSERT, authenticated, `bucket_id = 'owner-documents'`)
- [ ] Policy 2: Read Own (SELECT, authenticated, `bucket_id = 'owner-documents' AND (storage.foldername(name))[1] = auth.uid()::text`)

---

## ✅ PART 3: Test

- [ ] Run test script: `node scripts/test-storage-upload.js`
- [ ] Expected: `✅ STORAGE TEST PASSED!`

---

## 🎉 Complete!

When all boxes are checked, your storage is ready!

**Total time:** ~10 minutes
