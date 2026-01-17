-- ============================================
-- COMPLETE FIX: Add all missing columns to owner_applications
-- ============================================
-- This adds reviewed_at, reviewed_by, and updated_at if missing

-- Add reviewed_at column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'owner_applications' 
        AND column_name = 'reviewed_at'
    ) THEN
        ALTER TABLE public.owner_applications 
        ADD COLUMN reviewed_at TIMESTAMPTZ;
        RAISE NOTICE '✅ Added reviewed_at column';
    ELSE
        RAISE NOTICE '✓ reviewed_at already exists';
    END IF;
END $$;

-- Add reviewed_by column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'owner_applications' 
        AND column_name = 'reviewed_by'
    ) THEN
        ALTER TABLE public.owner_applications 
        ADD COLUMN reviewed_by UUID;
        RAISE NOTICE '✅ Added reviewed_by column';
    ELSE
        RAISE NOTICE '✓ reviewed_by already exists';
    END IF;
END $$;

-- Add updated_at column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'owner_applications' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.owner_applications 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column';
    ELSE
        RAISE NOTICE '✓ updated_at already exists';
    END IF;
END $$;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_owner_applications_updated_at ON public.owner_applications;

CREATE TRIGGER update_owner_applications_updated_at
    BEFORE UPDATE ON public.owner_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify all columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'owner_applications'
AND column_name IN ('reviewed_at', 'reviewed_by', 'updated_at', 'status', 'created_at')
ORDER BY column_name;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ All Missing Columns Added!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ reviewed_at column available';
    RAISE NOTICE '✅ reviewed_by column available';
    RAISE NOTICE '✅ updated_at column available';
    RAISE NOTICE '✅ Auto-update trigger created';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Try approving an owner application now!';
    RAISE NOTICE '';
END $$;
