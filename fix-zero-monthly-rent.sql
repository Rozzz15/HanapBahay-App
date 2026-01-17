-- Fix existing listings that have 0 monthly_rent
-- This script updates listings where monthly_rent is 0 but price field might have the correct value

-- Check current state
SELECT id, title, monthly_rent, price, "monthlyRent"
FROM published_listings
WHERE monthly_rent = 0 OR monthly_rent IS NULL;

-- If price field has the value, copy it to monthly_rent
UPDATE published_listings
SET monthly_rent = price
WHERE (monthly_rent = 0 OR monthly_rent IS NULL) 
  AND price > 0;

-- If monthlyRent (camelCase) field has the value, copy it to monthly_rent
UPDATE published_listings
SET monthly_rent = "monthlyRent"
WHERE (monthly_rent = 0 OR monthly_rent IS NULL) 
  AND "monthlyRent" > 0;

-- Verify the fix
SELECT id, title, monthly_rent, price, "monthlyRent"
FROM published_listings
WHERE monthly_rent = 0 OR monthly_rent IS NULL;

-- Show all listings with their monthly rent
SELECT 
  id, 
  title, 
  monthly_rent, 
  price,
  property_type as "propertyType",
  barangay,
  created_at
FROM published_listings
ORDER BY created_at DESC
LIMIT 10;
