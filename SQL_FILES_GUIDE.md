# 📁 SQL Files Organization Guide

## 🎯 ACTIVE FIXES (Use These)

### **Security Fixes (Apply to Supabase)**
- ✅ **`fix-cleanup-expired-cache-search-path.sql`** - Fixes cleanup_expired_cache() function security
- ✅ **`fix-update-updated-at-function.sql`** - Fixes update_updated_at_column() function security

### **Core Schema**
- 📋 **`supabase-schema.sql`** - Main database schema (all tables)
- 🗂️ **`supabase/migrations/001_cloud_storage_schema.sql`** - Cloud storage migration (UPDATED with fixes)

### **Storage Setup**
- 💾 **`supabase-storage-setup.sql`** - Storage buckets setup
- 🔒 **`supabase-storage-policies.sql`** - Storage bucket policies

---

## 🛠️ UTILITY SCRIPTS (Keep for reference)

### **Data Fixes**
- `add-all-missing-columns.sql` - Adds missing columns to tables
- `add-barangay-logo-column.sql` - Adds barangay logo column
- `add-booking-timestamp-columns.sql` - Adds booking timestamps
- `add-complaint-read-status.sql` - Adds complaint read status
- `add-missing-published-listings-columns.sql` - Adds missing listing columns
- `add-rating-column.sql` - Adds rating column
- `add-reviews-column.sql` - Adds reviews column
- `add-termination-fields-to-bookings.sql` - Adds termination fields

### **Constraint Fixes**
- `fix-barangay-constraint.sql` - Fixes barangay constraints
- `fix-family-type-constraint.sql` - Fixes family type constraints
- `supabase-fix-constraints-force.sql` - Forces constraint fixes
- `supabase-update-constraints.sql` - Updates constraints

### **Data Management**
- `fix-phone-numbers.sql` - Fixes phone number format
- `fix-rent-payments-schema.sql` - Fixes rent payments schema
- `fix-tenant-complaints-columns.sql` - Fixes tenant complaints columns
- `fix-zero-monthly-rent.sql` - Fixes zero monthly rent issues
- `force-rename-rent-payments-columns.sql` - Renames rent payment columns

### **User Management**
- `confirm-emails.sql` - Confirms user emails
- `set-passwords.sql` - Sets user passwords
- `set-remaining-passwords.sql` - Sets remaining passwords
- `DELETE_ALL_TEST_ACCOUNTS.sql` - Deletes test accounts

### **Barangay Setup**
- `create-burgos-manual.sql` - Creates Burgos barangay account
- `fix-burgos-profile.sql` - Fixes Burgos profile
- `verify-burgos-email.sql` - Verifies Burgos email
- `fix-booking-rejection.sql` - Fixes booking rejection

### **Table Creation**
- `complete-table-fix.sql` - Complete table fix
- `create-listing-drafts-table.sql` - Creates listing drafts table
- `create-maintenance-requests-table.sql` - Creates maintenance requests
- `create-missing-tables.sql` - Creates missing tables
- `create-rent-payments-table.sql` - Creates rent payments table
- `create-tenant-complaints-simple.sql` - Creates complaints (simple)
- `create-tenant-complaints-table.sql` - Creates complaints (full)

### **Miscellaneous**
- `refresh-supabase-schema.sql` - Refreshes schema
- `railway-tables.sql` - Railway deployment tables
- `setup-owner-documents-bucket.sql` - Sets up owner documents storage
- `supabase-add-tenant-id.sql` - Adds tenant ID
- `supabase-fix-personal-details.sql` - Fixes personal details

---

## 🗑️ FILES DELETED (Failed Attempts)

These files were removed during cleanup:
- ❌ `fix-all-rls-policies-*.sql` (All RLS fix attempts - didn't work)
- ❌ `fix-supabase-warnings-*.sql` (All warning fix attempts - superseded)
- ❌ `test-warnings-fixed.sql` (Test file)
- ❌ `check-*.sql` (Check scripts)
- ❌ `tmp_rovodev_*.sql` (Temporary files)

---

## 📝 HOW TO USE THIS GUIDE

### **For Fresh Supabase Setup:**
1. Run `supabase-schema.sql` (creates all tables)
2. Run `supabase-storage-setup.sql` (creates storage buckets)
3. Run `supabase-storage-policies.sql` (sets up storage policies)
4. Run `supabase/migrations/001_cloud_storage_schema.sql` (cloud storage)
5. Run the security fixes:
   - `fix-cleanup-expired-cache-search-path.sql`
   - `fix-update-updated-at-function.sql`

### **For Existing Database:**
1. Apply only the security fixes:
   - `fix-cleanup-expired-cache-search-path.sql`
   - `fix-update-updated-at-function.sql`
2. Apply any specific data fixes you need from the utility scripts

### **For Adding Missing Columns/Tables:**
- Review the `add-*.sql` and `create-*.sql` files
- Apply only what's missing in your database

---

## ⚠️ IMPORTANT NOTES

1. **Always backup your database before running SQL scripts!**
2. **Test scripts on a development database first**
3. **The security fixes are critical - apply them immediately**
4. **Keep this guide updated when you add new SQL files**

---

## 📊 FILE COUNT

- **Total SQL files**: 45
- **Active fixes**: 2
- **Core schema files**: 4
- **Utility scripts**: 39
- **Deleted files**: 17

---

**Last Updated**: 2026-01-18
**Cleaned by**: Rovo Dev
