# 🚀 Quick Start: Supabase Storage Setup (5 Minutes)

## TL;DR - What You Need to Do

Create 4 storage buckets in Supabase Dashboard and configure their access policies.

---

## 🎯 Option 1: Automatic Setup (If you have Service Role Key)

1. Get your **Service Role Key** from Supabase Dashboard:
   - Go to **Settings** → **API**
   - Copy the `service_role` key (keep it secret!)

2. Add to `.env` file:
   ```bash
   EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. Run the setup script:
   ```bash
   cd Desktop/hanapbahay
   node scripts/setup-supabase-storage.js
   ```

4. Then configure policies manually in Dashboard (required).

---

## 🎯 Option 2: Manual Setup (Recommended - Most Secure)

### Step 1: Create Buckets (2 minutes)

Go to [Supabase Dashboard](https://app.supabase.com) → Your Project → **Storage** → **New Bucket**

Create these 4 buckets:

| Bucket Name | Public? | Size Limit | Purpose |
|-------------|---------|------------|---------|
| `property-images` | ✅ Yes | 5 MB | Property photos |
| `property-videos` | ✅ Yes | 50 MB | Property videos |
| `owner-documents` | ❌ No | 10 MB | Owner verification docs |
| `profile-photos` | ✅ Yes | 2 MB | User profile pics |

### Step 2: Add Policies (3 minutes)

For **each public bucket** (property-images, property-videos, profile-photos):

Click bucket → **Policies** → **New Policy** → Add these 2 policies:

**Policy 1:** Allow Upload
```
Name: Allow authenticated users to upload
Operation: INSERT
Target: authenticated
Using: (bucket_id = 'bucket-name-here')
```

**Policy 2:** Allow Public Read
```
Name: Allow public read
Operation: SELECT
Target: anon, authenticated
Using: (bucket_id = 'bucket-name-here')
```

For **owner-documents** (private bucket):

**Policy 1:** Allow Upload
```
Name: Allow users to upload documents
Operation: INSERT
Target: authenticated
Using: (bucket_id = 'owner-documents')
```

**Policy 2:** Allow Read Own Documents
```
Name: Allow users to read their own documents
Operation: SELECT
Target: authenticated
Using: (bucket_id = 'owner-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
```

---

## ✅ Test It

Run the test script to verify everything works:

```bash
cd Desktop/hanapbahay
node scripts/test-storage-upload.js
```

Expected output:
```
✅ STORAGE TEST PASSED!
🎉 Your Supabase Storage is properly configured!
```

---

## 🎉 Done!

Now your app can:
- ✅ Upload property photos to cloud
- ✅ Upload property videos to cloud
- ✅ Store owner documents securely
- ✅ Upload profile pictures

Test it by creating a new listing with photos in your app!

---

## 🆘 Need Help?

See detailed guide: `SUPABASE_STORAGE_SETUP_GUIDE.md`
