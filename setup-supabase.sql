-- =====================================================
-- Plate2Farm complete Supabase setup (idempotent)
-- Project: uetrldftyotnmkbqeyxo
-- =====================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('restaurant', 'farm')),
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed')),
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id)
);

-- Ensure optional columns exist if tables were partially created earlier
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS description TEXT;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_listings_restaurant_id ON public.listings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_expires_at ON public.listings(expires_at);
CREATE INDEX IF NOT EXISTS idx_claims_listing_id ON public.claims(listing_id);
CREATE INDEX IF NOT EXISTS idx_claims_farm_id ON public.claims(farm_id);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Fix infinite recursion between listings and claims RLS policies
-- Error: 42P17 infinite recursion detected in policy for relation "listings"

-- SECURITY DEFINER helpers bypass RLS when checking ownership/claims
CREATE OR REPLACE FUNCTION public.is_listing_owner(listing_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = listing_uuid
      AND l.restaurant_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_claim_on_listing(listing_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.claims c
    WHERE c.listing_id = listing_uuid
      AND c.farm_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_farm_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'farm'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_listing_owner(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.user_has_claim_on_listing(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_farm_user() TO authenticated, anon;

-- Recreate listings policies without recursive subqueries
DROP POLICY IF EXISTS "Users can view listings" ON public.listings;
DROP POLICY IF EXISTS "Everyone can view available listings" ON public.listings;
DROP POLICY IF EXISTS "Users can view claimed listings" ON public.listings;
DROP POLICY IF EXISTS "Restaurants can manage their listings" ON public.listings;
DROP POLICY IF EXISTS "Authenticated users can insert listings" ON public.listings;
DROP POLICY IF EXISTS "Owners can update listings" ON public.listings;
DROP POLICY IF EXISTS "Owners can delete listings" ON public.listings;
DROP POLICY IF EXISTS "Farms can update claimed status" ON public.listings;

CREATE POLICY "listings_select"
  ON public.listings
  FOR SELECT
  USING (
    status = 'available'
    OR restaurant_id = auth.uid()
    OR public.user_has_claim_on_listing(id)
  );

CREATE POLICY "listings_insert"
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (restaurant_id = auth.uid());

CREATE POLICY "listings_update"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (
    restaurant_id = auth.uid()
    OR public.is_farm_user()
  )
  WITH CHECK (
    restaurant_id = auth.uid()
    OR public.is_farm_user()
  );

CREATE POLICY "listings_delete"
  ON public.listings
  FOR DELETE
  TO authenticated
  USING (restaurant_id = auth.uid());

-- Recreate claims policies without recursive listings subqueries
DROP POLICY IF EXISTS "Farms can create claims" ON public.claims;
DROP POLICY IF EXISTS "Users can view claims for their listings/claims" ON public.claims;

CREATE POLICY "claims_insert"
  ON public.claims
  FOR INSERT
  TO authenticated
  WITH CHECK (farm_id = auth.uid());

CREATE POLICY "claims_select"
  ON public.claims
  FOR SELECT
  TO authenticated
  USING (
    farm_id = auth.uid()
    OR public.is_listing_owner(listing_id)
  );

-- Ensure profiles still readable for joins
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other profiles for listings" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "profiles_select"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =====================================================
-- STORAGE BUCKETS
-- App uses both names in different helpers; create both public buckets.
-- Primary used by lib/storage.js: plate2farm_images
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'plate2farm_images',
  'plate2farm_images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listings_images',
  'listings_images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for plate2farm_images
DROP POLICY IF EXISTS "Public read plate2farm_images" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload plate2farm_images" ON storage.objects;
DROP POLICY IF EXISTS "Auth update plate2farm_images" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete plate2farm_images" ON storage.objects;

CREATE POLICY "Public read plate2farm_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plate2farm_images');

CREATE POLICY "Auth upload plate2farm_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'plate2farm_images');

CREATE POLICY "Auth update plate2farm_images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'plate2farm_images')
  WITH CHECK (bucket_id = 'plate2farm_images');

CREATE POLICY "Auth delete plate2farm_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'plate2farm_images');

-- Storage policies for listings_images
DROP POLICY IF EXISTS "Public read listings_images" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload listings_images" ON storage.objects;
DROP POLICY IF EXISTS "Auth update listings_images" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete listings_images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for listings images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

CREATE POLICY "Public read listings_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listings_images');

CREATE POLICY "Auth upload listings_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listings_images');

CREATE POLICY "Auth update listings_images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'listings_images')
  WITH CHECK (bucket_id = 'listings_images');

CREATE POLICY "Auth delete listings_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'listings_images');

-- =====================================================
-- OPTIONAL: auto-create empty profile stub on signup
-- (App currently creates profile during onboarding, so this is a safety net only)
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Do nothing by default; onboarding creates the full profile.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Intentionally not attaching auto-profile creation; app handles it in onboarding.
