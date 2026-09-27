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
import { useRouter } from 'expo-router';
import { signOut, getCurrentUser, getUserProfile } from '../../lib/auth';
import { getRestaurantListings } from '../../lib/listings';
import { colors, radii, shadows, spacing, typography } from '../../constants/theme';

export default function RestaurantDashboard() {
  const [listings, setListings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      const { user } = await getCurrentUser();
      if (user) {
        const { profile } = await getUserProfile(user.id);
        setUserProfile(profile);

        const { listings: restaurantListings } = await getRestaurantListings(user.id);
        setListings(restaurantListings);
      }
    } catch (error) {
      Alert.alert('Could not load', 'Failed to load dashboard data.');
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
      'Sign out',
      'You will need to sign in again to manage listings.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return colors.primary;
      case 'claimed':
        return colors.accent;
      default:
        return colors.muted;
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
          <Text style={styles.placeholderText}>No photo</Text>
        </View>
      )}
      
      <View style={styles.listingContent}>
        <View style={styles.listingHeader}>
          <Text style={styles.itemName}>{item.item_name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
        
        <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
        <Text style={styles.expires}>Expires: {formatDate(item.expires_at)}</Text>
        
        {item.claims && item.claims.length > 0 && (
          <Text style={styles.claimedBy}>
            Claimed by: {item.claims[0].farm?.name || 'Unknown farm'}
          </Text>
        )}
        
        <Text style={styles.posted}>Posted: {formatDate(item.created_at)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading kitchen board…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Kitchen board</Text>
          <Text style={styles.subtitle}>Welcome, {userProfile?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/(restaurant)/create-listing')}
      >
        <Text style={styles.createButtonText}>Post new surplus</Text>
      </TouchableOpacity>

      <View style={styles.listingsSection}>
        <Text style={styles.sectionTitle}>Your listings ({listings.length})</Text>
        
        {listings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No listings yet</Text>
            <Text style={styles.emptySubtext}>Post your first surplus offering to get started</Text>
          </View>
        ) : (
          <FlatList
            data={listings}
            renderItem={renderListing}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
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
    backgroundColor: colors.bg,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    ...typography.body,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.body,
    marginTop: 4,
  },
  signOutButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  signOutText: {
    color: colors.danger,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  createButtonText: {
    ...typography.button,
    color: colors.white,
  },
  listingsSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: colors.inkSoft,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    ...typography.caption,
    textAlign: 'center',
  },
  listingCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    ...shadows.card,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  statusText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  quantity: {
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: 4,
  },
  expires: {
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: 4,
  },
  claimedBy: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '700',
    marginBottom: 4,
  },
  posted: {
    ...typography.caption,
  },
  productImage: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    backgroundColor: colors.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  listingContent: {
    padding: spacing.md,
  },
  description: {
    ...typography.caption,
    marginBottom: 8,
  },
});
