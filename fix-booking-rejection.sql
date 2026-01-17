-- Fix Booking Rejection Error: Add Missing Timestamp Columns
-- This script adds the required timestamp columns to the bookings table
-- and refreshes the Supabase schema cache

-- Step 1: Add missing timestamp columns if they don't exist
DO $$ 
BEGIN
    -- Add approved_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN approved_at TIMESTAMPTZ;
        RAISE NOTICE 'Added approved_at column';
    ELSE
        RAISE NOTICE 'approved_at column already exists';
    END IF;

    -- Add rejected_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'rejected_at'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN rejected_at TIMESTAMPTZ;
        RAISE NOTICE 'Added rejected_at column';
    ELSE
        RAISE NOTICE 'rejected_at column already exists';
    END IF;

    -- Add cancelled_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN cancelled_at TIMESTAMPTZ;
        RAISE NOTICE 'Added cancelled_at column';
    ELSE
        RAISE NOTICE 'cancelled_at column already exists';
    END IF;

    -- Add completed_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN completed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added completed_at column';
    ELSE
        RAISE NOTICE 'completed_at column already exists';
    END IF;

    -- Add is_deleted column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_deleted column';
    ELSE
        RAISE NOTICE 'is_deleted column already exists';
    END IF;

    -- Add deleted_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN deleted_at TIMESTAMPTZ;
        RAISE NOTICE 'Added deleted_at column';
    ELSE
        RAISE NOTICE 'deleted_at column already exists';
    END IF;
END $$;

-- Step 2: Verify all columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'bookings'
    AND column_name IN (
        'approved_at', 'rejected_at', 'cancelled_at', 
        'completed_at', 'deleted_at', 'is_deleted'
    )
ORDER BY column_name;

-- Step 3: Force Supabase to reload the schema cache
-- This is done by making a metadata change
COMMENT ON TABLE public.bookings IS 'Bookings table with status tracking timestamps';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Booking rejection fix completed successfully!';
    RAISE NOTICE '📋 All required timestamp columns have been added';
    RAISE NOTICE '🔄 Schema cache will be refreshed automatically';
    RAISE NOTICE '💡 You can now reject bookings without errors';
END $$;
