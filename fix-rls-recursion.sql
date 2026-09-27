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
