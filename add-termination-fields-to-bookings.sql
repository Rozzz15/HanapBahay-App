-- Add termination tracking fields to bookings table
-- Run this in your Supabase SQL Editor

-- Add termination fields if they don't exist
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS termination_initiated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS termination_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS termination_mode TEXT CHECK (termination_mode IN ('countdown', 'immediate'));

-- Add comments for documentation
COMMENT ON COLUMN bookings.termination_initiated_at IS 'When tenant initiated ending rental stay';
COMMENT ON COLUMN bookings.termination_end_date IS 'Calculated end date based on remaining advance months';
COMMENT ON COLUMN bookings.termination_mode IS 'How tenant wants to leave: countdown or immediate';

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings' 
  AND column_name LIKE 'termination%'
ORDER BY column_name;
