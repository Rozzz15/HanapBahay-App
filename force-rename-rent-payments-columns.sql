-- Force rename rent_payments columns from camelCase to snake_case
-- Simple and direct approach

-- Rename all columns one by one
ALTER TABLE public.rent_payments RENAME COLUMN "bookingId" TO booking_id;
ALTER TABLE public.rent_payments RENAME COLUMN "tenantId" TO tenant_id;
ALTER TABLE public.rent_payments RENAME COLUMN "ownerId" TO owner_id;
ALTER TABLE public.rent_payments RENAME COLUMN "propertyId" TO property_id;
ALTER TABLE public.rent_payments RENAME COLUMN "lateFee" TO late_fee;
ALTER TABLE public.rent_payments RENAME COLUMN "totalAmount" TO total_amount;
ALTER TABLE public.rent_payments RENAME COLUMN "paymentMonth" TO payment_month;
ALTER TABLE public.rent_payments RENAME COLUMN "dueDate" TO due_date;
ALTER TABLE public.rent_payments RENAME COLUMN "paidDate" TO paid_date;
ALTER TABLE public.rent_payments RENAME COLUMN "paymentMethod" TO payment_method;
ALTER TABLE public.rent_payments RENAME COLUMN "receiptNumber" TO receipt_number;
ALTER TABLE public.rent_payments RENAME COLUMN "ownerPaymentAccountId" TO owner_payment_account_id;
ALTER TABLE public.rent_payments RENAME COLUMN "paymongoPaymentIntentId" TO paymongo_payment_intent_id;
ALTER TABLE public.rent_payments RENAME COLUMN "paymongoPaymentId" TO paymongo_payment_id;
ALTER TABLE public.rent_payments RENAME COLUMN "paymongoStatus" TO paymongo_status;
ALTER TABLE public.rent_payments RENAME COLUMN "rejectedAt" TO rejected_at;
ALTER TABLE public.rent_payments RENAME COLUMN "rejectedBy" TO rejected_by;
ALTER TABLE public.rent_payments RENAME COLUMN "originalPaidDate" TO original_paid_date;
ALTER TABLE public.rent_payments RENAME COLUMN "originalPaymentMethod" TO original_payment_method;
ALTER TABLE public.rent_payments RENAME COLUMN "originalStatus" TO original_status;
ALTER TABLE public.rent_payments RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE public.rent_payments RENAME COLUMN "updatedAt" TO updated_at;

-- Recreate indexes
DROP INDEX IF EXISTS idx_rent_payments_booking_id;
DROP INDEX IF EXISTS idx_rent_payments_tenant_id;
DROP INDEX IF EXISTS idx_rent_payments_owner_id;
DROP INDEX IF EXISTS idx_rent_payments_status;
DROP INDEX IF EXISTS idx_rent_payments_due_date;
DROP INDEX IF EXISTS idx_rent_payments_payment_month;

CREATE INDEX idx_rent_payments_booking_id ON public.rent_payments(booking_id);
CREATE INDEX idx_rent_payments_tenant_id ON public.rent_payments(tenant_id);
CREATE INDEX idx_rent_payments_owner_id ON public.rent_payments(owner_id);
CREATE INDEX idx_rent_payments_status ON public.rent_payments(status);
CREATE INDEX idx_rent_payments_due_date ON public.rent_payments(due_date);
CREATE INDEX idx_rent_payments_payment_month ON public.rent_payments(payment_month);

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'rent_payments'
ORDER BY ordinal_position;
