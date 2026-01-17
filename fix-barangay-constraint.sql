-- ============================================================================
-- Fix Barangay Constraint - Add BURGOS
-- ============================================================================
-- The database constraint doesn't include BURGOS yet
-- This will update it to match the app's barangay list
-- ============================================================================

-- Step 1: Check current constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname LIKE '%barangay%';

-- Step 2: Drop the old constraint
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_barangay_check;

-- Step 3: Add new constraint with BURGOS included
ALTER TABLE public.users 
ADD CONSTRAINT users_barangay_check 
CHECK (barangay IN ('RIZAL', 'TALOLONG', 'GOMEZ', 'MAGSAYSAY', 'BURGOS', 'LOPEZ'));

-- Step 4: Verify the new constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_barangay_check';

-- ============================================================================
-- Now retry creating the BURGOS user profile
-- ============================================================================

-- Get the BURGOS auth user ID
SELECT 
  id,
  email
FROM auth.users
WHERE email = 'brgy.burgos@hanapbahay.app';

-- Create BURGOS profile (replace USER_ID with the ID from above)
INSERT INTO public.users (
  id,
  email,
  name,
  phone,
  address,
  role,
  roles,
  barangay,
  created_at,
  updated_at
) VALUES (
  '31c63008-ab70-47b9-a508-95629aca7ceb',  -- Use the actual ID from the error message
  'brgy.burgos@hanapbahay.app',
  'Barangay Burgos Official',
  '+639171234505',
  'Burgos Street, Lopez, Quezon',
  'brgy_official',
  ARRAY['brgy_official'],
  'BURGOS',
  NOW(),
  NOW()
);

-- Verify it was created
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.barangay,
  au.email_confirmed_at
FROM public.users u
JOIN auth.users au ON au.id::text = u.id
WHERE u.email = 'brgy.burgos@hanapbahay.app';

-- ============================================================================
-- All done! BURGOS account should now work.
-- ============================================================================
