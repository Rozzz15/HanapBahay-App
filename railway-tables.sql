-- Railway PostgreSQL Tables Setup
-- Run this entire script in Railway

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  name TEXT,
  roles TEXT[] DEFAULT '{}',
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Published listings table
CREATE TABLE IF NOT EXISTS published_listings (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  property_type TEXT,
  rental_type TEXT,
  address TEXT,
  barangay TEXT,
  municipality TEXT,
  province TEXT,
  monthly_rent NUMERIC,
  security_deposit NUMERIC,
  advance_payment NUMERIC,
  cover_photo TEXT,
  photos TEXT[],
  videos TEXT[],
  amenities TEXT[],
  rules TEXT[],
  description TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  floor_area NUMERIC,
  capacity INTEGER,
  occupied_slots INTEGER DEFAULT 0,
  availability_status TEXT DEFAULT 'Available',
  lease_term TEXT,
  owner_name TEXT,
  business_name TEXT,
  contact_number TEXT,
  email TEXT,
  payment_methods TEXT[],
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES users(id),
  tenant_id TEXT REFERENCES users(id),
  property_id TEXT REFERENCES published_listings(id),
  property_title TEXT,
  owner_name TEXT,
  tenant_name TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_by_owner INTEGER DEFAULT 0,
  unread_by_tenant INTEGER DEFAULT 0,
  participant_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id),
  sender_id TEXT REFERENCES users(id),
  text TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  read_by TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES published_listings(id),
  tenant_id TEXT REFERENCES users(id),
  owner_id TEXT REFERENCES users(id),
  property_title TEXT,
  tenant_name TEXT,
  tenant_email TEXT,
  tenant_phone TEXT,
  owner_name TEXT,
  monthly_rent NUMERIC,
  number_of_months INTEGER,
  start_date DATE,
  end_date DATE,
  move_in_date DATE,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  total_amount NUMERIC,
  amount_paid NUMERIC DEFAULT 0,
  security_deposit NUMERIC,
  advance_payment NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  property_id TEXT REFERENCES published_listings(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Property ratings table
CREATE TABLE IF NOT EXISTS property_ratings (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES published_listings(id),
  user_id TEXT REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owner applications table
CREATE TABLE IF NOT EXISTS owner_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  business_name TEXT,
  business_address TEXT,
  business_phone TEXT,
  business_email TEXT,
  id_type TEXT,
  id_number TEXT,
  id_photo_uri TEXT,
  selfie_with_id_uri TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant complaints table
CREATE TABLE IF NOT EXISTS tenant_complaints (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES users(id),
  property_id TEXT REFERENCES published_listings(id),
  booking_id TEXT REFERENCES bookings(id),
  complaint_type TEXT,
  description TEXT,
  photos TEXT[],
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON published_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
