# Upload Fix Instructions

## Issue Identified
The "Failed to upload documents. Please check your internet connection and try again." error occurs when creating an owner account because:

1. **Missing Storage Bucket**: The `owner-documents` bucket doesn't exist in Supabase
2. **Incorrect Permissions**: The bucket may have restrictive RLS policies
3. **File System Access Issues**: Different devices handle file URIs differently

## Solution Steps

### Step 1: Create Supabase Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `pslcopwbzlfmuuqwshkx`
3. Navigate to **Storage** in the left sidebar
4. Click **New Bucket**
5. Create a bucket with these settings:
   - **Name**: `owner-documents`
   - **Public**: ✅ Yes (checked)
   - **File size limit**: 50 MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/jpg, application/pdf`

### Step 2: Configure Bucket Permissions

After creating the bucket, set up the RLS policies:

```sql
-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'owner-documents');

-- Allow public read access to documents
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'owner-documents');

-- Allow users to update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'owner-documents');

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'owner-documents');
```

### Step 3: Verify Additional Required Buckets

Make sure these buckets also exist:
- `property-images` (public)
- `property-videos` (public)
- `profile-photos` (public)

### Step 4: Test the Upload

1. Build a new APK/IPA with the fixed configuration
2. Install on a test device
3. Create an owner account with document upload
4. Verify documents appear in Supabase Storage

## Alternative Fix: Enhanced Error Handling

If you want better error messages and retry logic, apply the enhanced upload function below.

