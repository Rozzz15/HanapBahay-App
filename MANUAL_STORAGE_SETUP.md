# 📦 Manual Storage Setup - Step by Step

## Why Manual Setup?

Supabase has RLS (Row Level Security) policies on storage buckets that prevent programmatic creation. Manual setup via the Dashboard is the official way.

---

## 🎯 Setup Instructions (5 Minutes)

### **Step 1: Access Supabase Dashboard**

1. Open browser and go to: https://app.supabase.com
2. Click on your **HanapBahay project**
3. In the left sidebar, click **"Storage"**

---

### **Step 2: Create Buckets (Click "New Bucket" for each)**

#### **Bucket 1: property-images**
```
Name: property-images
Public bucket: ✅ Check the box (YES)
File size limit: 5242880
Allowed MIME types: image/jpeg,image/jpg,image/png,image/webp
```
Click **"Create bucket"**

#### **Bucket 2: property-videos**
```
Name: property-videos
Public bucket: ✅ Check the box (YES)
File size limit: 52428800
Allowed MIME types: video/mp4,video/quicktime,video/x-msvideo
```
Click **"Create bucket"**

#### **Bucket 3: owner-documents**
```
Name: owner-documents
Public bucket: ❌ Leave unchecked (PRIVATE)
File size limit: 10485760
Allowed MIME types: image/jpeg,image/jpg,image/png,application/pdf
```
Click **"Create bucket"**

#### **Bucket 4: profile-photos**
```
Name: profile-photos
Public bucket: ✅ Check the box (YES)
File size limit: 2097152
Allowed MIME types: image/jpeg,image/jpg,image/png,image/webp
```
Click **"Create bucket"**

✅ **You should now see 4 buckets listed!**

---

### **Step 3: Configure Policies (For Each Bucket)**

#### **For property-images:**

1. Click on **"property-images"** bucket
2. Click **"Policies"** tab at the top
3. Click **"New Policy"** button

**Policy A: Upload Access**
- Click **"For full customization"** → **"Create a new policy"**
- Policy name: `Allow authenticated upload`
- Allowed operation: **INSERT** ✅
- Target roles: `authenticated` ✅
- USING expression:
  ```sql
  (bucket_id = 'property-images')
  ```
- Click **"Review"** → **"Save policy"**

**Policy B: Public Read Access**
- Click **"New Policy"** again
- Policy name: `Allow public read`
- Allowed operation: **SELECT** ✅
- Target roles: `anon` ✅ and `authenticated` ✅
- USING expression:
  ```sql
  (bucket_id = 'property-images')
  ```
- Click **"Review"** → **"Save policy"**

**Policy C: Update Access (Optional but recommended)**
- Click **"New Policy"**
- Policy name: `Allow users to update`
- Allowed operation: **UPDATE** ✅
- Target roles: `authenticated` ✅
- USING expression:
  ```sql
  (bucket_id = 'property-images')
  ```
- Click **"Review"** → **"Save policy"**

**Policy D: Delete Access (Optional but recommended)**
- Click **"New Policy"**
- Policy name: `Allow users to delete`
- Allowed operation: **DELETE** ✅
- Target roles: `authenticated` ✅
- USING expression:
  ```sql
  (bucket_id = 'property-images')
  ```
- Click **"Review"** → **"Save policy"**

---

#### **For property-videos:**

Repeat the same 4 policies as above, but change `'property-images'` to `'property-videos'` in the USING expression.

**Quick Summary:**
1. Allow authenticated upload (INSERT)
2. Allow public read (SELECT)
3. Allow users to update (UPDATE)
4. Allow users to delete (DELETE)

---

#### **For profile-photos:**

Same 4 policies as property-images, but change to `'profile-photos'`.

---

#### **For owner-documents (PRIVATE - Different policies!):**

**Policy A: Upload Own Documents**
- Policy name: `Allow users to upload documents`
- Operation: **INSERT** ✅
- Target roles: `authenticated` ✅
- USING expression:
  ```sql
  (bucket_id = 'owner-documents')
  ```
- Save policy

**Policy B: Read Own Documents Only**
- Policy name: `Allow users to read own documents`
- Operation: **SELECT** ✅
- Target roles: `authenticated` ✅
- USING expression:
  ```sql
  (bucket_id = 'owner-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  ```
- Save policy

---

### **Step 4: Verify Setup**

Go back to **Storage** and you should see:
```
✅ property-images (public) - 4 policies
✅ property-videos (public) - 4 policies  
✅ profile-photos (public) - 4 policies
✅ owner-documents (private) - 2 policies
```

---

## 🧪 Test Your Setup

Run this command to test:

```bash
cd Desktop/hanapbahay
node scripts/test-storage-upload.js
```

**Expected output:**
```
✅ STORAGE TEST PASSED!
🎉 Your Supabase Storage is properly configured!
```

---

## ✅ Done!

Your HanapBahay app can now:
- Upload property photos to cloud storage
- Upload property videos to cloud storage
- Store owner verification documents securely
- Upload user profile pictures

**Next:** Try creating a new listing with photos in your app!

---

## 🆘 Troubleshooting

**Issue:** "Cannot create bucket"
- Make sure you're logged into the correct Supabase project
- Check you have admin/owner access to the project

**Issue:** "Test script fails"
- Verify all 4 buckets are created
- Check policies are enabled (green toggle)
- Make sure public buckets have the "Public" badge

**Issue:** "Policy creation fails"
- Use the exact SQL expressions shown above
- Make sure to select correct operation (INSERT/SELECT/UPDATE/DELETE)
- Check target roles are selected
