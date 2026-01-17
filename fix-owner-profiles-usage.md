# Fix owner_profiles Table Usage

## Issue
The `owner_profiles` table uses `user_id` as the primary key, not `id`.

## Files That Need Fixing
All files that call:
- `db.get('owner_profiles', userId)` - Works if userId is passed correctly
- `db.upsert('owner_profiles', userId, data)` - Works if userId is passed correctly

The `db` utility functions expect the second parameter to match the primary key column.

Since the primary key is `user_id`, the code should work as long as we're passing the user's ID.

## Quick Check
If you're still getting errors, the issue is likely:
1. The data being upserted includes an `id` field that doesn't exist
2. The query is trying to SELECT by `id` column

Let me check the actual usage...
