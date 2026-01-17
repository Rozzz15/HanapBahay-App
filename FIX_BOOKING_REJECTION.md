# Fix Booking Rejection Error - Step by Step Guide

## Problem
The booking rejection function is failing with this error:
```
Error upserting to bookings: {"code": "PGRST204", "details": null, "hint": null, 
"message": "Could not find the 'rejected_at' column of 'bookings' in the schema cache"}
```

## Root Cause
The `bookings` table is missing required timestamp columns (`rejected_at`, `approved_at`, etc.) in your Supabase database. While the schema file (`supabase-schema.sql`) has these columns defined, they haven't been applied to your actual database yet.

## Solution - Apply the Migration

### Option 1: Using Supabase Dashboard (RECOMMENDED)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your HanapBahay project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Fix Script**
   - Open the file: `fix-booking-rejection.sql`
   - Copy ALL the content
   - Paste it into the SQL Editor
   - Click "RUN" button

4. **Verify the Fix**
   - You should see success messages in the output
   - Check that all 6 columns were added:
     - `approved_at`
     - `rejected_at`
     - `cancelled_at`
     - `completed_at`
     - `deleted_at`
     - `is_deleted`

5. **Test the Rejection**
   - Go to your app (Owner Dashboard)
   - Try rejecting a booking request
   - It should now work without errors! ✅

### Option 2: Using Command Line (Alternative)

If you have the Supabase CLI installed:

```bash
# Navigate to the project directory
cd Desktop/hanapbahay

# Run the migration
npx supabase db execute --file fix-booking-rejection.sql
```

## What the Fix Does

The `fix-booking-rejection.sql` script:

1. ✅ Adds missing timestamp columns to track booking status changes
2. ✅ Checks if columns already exist (safe to run multiple times)
3. ✅ Forces Supabase to refresh its schema cache
4. ✅ Verifies all columns were added correctly

## Testing After Fix

1. **Login as Owner**
2. **Go to Bookings or Dashboard**
3. **Find a pending booking**
4. **Click "Reject" button**
5. **Verify**:
   - No error messages appear
   - Booking status changes to "Rejected"
   - Tenant is notified (if notifications are enabled)

## Technical Details

### Columns Added

| Column | Type | Purpose |
|--------|------|---------|
| `approved_at` | TIMESTAMPTZ | Timestamp when booking was approved |
| `rejected_at` | TIMESTAMPTZ | Timestamp when booking was rejected |
| `cancelled_at` | TIMESTAMPTZ | Timestamp when booking was cancelled by tenant |
| `completed_at` | TIMESTAMPTZ | Timestamp when booking was completed |
| `deleted_at` | TIMESTAMPTZ | Timestamp when booking was soft-deleted |
| `is_deleted` | BOOLEAN | Flag to mark booking as deleted (for soft deletes) |

### Code Location

The rejection logic is in:
- **File**: `utils/booking.ts`
- **Function**: `updateBookingStatus()` (line 286-338)
- **Used in**: 
  - `app/(owner)/dashboard.tsx` (line 639)
  - `app/(owner)/bookings.tsx` (lines 146, 203)

## Troubleshooting

### If You Still Get Errors After Running the Script

1. **Check if columns were actually added**:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'bookings' 
   AND column_name LIKE '%_at';
   ```

2. **Manually refresh schema cache**:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. **Restart your app**:
   - Close and reopen the app
   - Or refresh the browser (Ctrl+F5)

4. **Check Supabase project URL**:
   - Make sure your app is connecting to the correct Supabase project
   - Check `.env` or environment variables

### Still Not Working?

If the issue persists:
1. Check the Supabase logs for errors
2. Verify your database connection
3. Make sure you're running the script on the correct database/project

## Prevention

To prevent similar issues in the future:
- Always run migration scripts when updating the schema
- Keep `supabase-schema.sql` in sync with your database
- Test schema changes in development before deploying

## Related Files

- `add-booking-timestamp-columns.sql` - Original migration script (more detailed)
- `supabase-schema.sql` - Complete database schema
- `utils/booking.ts` - Booking management logic
- `app/(owner)/bookings.tsx` - Owner bookings UI

---

**Status**: Ready to apply ✅  
**Estimated Time**: 2-3 minutes  
**Risk Level**: Low (safe to run, checks for existing columns)
