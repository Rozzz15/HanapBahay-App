-- ============================================
-- Add rating column to published_listings table
-- ============================================

-- Add rating column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'published_listings' 
        AND column_name = 'rating'
    ) THEN
        ALTER TABLE public.published_listings 
        ADD COLUMN rating DECIMAL(3, 2) DEFAULT 0.00;
        RAISE NOTICE '✅ Added rating column';
    ELSE
        RAISE NOTICE '✓ rating already exists';
    END IF;
END $$;

-- Add reviews_count column if missing (often used with rating)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'published_listings' 
        AND column_name = 'reviews_count'
    ) THEN
        ALTER TABLE public.published_listings 
        ADD COLUMN reviews_count INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added reviews_count column';
    ELSE
        RAISE NOTICE '✓ reviews_count already exists';
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
AND column_name IN ('rating', 'reviews_count', 'inquiries', 'views');

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Rating Column Added!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ published_listings table updated';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test by creating a new listing';
    RAISE NOTICE '';
END $$;
