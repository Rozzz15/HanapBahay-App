-- ============================================
-- Add barangay_logo column to users table
-- ============================================
-- Run this in Supabase Dashboard > SQL Editor

-- Add barangay_logo column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'barangay_logo'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN barangay_logo TEXT;
        RAISE NOTICE '✅ Added barangay_logo column to users';
    ELSE
        RAISE NOTICE '✓ barangay_logo already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name IN ('barangay_logo', 'barangay', 'role');

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ barangay_logo Column Added!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ users table updated';
    RAISE NOTICE '✅ barangay_logo column available';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test by uploading a barangay logo';
    RAISE NOTICE '';
END $$;
