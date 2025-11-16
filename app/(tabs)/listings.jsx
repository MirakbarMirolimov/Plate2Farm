import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getUserProfile } from '../../lib/auth';
import { getAllListings, claimListing } from '../../lib/listings';
import Logo from '../../components/Logo';
// Removed complex image validation functions - using simple storage.js now

export default function ListingsTab() {
  const [availableListings, setAvailableListings] = useState([]);
  const [claimedListings, setClaimedListings] = useState([]);
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'claimed'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [imageErrors, setImageErrors] = useState({}); // Track image errors by listing ID
  const [currentTime, setCurrentTime] = useState(new Date());
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  // Update timer every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Calculate remaining time for a listing
  const getRemainingTime = (expiresAt) => {
    const now = currentTime;
    const expiration = new Date(expiresAt);
    const timeDifference = expiration - now;

    if (timeDifference <= 0) {
      return { expired: true, display: 'EXPIRED', color: '#ef4444' };
    }

    const hours = Math.floor(timeDifference / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

    let color = '#22c55e'; // Green
    if (hours < 2) color = '#ef4444'; // Red if less than 2 hours
    else if (hours < 6) color = '#f59e0b'; // Orange if less than 6 hours

    if (hours > 0) {
      return { 
        expired: false, 
        display: `${hours}h ${minutes}m left`, 
        color 
      };
    } else {
      return { 
        expired: false, 
        display: `${minutes}m left`, 
        color 
      };
    }
  };

  const loadData = async () => {
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { profile } = await getUserProfile(session.user.id);
        setUserProfile(profile);
      }

      // Load all listings
      const { listings: allListings, error } = await getAllListings();
      if (error) {
        console.error('❌ Error loading listings:', error);
      } else {
        console.log('📋 Loaded all listings:', allListings?.length || 0);
        
        // Separate available and claimed listings
        // Also check claims array as fallback in case status isn't updated properly
        const available = allListings?.filter(listing => 
          listing.status === 'available' && (!listing.claims || listing.claims.length === 0)
        ) || [];
        const claimed = allListings?.filter(listing => 
          listing.status === 'claimed' || (listing.claims && listing.claims.length > 0)
        ) || [];
        
        console.log('📋 Total listings loaded:', allListings?.length || 0);
        console.log('📋 Available listings:', available.length);
        console.log('📋 Claimed listings:', claimed.length);
        
        // Debug: Log listings with claims
        allListings?.forEach(listing => {
          console.log(`📋 Listing ${listing.id}: status=${listing.status}, claims=${listing.claims?.length || 0}`);
        });
        
        setAvailableListings(available);
        setClaimedListings(claimed);
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

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
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
                const timeInfo = getRemainingTime(listing.expires_at);
                
                // Move listing from available to claimed
                setAvailableListings(prev => prev.filter(l => l.id !== listing.id));
                
                // Add to claimed with farm info
                const claimedListing = {
                  ...listing,
                  status: 'claimed',
                  claims: [{
                    id: claim.id,
                    claimed_at: claim.claimed_at,
                    farm: { name: userProfile.name }
                  }]
                };
                setClaimedListings(prev => [claimedListing, ...prev]);
                
                // Switch to claimed tab to show the newly claimed listing
                setActiveTab('claimed');
                
                Alert.alert(
                  'Success! 🎉', 
                  `Listing claimed successfully!\n\n⏰ Time remaining: ${timeInfo.display}\n\nYou can now coordinate pickup with the restaurant.\n\n📋 Check the "Claimed" tab to see your claimed listings.`
                );
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
          <TouchableOpacity onPress={() => openImageModal(item.image_url)}>
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.productImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('❌ Image load error for listing:', item.item_name);
                console.log('Error details:', error.nativeEvent);
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
          </TouchableOpacity>
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
          </View>
        )}
      
      <View style={styles.listingContent}>
        <View style={styles.listingHeader}>
          <Text style={styles.itemName}>{item.item_name}</Text>
          <View style={[styles.urgencyBadge, { backgroundColor: getRemainingTime(item.expires_at).color }]}>
            <Text style={styles.urgencyText}>
              ⏰ {getRemainingTime(item.expires_at).display}
            </Text>
          </View>
        </View>
        
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
        
        <View style={styles.detailsRow}>
          <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
          <Text style={styles.restaurant}>📍 {item.restaurant?.name}</Text>
        </View>
        
        {/* Show claim button only for available listings */}
        {userProfile?.role === 'farm' && item.status === 'available' && (
          <TouchableOpacity
            style={[
              styles.claimButton,
              claimingId === item.id && styles.claimButtonDisabled,
              getRemainingTime(item.expires_at).expired && styles.expiredButton
            ]}
            onPress={() => handleClaimListing(item)}
            disabled={claimingId === item.id || getRemainingTime(item.expires_at).expired}
          >
            <Text style={styles.claimButtonText}>
              {getRemainingTime(item.expires_at).expired ? '❌ Expired' :
               claimingId === item.id ? 'Claiming...' : '🚜 Claim This'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Show claimed info for claimed listings */}
        {item.status === 'claimed' && item.claims && item.claims.length > 0 && (
          <View style={styles.claimedBox}>
            <Text style={styles.claimedText}>
              {userProfile?.role === 'farm' && item.claims[0].farm?.name === userProfile.name
                ? '✅ You claimed this listing'
                : `✅ Claimed by ${item.claims[0].farm?.name}`
              }
            </Text>
            <Text style={styles.claimedDate}>
              📅 {new Date(item.claims[0].claimed_at).toLocaleDateString()}
            </Text>
            {userProfile?.role === 'farm' && item.claims[0].farm?.name === userProfile.name && (
              <Text style={styles.claimedAction}>
                🏪 Contact {item.restaurant?.name} for pickup details
              </Text>
            )}
          </View>
        )}
        
        {/* Info for restaurants on available listings */}
        {userProfile?.role === 'restaurant' && item.status === 'available' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 This listing is available for farms to claim
            </Text>
          </View>
        )}

        {/* Info for restaurants on claimed listings */}
        {userProfile?.role === 'restaurant' && item.status === 'claimed' && item.claims && item.claims.length > 0 && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              🎉 Claimed by {item.claims[0].farm?.name}
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
          <View style={styles.headerContent}>
            <View style={styles.logoView}>
              <Logo size="small" />
            </View>
            <View style={styles.textView}>
              <Text style={styles.title}>Available Listings</Text>
            </View>
          </View>
          <View style={styles.headerDecoration} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading listings...</Text>
        </View>
      </View>
    );
  }

  const currentListings = activeTab === 'available' ? availableListings : claimedListings;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoView}>
            <Logo size="small" />
          </View>
          <View style={styles.textView}>
            <Text style={styles.title}>Food Listings</Text>
            <Text style={styles.subtitle}>
              {userProfile?.role === 'farm' 
                ? 'Surplus food from restaurants' 
                : 'Share your surplus food with local farms'
              }
            </Text>
          </View>
        </View>
        
        {/* Tab Buttons inside header */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'available' && styles.tabButtonActive]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'available' && styles.tabButtonTextActive]}>
              Available ({availableListings.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'claimed' && styles.tabButtonActive]}
            onPress={() => setActiveTab('claimed')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'claimed' && styles.tabButtonTextActive]}>
              Claimed ({claimedListings.length})
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerDecoration} />
      </View>
        
      {/* Helpful message for restaurants */}
      {userProfile?.role === 'restaurant' && availableListings.length === 0 && claimedListings.length === 0 && (
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeText}>
            👋 Welcome! Start by posting surplus food that farms can claim. Use the + button below to create your first listing.
          </Text>
        </View>
      )}

      <FlatList
        data={currentListings}
        renderItem={renderListing}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'available' ? '📋' : '✅'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'available' ? 'No available listings' : 'No claimed listings'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'available' 
                ? (userProfile?.role === 'farm' 
                    ? 'Check back later for new surplus food from restaurants'
                    : 'Tap the + button below to post your first surplus food listing')
                : 'Claimed listings will appear here'
              }
            </Text>
            
            {/* Add listing button for restaurants in empty state */}
            {userProfile?.role === 'restaurant' && activeTab === 'available' && (
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={() => router.push('/(tabs)/create-listing')}
              >
                <Text style={styles.emptyActionButtonText}>📋 Create Your First Listing</Text>
              </TouchableOpacity>
            )}
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

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackground}
            onPress={closeImageModal}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeImageModal}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Will fallback to solid color
    backgroundColor: '#f0f4ff', // Beautiful light blue-purple background
    paddingBottom: 120, // Extra bottom margin for floating tab bar
  },
  header: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Will fallback to solid color
    backgroundColor: '#6366f1', // Vibrant indigo
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 2,
  },
  logoView: {
    marginRight: 15,
  },
  textView: {
    flex: 1,
  },
  headerDecoration: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'left',
    opacity: 0.9,
    marginTop: 4,
  },
  welcomeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
    marginHorizontal: 20,
    borderWidth: 2,
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  welcomeText: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
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
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 220,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  placeholderImage: {
    backgroundColor: 'linear-gradient(135deg, #f3e8ff 0%, #e0e7ff 100%)',
    backgroundColor: '#f8faff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#c7d2fe',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 40,
    color: '#8b5cf6',
  },
  placeholderSubtext: {
    fontSize: 15,
    color: '#6366f1',
    marginTop: 8,
    fontWeight: '500',
  },
  debugText: {
    fontSize: 10,
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  listingContent: {
    padding: 20,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
    flex: 1,
    letterSpacing: 0.3,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  urgencyText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
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
    backgroundColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  claimButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  expiredButton: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    opacity: 0.8,
  },
  claimButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 20,
    borderRadius: 25,
    padding: 4,
    zIndex: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabButtonTextActive: {
    color: '#2d3748',
  },
  claimedBox: {
    backgroundColor: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    backgroundColor: '#ecfdf5',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  claimedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 6,
  },
  claimedDate: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '500',
  },
  claimedAction: {
    fontSize: 13,
    color: '#10b981',
    fontStyle: 'italic',
    marginTop: 6,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#d97706',
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
    marginBottom: 24,
  },
  emptyActionButton: {
    backgroundColor: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  emptyActionButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 130, // Moved higher to avoid tab bar
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  fabText: {
    fontSize: 28,
    color: 'white',
    fontWeight: '900',
  },
  // Image Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
