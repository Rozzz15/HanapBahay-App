-- ============================================
-- Create rent_payments table for HanapBahay
-- ============================================
-- This table stores all rent payment records for tenants

-- Create rent_payments table
CREATE TABLE IF NOT EXISTS public.rent_payments (
    id TEXT PRIMARY KEY,
    bookingId TEXT NOT NULL,
    tenantId TEXT NOT NULL,  -- Changed to TEXT to match potential tenant IDs
    ownerId UUID NOT NULL,
    propertyId TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    lateFee DECIMAL(10, 2) DEFAULT 0,
    totalAmount DECIMAL(10, 2) NOT NULL,
    paymentMonth TEXT NOT NULL, -- YYYY-MM format
    dueDate TIMESTAMPTZ NOT NULL,
    paidDate TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'partial', 'pending_owner_confirmation', 'rejected')),
    paymentMethod TEXT,
    receiptNumber TEXT NOT NULL,
    notes TEXT,
    ownerPaymentAccountId TEXT,
    
    -- Paymongo integration fields
    paymongoPaymentIntentId TEXT,
    paymongoPaymentId TEXT,
    paymongoStatus TEXT CHECK (paymongoStatus IN ('awaiting_payment_method', 'awaiting_next_action', 'processing', 'succeeded', 'awaiting_payment', 'canceled', 'failed')),
    
    -- Backup fields for restoring rejected payments
    rejectedAt TIMESTAMPTZ,
    rejectedBy UUID,
    originalPaidDate TIMESTAMPTZ,
    originalPaymentMethod TEXT,
    originalStatus TEXT,
    
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign keys (removed tenant FK since tenantId might not always reference users table)
    CONSTRAINT fk_owner FOREIGN KEY (ownerId) 
        REFERENCES public.users(id) ON DELETE CASCADE
    -- Temporarily removed booking and property foreign keys due to type mismatches
    -- Will add them after verifying actual column types in database
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rent_payments_booking_id 
    ON public.rent_payments(bookingId);

CREATE INDEX IF NOT EXISTS idx_rent_payments_tenant_id 
    ON public.rent_payments(tenantId);

CREATE INDEX IF NOT EXISTS idx_rent_payments_owner_id 
    ON public.rent_payments(ownerId);

CREATE INDEX IF NOT EXISTS idx_rent_payments_status 
    ON public.rent_payments(status);

CREATE INDEX IF NOT EXISTS idx_rent_payments_due_date 
    ON public.rent_payments(dueDate);

CREATE INDEX IF NOT EXISTS idx_rent_payments_payment_month 
    ON public.rent_payments(paymentMonth);

-- Create trigger to auto-update updatedAt
CREATE OR REPLACE FUNCTION update_rent_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rent_payments_updated_at_trigger ON public.rent_payments;

CREATE TRIGGER update_rent_payments_updated_at_trigger
    BEFORE UPDATE ON public.rent_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_rent_payments_updated_at();

-- Enable RLS
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow all for authenticated users)
CREATE POLICY "Allow all for authenticated users" 
    ON public.rent_payments 
    FOR ALL 
    USING (true);

-- Grant permissions
GRANT ALL ON public.rent_payments TO authenticated;
GRANT ALL ON public.rent_payments TO service_role;

-- Verify table was created
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'rent_payments'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ rent_payments Table Created!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Table structure created';
    RAISE NOTICE '✅ Indexes created';
    RAISE NOTICE '✅ Auto-update trigger created';
    RAISE NOTICE '✅ RLS policies created';
    RAISE NOTICE '✅ Permissions granted';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test by viewing tenant payment history';
    RAISE NOTICE '';
END $$;
