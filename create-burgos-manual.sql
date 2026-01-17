-- ============================================================================
-- Create BURGOS Barangay Official Account Manually
-- ============================================================================
-- This bypasses the email rate limit by creating the user directly in the database
-- Run this in Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu
-- ============================================================================

-- STEP 1: Insert into auth.users table
-- Note: You need to use Supabase Service Role key for this, or use the dashboard

-- For now, we'll create just the users table entry
-- The auth user will need to be created via Dashboard UI

-- First, let's check if BURGOS already exists
SELECT id, email, name, role, barangay 
FROM public.users 
WHERE email = 'brgy.burgos@hanapbahay.app';

-- If not exists, you'll need to:
-- 1. Create the auth user via Supabase Dashboard (Authentication → Users → Add User)
-- 2. Then run this SQL to create the profile

-- ============================================================================
-- ALTERNATIVE: Create via Dashboard UI
-- ============================================================================
-- Since the API has rate limits, the easiest way is:
-- 
-- 1. Go to: Authentication → Users → "Add User" button
-- 2. Fill in:
--    Email: brgy.burgos@hanapbahay.app
--    Password: burgos123
--    Auto Confirm User: ✅ CHECK THIS
--    User Metadata (JSON):
--    {
--      "name": "Barangay Burgos Official",
--      "role": "brgy_official",
--      "phone": "+639171234505"
--    }
-- 
-- 3. Click "Create user"
-- 4. Copy the user ID that was created
-- 5. Run this SQL below (replace USER_ID with the actual UUID):

-- ============================================================================
-- STEP 2: Insert user profile (run after creating auth user)
-- ============================================================================
-- Replace 'PASTE_USER_ID_HERE' with the actual user ID from step 1

/*
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
  'PASTE_USER_ID_HERE',  -- Replace with actual user ID from auth.users
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
*/

-- ============================================================================
-- STEP 3: Verify the account was created
-- ============================================================================

SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.barangay,
  u.phone,
  au.email_confirmed_at,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '❌ Not Confirmed'
  END as email_status
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id::text
WHERE u.email = 'brgy.burgos@hanapbahay.app';

-- ============================================================================
-- After creation, login credentials will be:
-- Email:    brgy.burgos@hanapbahay.app
-- Password: burgos123
-- ============================================================================
