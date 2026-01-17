-- Add missing timestamp columns to bookings table
-- These columns track when bookings change status

-- Add approved_at column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN approved_at TIMESTAMPTZ;
        COMMENT ON COLUMN bookings.approved_at IS 'Timestamp when booking was approved by owner';
    END IF;
END $$;

-- Add rejected_at column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'rejected_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN rejected_at TIMESTAMPTZ;
        COMMENT ON COLUMN bookings.rejected_at IS 'Timestamp when booking was rejected by owner';
    END IF;
END $$;

-- Add cancelled_at column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN cancelled_at TIMESTAMPTZ;
        COMMENT ON COLUMN bookings.cancelled_at IS 'Timestamp when booking was cancelled by tenant';
    END IF;
END $$;

-- Add completed_at column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN completed_at TIMESTAMPTZ;
        COMMENT ON COLUMN bookings.completed_at IS 'Timestamp when booking was completed';
    END IF;
END $$;

-- Add deleted_at column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN deleted_at TIMESTAMPTZ;
        COMMENT ON COLUMN bookings.deleted_at IS 'Timestamp when booking was soft-deleted';
    END IF;
END $$;

-- Add is_deleted column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE bookings ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN bookings.is_deleted IS 'Flag to mark booking as deleted';
    END IF;
END $$;

-- Add notification_viewed_by_tenant column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'notification_viewed_by_tenant'
    ) THEN
        ALTER TABLE bookings ADD COLUMN notification_viewed_by_tenant BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN bookings.notification_viewed_by_tenant IS 'Track if tenant has viewed booking status notification';
    END IF;
END $$;

-- Add notification_viewed_at column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'notification_viewed_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN notification_viewed_at TIMESTAMPTZ;
        COMMENT ON COLUMN bookings.notification_viewed_at IS 'Timestamp when tenant viewed notification';
    END IF;
END $$;

-- Add termination tracking columns (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'termination_initiated_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN termination_initiated_at TIMESTAMPTZ;
        COMMENT ON COLUMN bookings.termination_initiated_at IS 'When tenant initiated ending rental stay';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'termination_end_date'
    ) THEN
        ALTER TABLE bookings ADD COLUMN termination_end_date TEXT;
        COMMENT ON COLUMN bookings.termination_end_date IS 'Calculated end date based on remaining advance months';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'termination_mode'
    ) THEN
        ALTER TABLE bookings ADD COLUMN termination_mode TEXT;
        COMMENT ON COLUMN bookings.termination_mode IS 'How tenant wants to leave: countdown or immediate';
    END IF;
END $$;

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
    AND column_name IN (
        'approved_at', 'rejected_at', 'cancelled_at', 'completed_at', 
        'deleted_at', 'is_deleted', 'notification_viewed_by_tenant',
        'notification_viewed_at', 'termination_initiated_at', 
        'termination_end_date', 'termination_mode'
    )
ORDER BY column_name;
