-- HanapBahay Database Schema for Supabase
-- Run this script in your Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (uses UUID to match Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    role TEXT NOT NULL CHECK (role IN ('tenant', 'owner', 'brgy_official')),
    roles TEXT[],
    gender TEXT CHECK (gender IN ('male', 'female')),
    family_type TEXT CHECK (family_type IN ('individual', 'family')),
    barangay TEXT,
    is_owner_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT users_id_unique UNIQUE (id),
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- Tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    id TEXT PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')),
    family_type TEXT CHECK (family_type IN ('individual', 'family')),
    emergency_contact_person TEXT,
    emergency_contact_number TEXT,
    preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owners table
CREATE TABLE IF NOT EXISTS public.owners (
    id TEXT PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    business_name TEXT,
    contact_number TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owner profiles table (legacy support)
CREATE TABLE IF NOT EXISTS public.owner_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    business_name TEXT,
    contact_number TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owner verifications table
CREATE TABLE IF NOT EXISTS public.owner_verifications (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    gov_id_uri TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owner applications table
CREATE TABLE IF NOT EXISTS public.owner_applications (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    house_number TEXT NOT NULL,
    street TEXT NOT NULL,
    barangay TEXT NOT NULL,
    gov_id_uri TEXT,
    documents JSONB,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    reason TEXT,
    created_by UUID NOT NULL,
    reviewed_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reapplication_requested BOOLEAN DEFAULT false,
    reapplication_requested_at TIMESTAMPTZ,
    reapplication_requested_by UUID
);

-- Barangay notifications table
CREATE TABLE IF NOT EXISTS public.brgy_notifications (
    id TEXT PRIMARY KEY,
    barangay TEXT NOT NULL,
    type TEXT NOT NULL,
    owner_application_id TEXT,
    owner_name TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment profiles table
CREATE TABLE IF NOT EXISTS public.payment_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    methods TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment accounts table
CREATE TABLE IF NOT EXISTS public.payment_accounts (
    id TEXT PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('gcash', 'paymaya', 'bank_transfer', 'cash')),
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_details TEXT,
    qr_code_image_uri TEXT,
    qr_code_data TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Published listings table
CREATE TABLE IF NOT EXISTS public.published_listings (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_type TEXT NOT NULL,
    rental_type TEXT NOT NULL,
    address TEXT NOT NULL,
    barangay TEXT,
    rooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    monthly_rent NUMERIC NOT NULL,
    amenities TEXT[],
    rules TEXT[],
    photos TEXT[],
    videos TEXT[],
    cover_photo TEXT,
    security_deposit NUMERIC,
    advance_deposit_months INTEGER,
    payment_methods TEXT[],
    owner_name TEXT NOT NULL,
    business_name TEXT,
    contact_number TEXT NOT NULL,
    email TEXT NOT NULL,
    emergency_contact TEXT,
    availability_status TEXT NOT NULL,
    lease_term TEXT NOT NULL,
    status TEXT DEFAULT 'published',
    published_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT,
    location TEXT,
    description TEXT,
    size INTEGER,
    price NUMERIC,
    owner_user_id UUID,
    capacity INTEGER,
    room_capacities INTEGER[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property photos table
CREATE TABLE IF NOT EXISTS public.property_photos (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    photo_uri TEXT NOT NULL,
    photo_data TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    is_cover_photo BOOLEAN DEFAULT false,
    photos TEXT[],
    videos TEXT[],
    cover_photo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property videos table
CREATE TABLE IF NOT EXISTS public.property_videos (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    video_uri TEXT NOT NULL,
    video_data TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    duration INTEGER,
    thumbnail_uri TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profile photos table
CREATE TABLE IF NOT EXISTS public.user_profile_photos (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    photo_uri TEXT NOT NULL,
    photo_data TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    participant_ids TEXT[],
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ,
    unread_by_owner INTEGER DEFAULT 0,
    unread_by_tenant INTEGER DEFAULT 0,
    last_read_by_owner TIMESTAMPTZ,
    last_read_by_tenant TIMESTAMPTZ,
    property_id TEXT,
    property_title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    read_by TEXT[],
    type TEXT DEFAULT 'message',
    property_id TEXT,
    property_title TEXT,
    image_uri TEXT,
    image_width INTEGER,
    image_height INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_title TEXT NOT NULL,
    property_address TEXT NOT NULL,
    monthly_rent NUMERIC NOT NULL,
    security_deposit NUMERIC,
    advance_deposit_months INTEGER,
    remaining_advance_months INTEGER,
    total_amount NUMERIC NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
    tenant_name TEXT NOT NULL,
    tenant_email TEXT NOT NULL,
    tenant_phone TEXT NOT NULL,
    tenant_address TEXT,
    owner_name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
    special_requests TEXT,
    selected_payment_method TEXT,
    payment_method_details JSONB,
    notes TEXT,
    selected_room INTEGER,
    tenant_type TEXT,
    number_of_people INTEGER,
    notification_viewed_by_tenant BOOLEAN DEFAULT false,
    notification_viewed_at TIMESTAMPTZ,
    termination_initiated_at TIMESTAMPTZ,
    termination_end_date TIMESTAMPTZ,
    termination_mode TEXT,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- Property ratings table
CREATE TABLE IF NOT EXISTS public.property_ratings (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    owner_reply TEXT,
    owner_reply_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal details table (legacy support)
CREATE TABLE IF NOT EXISTS public.personal_details (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User notification states table (for tracking shown notifications)
CREATE TABLE IF NOT EXISTS public.user_notification_states (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    notification_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- User sessions table (for auth session management)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_published_listings_user_id ON public.published_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_published_listings_barangay ON public.published_listings(barangay);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON public.bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON public.bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_conversations_owner_id ON public.conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_property_ratings_property_id ON public.property_ratings(property_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brgy_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for authenticated users for now)
-- You can customize these policies based on your security requirements

CREATE POLICY "Allow all for authenticated users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.tenants FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.owners FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.owner_profiles FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.owner_verifications FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.owner_applications FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.brgy_notifications FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.payment_profiles FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.payment_accounts FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.published_listings FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.property_photos FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.property_videos FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.user_profile_photos FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.conversations FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.messages FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.bookings FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.favorites FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.property_ratings FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.personal_details FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.user_notification_states FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.user_sessions FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'HanapBahay database schema created successfully!';
  RAISE NOTICE 'All tables, indexes, and RLS policies have been set up.';
  RAISE NOTICE 'You can now use the app with full cloud functionality.';
END $$;
