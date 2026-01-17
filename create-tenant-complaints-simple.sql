-- ============================================================================
-- Create tenant_complaints table - SIMPLIFIED VERSION
-- ============================================================================
-- Run this step by step in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Create the table (run this first)
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

-- STEP 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_tenant_id ON public.tenant_complaints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_property_id ON public.tenant_complaints(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_status ON public.tenant_complaints(status);

-- STEP 3: Enable RLS
ALTER TABLE public.tenant_complaints ENABLE ROW LEVEL SECURITY;

-- STEP 4: Grant permissions
GRANT ALL ON public.tenant_complaints TO authenticated;
GRANT SELECT ON public.tenant_complaints TO anon;

-- STEP 5: Create a simple policy - Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read complaints"
ON public.tenant_complaints
FOR SELECT
TO authenticated
USING (true);

-- STEP 6: Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert complaints"
ON public.tenant_complaints
FOR INSERT
TO authenticated
WITH CHECK (true);

-- STEP 7: Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update complaints"
ON public.tenant_complaints
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tenant_complaints'
ORDER BY ordinal_position;
