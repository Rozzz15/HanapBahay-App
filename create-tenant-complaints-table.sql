-- ============================================================================
-- Create tenant_complaints table in Supabase
-- ============================================================================
-- Run this in Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu
-- Location: SQL Editor → New Query → Paste → Run
-- ============================================================================

-- Create tenant_complaints table
CREATE TABLE IF NOT EXISTS public.tenant_complaints (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  property_id TEXT,
  booking_id TEXT,
  complaint_type TEXT,
  description TEXT,
  photos TEXT[],
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE public.tenant_complaints IS 'Stores tenant complaints about properties and bookings';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_tenant_id ON public.tenant_complaints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_property_id ON public.tenant_complaints(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_booking_id ON public.tenant_complaints(booking_id);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_status ON public.tenant_complaints(status);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_created_at ON public.tenant_complaints(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tenant_complaints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Tenants can view their own complaints" ON public.tenant_complaints;
DROP POLICY IF EXISTS "Tenants can create their own complaints" ON public.tenant_complaints;
DROP POLICY IF EXISTS "Tenants can update their own complaints" ON public.tenant_complaints;
DROP POLICY IF EXISTS "Barangay officials can view all complaints" ON public.tenant_complaints;
DROP POLICY IF EXISTS "Barangay officials can update complaint status" ON public.tenant_complaints;

-- RLS Policies

-- 1. Tenants can view their own complaints
CREATE POLICY "Tenants can view their own complaints"
ON public.tenant_complaints
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = tenant_id OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND (users.role = 'brgy_official' OR users.role = 'admin')
  )
);

-- 2. Tenants can create their own complaints
CREATE POLICY "Tenants can create their own complaints"
ON public.tenant_complaints
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = tenant_id);

-- 3. Tenants can update their own pending complaints
CREATE POLICY "Tenants can update their own complaints"
ON public.tenant_complaints
FOR UPDATE
TO authenticated
USING (auth.uid()::text = tenant_id AND status = 'pending')
WITH CHECK (auth.uid()::text = tenant_id);

-- 4. Barangay officials can view all complaints
CREATE POLICY "Barangay officials can view all complaints"
ON public.tenant_complaints
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND (users.role = 'brgy_official' OR users.role = 'admin')
  )
);

-- 5. Barangay officials can update complaint status
CREATE POLICY "Barangay officials can update complaint status"
ON public.tenant_complaints
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND (users.role = 'brgy_official' OR users.role = 'admin')
  )
);

-- Grant permissions
GRANT ALL ON public.tenant_complaints TO authenticated;
GRANT SELECT ON public.tenant_complaints TO anon;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_tenant_complaints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenant_complaints_updated_at ON public.tenant_complaints;

CREATE TRIGGER update_tenant_complaints_updated_at
BEFORE UPDATE ON public.tenant_complaints
FOR EACH ROW
EXECUTE FUNCTION public.update_tenant_complaints_updated_at();

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tenant_complaints'
ORDER BY ordinal_position;

-- ============================================================================
-- Table created successfully!
-- The tenant_complaints error should now be fixed.
-- ============================================================================
