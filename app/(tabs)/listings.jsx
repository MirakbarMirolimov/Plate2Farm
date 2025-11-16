import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getUserProfile } from '../../lib/auth';
import { getAvailableListings, claimListing } from '../../lib/listings';
// Removed complex image validation functions - using simple storage.js now

export default function ListingsTab() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [imageErrors, setImageErrors] = useState({}); // Track image errors by listing ID
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { profile } = await getUserProfile(session.user.id);
        setUserProfile(profile);
      }

      // Load available listings
      const { listings: availableListings, error } = await getAvailableListings();
      if (error) {
        console.error('❌ Error loading listings:', error);
      } else {
        console.log('📋 Loaded listings:', availableListings?.length || 0);
        
        // Debug: Simple listing count
        console.log('📋 Loaded listings with images:', availableListings?.filter(l => l.image_url).length || 0);
        
        setListings(availableListings || []);
      }
    } catch (error) {
      console.error('❌ Error in loadData:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleClaimListing = async (listing) => {
    if (!userProfile || userProfile.role !== 'farm') {
      Alert.alert('Error', 'Only farms can claim listings');
      return;
    }

    Alert.alert(
      'Claim Listing',
      `Do you want to claim "${listing.item_name}" from ${listing.restaurant?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            setClaimingId(listing.id);
            
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.user) {
                Alert.alert('Error', 'User not authenticated');
                return;
              }

              const { claim, error } = await claimListing(listing.id, session.user.id);
              
              if (error) {
                Alert.alert('Error', error.message);
              } else {
                Alert.alert('Success', 'Listing claimed successfully!');
                loadData(); // Refresh the list
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to claim listing');
            } finally {
              setClaimingId(null);
            }
          }
        }
      ]
    );
  };

  const getTimeUntilExpiration = (expiresAt) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffInHours = Math.ceil((expiration - now) / (1000 * 60 * 60));
    
    if (diffInHours <= 0) {
      return 'Expired';
    } else if (diffInHours < 24) {
      return `${diffInHours}h left`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d left`;
    }
  };

  const getUrgencyColor = (expiresAt) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffInHours = (expiration - now) / (1000 * 60 * 60);
    
    if (diffInHours <= 2) {
      return '#e53e3e'; // Red - very urgent
    } else if (diffInHours < 6) {
      return '#ed8936'; // Orange - urgent
    } else {
      return '#48bb78'; // Green - not urgent
    }
  };

  const renderListing = ({ item }) => {
    const hasImageError = imageErrors[item.id] || false;
    
    return (
      <View style={styles.listingCard}>
        {/* Product Image */}
        {item.image_url && !hasImageError ? (
          <Image 
            source={{ uri: item.image_url }} 
            style={styles.productImage}
            resizeMode="cover"
            onError={(error) => {
              console.log('❌ Image load error for listing:', item.item_name);
              setImageErrors(prev => ({ ...prev, [item.id]: true }));
            }}
            onLoad={() => {
              console.log('✅ Image loaded successfully for:', item.item_name);
              setImageErrors(prev => ({ ...prev, [item.id]: false }));
            }}
            onLoadStart={() => {
              console.log('🔄 Loading image for:', item.item_name);
              setImageErrors(prev => ({ ...prev, [item.id]: false }));
            }}
          />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>📷</Text>
            <Text style={styles.placeholderSubtext}>
              {hasImageError ? 'Image failed to load' : 
               item.image_url ? 'Invalid image URL' : 'No image'}
            </Text>
            {item.image_url && (
              <TouchableOpacity 
                onPress={() => {
                  console.log('🔄 Retrying image load...');
                  setImageErrors(prev => ({ ...prev, [item.id]: false }));
                }}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Tap to retry</Text>
              </TouchableOpacity>
            )}
            {item.image_url && (
              <View>
                <Text style={styles.debugText} numberOfLines={1}>
                  Original: {item.image_url}
                </Text>
                {fixedImageUrl !== item.image_url && (
                  <Text style={styles.debugText} numberOfLines={1}>
                    Fixed: {fixedImageUrl}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      
      <View style={styles.listingContent}>
        <View style={styles.listingHeader}>
          <Text style={styles.itemName}>{item.item_name}</Text>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.expires_at) }]}>
            <Text style={styles.urgencyText}>{getTimeUntilExpiration(item.expires_at)}</Text>
          </View>
        </View>
        
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
        
        <View style={styles.detailsRow}>
          <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
          <Text style={styles.restaurant}>📍 {item.restaurant?.name}</Text>
        </View>
        
        {userProfile?.role === 'farm' && (
          <TouchableOpacity
            style={[
              styles.claimButton,
              claimingId === item.id && styles.claimButtonDisabled
            ]}
            onPress={() => handleClaimListing(item)}
            disabled={claimingId === item.id}
          >
            <Text style={styles.claimButtonText}>
              {claimingId === item.id ? 'Claiming...' : '🚜 Claim This'}
            </Text>
          </TouchableOpacity>
        )}
        
        {userProfile?.role === 'restaurant' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 This listing is available for farms to claim
            </Text>
          </View>
        )}
      </View>
    </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Available Listings</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading listings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Listings</Text>
        <Text style={styles.subtitle}>
          {userProfile?.role === 'farm' 
            ? 'Surplus food available from restaurants' 
            : 'All available surplus food listings'
          }
        </Text>
      </View>

      <FlatList
        data={listings}
        renderItem={renderListing}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📋</Text>
            <Text style={styles.emptyTitle}>No listings available</Text>
            <Text style={styles.emptySubtitle}>
              {userProfile?.role === 'farm' 
                ? 'Check back later for new surplus food from restaurants'
                : 'Restaurants will post surplus food here'
              }
            </Text>
          </View>
        }
      />

      {/* Floating Action Button for Restaurants */}
      {userProfile?.role === 'restaurant' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(tabs)/create-listing')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
  },
  listingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  placeholderImage: {
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 32,
    color: '#a0aec0',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#a0aec0',
    marginTop: 8,
  },
  debugText: {
    fontSize: 10,
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryButton: {
    backgroundColor: '#48bb78',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  listingContent: {
    padding: 16,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  urgencyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quantity: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '600',
  },
  restaurant: {
    fontSize: 14,
    color: '#4a5568',
  },
  claimButton: {
    backgroundColor: '#48bb78',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  claimButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#e6fffa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#48bb78',
  },
  infoText: {
    fontSize: 14,
    color: '#2d3748',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#48bb78',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
});
