-- Add id column to tenants table
-- This fixes the "column tenants.id does not exist" error

DO $$ 
BEGIN
    -- Check if id column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'id'
    ) THEN
        -- Add id column as TEXT to match other tables
        ALTER TABLE public.tenants ADD COLUMN id TEXT;
        
        -- Set id = user_id for existing records
        UPDATE public.tenants SET id = user_id::TEXT WHERE id IS NULL;
        
        -- Make it NOT NULL
        ALTER TABLE public.tenants ALTER COLUMN id SET NOT NULL;
        
        -- Add unique constraint
        ALTER TABLE public.tenants ADD CONSTRAINT tenants_id_unique UNIQUE (id);
        
        RAISE NOTICE '✅ Added id column to tenants table';
    ELSE
        RAISE NOTICE '⚠️  id column already exists in tenants table';
    END IF;
    
    -- Also check owners table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'owners' 
        AND column_name = 'id'
    ) THEN
        -- Add id column to owners table too
        ALTER TABLE public.owners ADD COLUMN id TEXT;
        UPDATE public.owners SET id = user_id::TEXT WHERE id IS NULL;
        ALTER TABLE public.owners ALTER COLUMN id SET NOT NULL;
        ALTER TABLE public.owners ADD CONSTRAINT owners_id_unique UNIQUE (id);
        
        RAISE NOTICE '✅ Added id column to owners table';
    ELSE
        RAISE NOTICE '⚠️  id column already exists in owners table';
    END IF;
    
    RAISE NOTICE '====================================================';
    RAISE NOTICE '✅ Tenant and Owner tables updated successfully!';
    RAISE NOTICE '====================================================';
END $$;
