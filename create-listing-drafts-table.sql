-- ============================================
-- Create listing_drafts table for HanapBahay
-- ============================================
-- This table stores draft listings that haven't been published yet

-- Create listing_drafts table
CREATE TABLE IF NOT EXISTS public.listing_drafts (
    id TEXT PRIMARY KEY,
    ownerId UUID NOT NULL,
    formData JSONB NOT NULL,
    currentStep INTEGER DEFAULT 1,
    lastSaved TIMESTAMPTZ DEFAULT NOW(),
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key
    CONSTRAINT fk_owner FOREIGN KEY (ownerId) 
        REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_listing_drafts_owner_id 
    ON public.listing_drafts(ownerId);

CREATE INDEX IF NOT EXISTS idx_listing_drafts_last_saved 
    ON public.listing_drafts(lastSaved DESC);

-- Enable RLS
ALTER TABLE public.listing_drafts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (owners can only see their own drafts)
CREATE POLICY "Users can manage their own drafts" 
    ON public.listing_drafts 
    FOR ALL 
    USING (ownerId = auth.uid());

-- Grant permissions
GRANT ALL ON public.listing_drafts TO authenticated;
GRANT ALL ON public.listing_drafts TO service_role;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ listing_drafts Table Created!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Table structure created';
    RAISE NOTICE '✅ Indexes created';
    RAISE NOTICE '✅ RLS policies created';
    RAISE NOTICE '✅ Permissions granted';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Now owners can save listing drafts!';
    RAISE NOTICE '';
END $$;
