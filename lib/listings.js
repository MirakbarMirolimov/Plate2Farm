import { supabase } from './supabase';

export const createListing = async (restaurantId, itemName, quantity, expiresAt) => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .insert({
        restaurant_id: restaurantId,
        item_name: itemName,
        quantity,
        expires_at: expiresAt,
        status: 'available',
      })
      .select()
      .single();

    if (error) throw error;
    return { listing: data, error: null };
  } catch (error) {
    return { listing: null, error };
  }
};

export const getRestaurantListings = async (restaurantId) => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        claims (
          id,
          claimed_at,
          farm:profiles!claims_farm_id_fkey (
            name
          )
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { listings: data, error: null };
  } catch (error) {
    return { listings: [], error };
  }
};

export const getAvailableListings = async () => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        restaurant:profiles!listings_restaurant_id_fkey (
          name
        )
      `)
      .eq('status', 'available')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true });

    if (error) throw error;
    return { listings: data, error: null };
  } catch (error) {
    return { listings: [], error };
  }
};

export const claimListing = async (listingId, farmId) => {
  try {
    // Start a transaction
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .insert({
        listing_id: listingId,
        farm_id: farmId,
      })
      .select()
      .single();

    if (claimError) throw claimError;

    // Update listing status
    const { error: updateError } = await supabase
      .from('listings')
      .update({ status: 'claimed' })
      .eq('id', listingId);

    if (updateError) throw updateError;

    return { claim, error: null };
  } catch (error) {
    return { claim: null, error };
  }
};

export const updateListingStatus = async (listingId, status) => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', listingId)
      .select()
      .single();

    if (error) throw error;
    return { listing: data, error: null };
  } catch (error) {
    return { listing: null, error };
  }
};
