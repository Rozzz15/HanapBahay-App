-- ============================================
-- Add reviews column to published_listings table
-- ============================================

-- Add reviews column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'published_listings' 
        AND column_name = 'reviews'
    ) THEN
        ALTER TABLE public.published_listings 
        ADD COLUMN reviews INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added reviews column';
    ELSE
        RAISE NOTICE '✓ reviews already exists';
    END IF;
END $$;

-- Verify column was added
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'published_listings'
AND column_name = 'reviews';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ reviews Column Added!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Now try creating a listing!';
    RAISE NOTICE '';
END $$;
