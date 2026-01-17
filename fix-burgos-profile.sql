-- ============================================================================
-- Fix BURGOS Account - Create User Profile
-- ============================================================================
-- This creates the missing user profile in the public.users table
-- ============================================================================

-- Step 1: Find the BURGOS auth user ID
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'brgy.burgos@hanapbahay.app';

-- Copy the 'id' from the result above and use it in Step 2

-- ============================================================================
-- Step 2: Create the user profile (REPLACE 'USER_ID_HERE' with actual ID)
-- ============================================================================

-- IMPORTANT: Replace 'USER_ID_HERE' with the ID from Step 1
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
  'USER_ID_HERE',  -- ⚠️ REPLACE THIS with the ID from Step 1
  'brgy.burgos@hanapbahay.app',
  'Barangay Burgos Official',
  '+639171234505',
  'Burgos Street, Lopez, Quezon',
  'brgy_official',
  ARRAY['brgy_official'],
  'BURGOS',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  role = EXCLUDED.role,
  roles = EXCLUDED.roles,
  barangay = EXCLUDED.barangay,
  updated_at = NOW();

-- ============================================================================
-- Step 3: Verify both auth and profile exist
-- ============================================================================

SELECT 
  au.id as auth_id,
  au.email as auth_email,
  au.email_confirmed_at,
  u.id as profile_id,
  u.email as profile_email,
  u.name,
  u.role,
  u.barangay,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Profile Exists'
    ELSE '❌ Profile Missing'
  END as profile_status
FROM auth.users au
LEFT JOIN public.users u ON au.id::text = u.id
WHERE au.email = 'brgy.burgos@hanapbahay.app';

-- ============================================================================
-- Expected result: Should show both auth_id and profile_id with data
-- ============================================================================
