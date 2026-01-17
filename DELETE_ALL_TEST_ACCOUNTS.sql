-- ============================================
-- DELETE ALL TEST ACCOUNTS FROM SUPABASE
-- ============================================
-- CAUTION: This will delete ALL user data!
-- Only use in development/testing environment
-- ============================================

-- Step 1: Delete from child tables first (to avoid foreign key constraints)

-- Delete all personal details
DELETE FROM public.personal_details;

-- Delete all tenant profiles
DELETE FROM public.tenants;

-- Delete all owner profiles
DELETE FROM public.owners;
DELETE FROM public.owner_profiles;

-- Delete all owner applications and verifications
DELETE FROM public.owner_applications;
DELETE FROM public.owner_verifications;

-- Delete all barangay notifications
DELETE FROM public.brgy_notifications;

-- Delete all bookings
DELETE FROM public.bookings;

-- Delete all messages and conversations
DELETE FROM public.messages;
DELETE FROM public.conversations;

-- Delete all favorites
DELETE FROM public.favorites;

-- Delete all property ratings
DELETE FROM public.property_ratings;

-- Delete all property media
DELETE FROM public.property_photos;
DELETE FROM public.property_videos;

-- Delete all published listings
DELETE FROM public.published_listings;

-- Delete all payment profiles and accounts
DELETE FROM public.payment_profiles;
DELETE FROM public.payment_accounts;

-- Delete all user profile photos
DELETE FROM public.user_profile_photos;

-- Delete all user sessions
DELETE FROM public.user_sessions;

-- Delete all user notification states
DELETE FROM public.user_notification_states;

-- Step 2: Delete from users table (main table)
DELETE FROM public.users;

-- Step 3: Delete from Supabase Auth (this removes authentication records)
-- Note: This requires admin privileges
-- You may need to delete auth users from Supabase Dashboard → Authentication → Users

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All test accounts deleted successfully!';
  RAISE NOTICE '📊 All user data, listings, bookings, and messages removed.';
  RAISE NOTICE '⚠️  Remember to also delete users from Authentication tab in Supabase Dashboard!';
  RAISE NOTICE '🔗 Go to: https://supabase.com/dashboard → Your Project → Authentication → Users';
END $$;
