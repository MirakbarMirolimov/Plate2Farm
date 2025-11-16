import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { signOut, getCurrentUser, getUserProfile } from '../../lib/auth';
import { getAvailableListings, claimListing } from '../../lib/listings';

export default function FarmListings() {
  const [listings, setListings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState(null);

  const loadData = async () => {
    try {
      const { user } = await getCurrentUser();
      if (user) {
        const { profile } = await getUserProfile(user.id);
        setUserProfile(profile);
      }

      const { listings: availableListings } = await getAvailableListings();
      setListings(availableListings);
    } catch (error) {
      Alert.alert('Error', 'Failed to load listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const handleClaimListing = async (listing) => {
    Alert.alert(
      'Claim Listing',
      `Are you sure you want to claim "${listing.item_name}" from ${listing.restaurant.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            setClaimingId(listing.id);
            
            try {
              const { user } = await getCurrentUser();
              if (!user) {
                Alert.alert('Error', 'User not authenticated');
                return;
              }

              const { claim, error } = await claimListing(listing.id, user.id);

              if (error) {
                Alert.alert('Error', error.message);
              } else {
                Alert.alert('Success', 'Listing claimed successfully!');
                // Remove the claimed listing from the list
                setListings(prev => prev.filter(item => item.id !== listing.id));
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to claim listing');
            } finally {
              setClaimingId(null);
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntilExpiration = (expiresAt) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffInHours = Math.ceil((expiration - now) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Expires soon';
    } else if (diffInHours < 24) {
      return `${diffInHours}h left`;
    } else {
      const days = Math.ceil(diffInHours / 24);
      return `${days}d left`;
    }
  };

  const getUrgencyColor = (expiresAt) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffInHours = (expiration - now) / (1000 * 60 * 60);
    
    if (diffInHours < 2) {
      return '#e53e3e'; // Red - very urgent
    } else if (diffInHours < 6) {
      return '#ed8936'; // Orange - urgent
    } else {
      return '#48bb78'; // Green - not urgent
    }
  };

  const renderListing = ({ item }) => (
    <View style={styles.listingCard}>
      {/* Product Image */}
      {item.image_url ? (
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.productImage}
          resizeMode="cover"
          onError={(error) => console.log('❌ Image load error:', error.nativeEvent.error)}
          onLoad={() => console.log('✅ Image loaded successfully:', item.image_url)}
        />
      ) : (
        <View style={[styles.productImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>📷</Text>
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
        
        <Text style={styles.restaurant}>From: {item.restaurant?.name || 'Unknown Restaurant'}</Text>
        <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
        <Text style={styles.expires}>Expires: {formatDate(item.expires_at)}</Text>
        <Text style={styles.posted}>Posted: {formatDate(item.created_at)}</Text>

        <TouchableOpacity
          style={[
            styles.claimButton,
            claimingId === item.id && styles.claimButtonDisabled
          ]}
          onPress={() => handleClaimListing(item)}
          disabled={claimingId === item.id}
        >
          <Text style={styles.claimButtonText}>
            {claimingId === item.id ? 'Claiming...' : '🌾 Claim This Item'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Available Listings</Text>
          <Text style={styles.subtitle}>Welcome, {userProfile?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listingsSection}>
        <Text style={styles.sectionTitle}>
          {listings.length} Available Items
        </Text>
        
        {listings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No available listings</Text>
            <Text style={styles.emptySubtext}>
              Check back later for new food items from restaurants
            </Text>
          </View>
        ) : (
          <FlatList
            data={listings}
            renderItem={renderListing}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginTop: 4,
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e53e3e',
  },
  signOutText: {
    color: '#e53e3e',
    fontWeight: '600',
  },
  listingsSection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#718096',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#a0aec0',
    textAlign: 'center',
  },
  listingCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
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
    borderRadius: 4,
  },
  urgencyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  restaurant: {
    fontSize: 16,
    color: '#48bb78',
    fontWeight: '600',
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 4,
  },
  expires: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 4,
  },
  posted: {
    fontSize: 12,
    color: '#a0aec0',
    marginBottom: 12,
  },
  claimButton: {
    backgroundColor: '#48bb78',
    paddingVertical: 12,
    borderRadius: 6,
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
  productImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
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
  listingContent: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    fontStyle: 'italic',
  },
});
