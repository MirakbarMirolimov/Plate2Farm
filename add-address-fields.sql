-- Add address fields to profiles table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude);

-- Update existing profiles to have default Baltimore-DC area locations if needed
-- (This is optional - you can remove this section if you want users to add addresses manually)

-- Sample update for existing profiles (optional)
-- UPDATE profiles SET 
--   address = '123 Main St',
--   city = 'Baltimore', 
--   state = 'MD',
--   zip_code = '21201',
--   latitude = 39.2904,
--   longitude = -76.6122
-- WHERE address IS NULL AND role = 'restaurant';

-- UPDATE profiles SET 
--   address = '456 Farm Rd',
--   city = 'Washington', 
--   state = 'DC',
--   zip_code = '20001',
--   latitude = 38.9072,
--   longitude = -77.0369
-- WHERE address IS NULL AND role = 'farm';
