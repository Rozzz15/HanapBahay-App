# 📦 Supabase Storage Setup Guide

## Overview
This guide will help you set up cloud storage for media uploads (photos & videos) in the HanapBahay app.

---

## 🎯 What You'll Create

1. **property-images** - Property listing photos (PUBLIC)
2. **property-videos** - Property listing videos (PUBLIC)
3. **owner-documents** - Owner verification documents (PRIVATE)
4. **profile-photos** - User profile pictures (PUBLIC)

---

## 📋 Step-by-Step Instructions

### **Step 1: Access Supabase Dashboard**

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Log in to your account
3. Select your **HanapBahay project**

---

### **Step 2: Create Storage Buckets**

1. In the left sidebar, click **Storage**
2. Click **"Create a new bucket"** button

#### Create Each Bucket:

**Bucket 1: property-images**
- Name: `property-images`
- Public bucket: ✅ **YES**
- File size limit: `5242880` (5MB)
- Allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp`
- Click **Create bucket**

**Bucket 2: property-videos**
- Name: `property-videos`
- Public bucket: ✅ **YES**
- File size limit: `52428800` (50MB)
- Allowed MIME types: `video/mp4, video/quicktime, video/x-msvideo`
- Click **Create bucket**

**Bucket 3: owner-documents**
- Name: `owner-documents`
- Public bucket: ❌ **NO** (Private)
- File size limit: `10485760` (10MB)
- Allowed MIME types: `image/jpeg, image/jpg, image/png, application/pdf`
- Click **Create bucket**

**Bucket 4: profile-photos**
- Name: `profile-photos`
- Public bucket: ✅ **YES**
- File size limit: `2097152` (2MB)
- Allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp`
- Click **Create bucket**

---

### **Step 3: Configure Storage Policies**

Each bucket needs policies to control access. Follow these steps for each bucket:

1. Click on the bucket name
2. Click **"Policies"** tab
3. Click **"New Policy"**

---

#### **Policies for: property-images**

**Policy 1: Allow Upload**
```
Operation: INSERT
Policy name: Allow authenticated users to upload images
Target roles: authenticated
Using expression:
(bucket_id = 'property-images')
```

**Policy 2: Allow Public Read**
```
Operation: SELECT
Policy name: Allow public read access
Target roles: anon, authenticated
Using expression:
(bucket_id = 'property-images')
```

**Policy 3: Allow Update**
```
Operation: UPDATE
Policy name: Allow users to update their images
Target roles: authenticated
Using expression:
(bucket_id = 'property-images')
```

**Policy 4: Allow Delete**
```
Operation: DELETE
Policy name: Allow users to delete their images
Target roles: authenticated
Using expression:
(bucket_id = 'property-images')
```

---

#### **Policies for: property-videos**

**Policy 1: Allow Upload**
```
Operation: INSERT
Policy name: Allow authenticated users to upload videos
Target roles: authenticated
Using expression:
(bucket_id = 'property-videos')
```

**Policy 2: Allow Public Read**
```
Operation: SELECT
Policy name: Allow public read access
Target roles: anon, authenticated
Using expression:
(bucket_id = 'property-videos')
```

---

#### **Policies for: owner-documents** (PRIVATE)

**Policy 1: Allow Upload**
```
Operation: INSERT
Policy name: Allow users to upload their documents
Target roles: authenticated
Using expression:
(bucket_id = 'owner-documents' AND auth.role() = 'authenticated')
```

**Policy 2: Allow Read Own Documents**
```
Operation: SELECT
Policy name: Allow users to read their own documents
Target roles: authenticated
Using expression:
(bucket_id = 'owner-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
```

---

#### **Policies for: profile-photos**

**Policy 1: Allow Upload**
```
Operation: INSERT
Policy name: Allow users to upload profile photos
Target roles: authenticated
Using expression:
(bucket_id = 'profile-photos')
```

**Policy 2: Allow Public Read**
```
Operation: SELECT
Policy name: Allow public read access
Target roles: anon, authenticated
Using expression:
(bucket_id = 'profile-photos')
```

---

### **Step 4: Verify Setup**

1. Go back to **Storage** in the sidebar
2. You should see all 4 buckets listed:
   - ✅ property-images (public)
   - ✅ property-videos (public)
   - ✅ owner-documents (private)
   - ✅ profile-photos (public)

---

## 🧪 Test the Setup

After completing the setup, run this test script:

```bash
cd Desktop/hanapbahay
node scripts/test-storage-upload.js
```

---

## ✅ What This Enables

Once storage is set up, your app will:

1. ✅ Upload property photos to cloud storage
2. ✅ Upload property videos to cloud storage
3. ✅ Store owner verification documents securely
4. ✅ Upload user profile pictures
5. ✅ Display images from cloud URLs (faster & more reliable)

---

## 🔧 Troubleshooting

### Issue: "new row violates row-level security policy"

**Solution:** You need to use the Service Role Key to create buckets.

1. Go to **Settings** → **API** in Supabase Dashboard
2. Copy the **service_role** key (keep it secret!)
3. Add to your `.env` file:
   ```
   EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
4. Re-run the setup script

**OR** create buckets manually in the dashboard (recommended for security).

---

### Issue: "Cannot upload files"

**Solution:** Check storage policies are correctly configured.

1. Go to **Storage** → Click bucket → **Policies**
2. Verify policies are enabled
3. Check the "Using expression" matches the examples above

---

### Issue: "Files not showing in app"

**Solution:** 

1. Check bucket is set to **PUBLIC**
2. Verify the public URL is correct
3. Check CORS settings in Storage configuration

---

## 📚 Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload Limits](https://supabase.com/docs/guides/storage/uploads/file-limits)

---

## 🎉 You're Done!

Once you've completed all steps, your HanapBahay app will have full cloud storage capabilities for photos, videos, and documents!
