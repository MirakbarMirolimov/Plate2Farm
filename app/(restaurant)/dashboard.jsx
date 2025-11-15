import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signOut, getCurrentUser, getUserProfile } from '../../lib/auth';
import { getRestaurantListings } from '../../lib/listings';

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
      Alert.alert('Error', 'Failed to load data');
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
        return '#48bb78';
      case 'claimed':
        return '#ed8936';
      default:
        return '#718096';
    }
  };

  const renderListing = ({ item }) => (
    <View style={styles.listingCard}>
      <View style={styles.listingHeader}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
      <Text style={styles.expires}>Expires: {formatDate(item.expires_at)}</Text>
      
      {item.claims && item.claims.length > 0 && (
        <Text style={styles.claimedBy}>
          Claimed by: {item.claims[0].farm.name}
        </Text>
      )}
      
      <Text style={styles.created}>
        Posted: {formatDate(item.created_at)}
      </Text>
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
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, {userProfile?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/(restaurant)/create-listing')}
      >
        <Text style={styles.createButtonText}>+ Create New Listing</Text>
      </TouchableOpacity>

      <View style={styles.listingsSection}>
        <Text style={styles.sectionTitle}>Your Listings ({listings.length})</Text>
        
        {listings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No listings yet</Text>
            <Text style={styles.emptySubtext}>Create your first listing to get started</Text>
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
  createButton: {
    backgroundColor: '#48bb78',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
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
  },
  listingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  claimedBy: {
    fontSize: 14,
    color: '#ed8936',
    fontWeight: '600',
    marginBottom: 4,
  },
  created: {
    fontSize: 12,
    color: '#a0aec0',
  },
});
