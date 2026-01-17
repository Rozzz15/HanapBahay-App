-- HanapBahay Database - ADD MISSING CONSTRAINTS & TABLES
-- This script safely adds missing constraints and tables without errors

-- =====================================================
-- 1. ADD UNIQUE CONSTRAINTS TO USERS TABLE
-- =====================================================

-- Drop existing constraints if they exist (to recreate them properly)
DO $$ 
BEGIN
    -- Add unique constraint on id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_id_unique' AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_id_unique UNIQUE (id);
        RAISE NOTICE 'Added users_id_unique constraint';
    ELSE
        RAISE NOTICE 'users_id_unique constraint already exists';
    END IF;

    -- Add unique constraint on email if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_unique' AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
        RAISE NOTICE 'Added users_email_unique constraint';
    ELSE
        RAISE NOTICE 'users_email_unique constraint already exists';
    END IF;
END $$;

-- =====================================================
-- 2. CREATE USER_SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_data JSONB,
    roles TEXT[],
    permissions TEXT[],
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_sessions_user_id_unique UNIQUE (user_id)
);

-- =====================================================
-- 3. ENABLE RLS ON NEW TABLE
-- =====================================================

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE POLICIES (ONLY IF THEY DON'T EXIST)
-- =====================================================

DO $$ 
BEGIN
    -- Policy for user_sessions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_sessions' 
        AND policyname = 'Allow all for authenticated users'
    ) THEN
        CREATE POLICY "Allow all for authenticated users" ON public.user_sessions FOR ALL USING (true);
        RAISE NOTICE 'Created policy for user_sessions';
    ELSE
        RAISE NOTICE 'Policy for user_sessions already exists';
    END IF;
END $$;

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;

-- =====================================================
-- 6. CREATE INDEX FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON public.user_sessions(last_active_at);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '====================================================';
  RAISE NOTICE '✅ Database update completed successfully!';
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  ✓ Added unique constraints to users table';
  RAISE NOTICE '  ✓ Created user_sessions table';
  RAISE NOTICE '  ✓ Configured RLS policies';
  RAISE NOTICE '  ✓ Granted permissions';
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Your database is now ready!';
  RAISE NOTICE 'All upsert errors should be fixed.';
  RAISE NOTICE '====================================================';
END $$;
