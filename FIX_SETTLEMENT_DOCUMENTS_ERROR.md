# Fix for Settlement Documents Error

## Problem
The application was throwing an error:
```
Could not find the 'settlement_documents' column of 'tenant_complaints' in the schema cache
```

This error occurred because the `tenant_complaints` table was missing several columns that the TypeScript code expected.

## Root Cause
The original `create-tenant-complaints-table.sql` script created a basic table structure, but the application code (in `utils/tenant-complaints.ts` and `app/(brgy)/complaints.tsx`) expects additional columns including:
- `settlement_documents` (array of document URIs)
- `videos` (array of video URIs)
- `category` (complaint category)
- `is_anonymous` (boolean flag)
- `urgency` (urgency level)
- `barangay_notes` (notes from barangay officials)
- `resolved_at` (timestamp)
- `closed_at` (timestamp)

## Solution

### Step 1: Run the SQL Migration Script
1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/dkrctrkqhunttrnkqzsu
2. Go to **SQL Editor** → **New Query**
3. Copy and paste the contents of `fix-tenant-complaints-columns.sql`
4. Click **Run** to execute the migration

### Step 2: Verify the Fix
After running the migration, you should see all the new columns added to the `tenant_complaints` table. The script will:
- ✅ Add all missing columns with appropriate data types
- ✅ Set default values for existing records
- ✅ Create indexes for better query performance
- ✅ Add column comments for documentation

### Step 3: Test the Application
1. Restart your Expo development server if needed
2. Try submitting a complaint as a tenant
3. Try uploading settlement documents as a barangay official
4. Verify that no errors appear in the console

## What Was Fixed

### Missing Columns Added:
- `category` (TEXT) - Complaint category like 'noise_complaint', 'landlord_abuse', etc.
- `videos` (TEXT[]) - Array for video attachments
- `is_anonymous` (BOOLEAN) - Flag for anonymous complaints
- `urgency` (TEXT) - Priority level: 'low', 'medium', 'high', 'urgent'
- `barangay_notes` (TEXT) - Notes from barangay officials
- `settlement_documents` (TEXT[]) - **This was the missing column causing the error**
- `resolved_at` (TIMESTAMPTZ) - Timestamp when resolved
- `closed_at` (TIMESTAMPTZ) - Timestamp when closed

### Backward Compatibility:
The migration script also handles the `complaint_type` field that may have been used in older versions, migrating it to `category` for consistency.

## Files Modified
- Created: `fix-tenant-complaints-columns.sql` - Migration script to add missing columns

## Files Involved (No Changes Needed)
- `utils/tenant-complaints.ts` - Contains the `addSettlementDocuments()` function
- `app/(brgy)/complaints.tsx` - UI for barangay officials to manage complaints
- `types/index.ts` - Defines the `TenantComplaintRecord` interface

## Next Steps
After running the SQL migration:
1. The error should be completely resolved
2. You can now upload settlement documents
3. All complaint features should work as expected

## Troubleshooting
If you still see the error after running the migration:
1. Make sure the SQL script executed successfully (check for any error messages)
2. Refresh your Supabase schema cache: Run `SELECT pg_notify('pgrst', 'reload schema');` in SQL Editor
3. Restart your Expo development server
4. Clear the app cache if needed

## Prevention
To prevent similar issues in the future:
- Keep the database schema in sync with TypeScript type definitions
- Use migration scripts for all schema changes
- Always add indexes for frequently queried columns
