# 🚀 Complete Setup: Railway PostgreSQL + Supabase Storage

## Overview

Your app will use:
- **Railway**: PostgreSQL database (users, listings, bookings, messages)
- **Railway**: Backend server (PayMongo payments) - Already deployed ✅
- **Supabase**: File storage (images, videos)

## Part 1: Add PostgreSQL to Railway (10 minutes)

### Step 1: Add PostgreSQL Service

1. Go to: https://railway.app
2. Open your existing project (the one with your backend)
3. Click: **"+ New"** → **"Database"** → **"Add PostgreSQL"**
4. Wait for it to provision (2-3 minutes)

### Step 2: Get Database Credentials

1. Click on your **PostgreSQL** service
2. Go to: **"Connect"** tab
3. Copy these values:
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`
   - Or just copy `DATABASE_URL` (easier!)

### Step 3: Install PostgreSQL Client

In your project root:

```bash
npm install pg
```

### Step 4: Create Tables

1. In Railway dashboard → PostgreSQL service
2. Click: **"Data"** tab → **"Query"**
3. Paste and run this SQL:

```sql
-- Users table
CREATE TABLE users (
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
CREATE TABLE published_listings (
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
  room_capacities INTEGER[],
  room_availability INTEGER[],
  availability_status TEXT DEFAULT 'Available',
  lease_term TEXT,
  owner_name TEXT,
  business_name TEXT,
  contact_number TEXT,
  email TEXT,
  emergency_contact TEXT,
  payment_methods TEXT[],
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
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
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id),
  sender_id TEXT REFERENCES users(id),
  text TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  read_by TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
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
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  payment_confirmed_at TIMESTAMPTZ,
  termination_initiated_at TIMESTAMPTZ,
  termination_mode TEXT,
  termination_remaining_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  property_id TEXT REFERENCES published_listings(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Property ratings table
CREATE TABLE property_ratings (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES published_listings(id),
  user_id TEXT REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owner applications table
CREATE TABLE owner_applications (
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
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant complaints table
CREATE TABLE tenant_complaints (
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

-- Create indexes for better performance
CREATE INDEX idx_listings_user_id ON published_listings(user_id);
CREATE INDEX idx_listings_status ON published_listings(availability_status);
CREATE INDEX idx_conversations_owner ON conversations(owner_id);
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX idx_bookings_owner ON bookings(owner_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_ratings_property ON property_ratings(property_id);
```

## Part 2: Set Up Supabase Storage (10 minutes)

### Step 1: Create Supabase Account

1. Go to: https://supabase.com
2. Sign up (free)
3. Create new project
4. Wait for setup (2-3 minutes)

### Step 2: Create Storage Bucket

1. In Supabase dashboard → **"Storage"**
2. Click: **"Create bucket"**
3. Name: `property-images`
4. **Public bucket**: ✅ Yes (so images can be viewed)
5. Click: **"Create bucket"**

### Step 3: Get Supabase Credentials

1. Go to: **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

### Step 4: Update .env.local

Add to your `.env.local`:

```env
# Railway PostgreSQL
DATABASE_URL=postgresql://user:pass@host:port/db

# Supabase Storage (for images/videos only)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...

# Railway Backend (already have this)
EXPO_PUBLIC_API_URL=https://web-production-e66fb.up.railway.app
```

## Part 3: Use the Database & Storage (I'll create this for you)

The code is simple - I'll create:

1. **`utils/railway-db.ts`** - Railway PostgreSQL wrapper
2. **`utils/supabase-storage.ts`** - Supabase file upload helper

## Testing

### Test Railway Database:

```typescript
import { railwayDb } from '@/utils/railway-db';

const testDb = async () => {
  // Save user
  await railwayDb.upsert('users', 'user123', {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['tenant']
  });
  
  // Get all users
  const users = await railwayDb.list('users');
  console.log('Users in Railway:', users);
};
```

### Test Supabase Storage:

```typescript
import { uploadToSupabase } from '@/utils/supabase-storage';

const testUpload = async () => {
  const imageUri = 'file:///path/to/image.jpg';
  const url = await uploadToSupabase(imageUri, 'property-images', 'test.jpg');
  console.log('Image uploaded to:', url);
};
```

## Benefits

✅ **Railway PostgreSQL**:
- All app data (users, listings, bookings)
- Free 512MB
- Fast queries
- Same place as your backend

✅ **Supabase Storage**:
- All images/videos
- Free 1GB
- CDN delivery (fast)
- Public URLs for images

## Architecture

```
Your App:
  ↓
Railway PostgreSQL → Store data (text, numbers)
  ↓
Supabase Storage → Store files (images, videos)
  ↓
Railway Backend → Process payments (PayMongo)
```

## File Structure

After setup, you'll have:
- `utils/railway-db.ts` - Database operations
- `utils/supabase-storage.ts` - File uploads
- `.env.local` - Both credentials

## Next Steps

1. ✅ Add PostgreSQL to Railway
2. ✅ Run SQL to create tables
3. ✅ Set up Supabase Storage
4. ✅ Update .env.local
5. ✅ I'll create the helper files
6. ✅ Test both services
7. ✅ Deploy!

---

**Simple, clean, and everything you need!** 🚀
