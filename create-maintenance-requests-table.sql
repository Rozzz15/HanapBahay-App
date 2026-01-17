-- ============================================
-- Create maintenance_requests table for HanapBahay
-- ============================================
-- This table stores maintenance requests from tenants

-- Create maintenance_requests table
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
    id TEXT PRIMARY KEY,
    bookingId TEXT NOT NULL,
    tenantId TEXT NOT NULL,
    ownerId UUID NOT NULL,
    propertyId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('plumbing', 'electrical', 'appliance', 'structural', 'cleaning', 'pest_control', 'other')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    
    -- Photos and videos of the issue
    photos TEXT[], -- Array of image URLs
    videos TEXT[], -- Array of video URLs
    
    -- Resolution details
    resolvedAt TIMESTAMPTZ,
    resolvedBy UUID,
    resolutionNotes TEXT,
    resolutionPhotos TEXT[], -- Array of image URLs
    
    -- Cost tracking
    estimatedCost DECIMAL(10, 2),
    actualCost DECIMAL(10, 2),
    
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_owner FOREIGN KEY (ownerId) 
        REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_booking_id 
    ON public.maintenance_requests(bookingId);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant_id 
    ON public.maintenance_requests(tenantId);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_owner_id 
    ON public.maintenance_requests(ownerId);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property_id 
    ON public.maintenance_requests(propertyId);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status 
    ON public.maintenance_requests(status);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_priority 
    ON public.maintenance_requests(priority);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_created_at 
    ON public.maintenance_requests(createdAt DESC);

-- Create trigger to auto-update updatedAt
CREATE OR REPLACE FUNCTION update_maintenance_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_maintenance_requests_updated_at_trigger ON public.maintenance_requests;

CREATE TRIGGER update_maintenance_requests_updated_at_trigger
    BEFORE UPDATE ON public.maintenance_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_requests_updated_at();

-- Enable RLS
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow all for authenticated users)
CREATE POLICY "Allow all for authenticated users" 
    ON public.maintenance_requests 
    FOR ALL 
    USING (true);

-- Grant permissions
GRANT ALL ON public.maintenance_requests TO authenticated;
GRANT ALL ON public.maintenance_requests TO service_role;

-- Verify table was created
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'maintenance_requests'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ maintenance_requests Table Created!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Table structure created';
    RAISE NOTICE '✅ Indexes created';
    RAISE NOTICE '✅ Auto-update trigger created';
    RAISE NOTICE '✅ RLS policies created';
    RAISE NOTICE '✅ Permissions granted';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test by submitting a maintenance request';
    RAISE NOTICE '';
END $$;
