import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  Linking,
  ScrollView,
  Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../../lib/supabase';
import { getUserProfile } from '../../lib/auth';

const { width, height } = Dimensions.get('window');

export default function MapTab() {
  const [userProfile, setUserProfile] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [activeFilter, setActiveFilter] = useState('both'); // 'farms', 'restaurants', 'both'
  
  // Default location (New York City)
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    loadUserData();
    loadBusinesses();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { profile } = await getUserProfile(session.user.id);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  };

  const loadBusinesses = async () => {
    try {
      // Get all profiles to show on map
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('❌ Error fetching businesses:', error);
        return;
      }

      // Create mock coordinates for businesses around NYC area
      const businessesWithCoords = profiles?.map((profile, index) => ({
        ...profile,
        // Spread businesses around NYC area
        latitude: 40.7128 + (Math.random() - 0.5) * 0.2, // ±0.1 degrees around NYC
        longitude: -74.0060 + (Math.random() - 0.5) * 0.2,
        // Add some additional info
        distance: Math.round((Math.random() * 15 + 1) * 10) / 10, // 1-15 km
      })) || [];

      setBusinesses(businessesWithCoords);
      setFilteredBusinesses(businessesWithCoords); // Initially show all
    } catch (error) {
      console.error('❌ Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter businesses based on selected filter
  const applyFilter = (filterType) => {
    setActiveFilter(filterType);
    let filtered = [];
    
    switch (filterType) {
      case 'farms':
        filtered = businesses.filter(business => business.role === 'farm');
        break;
      case 'restaurants':
        filtered = businesses.filter(business => business.role === 'restaurant');
        break;
      case 'both':
      default:
        filtered = businesses;
        break;
    }
    
    setFilteredBusinesses(filtered);
  };

  // Get available filter options based on user role
  const getFilterOptions = () => {
    if (!userProfile) {
      return [
        { key: 'both', label: 'All Businesses', icon: '🏢' },
        { key: 'farms', label: 'Farms Only', icon: '🚜' },
        { key: 'restaurants', label: 'Restaurants Only', icon: '🍽️' }
      ];
    }
    
    // Role-based filter options
    if (userProfile.role === 'farm') {
      return [
        { key: 'restaurants', label: 'Restaurants Only', icon: '🍽️' },
        { key: 'both', label: 'All Businesses', icon: '🏢' }
      ];
    } else { // restaurant
      return [
        { key: 'farms', label: 'Farms Only', icon: '🚜' },
        { key: 'both', label: 'All Businesses', icon: '🏢' }
      ];
    }
  };

  // Update filtered businesses when businesses or user profile changes
  useEffect(() => {
    if (businesses.length > 0) {
      applyFilter(activeFilter);
    }
  }, [businesses, userProfile]);

  const getMarkerColor = (role) => {
    return role === 'farm' ? '#48bb78' : '#4299e1'; // Green for farms, blue for restaurants
  };

  const getBusinessTypeIcon = (role) => {
    return role === 'farm' ? '🚜' : '🍽️';
  };

  const getBusinessTypeLabel = (role) => {
    return role === 'farm' ? 'Farm' : 'Restaurant';
  };

  const handleMarkerPress = (business) => {
    setSelectedBusiness(business);
    // Just set the selected business, let the map handle its own positioning
  };

  const handleCalloutPress = (business) => {
    Alert.alert(
      business.name,
      `${getBusinessTypeLabel(business.role)}\nDistance: ~${business.distance} km\n\nEmail: ${business.email}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open in Maps', 
          onPress: () => {
            const url = `https://maps.google.com/?q=${business.latitude},${business.longitude}`;
            Linking.openURL(url);
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Map</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading businesses...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Business Map</Text>
        <Text style={styles.subtitle}>
          🚜 Green = Farms • 🍽️ Blue = Restaurants • Tap for details
        </Text>
      </View>

      {/* Full-Screen Interactive Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={true}
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={true}
        >
          {/* Filtered Business Markers */}
          {filteredBusinesses.map((business) => (
            <Marker
              key={business.id}
              coordinate={{
                latitude: business.latitude,
                longitude: business.longitude,
              }}
              title={business.name}
              description={`${getBusinessTypeLabel(business.role)} • ${business.distance} km away`}
              pinColor={getMarkerColor(business.role)}
              onPress={() => handleMarkerPress(business)}
              onCalloutPress={() => handleCalloutPress(business)}
            />
          ))}
        </MapView>
        
        {/* Map Legend */}
        <View style={styles.mapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#48bb78' }]} />
            <Text style={styles.legendText}>Farms</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4299e1' }]} />
            <Text style={styles.legendText}>Restaurants</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendEmoji}>📍</Text>
            <Text style={styles.legendText}>Your Location</Text>
          </View>
        </View>
        
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {getFilterOptions().map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterButton,
                activeFilter === option.key && styles.filterButtonActive
              ]}
              onPress={() => applyFilter(option.key)}
            >
              <Text style={styles.filterIcon}>{option.icon}</Text>
              <Text style={[
                styles.filterText,
                activeFilter === option.key && styles.filterTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Business Count Badge */}
        <View style={styles.businessCount}>
          <Text style={styles.businessCountText}>
            {filteredBusinesses.length} of {businesses.length} {filteredBusinesses.length === 1 ? 'Business' : 'Businesses'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapLegend: {
    position: 'absolute',
    top: 20,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  businessCount: {
    position: 'absolute',
    top: 20,
    left: 16,
    backgroundColor: 'rgba(72, 187, 120, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  businessCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendEmoji: {
    fontSize: 16,
    marginRight: 8,
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
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '500',
  },
  filterContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(72, 187, 120, 0.95)',
    borderColor: '#48bb78',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '600',
  },
  filterTextActive: {
    color: 'white',
  },
});
