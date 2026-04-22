# Fix owner-documents Bucket

## Issue Found
Your `owner-documents` bucket exists but is **NOT PUBLIC**. This is why uploads fail!

## Quick Fix (2 minutes)

### Option 1: Make Bucket Public (Easiest)

1. Go to https://supabase.com/dashboard/project/pslcopwbzlfmuuqwshkx/storage/buckets
2. Find the `owner-documents` bucket
3. Click on the bucket name to open details
4. Click **"Settings"** or the gear icon ⚙️
5. Find the **"Public bucket"** toggle
6. Turn it **ON** ✅
7. Click **"Save"**

### Option 2: Fix Policies (If you want to keep it private)

If you prefer to keep the bucket private, you need to add these policies:

1. Go to https://supabase.com/dashboard/project/pslcopwbzlfmuuqwshkx/storage/policies
2. Select the `owner-documents` bucket
3. Add these policies:

**Policy 1: Allow anonymous uploads (for signup)**
```sql
CREATE POLICY "Allow anonymous uploads to owner-documents"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'owner-documents');
```

**Policy 2: Allow public read access**
```sql
CREATE POLICY "Public read access for owner documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'owner-documents');
```

**Policy 3: Allow authenticated users to upload their own**
```sql
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'owner-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Recommended: Option 1 (Make it Public)

Making the bucket public is simpler and works for your use case since:
- Documents are for verification purposes
- Barangay officials need to review them
- URLs are hard to guess (random IDs in filenames)
- You can still control who can upload via policies

## After Fixing

1. ✅ Verify bucket shows "Public" label
2. ✅ Rebuild app: `npx expo start --clear`
3. ✅ Test owner signup with document upload
4. ✅ Should work!

## Still Not Working?

Run the full SQL script to ensure all policies are correct:
```bash
# Go to SQL Editor and run:
supabase-storage-setup.sql
```
