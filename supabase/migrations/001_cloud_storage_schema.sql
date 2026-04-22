-- =====================================================
-- HanapBahay Cloud Storage Migration Schema
-- Replaces AsyncStorage/localStorage with Supabase
-- =====================================================

-- =====================================================
-- 1. USER SESSIONS TABLE (replaces auth_user AsyncStorage)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_data JSONB NOT NULL DEFAULT '{}',
  roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON user_sessions(last_active_at);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 2. PROPERTY MEDIA CACHE TABLE (replaces property_media_cache AsyncStorage)
-- =====================================================
CREATE TABLE IF NOT EXISTS property_media_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_photo TEXT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  videos TEXT[] DEFAULT ARRAY[]::TEXT[],
  cache_timestamp TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_property_media_cache_listing ON property_media_cache(listing_id);
CREATE INDEX IF NOT EXISTS idx_property_media_cache_user ON property_media_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_property_media_cache_expires ON property_media_cache(expires_at);

-- Enable RLS
ALTER TABLE property_media_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies - allow users to cache any property they view
CREATE POLICY "Users can view all cached media" ON property_media_cache
  FOR SELECT USING (true);

CREATE POLICY "Users can insert cache for any listing" ON property_media_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cache" ON property_media_cache
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cache" ON property_media_cache
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 3. USER PREFERENCES TABLE (replaces various settings keys)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{}',
  theme TEXT DEFAULT 'system',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 4. STORAGE BUCKETS FOR MEDIA FILES
-- =====================================================

-- Create storage bucket for property media (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-media', 'property-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for user profile photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for cached media (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-cache', 'media-cache', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. STORAGE POLICIES
-- =====================================================

-- Property Media Bucket Policies
CREATE POLICY "Anyone can view property media" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-media');

CREATE POLICY "Authenticated users can upload property media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-media' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own property media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own property media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Profile Photos Bucket Policies
CREATE POLICY "Anyone can view profile photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own profile photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own profile photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own profile photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Media Cache Bucket Policies
CREATE POLICY "Users can view own cached media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'media-cache' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload to media cache" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media-cache' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own cached media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media-cache' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- 6. FUNCTIONS FOR CACHE CLEANUP
-- =====================================================

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  DELETE FROM public.property_media_cache
  WHERE expires_at < NOW();
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_media_cache_updated_at
  BEFORE UPDATE ON property_media_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. SCHEDULED JOB FOR CACHE CLEANUP (Optional - requires pg_cron extension)
-- =====================================================
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('cleanup-expired-cache', '0 * * * *', 'SELECT cleanup_expired_cache();');

COMMENT ON TABLE user_sessions IS 'Stores user session data (replaces auth_user AsyncStorage)';
COMMENT ON TABLE property_media_cache IS 'Stores property media cache metadata (replaces property_media_cache AsyncStorage)';
COMMENT ON TABLE user_preferences IS 'Stores user preferences and settings';
COMMENT ON FUNCTION cleanup_expired_cache() IS 'Cleans up expired cache entries automatically';
