-- Update RLS policies for better profile access
-- Run this if you already have the database set up

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view other profiles for listings" ON profiles;

-- Recreate policies with better permissions
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view other profiles for listings (restaurants visible to farms)
CREATE POLICY "Users can view other profiles for listings" ON profiles
  FOR SELECT USING (true);

-- Also add missing columns if they don't exist
ALTER TABLE listings ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS description TEXT;
