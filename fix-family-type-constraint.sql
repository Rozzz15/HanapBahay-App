-- Fix family_type constraint to allow all tenant types
-- Run this in your Supabase SQL Editor

-- Drop the old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_family_type_check;

-- Add new constraint with all four values
ALTER TABLE users ADD CONSTRAINT users_family_type_check 
  CHECK (family_type IN ('individual', 'couple', 'family', 'group'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'users_family_type_check';
