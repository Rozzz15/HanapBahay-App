-- Fix rent_payments table schema - Add missing booking_id column
-- The table currently has "bookingId" (camelCase) but Supabase expects "booking_id" (snake_case)

-- Step 1: Check current columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'rent_payments'
ORDER BY ordinal_position;

-- Step 2: Rename all camelCase columns to snake_case
DO $$
BEGIN
    -- booking_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rent_payments' 
        AND column_name = 'booking_id'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'rent_payments' 
            AND column_name = 'bookingId'
        ) THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "bookingId" TO booking_id;
            RAISE NOTICE '✅ Renamed bookingId to booking_id';
        ELSE
            ALTER TABLE public.rent_payments ADD COLUMN booking_id TEXT;
            RAISE NOTICE '✅ Added booking_id column';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ booking_id column already exists';
    END IF;
    
    -- tenant_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rent_payments' 
        AND column_name = 'tenant_id'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'rent_payments' 
            AND column_name = 'tenantId'
        ) THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "tenantId" TO tenant_id;
            RAISE NOTICE '✅ Renamed tenantId to tenant_id';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ tenant_id column already exists';
    END IF;
    
    -- owner_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'owner_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'ownerId') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "ownerId" TO owner_id;
            RAISE NOTICE '✅ Renamed ownerId to owner_id';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ owner_id column already exists';
    END IF;
    
    -- property_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'property_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'propertyId') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "propertyId" TO property_id;
            RAISE NOTICE '✅ Renamed propertyId to property_id';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ property_id column already exists';
    END IF;
    
    -- late_fee
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'late_fee') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'lateFee') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "lateFee" TO late_fee;
            RAISE NOTICE '✅ Renamed lateFee to late_fee';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ late_fee column already exists';
    END IF;
    
    -- total_amount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'total_amount') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'totalAmount') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "totalAmount" TO total_amount;
            RAISE NOTICE '✅ Renamed totalAmount to total_amount';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ total_amount column already exists';
    END IF;
    
    -- payment_month
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'payment_month') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'paymentMonth') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "paymentMonth" TO payment_month;
            RAISE NOTICE '✅ Renamed paymentMonth to payment_month';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ payment_month column already exists';
    END IF;
    
    -- due_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'due_date') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'dueDate') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "dueDate" TO due_date;
            RAISE NOTICE '✅ Renamed dueDate to due_date';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ due_date column already exists';
    END IF;
    
    -- paid_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'paid_date') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'paidDate') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "paidDate" TO paid_date;
            RAISE NOTICE '✅ Renamed paidDate to paid_date';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ paid_date column already exists';
    END IF;
    
    -- payment_method
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'payment_method') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'paymentMethod') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "paymentMethod" TO payment_method;
            RAISE NOTICE '✅ Renamed paymentMethod to payment_method';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ payment_method column already exists';
    END IF;
    
    -- receipt_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'receipt_number') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'receiptNumber') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "receiptNumber" TO receipt_number;
            RAISE NOTICE '✅ Renamed receiptNumber to receipt_number';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ receipt_number column already exists';
    END IF;
    
    -- owner_payment_account_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'owner_payment_account_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'ownerPaymentAccountId') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "ownerPaymentAccountId" TO owner_payment_account_id;
            RAISE NOTICE '✅ Renamed ownerPaymentAccountId to owner_payment_account_id';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ owner_payment_account_id column already exists';
    END IF;
    
    -- paymongo_payment_intent_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'paymongo_payment_intent_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'paymongoPaymentIntentId') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "paymongoPaymentIntentId" TO paymongo_payment_intent_id;
            RAISE NOTICE '✅ Renamed paymongoPaymentIntentId to paymongo_payment_intent_id';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ paymongo_payment_intent_id column already exists';
    END IF;
    
    -- paymongo_payment_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'paymongo_payment_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'paymongoPaymentId') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "paymongoPaymentId" TO paymongo_payment_id;
            RAISE NOTICE '✅ Renamed paymongoPaymentId to paymongo_payment_id';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ paymongo_payment_id column already exists';
    END IF;
    
    -- paymongo_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'paymongo_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'paymongoStatus') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "paymongoStatus" TO paymongo_status;
            RAISE NOTICE '✅ Renamed paymongoStatus to paymongo_status';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ paymongo_status column already exists';
    END IF;
    
    -- rejected_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'rejected_at') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'rejectedAt') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "rejectedAt" TO rejected_at;
            RAISE NOTICE '✅ Renamed rejectedAt to rejected_at';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ rejected_at column already exists';
    END IF;
    
    -- rejected_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'rejected_by') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'rejectedBy') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "rejectedBy" TO rejected_by;
            RAISE NOTICE '✅ Renamed rejectedBy to rejected_by';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ rejected_by column already exists';
    END IF;
    
    -- original_paid_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'original_paid_date') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'originalPaidDate') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "originalPaidDate" TO original_paid_date;
            RAISE NOTICE '✅ Renamed originalPaidDate to original_paid_date';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ original_paid_date column already exists';
    END IF;
    
    -- original_payment_method
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'original_payment_method') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'originalPaymentMethod') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "originalPaymentMethod" TO original_payment_method;
            RAISE NOTICE '✅ Renamed originalPaymentMethod to original_payment_method';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ original_payment_method column already exists';
    END IF;
    
    -- original_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'original_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'originalStatus') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "originalStatus" TO original_status;
            RAISE NOTICE '✅ Renamed originalStatus to original_status';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ original_status column already exists';
    END IF;
    
    -- created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'created_at') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'createdAt') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "createdAt" TO created_at;
            RAISE NOTICE '✅ Renamed createdAt to created_at';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ created_at column already exists';
    END IF;
    
    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'updated_at') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rent_payments' AND column_name = 'updatedAt') THEN
            ALTER TABLE public.rent_payments RENAME COLUMN "updatedAt" TO updated_at;
            RAISE NOTICE '✅ Renamed updatedAt to updated_at';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ updated_at column already exists';
    END IF;
END $$;

-- Step 3: Recreate indexes with correct column names
DO $$
BEGIN
    -- Drop old indexes (if they exist with old names)
    DROP INDEX IF EXISTS idx_rent_payments_booking_id;
    DROP INDEX IF EXISTS idx_rent_payments_tenant_id;
    DROP INDEX IF EXISTS idx_rent_payments_owner_id;
    DROP INDEX IF EXISTS idx_rent_payments_status;
    DROP INDEX IF EXISTS idx_rent_payments_due_date;
    DROP INDEX IF EXISTS idx_rent_payments_payment_month;
    
    -- Create new indexes with snake_case column names (only if columns exist)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rent_payments' AND column_name = 'booking_id') THEN
        CREATE INDEX IF NOT EXISTS idx_rent_payments_booking_id ON public.rent_payments(booking_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rent_payments' AND column_name = 'tenant_id') THEN
        CREATE INDEX IF NOT EXISTS idx_rent_payments_tenant_id ON public.rent_payments(tenant_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rent_payments' AND column_name = 'owner_id') THEN
        CREATE INDEX IF NOT EXISTS idx_rent_payments_owner_id ON public.rent_payments(owner_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rent_payments' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_rent_payments_status ON public.rent_payments(status);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rent_payments' AND column_name = 'due_date') THEN
        CREATE INDEX IF NOT EXISTS idx_rent_payments_due_date ON public.rent_payments(due_date);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rent_payments' AND column_name = 'payment_month') THEN
        CREATE INDEX IF NOT EXISTS idx_rent_payments_payment_month ON public.rent_payments(payment_month);
    END IF;
    
    RAISE NOTICE '✅ Indexes recreated successfully';
END $$;

-- Step 4: Force Supabase to reload the schema cache
COMMENT ON TABLE public.rent_payments IS 'Rent payments table with snake_case columns';

-- Step 5: Verify the fix
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'rent_payments'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ rent_payments schema fixed successfully!';
    RAISE NOTICE '📋 All columns are now in snake_case format';
    RAISE NOTICE '🔄 Schema cache refreshed';
    RAISE NOTICE '💡 You can now approve bookings without errors!';
END $$;
