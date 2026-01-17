# Fix Booking Approval Error - Schema Mismatch

## Problem
When owner tries to approve a booking request, it shows these errors:
```
Error upserting to rent_payments: {"code": "PGRST204", "details": null, "hint": null, 
"message": "Could not find the 'booking_id' column of 'rent_payments' in the schema cache"}

Error creating initial payment for approved booking: ...
Failed to upsert to rent_payments: ...
```

## Root Cause
The `rent_payments` table was created with **camelCase** column names (`bookingId`, `tenantId`, etc.) but Supabase's PostgREST expects **snake_case** column names (`booking_id`, `tenant_id`, etc.).

This is the same issue we fixed earlier with the `bookings` table!

## Solution - Apply Schema Fix

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your **HanapBahay** project
3. Click **"SQL Editor"** in the left sidebar

### Step 2: Run the Fix Script
1. Open the file: `fix-rent-payments-schema.sql`
2. **Copy ALL the content** (entire file)
3. **Paste** into Supabase SQL Editor
4. Click **"RUN"** button
5. Wait for success messages ✅

### Step 3: Verify the Fix
You should see messages like:
```
✅ Renamed bookingId to booking_id
✅ Renamed tenantId to tenant_id
✅ Renamed ownerId to owner_id
... (and many more)
✅ rent_payments schema fixed successfully!
📋 All columns are now in snake_case format
🔄 Schema cache refreshed
💡 You can now approve bookings without errors!
```

### Step 4: Test Booking Approval
1. **Restart your app** completely
2. **Login as Owner**
3. **Go to Dashboard or Bookings**
4. **Find a pending booking**
5. **Click "Approve"** button
6. **Verify**: 
   - ✅ No error messages
   - ✅ Booking status changes to "Approved"
   - ✅ Initial payment is created
   - ✅ Tenant is notified

## What This Fix Does

### Column Name Changes (camelCase → snake_case):
| Before (camelCase) | After (snake_case) |
|-------------------|-------------------|
| `bookingId` | `booking_id` |
| `tenantId` | `tenant_id` |
| `ownerId` | `owner_id` |
| `propertyId` | `property_id` |
| `lateFee` | `late_fee` |
| `totalAmount` | `total_amount` |
| `paymentMonth` | `payment_month` |
| `dueDate` | `due_date` |
| `paidDate` | `paid_date` |
| `paymentMethod` | `payment_method` |
| `receiptNumber` | `receipt_number` |
| `ownerPaymentAccountId` | `owner_payment_account_id` |
| `paymongoPaymentIntentId` | `paymongo_payment_intent_id` |
| `paymongoPaymentId` | `paymongo_payment_id` |
| `paymongoStatus` | `paymongo_status` |
| `rejectedAt` | `rejected_at` |
| `rejectedBy` | `rejected_by` |
| `originalPaidDate` | `original_paid_date` |
| `originalPaymentMethod` | `original_payment_method` |
| `originalStatus` | `original_status` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

### Additional Actions:
1. ✅ Recreates indexes with correct column names
2. ✅ Refreshes Supabase schema cache
3. ✅ Preserves all existing data (no data loss)

## Technical Details

### Why This Happens
- Supabase uses **PostgreSQL** which is case-sensitive with quoted identifiers
- PostgREST (Supabase's REST API) expects **snake_case** for consistency
- The `create-rent-payments-table.sql` file used camelCase
- This causes a mismatch when inserting data

### Where Payments Are Created
- **File**: `utils/booking.ts`
- **Function**: `createInitialPaymentForApprovedBooking()` (line 559-683)
- **Trigger**: When owner approves a booking
- **Purpose**: Creates first payment record (includes advance deposit if any)

## Troubleshooting

### If You Still Get Errors After Running Script

1. **Check if columns were renamed**:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'rent_payments' 
   ORDER BY column_name;
   ```

2. **Manually refresh schema cache**:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. **Restart your app**:
   - Close completely and reopen
   - Or force refresh (Ctrl+Shift+R)

4. **Check Supabase logs**:
   - Go to Supabase Dashboard → Database → Logs
   - Look for any errors related to rent_payments

### Still Not Working?

If the issue persists:
1. Check the Supabase project URL in your `.env` file
2. Verify you're running the script on the correct database
3. Check if there are any foreign key constraints blocking the rename
4. Try recreating the table from scratch using `create-rent-payments-table.sql` (but use snake_case)

## Prevention

To prevent similar issues in the future:

1. **Always use snake_case** for PostgreSQL/Supabase column names
2. **Test schema changes** in development before production
3. **Keep naming conventions consistent** across all tables
4. **Review SQL files** before running them

## Related Files

- `fix-rent-payments-schema.sql` - This migration script
- `create-rent-payments-table.sql` - Original table creation (has camelCase)
- `utils/booking.ts` - Booking approval logic
- `supabase-schema.sql` - Complete database schema

## Summary of All Fixes Today

| # | Issue | Status | Solution |
|---|-------|--------|----------|
| 1 | Booking Rejection Error | ✅ FIXED | Added missing timestamp columns |
| 2 | Phone Number "+63" | ✅ FIXED | Phone validation |
| 3 | Tenant Info - Address | ✅ FIXED | Load from users table |
| 4 | Tenant Info - Remove Type | ✅ FIXED | Removed field |
| 5 | Emergency Contacts | ✅ FIXED | Conditional display |
| 6 | Bookings Count = 0 | ✅ FIXED | Fixed owner_id filter |
| 7 | Inquiries Icon | ✅ FIXED | Removed from UI |
| 8 | **Booking Approval Error** | ⏳ **PENDING** | Run fix-rent-payments-schema.sql |

---

**Status**: Ready to apply ✅  
**Estimated Time**: 2-3 minutes  
**Risk Level**: Low (renames columns, preserves data)  
**Next Step**: Run `fix-rent-payments-schema.sql` in Supabase SQL Editor
