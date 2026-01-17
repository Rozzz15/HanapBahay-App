-- ============================================================================
-- Add Read Status to Tenant Complaints Table
-- ============================================================================
-- Run this in Supabase SQL Editor to add read status tracking
-- Dashboard: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu
-- Location: SQL Editor → New Query → Paste → Run
-- ============================================================================

-- Add read status column
ALTER TABLE public.tenant_complaints 
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS read_by UUID REFERENCES auth.users(id);

-- Set existing complaints as unread by default
UPDATE public.tenant_complaints 
SET is_read = false
WHERE is_read IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_is_read ON public.tenant_complaints(is_read);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_read_by ON public.tenant_complaints(read_by);

-- Add comments to new columns
COMMENT ON COLUMN public.tenant_complaints.is_read IS 'Whether the complaint has been read by barangay officials';
COMMENT ON COLUMN public.tenant_complaints.read_at IS 'Timestamp when complaint was first read by barangay';
COMMENT ON COLUMN public.tenant_complaints.read_by IS 'User ID of barangay official who first read the complaint';

-- Refresh the schema cache to make columns immediately available
NOTIFY pgrst, 'reload schema';

-- Verify the changes
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tenant_complaints'
  AND column_name IN ('is_read', 'read_at', 'read_by')
ORDER BY ordinal_position;

-- ============================================================================
-- Migration completed successfully!
-- The is_read, read_at, and read_by columns are now added.
-- ============================================================================
