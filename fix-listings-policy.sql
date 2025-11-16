-- Fix RLS policy to allow viewing claimed listings
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Everyone can view available listings" ON listings;

-- Create new policies that allow viewing both available and claimed listings
CREATE POLICY "Everyone can view available listings" ON listings
  FOR SELECT USING (status = 'available');

CREATE POLICY "Users can view claimed listings" ON listings
  FOR SELECT USING (
    status = 'claimed' AND (
      auth.uid() = restaurant_id OR 
      auth.uid() IN (SELECT farm_id FROM claims WHERE listing_id = id)
    )
  );

-- Alternative: Single policy for all listings (simpler approach)
-- Uncomment this if you prefer one policy instead of two:
-- DROP POLICY IF EXISTS "Everyone can view available listings" ON listings;
-- DROP POLICY IF EXISTS "Users can view claimed listings" ON listings;
-- CREATE POLICY "Users can view listings" ON listings
--   FOR SELECT USING (
--     status = 'available' OR 
--     (status = 'claimed' AND (
--       auth.uid() = restaurant_id OR 
--       auth.uid() IN (SELECT farm_id FROM claims WHERE listing_id = id)
--     ))
--   );
