# Cloud Storage Migration Guide

This guide explains how to migrate from AsyncStorage/localStorage to Supabase cloud storage in the HanapBahay app.

## 📋 Overview

The app has been updated to use **Supabase cloud storage** instead of local storage (AsyncStorage/localStorage) for:

1. **User Sessions** - Authentication and user data
2. **Property Media Cache** - Cached images and videos
3. **User Preferences** - App settings and preferences
4. **Media Files** - Uploaded images and videos in Supabase Storage buckets

## 🎯 Benefits of Cloud Storage

✅ **Data Persistence** - Data is stored in the cloud and accessible from any device  
✅ **Better Performance** - Reduced local storage usage and better caching  
✅ **Synchronization** - Automatic sync across devices  
✅ **Scalability** - No local storage limits  
✅ **Security** - Built-in Row Level Security (RLS) policies  
✅ **Backup** - Automatic backups by Supabase  

## 📦 What Was Changed

### 1. New Supabase Schema
**File:** `supabase/migrations/001_cloud_storage_schema.sql`

Creates these tables:
- `user_sessions` - Stores user session data (replaces `auth_user` AsyncStorage key)
- `property_media_cache` - Stores property media cache (replaces `property_media_cache` AsyncStorage key)
- `user_preferences` - Stores user settings and preferences

Creates these storage buckets:
- `property-media` - For property listing media files
- `profile-photos` - For user profile photos
- `media-cache` - For temporary cached media

### 2. New Utilities

**`utils/cloud-storage.ts`** - Main cloud storage utility
- `storeCloudAuthUser()` / `getCloudAuthUser()` / `clearCloudAuthSession()`
- `cacheCloudPropertyMedia()` / `getCachedCloudPropertyMedia()` / `removeCachedCloudPropertyMedia()`
- `storeUserPreferences()` / `getUserPreferences()`
- `uploadToCloudStorage()` / `deleteFromCloudStorage()` / `getCloudStorageUrl()`

**`utils/auth-user-cloud.ts`** - Drop-in replacement for `auth-user.ts`
- Same API as original but uses Supabase instead of AsyncStorage

**`utils/property-media-cache-cloud.ts`** - Drop-in replacement for `property-media-cache.ts`
- Same API as original but uses Supabase instead of AsyncStorage

**`utils/storage-migration.ts`** - Migration utility
- `migrateToCloudStorage()` - Migrate all data from local to cloud
- `verifyMigration()` - Verify migration success
- `rollbackMigration()` - Rollback if needed
- `cleanupLocalStorage()` - Clean up after migration

## 🚀 Migration Steps

### Step 1: Set Up Supabase (If Not Already Done)

1. Create a Supabase project at https://supabase.com
2. Get your credentials from Settings → API
3. Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 2: Run Database Migration

Run the SQL migration in your Supabase project:

**Option A: Using Supabase Dashboard**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/001_cloud_storage_schema.sql`
4. Paste and run the SQL script

**Option B: Using Supabase CLI**
```bash
supabase db push
```

### Step 3: Choose Migration Approach

You have two options:

#### Option A: Gradual Migration (Recommended for Production)

Keep both old and new storage systems running simultaneously. Users migrate automatically on next login.

**Implementation:**
1. Don't change import paths yet
2. Add migration trigger in `AuthContext.tsx` after successful login
3. Migrate users gradually

```typescript
// In AuthContext.tsx, after successful login:
import { migrateToCloudStorage } from '../utils/storage-migration';

// After user logs in successfully
const migrationResult = await migrateToCloudStorage();
if (migrationResult.success) {
  console.log('✅ Data migrated to cloud');
}
```

#### Option B: Immediate Migration (Recommended for Development)

Replace all storage utilities at once.

**Implementation:**
1. Replace imports across the app:

```typescript
// OLD imports
import { storeAuthUser, getAuthUser, clearAuthSession } from './utils/auth-user';
import { cachePropertyMedia, getCachedPropertyMedia } from './utils/property-media-cache';

// NEW imports
import { storeAuthUser, getAuthUser, clearAuthSession } from './utils/auth-user-cloud';
import { cachePropertyMedia, getCachedPropertyMedia } from './utils/property-media-cache-cloud';
```

2. Or rename files to replace the old ones:
```bash
# Backup old files
mv utils/auth-user.ts utils/auth-user-local-backup.ts
mv utils/property-media-cache.ts utils/property-media-cache-local-backup.ts

# Use cloud versions
cp utils/auth-user-cloud.ts utils/auth-user.ts
cp utils/property-media-cache-cloud.ts utils/property-media-cache.ts
```

### Step 4: Test the Migration

1. **Test authentication:**
```typescript
import { storeAuthUser, getAuthUser } from './utils/auth-user-cloud';

// Store user
await storeAuthUser({
  id: 'user-123',
  roles: ['tenant'],
  permissions: ['view_properties'],
  name: 'Test User',
  email: 'test@example.com'
});

// Retrieve user
const user = await getAuthUser();
console.log('Retrieved user:', user);
```

2. **Test media cache:**
```typescript
import { cachePropertyMedia, getCachedPropertyMedia } from './utils/property-media-cache-cloud';

// Cache media
await cachePropertyMedia('listing-123', {
  coverPhoto: 'https://example.com/photo.jpg',
  photos: ['https://example.com/photo1.jpg'],
  videos: []
});

// Retrieve cache
const media = await getCachedPropertyMedia('listing-123');
console.log('Retrieved media:', media);
```

3. **Verify migration:**
```typescript
import { verifyMigration } from './utils/storage-migration';

const result = await verifyMigration();
console.log('Migration verified:', result);
```

### Step 5: Clean Up (Optional)

After successful migration and testing, clean up local storage:

```typescript
import { cleanupLocalStorage } from './utils/storage-migration';

// Clean up but keep auth tokens
await cleanupLocalStorage({ keepAuthTokens: true });
```

## 🔧 API Reference

### Cloud Storage Functions

#### Auth User Management
```typescript
// Store user session
await storeAuthUser(user: AuthUser): Promise<void>

// Get current user session
const user = await getAuthUser(): Promise<AuthUser | null>

// Clear user session
await clearAuthSession(): Promise<void>
```

#### Property Media Cache
```typescript
// Cache property media
await cachePropertyMedia(listingId: string, media: PropertyMedia, userId?: string): Promise<void>

// Get cached media
const media = await getCachedPropertyMedia(listingId: string): Promise<PropertyMedia | null>

// Remove cached media
await removeCachedPropertyMedia(listingId: string): Promise<void>

// Clear all cache
await clearAllCachedPropertyMedia(): Promise<void>

// Clear expired cache
await clearExpiredCachedPropertyMedia(): Promise<void>
```

#### User Preferences
```typescript
// Store preferences
await storeUserPreferences(preferences: UserPreferences): Promise<void>

// Get preferences
const prefs = await getUserPreferences(): Promise<UserPreferences | null>
```

#### File Storage
```typescript
// Upload file
const url = await uploadToCloudStorage(
  bucket: 'property-media' | 'profile-photos' | 'media-cache',
  filePath: string,
  fileData: Blob | File | ArrayBuffer,
  contentType?: string
): Promise<string | null>

// Delete file
await deleteFromCloudStorage(
  bucket: 'property-media' | 'profile-photos' | 'media-cache',
  filePath: string
): Promise<boolean>

// Get public URL
const url = getCloudStorageUrl(
  bucket: 'property-media' | 'profile-photos' | 'media-cache',
  filePath: string
): string
```

### Migration Functions

```typescript
// Migrate all data to cloud
const result = await migrateToCloudStorage(): Promise<MigrationResult>

// Verify migration
const verification = await verifyMigration(): Promise<VerificationResult>

// Rollback migration
await rollbackMigration(): Promise<void>

// Clean up local storage
await cleanupLocalStorage(options?: { keepAuthTokens?: boolean }): Promise<void>
```

## 🔒 Security Considerations

1. **Row Level Security (RLS)** - All tables have RLS enabled
2. **User-specific data** - Users can only access their own data
3. **Public media** - Property media is publicly accessible (as intended)
4. **Auth tokens** - Managed securely by Supabase Auth

## 🐛 Troubleshooting

### Migration fails with "No active session"
**Solution:** Ensure user is logged in before migrating
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  console.log('User must be logged in to migrate');
}
```

### "Table does not exist" error
**Solution:** Run the database migration SQL script first

### Cache not persisting
**Solution:** Check Supabase credentials and RLS policies

### Storage upload fails
**Solution:** Verify storage bucket policies and authentication

## 📝 Migration Checklist

- [ ] Supabase project created
- [ ] Environment variables configured (`.env` file)
- [ ] Database migration SQL executed
- [ ] Storage buckets created
- [ ] Choose migration approach (gradual or immediate)
- [ ] Update imports (if using immediate migration)
- [ ] Test authentication flow
- [ ] Test media caching
- [ ] Test file uploads
- [ ] Verify migration success
- [ ] Monitor for errors
- [ ] Clean up local storage (optional)
- [ ] Remove old backup files (after confirming everything works)

## 🎉 Next Steps

After successful migration:

1. **Monitor performance** - Check Supabase dashboard for usage
2. **Set up automated cache cleanup** - Use pg_cron if available
3. **Implement backup strategy** - Supabase handles this automatically
4. **Update documentation** - Document any app-specific changes
5. **Train team** - Ensure everyone knows about the new system

## 📞 Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Review RLS policies
3. Verify environment variables
4. Check network connectivity
5. See TROUBLESHOOTING.md for common issues

---

**Note:** Keep the old storage utilities (`auth-user.ts`, `property-media-cache.ts`) as backups until you're confident the cloud migration is stable.
