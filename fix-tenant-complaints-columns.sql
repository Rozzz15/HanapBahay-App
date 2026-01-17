-- ============================================================================
-- Fix tenant_complaints table - Add missing columns
-- ============================================================================
-- Run this in Supabase SQL Editor to add missing columns
-- Dashboard: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu
-- Location: SQL Editor → New Query → Paste → Run
-- ============================================================================

-- Add missing columns to tenant_complaints table
ALTER TABLE public.tenant_complaints 
  ADD COLUMN IF NOT EXISTS complaint_type TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS barangay_notes TEXT,
  ADD COLUMN IF NOT EXISTS settlement_documents TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Update existing records to have default values for new columns
UPDATE public.tenant_complaints 
SET 
  videos = COALESCE(videos, ARRAY[]::TEXT[]),
  is_anonymous = COALESCE(is_anonymous, false),
  urgency = COALESCE(urgency, 'medium'),
  settlement_documents = COALESCE(settlement_documents, ARRAY[]::TEXT[])
WHERE videos IS NULL OR is_anonymous IS NULL OR urgency IS NULL OR settlement_documents IS NULL;

-- Migrate complaint_type to category if needed (for backward compatibility)
UPDATE public.tenant_complaints 
SET category = COALESCE(category, complaint_type)
WHERE category IS NULL AND complaint_type IS NOT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_category ON public.tenant_complaints(category);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_urgency ON public.tenant_complaints(urgency);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_is_anonymous ON public.tenant_complaints(is_anonymous);

-- Add comments to new columns
COMMENT ON COLUMN public.tenant_complaints.category IS 'Category of the complaint (noise_complaint, landlord_abuse, etc.)';
COMMENT ON COLUMN public.tenant_complaints.videos IS 'Array of video URIs attached to the complaint';
COMMENT ON COLUMN public.tenant_complaints.is_anonymous IS 'Whether the complaint is submitted anonymously';
COMMENT ON COLUMN public.tenant_complaints.urgency IS 'Urgency level: low, medium, high, urgent';
COMMENT ON COLUMN public.tenant_complaints.barangay_notes IS 'Notes added by barangay officials';
COMMENT ON COLUMN public.tenant_complaints.settlement_documents IS 'Array of settlement document URIs uploaded by barangay';
COMMENT ON COLUMN public.tenant_complaints.resolved_at IS 'Timestamp when complaint was resolved';
COMMENT ON COLUMN public.tenant_complaints.closed_at IS 'Timestamp when complaint was closed';

-- Verify the changes
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tenant_complaints'
ORDER BY ordinal_position;

-- ============================================================================
-- Migration completed successfully!
-- The settlement_documents column and other missing fields are now added.
-- ============================================================================
