-- Check current policies on owner-documents bucket
SELECT 
  policyname as "Policy Name",
  cmd as "Operation",
  roles as "Roles",
  qual as "Using Check",
  with_check as "With Check"
FROM pg_policies 
WHERE tablename = 'objects' 
  AND (policyname LIKE '%owner%' OR policyname LIKE '%document%')
ORDER BY policyname;

-- Check bucket configuration
SELECT 
  id as "Bucket ID",
  name as "Bucket Name",
  public as "Is Public",
  file_size_limit / 1048576 as "Size Limit (MB)",
  allowed_mime_types as "Allowed Types"
FROM storage.buckets 
WHERE id = 'owner-documents';

-- Show count of policies per bucket
SELECT 
  bucket_id,
  COUNT(*) as policy_count
FROM storage.objects
WHERE bucket_id = 'owner-documents'
GROUP BY bucket_id;
