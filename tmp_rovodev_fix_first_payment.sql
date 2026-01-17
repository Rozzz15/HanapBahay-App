-- Fix the first payment to include advance deposit
-- January should be 20000 (rent 10000 + advance 10000)
-- February should stay 10000 (rent only)

-- First, let's see what we have
SELECT 
  id,
  payment_month,
  amount,
  status,
  notes
FROM rent_payments 
WHERE booking_id = 'booking_1768598816928_8b9nob'
ORDER BY payment_month;

-- Update January payment to include advance deposit
UPDATE rent_payments 
SET 
  amount = 20000.00,
  total_amount = 20000.00,
  notes = 'First payment (includes advance deposit) - before tenant added to owner''s list',
  receipt_number = 'INITIAL-' || EXTRACT(EPOCH FROM NOW())::bigint || '-' || substr(md5(random()::text), 1, 9),
  updated_at = NOW()
WHERE booking_id = 'booking_1768598816928_8b9nob'
  AND payment_month = '2026-01';

-- Verify the fix
SELECT 
  id,
  payment_month,
  amount,
  total_amount,
  status,
  notes,
  receipt_number
FROM rent_payments 
WHERE booking_id = 'booking_1768598816928_8b9nob'
ORDER BY payment_month;
