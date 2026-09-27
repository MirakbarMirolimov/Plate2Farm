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
import { colors, spacing, radii, shadows, typography } from '../../constants/theme';
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
      return { expired: true, display: 'Expired', color: colors.danger };
    }

    const hours = Math.floor(timeDifference / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

    let color = colors.primary;
    if (hours < 2) color = colors.danger;
    else if (hours < 6) color = colors.warn;

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
      Alert.alert('Unable to claim', 'Only farm accounts can claim surplus listings.');
      return;
    }

    Alert.alert(
      'Claim this listing?',
      `Reserve "${listing.item_name}" from ${listing.restaurant?.name} for pickup.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            setClaimingId(listing.id);
            
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.user) {
                Alert.alert('Sign in required', 'Please sign in to claim a listing.');
                return;
              }

              const { claim, error } = await claimListing(listing.id, session.user.id);
              
              if (error) {
                Alert.alert('Could not claim', error.message);
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
                  'Listing claimed',
                  `You're set. Time remaining: ${timeInfo.display}.\n\nCoordinate pickup with the restaurant, and find this item under Claimed.`
                );
              }
            } catch (error) {
              Alert.alert('Could not claim', 'Something went wrong while claiming this listing.');
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
      return colors.danger;
    } else if (diffInHours < 6) {
      return colors.warn;
    } else {
      return colors.primary;
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
            <Text style={styles.placeholderText}>No photo</Text>
            <Text style={styles.placeholderSubtext}>
              {hasImageError ? 'Could not load image' :
               item.image_url ? 'Image unavailable' : 'Photo not added yet'}
            </Text>
            {item.image_url && (
              <TouchableOpacity 
                onPress={() => {
                  console.log('🔄 Retrying image load...');
                  setImageErrors(prev => ({ ...prev, [item.id]: false }));
                }}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      
      <View style={styles.listingContent}>
        <View style={styles.listingHeader}>
          <Text style={styles.itemName}>{item.item_name}</Text>
          <View style={[styles.urgencyBadge, { backgroundColor: getRemainingTime(item.expires_at).color }]}>
            <Text style={styles.urgencyText}>
              {getRemainingTime(item.expires_at).display}
            </Text>
          </View>
        </View>
        
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
        
        <View style={styles.detailsRow}>
          <Text style={styles.quantity}>Qty · {item.quantity}</Text>
          <Text style={styles.restaurant}>{item.restaurant?.name}</Text>
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
              {getRemainingTime(item.expires_at).expired ? 'Expired' :
               claimingId === item.id ? 'Claiming…' : 'Claim listing'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Show claimed info for claimed listings */}
        {item.status === 'claimed' && item.claims && item.claims.length > 0 && (
          <View style={styles.claimedBox}>
            <Text style={styles.claimedText}>
              {userProfile?.role === 'farm' && item.claims[0].farm?.name === userProfile.name
                ? 'Reserved for your farm'
                : `Claimed by ${item.claims[0].farm?.name}`
              }
            </Text>
            <Text style={styles.claimedDate}>
              Claimed {new Date(item.claims[0].claimed_at).toLocaleDateString()}
            </Text>
            {userProfile?.role === 'farm' && item.claims[0].farm?.name === userProfile.name && (
              <Text style={styles.claimedAction}>
                Reach out to {item.restaurant?.name} to arrange pickup
              </Text>
            )}
          </View>
        )}
        
        {/* Info for restaurants on available listings */}
        {userProfile?.role === 'restaurant' && item.status === 'available' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Waiting for a nearby farm to claim
            </Text>
          </View>
        )}

        {/* Info for restaurants on claimed listings */}
        {userProfile?.role === 'restaurant' && item.status === 'claimed' && item.claims && item.claims.length > 0 && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              Claimed by {item.claims[0].farm?.name}
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
              <Text style={styles.title}>Harvest board</Text>
            </View>
          </View>
          <View style={styles.headerDecoration} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Gathering fresh listings…</Text>
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
            <Text style={styles.title}>Harvest board</Text>
            <Text style={styles.subtitle}>
              {userProfile?.role === 'farm'
                ? 'Rescue surplus before it goes to waste'
                : 'Offer surplus food to nearby farms'
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
              Available · {availableListings.length}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'claimed' && styles.tabButtonActive]}
            onPress={() => setActiveTab('claimed')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'claimed' && styles.tabButtonTextActive]}>
              Claimed · {claimedListings.length}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerDecoration} />
      </View>
        
      {/* Helpful message for restaurants */}
      {userProfile?.role === 'restaurant' && availableListings.length === 0 && claimedListings.length === 0 && (
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeText}>
            Post your first surplus offering so local farms can claim it. Use the + button when you are ready.
          </Text>
        </View>
      )}

      <FlatList
        data={currentListings}
        renderItem={renderListing}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyText}>
                {activeTab === 'available' ? 'Open shelf' : 'Claimed'}
              </Text>
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'available' ? 'Nothing available yet' : 'No claims yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'available'
                ? (userProfile?.role === 'farm'
                    ? 'Fresh surplus from restaurants will show up here'
                    : 'Share leftover food with farms that can put it to good use')
                : 'Claimed surplus will collect here once farms reserve it'
              }
            </Text>
            
            {/* Add listing button for restaurants in empty state */}
            {userProfile?.role === 'restaurant' && activeTab === 'available' && (
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={() => router.push('/(tabs)/create-listing')}
              >
                <Text style={styles.emptyActionButtonText}>Create a listing</Text>
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
    backgroundColor: colors.bg,
    paddingBottom: 120,
  },
  header: {
    backgroundColor: colors.header,
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    ...shadows.float,
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
    marginRight: spacing.md,
  },
  textView: {
    flex: 1,
  },
  headerDecoration: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: colors.headerMuted,
    textAlign: 'left',
    marginTop: 4,
    lineHeight: 20,
    fontWeight: '500',
  },
  welcomeBox: {
    backgroundColor: colors.accentSoft,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.soft,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 21,
    textAlign: 'center',
    fontWeight: '500',
  },
  listContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.muted,
  },
  listingCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  placeholderImage: {
    backgroundColor: colors.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  placeholderText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.inkSoft,
    letterSpacing: 0.2,
  },
  placeholderSubtext: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
    fontWeight: '500',
  },
  debugText: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    marginTop: spacing.md,
    ...shadows.soft,
  },
  retryText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  listingContent: {
    padding: spacing.md,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    flex: 1,
    letterSpacing: -0.2,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginLeft: spacing.sm,
  },
  urgencyText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  description: {
    ...typography.caption,
    marginBottom: spacing.sm,
    color: colors.inkSoft,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  quantity: {
    fontSize: 13,
    color: colors.inkSoft,
    fontWeight: '700',
  },
  restaurant: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing.sm,
  },
  claimButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    alignItems: 'center',
    ...shadows.soft,
  },
  claimButtonDisabled: {
    backgroundColor: colors.muted,
    shadowOpacity: 0.05,
  },
  expiredButton: {
    backgroundColor: colors.danger,
    opacity: 0.9,
  },
  claimButtonText: {
    color: colors.white,
    ...typography.button,
  },
  infoBox: {
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  infoText: {
    fontSize: 13,
    color: colors.inkSoft,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: spacing.md,
    borderRadius: radii.pill,
    padding: 4,
    zIndex: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.72)',
  },
  tabButtonTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  claimedBox: {
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  claimedText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  claimedDate: {
    fontSize: 12,
    color: colors.inkSoft,
    fontWeight: '500',
  },
  claimedAction: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 6,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: colors.accentSoft,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: spacing.sm,
  },
  successText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: spacing.lg,
  },
  emptyIconWrap: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.muted,
  },
  emptyActionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  emptyActionButtonText: {
    color: colors.white,
    ...typography.button,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 130,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.float,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  fabText: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '700',
    marginTop: -2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.overlay,
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
    backgroundColor: colors.primaryDark,
    borderRadius: radii.pill,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
