-- ============================================
-- Add ALL potentially missing columns to published_listings
-- ============================================
-- Run this to add all columns at once

-- Add rating
ALTER TABLE public.published_listings 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0.00;

-- Add reviews_count
ALTER TABLE public.published_listings 
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- Add inquiries
ALTER TABLE public.published_listings 
ADD COLUMN IF NOT EXISTS inquiries INTEGER DEFAULT 0;

-- Add views
ALTER TABLE public.published_listings 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Verify all columns
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'published_listings'
AND column_name IN ('rating', 'reviews_count', 'inquiries', 'views')
ORDER BY column_name;

-- Success message
SELECT '✅ All missing columns added to published_listings!' as status;
