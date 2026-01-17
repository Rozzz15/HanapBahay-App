-- Force Add Unique Constraints
-- This script will drop and recreate constraints if needed

-- =====================================================
-- 1. CHECK CURRENT CONSTRAINTS
-- =====================================================

DO $$ 
DECLARE
    constraint_count INTEGER;
BEGIN
    -- Check users table constraints
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint 
    WHERE conrelid = 'public.users'::regclass;
    
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Current constraints on users table: %', constraint_count;
    RAISE NOTICE '====================================================';
END $$;

-- =====================================================
-- 2. DROP OLD EMAIL CONSTRAINT (if exists)
-- =====================================================

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_key' AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT users_email_key;
        RAISE NOTICE 'Dropped old users_email_key constraint';
    END IF;
END $$;

-- =====================================================
-- 3. ADD NEW UNIQUE CONSTRAINTS
-- =====================================================

-- Add unique constraint on id
DO $$ 
BEGIN
    -- Drop if exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_id_unique' AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT users_id_unique;
        RAISE NOTICE 'Dropped existing users_id_unique';
    END IF;
    
    -- Add constraint
    ALTER TABLE public.users ADD CONSTRAINT users_id_unique UNIQUE (id);
    RAISE NOTICE '✅ Added users_id_unique constraint';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Could not add users_id_unique: %', SQLERRM;
END $$;

-- Add unique constraint on email
DO $$ 
BEGIN
    -- Drop if exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_unique' AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users DROP CONSTRAINT users_email_unique;
        RAISE NOTICE 'Dropped existing users_email_unique';
    END IF;
    
    -- Add constraint
    ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
    RAISE NOTICE '✅ Added users_email_unique constraint';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Could not add users_email_unique: %', SQLERRM;
END $$;

-- =====================================================
-- 4. VERIFY CONSTRAINTS WERE ADDED
-- =====================================================

DO $$ 
DECLARE
    id_constraint_exists BOOLEAN;
    email_constraint_exists BOOLEAN;
BEGIN
    -- Check if id constraint exists
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_id_unique' AND conrelid = 'public.users'::regclass
    ) INTO id_constraint_exists;
    
    -- Check if email constraint exists
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_unique' AND conrelid = 'public.users'::regclass
    ) INTO email_constraint_exists;
    
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'VERIFICATION RESULTS:';
    RAISE NOTICE '====================================================';
    
    IF id_constraint_exists THEN
        RAISE NOTICE '✅ users_id_unique: EXISTS';
    ELSE
        RAISE NOTICE '❌ users_id_unique: MISSING';
    END IF;
    
    IF email_constraint_exists THEN
        RAISE NOTICE '✅ users_email_unique: EXISTS';
    ELSE
        RAISE NOTICE '❌ users_email_unique: MISSING';
    END IF;
    
    RAISE NOTICE '====================================================';
END $$;

-- =====================================================
-- 5. ENSURE USER_SESSIONS TABLE EXISTS
-- =====================================================

-- Drop and recreate to ensure proper constraints
DROP TABLE IF EXISTS public.user_sessions CASCADE;

CREATE TABLE public.user_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    session_data JSONB,
    roles TEXT[],
    permissions TEXT[],
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.user_sessions;
CREATE POLICY "Allow all for authenticated users" ON public.user_sessions FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;
GRANT USAGE, SELECT ON SEQUENCE user_sessions_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_sessions_id_seq TO service_role;

-- =====================================================
-- 6. FINAL VERIFICATION
-- =====================================================

DO $$ 
DECLARE
    sessions_exists BOOLEAN;
    sessions_unique BOOLEAN;
BEGIN
    -- Check if user_sessions table exists
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'user_sessions'
    ) INTO sessions_exists;
    
    -- Check if unique constraint exists on user_id
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_sessions_user_id_key' AND conrelid = 'public.user_sessions'::regclass
    ) INTO sessions_unique;
    
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'FINAL STATUS:';
    RAISE NOTICE '====================================================';
    
    IF sessions_exists THEN
        RAISE NOTICE '✅ user_sessions table: EXISTS';
    ELSE
        RAISE NOTICE '❌ user_sessions table: MISSING';
    END IF;
    
    IF sessions_unique THEN
        RAISE NOTICE '✅ user_sessions unique constraint: EXISTS';
    ELSE
        RAISE NOTICE '❌ user_sessions unique constraint: MISSING';
    END IF;
    
    RAISE NOTICE '====================================================';
    RAISE NOTICE '🎉 Script completed!';
    RAISE NOTICE '====================================================';
END $$;
