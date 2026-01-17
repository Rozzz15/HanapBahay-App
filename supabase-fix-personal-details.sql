-- Fix personal_details table to support upsert operations

-- Add unique constraint on user_id for personal_details table
DO $$ 
BEGIN
    -- Check if constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'personal_details_user_id_unique' 
        AND conrelid = 'public.personal_details'::regclass
    ) THEN
        ALTER TABLE public.personal_details 
        ADD CONSTRAINT personal_details_user_id_unique UNIQUE (user_id);
        RAISE NOTICE '✅ Added unique constraint on personal_details.user_id';
    ELSE
        RAISE NOTICE '⚠️ Constraint already exists';
    END IF;
END $$;

-- Add unique constraint on user_id for user_profile_photos table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profile_photos_user_id_unique' 
        AND conrelid = 'public.user_profile_photos'::regclass
    ) THEN
        ALTER TABLE public.user_profile_photos 
        ADD CONSTRAINT user_profile_photos_user_id_unique UNIQUE (user_id);
        RAISE NOTICE '✅ Added unique constraint on user_profile_photos.user_id';
    ELSE
        RAISE NOTICE '⚠️ Constraint already exists';
    END IF;
END $$;

-- Verify constraints
DO $$ 
DECLARE
    details_constraint_exists BOOLEAN;
    photos_constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'personal_details_user_id_unique' 
        AND conrelid = 'public.personal_details'::regclass
    ) INTO details_constraint_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profile_photos_user_id_unique' 
        AND conrelid = 'public.user_profile_photos'::regclass
    ) INTO photos_constraint_exists;
    
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'VERIFICATION:';
    RAISE NOTICE '====================================================';
    
    IF details_constraint_exists THEN
        RAISE NOTICE '✅ personal_details.user_id UNIQUE constraint: EXISTS';
    ELSE
        RAISE NOTICE '❌ personal_details.user_id UNIQUE constraint: MISSING';
    END IF;
    
    IF photos_constraint_exists THEN
        RAISE NOTICE '✅ user_profile_photos.user_id UNIQUE constraint: EXISTS';
    ELSE
        RAISE NOTICE '❌ user_profile_photos.user_id UNIQUE constraint: MISSING';
    END IF;
    
    RAISE NOTICE '====================================================';
END $$;
