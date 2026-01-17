# ⚡ Quick Start: Cloud Storage Migration

## 🚀 3-Step Setup

### 1️⃣ Configure Supabase
```bash
# Create .env file
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2️⃣ Run Database Migration
- Open Supabase Dashboard → SQL Editor
- Copy & run: `supabase/migrations/001_cloud_storage_schema.sql`

### 3️⃣ Choose Migration Method
```bash
# Interactive wizard (recommended)
node scripts/migrate-to-cloud.js

# Or manually update imports:
# import { ... } from './utils/auth-user-cloud';
# import { ... } from './utils/property-media-cache-cloud';
```

---

## 📁 What You Got

| File | Purpose |
|------|---------|
| `utils/cloud-storage.ts` | Main cloud storage API |
| `utils/auth-user-cloud.ts` | Drop-in replacement for auth-user.ts |
| `utils/property-media-cache-cloud.ts` | Drop-in replacement for property-media-cache.ts |
| `utils/storage-migration.ts` | Migration utilities |
| `supabase/migrations/001_cloud_storage_schema.sql` | Database schema |
| `scripts/migrate-to-cloud.js` | Interactive migration wizard |
| `app/test-cloud-storage.tsx` | In-app testing screen |

---

## 🎯 Common Tasks

### Test Migration
```typescript
import { migrateToCloudStorage, verifyMigration } from './utils/storage-migration';

const result = await migrateToCloudStorage();
const verification = await verifyMigration();
```

### Store User Session
```typescript
import { storeAuthUser, getAuthUser } from './utils/auth-user-cloud';

await storeAuthUser({ id, roles, permissions, name, email });
const user = await getAuthUser();
```

### Cache Property Media
```typescript
import { cachePropertyMedia, getCachedPropertyMedia } from './utils/property-media-cache-cloud';

await cachePropertyMedia(listingId, { coverPhoto, photos, videos });
const media = await getCachedPropertyMedia(listingId);
```

### Upload Files
```typescript
import { uploadToCloudStorage } from './utils/cloud-storage';

const url = await uploadToCloudStorage('property-media', 'path/file.jpg', fileData, 'image/jpeg');
```

---

## 🐛 Quick Troubleshooting

| Error | Solution |
|-------|----------|
| "No active session" | User must be logged in |
| "Table does not exist" | Run database migration SQL |
| "RLS policy violation" | Check Supabase RLS policies |
| Network errors | Verify .env credentials |

---

## 📚 Full Documentation

- **Complete Guide:** `CLOUD_STORAGE_MIGRATION_GUIDE.md`
- **Summary:** `CLOUD_STORAGE_SUMMARY.md`
- **Test:** `node scripts/test-cloud-storage.js`

---

**Need help?** See `CLOUD_STORAGE_MIGRATION_GUIDE.md` for detailed instructions.
