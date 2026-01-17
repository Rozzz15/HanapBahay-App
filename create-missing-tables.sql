-- ============================================
-- Create Missing Tables for HanapBahay
-- ============================================
-- This creates listing_inquiries and any other missing tables

-- Create listing_inquiries table
CREATE TABLE IF NOT EXISTS public.listing_inquiries (
    id TEXT PRIMARY KEY,
    listingId TEXT NOT NULL,
    tenantId UUID NOT NULL,  -- Changed from TEXT to UUID to match users.id
    inquiryType TEXT NOT NULL CHECK (inquiryType IN ('message', 'booking_request', 'contact')),
    source TEXT DEFAULT 'unknown',
    message TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign keys (if tables exist)
    CONSTRAINT fk_listing FOREIGN KEY (listingId) 
        REFERENCES public.published_listings(id) ON DELETE CASCADE,
    CONSTRAINT fk_tenant FOREIGN KEY (tenantId) 
        REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_listing_id 
    ON public.listing_inquiries(listingId);

CREATE INDEX IF NOT EXISTS idx_listing_inquiries_tenant_id 
    ON public.listing_inquiries(tenantId);

CREATE INDEX IF NOT EXISTS idx_listing_inquiries_created_at 
    ON public.listing_inquiries(createdAt DESC);

-- Enable RLS
ALTER TABLE public.listing_inquiries ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow all for authenticated users)
CREATE POLICY "Allow all for authenticated users" 
    ON public.listing_inquiries 
    FOR ALL 
    USING (true);

-- Grant permissions
GRANT ALL ON public.listing_inquiries TO authenticated;
GRANT ALL ON public.listing_inquiries TO service_role;

-- Verify table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'listing_inquiries'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ listing_inquiries Table Created!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Table structure created';
    RAISE NOTICE '✅ Indexes created';
    RAISE NOTICE '✅ RLS policies created';
    RAISE NOTICE '✅ Permissions granted';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test by viewing owner applications or reports';
    RAISE NOTICE '';
END $$;
