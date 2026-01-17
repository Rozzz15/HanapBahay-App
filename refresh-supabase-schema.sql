-- Refresh Supabase PostgREST schema cache
-- Run this AFTER adding new columns to force PostgREST to recognize them

-- Method 1: Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Method 2: Also refresh the schema cache manually
SELECT pg_notify('pgrst', 'reload schema');

-- Verify the columns exist in the actual table
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
    AND column_name IN ('rejected_at', 'approved_at', 'cancelled_at', 'completed_at')
ORDER BY column_name;

-- Show current bookings table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;
