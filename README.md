# 📚 HanapBahay - Your Guide

## What You Have Now

✅ **Clean codebase** - Removed 46 old/duplicate MD files  
✅ **Railway PostgreSQL** - Database setup ready (`utils/railway-db.ts`)  
✅ **Supabase Storage** - Image upload ready (`utils/supabase-storage.ts`)  
✅ **Setup guide** - Complete instructions (`SETUP_GUIDE.md`)  

## Quick Start

### 1. Set Up Railway Database (10 min)
Follow: `SETUP_GUIDE.md` → Part 1

### 2. Set Up Supabase Storage (10 min)
Follow: `SETUP_GUIDE.md` → Part 2

### 3. Update Your Code
Replace local storage with cloud:

```typescript
// BEFORE (local only):
import { db } from '@/utils/db';

// AFTER (cloud database):
import { railwayDb as db } from '@/utils/railway-db';
```

For images:

```typescript
import { uploadToSupabase } from '@/utils/supabase-storage';

// Upload image and get URL
const imageUrl = await uploadToSupabase(localImageUri);

// Save URL to database (not the base64!)
await db.upsert('published_listings', listing.id, {
  ...listing,
  coverPhoto: imageUrl, // Supabase URL
  photos: [url1, url2, url3], // Array of Supabase URLs
});
```

## Architecture

```
Your App
  ↓
Railway PostgreSQL → Users, listings, bookings, messages
  ↓
Supabase Storage → Images, videos
  ↓
Railway Backend → PayMongo payments
```

## Files Created

- `utils/railway-db.ts` - Database operations
- `utils/supabase-storage.ts` - File uploads
- `SETUP_GUIDE.md` - Complete setup instructions
- `BUILD_APK_GUIDE.md` - How to build APK
- `README.md` - This file

## Environment Variables

Update your `.env.local`:

```env
# Railway PostgreSQL
DATABASE_URL=postgresql://user:pass@host:port/db

# Supabase Storage
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...

# Railway Backend (already have)
EXPO_PUBLIC_API_URL=https://web-production-e66fb.up.railway.app
```

## Common Tasks

### Upload Image
```typescript
import { uploadToSupabase } from '@/utils/supabase-storage';
const url = await uploadToSupabase(imageUri);
```

### Save to Database
```typescript
import { railwayDb } from '@/utils/railway-db';
await railwayDb.upsert('published_listings', id, data);
```

### Get Data
```typescript
const listings = await railwayDb.list('published_listings');
const user = await railwayDb.get('users', userId);
```

## Next Steps

1. ✅ Follow `SETUP_GUIDE.md`
2. ✅ Add PostgreSQL to Railway
3. ✅ Create Supabase Storage bucket
4. ✅ Update `.env.local` with credentials
5. ✅ Test database connection
6. ✅ Test image upload
7. ✅ Migrate your code to use Railway + Supabase
8. ✅ Build APK (see `BUILD_APK_GUIDE.md`)
9. ✅ Deploy to Play Store!

## Support

- **Setup issues**: Check `SETUP_GUIDE.md`
- **APK build**: Check `BUILD_APK_GUIDE.md`
- **Railway help**: https://docs.railway.app
- **Supabase help**: https://supabase.com/docs

---

**Your app is ready for the cloud!** 🚀
