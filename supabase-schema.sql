-- Plate2Farm Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('restaurant', 'farm')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create listings table
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed')),
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create claims table
CREATE TABLE claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view other profiles for listings (restaurants visible to farms)
CREATE POLICY "Users can view other profiles for listings" ON profiles
  FOR SELECT USING (true);

-- Create policies for listings table
CREATE POLICY "Restaurants can manage their listings" ON listings
  FOR ALL USING (auth.uid() = restaurant_id);

CREATE POLICY "Everyone can view available listings" ON listings
  FOR SELECT USING (status = 'available');

-- Create policies for claims table
CREATE POLICY "Farms can create claims" ON claims
  FOR INSERT WITH CHECK (auth.uid() = farm_id);

CREATE POLICY "Users can view claims for their listings/claims" ON claims
  FOR SELECT USING (
    auth.uid() = farm_id OR 
    auth.uid() IN (SELECT restaurant_id FROM listings WHERE id = listing_id)
  );

-- Create indexes for better performance
CREATE INDEX idx_listings_restaurant_id ON listings(restaurant_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_expires_at ON listings(expires_at);
CREATE INDEX idx_claims_listing_id ON claims(listing_id);
CREATE INDEX idx_claims_farm_id ON claims(farm_id);

-- Insert some sample data for testing (optional)
-- You can uncomment these after creating your first users

-- Sample restaurant profile (replace with actual user ID after registration)
-- INSERT INTO profiles (id, email, name, role) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'restaurant@example.com', 'Sample Restaurant', 'restaurant');

-- Sample farm profile (replace with actual user ID after registration)
-- INSERT INTO profiles (id, email, name, role) VALUES 
-- ('00000000-0000-0000-0000-000000000002', 'farm@example.com', 'Sample Farm', 'farm');

-- Sample listing (uncomment after creating restaurant user)
-- INSERT INTO listings (restaurant_id, item_name, quantity, expires_at) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'Fresh Salad Mix', '10 portions', NOW() + INTERVAL '2 hours');
