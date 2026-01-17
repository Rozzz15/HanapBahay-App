-- ============================================
-- Add missing columns to published_listings table
-- ============================================

-- Add inquiries column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'published_listings' 
        AND column_name = 'inquiries'
    ) THEN
        ALTER TABLE public.published_listings 
        ADD COLUMN inquiries INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added inquiries column';
    ELSE
        RAISE NOTICE '✓ inquiries already exists';
    END IF;
END $$;

-- Add views column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'published_listings' 
        AND column_name = 'views'
    ) THEN
        ALTER TABLE public.published_listings 
        ADD COLUMN views INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added views column';
    ELSE
        RAISE NOTICE '✓ views already exists';
    END IF;
END $$;

-- Verify columns were added
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'published_listings'
AND column_name IN ('inquiries', 'views');

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Missing Columns Added!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ published_listings table updated';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test by creating a new listing';
    RAISE NOTICE '';
END $$;
