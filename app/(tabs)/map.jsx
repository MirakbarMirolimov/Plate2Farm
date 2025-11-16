import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
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
  const [distanceFilter, setDistanceFilter] = useState('all'); // 'all', '5', '10', '25', '50'
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const mapRef = useRef(null);
  
  // Default location (Baltimore-DC area)
  const [mapRegion, setMapRegion] = useState({
    latitude: 39.0458, // Center between Baltimore and DC
    longitude: -76.6413,
    latitudeDelta: 0.8, // Wider view to cover both cities
    longitudeDelta: 0.8,
  });

  useEffect(() => {
    loadUserData();
    loadBusinesses();
    getUserLocation();
  }, []);

  // Recalculate distances when user location changes (only when location actually changes)
  useEffect(() => {
    if (userLocation && businesses.length > 0) {
      console.log('📏 Recalculating distances with user location:', userLocation);
      recalculateDistances();
    }
  }, [userLocation]); // Only depend on userLocation, not businesses

  // Apply filters when filter states change (avoid infinite loop)
  useEffect(() => {
    if (businesses.length > 0) {
      applyFilters();
    }
  }, [activeFilter, distanceFilter, applyFilters]);

  // Initial filtering when businesses are first loaded
  useEffect(() => {
    if (businesses.length > 0 && filteredBusinesses.length === 0) {
      console.log('🔄 Initial filtering of businesses');
      applyFilters();
    }
  }, [businesses, applyFilters]);

  const getUserLocation = async () => {
    try {
      setLocationLoading(true);
      console.log('📍 Requesting location permissions...');
      
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Location permission denied');
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to see accurate distances to businesses.',
          [
            { text: 'Use Default Location', onPress: () => useDefaultLocation() },
            { text: 'Open Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        useDefaultLocation();
        return;
      }

      console.log('✅ Location permission granted, getting current position...');
      
      // Get current location with high accuracy
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000, // 15 second timeout
      });

      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      console.log('📍 User location obtained:', userCoords);
      setUserLocation(userCoords);
      
      // Update map region to user's location with closer zoom
      const newRegion = {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.05, // Closer zoom to user location
        longitudeDelta: 0.05,
      };
      setMapRegion(newRegion);

      // Animate map to user location
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }

      Alert.alert(
        '📍 Location Updated',
        `Your location has been updated and map centered. Distances are now calculated from your current position.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('❌ Error getting user location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Using default Baltimore-DC area.',
        [{ text: 'OK' }]
      );
      useDefaultLocation();
    } finally {
      setLocationLoading(false);
    }
  };

  const useDefaultLocation = () => {
    // Fallback to Baltimore-DC area center
    const defaultLocation = {
      latitude: 39.0458,
      longitude: -76.6413
    };
    console.log('📍 Using default location:', defaultLocation);
    setUserLocation(defaultLocation);
  };

  const recalculateDistances = () => {
    if (!userLocation) return;

    const updatedBusinesses = businesses.map(business => ({
      ...business,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        business.latitude,
        business.longitude
      )
    }));

    console.log('📏 Distances recalculated for', updatedBusinesses.length, 'businesses');
    setBusinesses(updatedBusinesses);
    
    // Apply filters directly without triggering useEffect
    let filtered = updatedBusinesses;
    
    // Apply role filter
    switch (activeFilter) {
      case 'farms':
        filtered = filtered.filter(business => business.role === 'farm');
        break;
      case 'restaurants':
        filtered = filtered.filter(business => business.role === 'restaurant');
        break;
      case 'both':
      default:
        // No role filtering
        break;
    }
    
    // Apply distance filter
    if (distanceFilter !== 'all' && userLocation) {
      const maxDistance = parseFloat(distanceFilter);
      filtered = filtered.filter(business => business.distance <= maxDistance);
      console.log(`📏 Distance filter: ${filtered.length} businesses within ${maxDistance} miles`);
    }
    
    console.log(`🔍 Filters applied after distance recalculation: ${filtered.length} of ${updatedBusinesses.length} businesses shown`);
    setFilteredBusinesses(filtered);
  };

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

      // Fixed list of 20 farms in Baltimore-Washington area
      const farms = [
        { name: "Greenway Farm", lat: 39.3558, lng: -76.7369, city: "Towson, MD", address: "1234 Farm Rd" },
        { name: "Chesapeake Bay Farm", lat: 39.1754, lng: -76.6688, city: "Baltimore, MD", address: "567 Bay View Dr" },
        { name: "Heritage Harvest Farm", lat: 39.0458, lng: -76.8413, city: "Ellicott City, MD", address: "890 Heritage Ln" },
        { name: "Patapsco Valley Farm", lat: 39.2347, lng: -76.8094, city: "Catonsville, MD", address: "123 Valley Rd" },
        { name: "Gunpowder Falls Farm", lat: 39.4347, lng: -76.4094, city: "Bel Air, MD", address: "456 Falls Way" },
        { name: "Severn River Farm", lat: 39.0347, lng: -76.5094, city: "Annapolis, MD", address: "789 River Rd" },
        { name: "Catoctin Mountain Farm", lat: 39.5347, lng: -77.4094, city: "Frederick, MD", address: "321 Mountain View" },
        { name: "Monocacy Valley Farm", lat: 39.4147, lng: -77.2594, city: "Urbana, MD", address: "654 Valley Dr" },
        { name: "Sugarloaf Farm", lat: 39.2547, lng: -77.3794, city: "Poolesville, MD", address: "987 Sugar Rd" },
        { name: "Potomac River Farm", lat: 39.0847, lng: -77.1494, city: "Potomac, MD", address: "147 River Bend" },
        { name: "Rock Creek Farm", lat: 38.9847, lng: -77.0294, city: "Washington, DC", address: "258 Creek Ln" },
        { name: "Anacostia Farm", lat: 38.8647, lng: -76.9794, city: "Washington, DC", address: "369 Anacostia Ave" },
        { name: "Capitol Hill Farm", lat: 38.8947, lng: -77.0094, city: "Washington, DC", address: "741 Hill St" },
        { name: "Georgetown Farm", lat: 38.9047, lng: -77.0694, city: "Washington, DC", address: "852 M St NW" },
        { name: "Fairfax County Farm", lat: 38.8447, lng: -77.3094, city: "Fairfax, VA", address: "963 County Rd" },
        { name: "Arlington Heights Farm", lat: 38.8947, lng: -77.0894, city: "Arlington, VA", address: "159 Heights Dr" },
        { name: "Alexandria Bay Farm", lat: 38.8147, lng: -77.0594, city: "Alexandria, VA", address: "357 Bay St" },
        { name: "Prince George Farm", lat: 38.7847, lng: -76.8694, city: "College Park, MD", address: "468 Prince Ave" },
        { name: "Montgomery Farm", lat: 39.1647, lng: -77.2094, city: "Rockville, MD", address: "579 Montgomery Ln" },
        { name: "Howard County Farm", lat: 39.2047, lng: -76.8594, city: "Columbia, MD", address: "681 Howard Way" }
      ];

      // Fixed list of 30 restaurants, cafes, and malls in Baltimore-Washington area
      const restaurants = [
        { name: "The Prime Rib", lat: 39.2904, lng: -76.6122, city: "Baltimore, MD", address: "1101 N Calvert St" },
        { name: "Woodberry Kitchen", lat: 39.3299, lng: -76.6205, city: "Baltimore, MD", address: "2010 Clipper Park Rd" },
        { name: "Charleston", lat: 39.2847, lng: -76.6205, city: "Baltimore, MD", address: "1000 Lancaster St" },
        { name: "Amicci's", lat: 39.2704, lng: -76.6022, city: "Baltimore, MD", address: "231 S High St" },
        { name: "Thames Street Oyster House", lat: 39.2834, lng: -76.6056, city: "Baltimore, MD", address: "1728 Thames St" },
        { name: "The Food Market", lat: 39.3199, lng: -76.6305, city: "Baltimore, MD", address: "1017 W 36th St" },
        { name: "Cinghiale", lat: 39.2944, lng: -76.6172, city: "Baltimore, MD", address: "822 Lancaster St" },
        { name: "Artifact Coffee", lat: 39.2799, lng: -76.6105, city: "Baltimore, MD", address: "1500 Union Ave" },
        { name: "Blue Moon Cafe", lat: 39.2899, lng: -76.5905, city: "Baltimore, MD", address: "1621 Aliceanna St" },
        { name: "Phillips Seafood", lat: 39.2864, lng: -76.6086, city: "Baltimore, MD", address: "601 E Pratt St" },
        { name: "Le Bernardin", lat: 38.9072, lng: -77.0369, city: "Washington, DC", address: "1401 Pennsylvania Ave" },
        { name: "The Capital Grille", lat: 38.8951, lng: -77.0364, city: "Washington, DC", address: "601 Pennsylvania Ave" },
        { name: "Founding Farmers", lat: 38.8816, lng: -77.0910, city: "Washington, DC", address: "1924 Pennsylvania Ave" },
        { name: "Old Ebbitt Grill", lat: 38.8976, lng: -77.0365, city: "Washington, DC", address: "675 15th St NW" },
        { name: "Zaytinya", lat: 38.8938, lng: -77.0146, city: "Washington, DC", address: "701 9th St NW" },
        { name: "Rasika", lat: 38.8938, lng: -77.0246, city: "Washington, DC", address: "633 D St NW" },
        { name: "Blue Duck Tavern", lat: 38.9038, lng: -77.0546, city: "Washington, DC", address: "1201 24th St NW" },
        { name: "Komi", lat: 38.9138, lng: -77.0446, city: "Washington, DC", address: "1509 17th St NW" },
        { name: "Fiola", lat: 38.8938, lng: -77.0346, city: "Washington, DC", address: "601 Pennsylvania Ave" },
        { name: "Minibar", lat: 38.9038, lng: -77.0246, city: "Washington, DC", address: "855 E St NW" },
        { name: "Busboys and Poets", lat: 38.9238, lng: -77.0346, city: "Washington, DC", address: "2021 14th St NW" },
        { name: "Compass Coffee", lat: 38.8838, lng: -77.0146, city: "Washington, DC", address: "1535 7th St NW" },
        { name: "Bluestone Lane", lat: 38.9138, lng: -77.0246, city: "Washington, DC", address: "1700 N Moore St" },
        { name: "Tysons Corner Center", lat: 38.9186, lng: -77.2297, city: "McLean, VA", address: "1961 Chain Bridge Rd" },
        { name: "Pentagon City Mall", lat: 38.8616, lng: -77.0592, city: "Arlington, VA", address: "1100 S Hayes St" },
        { name: "Westfield Montgomery", lat: 39.0896, lng: -77.1446, city: "Bethesda, MD", address: "7101 Democracy Blvd" },
        { name: "The Shops at National Harbor", lat: 38.7847, lng: -77.0169, city: "Oxon Hill, MD", address: "171 Waterfront St" },
        { name: "Arundel Mills", lat: 39.1547, lng: -76.7269, city: "Hanover, MD", address: "7000 Arundel Mills Cir" },
        { name: "Annapolis Mall", lat: 38.9947, lng: -76.5469, city: "Annapolis, MD", address: "1 Annapolis Mall" },
        { name: "Towson Town Center", lat: 39.4047, lng: -76.6069, city: "Towson, MD", address: "825 Dulaney Valley Rd" }
      ];

      // Create all 50 businesses (20 farms + 30 restaurants) regardless of user profiles
      const allBusinesses = [];
      
      // Add all 20 farms
      farms.forEach((farm, index) => {
        allBusinesses.push({
          id: `farm_${index}`,
          role: 'farm',
          name: farm.name,
          businessName: farm.name,
          email: `contact@${farm.name.toLowerCase().replace(/\s+/g, '')}.com`,
          latitude: farm.lat,
          longitude: farm.lng,
          city: farm.city,
          address: farm.address,
          distance: 0, // Will be calculated when user location is obtained
        });
      });
      
      // Add all 30 restaurants
      restaurants.forEach((restaurant, index) => {
        allBusinesses.push({
          id: `restaurant_${index}`,
          role: 'restaurant',
          name: restaurant.name,
          businessName: restaurant.name,
          email: `info@${restaurant.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`,
          latitude: restaurant.lat,
          longitude: restaurant.lng,
          city: restaurant.city,
          address: restaurant.address,
          distance: 0, // Will be calculated when user location is obtained
        });
      });
      
      const businessesWithCoords = allBusinesses;

      console.log('📍 Total businesses loaded:', businessesWithCoords.length);
      console.log('🚜 Farms loaded:', businessesWithCoords.filter(b => b.role === 'farm').length);
      console.log('🍽️ Restaurants loaded:', businessesWithCoords.filter(b => b.role === 'restaurant').length);
      if (businessesWithCoords.length > 0) {
        console.log('📍 Sample farm:', {
          name: businessesWithCoords.find(b => b.role === 'farm')?.businessName,
          role: 'farm',
          lat: businessesWithCoords.find(b => b.role === 'farm')?.latitude,
          lng: businessesWithCoords.find(b => b.role === 'farm')?.longitude
        });
        console.log('📍 Sample restaurant:', {
          name: businessesWithCoords.find(b => b.role === 'restaurant')?.businessName,
          role: 'restaurant',
          lat: businessesWithCoords.find(b => b.role === 'restaurant')?.latitude,
          lng: businessesWithCoords.find(b => b.role === 'restaurant')?.longitude
        });
      }
      
      setBusinesses(businessesWithCoords);
      // Don't set filtered businesses here - let useEffect handle it
    } catch (error) {
      console.error('❌ Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two coordinates (in miles)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  // Filter businesses based on selected filters (memoized to prevent infinite loops)
  const applyFilters = useCallback((businessList = businesses, roleFilter = activeFilter, distFilter = distanceFilter) => {
    let filtered = businessList;
    
    // Apply role filter
    switch (roleFilter) {
      case 'farms':
        filtered = filtered.filter(business => business.role === 'farm');
        break;
      case 'restaurants':
        filtered = filtered.filter(business => business.role === 'restaurant');
        break;
      case 'both':
      default:
        // No role filtering
        break;
    }
    
    // Apply distance filter (only if distances are calculated)
    if (distFilter !== 'all' && userLocation) {
      const maxDistance = parseFloat(distFilter);
      filtered = filtered.filter(business => business.distance <= maxDistance);
      console.log(`📏 Distance filter: ${filtered.length} businesses within ${maxDistance} miles`);
    }
    
    console.log(`🔍 Filters applied: ${filtered.length} of ${businessList.length} businesses shown`);
    setFilteredBusinesses(filtered);
  }, [businesses, activeFilter, distanceFilter, userLocation]);

  // Update active filter and apply all filters
  const updateRoleFilter = (filterType) => {
    setActiveFilter(filterType);
  };

  // Update distance filter and apply all filters
  const updateDistanceFilter = (distance) => {
    setDistanceFilter(distance);
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

  // Update filtered businesses when any filter changes
  useEffect(() => {
    if (businesses.length > 0) {
      applyFilters();
    }
  }, [businesses, activeFilter, distanceFilter]);

  // Get distance filter options
  const getDistanceOptions = () => {
    return [
      { key: 'all', label: 'All Distances', icon: '🌍' },
      { key: '5', label: 'Within 5 mi', icon: '🚶' },
      { key: '10', label: 'Within 10 mi', icon: '🚴' },
      { key: '25', label: 'Within 25 mi', icon: '🚗' },
      { key: '50', label: 'Within 50 mi', icon: '✈️' }
    ];
  };

  const getMarkerColor = (role) => {
    return role === 'farm' ? 'green' : 'blue'; // Use standard colors for better visibility
  };

  // Custom marker component for better visibility
  const CustomMarker = ({ business }) => (
    <View style={[
      styles.customMarker,
      { backgroundColor: getMarkerColor(business.role) }
    ]}>
      <Text style={styles.markerIcon}>
        {getBusinessTypeIcon(business.role)}
      </Text>
    </View>
  );

  const getBusinessTypeIcon = (role) => {
    return role === 'farm' ? '🚜' : '🍽️';
  };

  const getBusinessTypeLabel = (role) => {
    return role === 'farm' ? 'Farm' : 'Restaurant';
  };

  const handleMarkerPress = (business) => {
    setSelectedBusiness(business);
    
    // Show quick directions option when marker is pressed
    Alert.alert(
      `${getBusinessTypeIcon(business.role)} ${business.businessName || business.name}`,
      `${getBusinessTypeLabel(business.role)}\n📍 ${business.address}, ${business.city}\n📏 ${business.distance} mi away`,
      [
        { text: 'Close', style: 'cancel' },
        { 
          text: '🗺️ Get Directions', 
          onPress: () => openDirections(business)
        }
      ]
    );
  };

  const openDirections = (business) => {
    const { latitude, longitude, businessName, name, address, city } = business;
    const destination = `${latitude},${longitude}`;
    const fullAddress = encodeURIComponent(`${address}, ${city}`);
    const businessNameEncoded = encodeURIComponent(businessName || name);
    
    // Multiple directions options with enhanced URLs
    Alert.alert(
      '🗺️ Get Directions',
      `Navigate to ${businessName || name}\n📍 ${address}, ${city}\n📏 ${business.distance} mi away`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '📍 Google Maps',
          onPress: () => {
            // Use address for better routing
            const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${fullAddress}&destination_place_id=${businessNameEncoded}`;
            console.log('🗺️ Opening Google Maps:', googleUrl);
            Linking.openURL(googleUrl).catch(err => {
              console.error('❌ Error opening Google Maps:', err);
              // Fallback to coordinates
              const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
              Linking.openURL(fallbackUrl);
            });
          }
        },
        {
          text: '🍎 Apple Maps',
          onPress: () => {
            // Use address for Apple Maps
            const appleUrl = `http://maps.apple.com/?daddr=${fullAddress}&dirflg=d`;
            console.log('🗺️ Opening Apple Maps:', appleUrl);
            Linking.openURL(appleUrl).catch(err => {
              console.error('❌ Error opening Apple Maps:', err);
              // Fallback to coordinates
              const fallbackUrl = `http://maps.apple.com/?daddr=${destination}&dirflg=d`;
              Linking.openURL(fallbackUrl);
            });
          }
        },
        {
          text: '🚗 Waze',
          onPress: () => {
            // Waze works best with coordinates
            const wazeUrl = `https://waze.com/ul?ll=${destination}&navigate=yes&zoom=17`;
            console.log('🗺️ Opening Waze:', wazeUrl);
            Linking.openURL(wazeUrl).catch(err => {
              console.error('❌ Error opening Waze:', err);
            });
          }
        }
      ]
    );
  };

  const findNearestBusiness = () => {
    if (filteredBusinesses.length === 0) {
      Alert.alert('No Businesses', 'No businesses found with current filters.');
      return;
    }

    // Find the nearest business
    const nearest = filteredBusinesses.reduce((closest, current) => {
      return current.distance < closest.distance ? current : closest;
    });

    Alert.alert(
      '🎯 Nearest Business Found',
      `${nearest.businessName || nearest.name}\n${getBusinessTypeLabel(nearest.role)}\n📍 ${nearest.address}, ${nearest.city}\n📏 ${nearest.distance} mi away`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '🗺️ Get Directions',
          onPress: () => openDirections(nearest)
        }
      ]
    );
  };

  const handleCalloutPress = (business) => {
    Alert.alert(
      `${getBusinessTypeIcon(business.role)} ${business.businessName || business.name}`,
      `${getBusinessTypeLabel(business.role)}\n${business.address ? `📍 ${business.address}\n` : ''}📍 ${business.city}${business.state ? `, ${business.state}` : ''}\n📏 Distance: ~${business.distance} mi\n📧 ${business.email}`,
      [
        { text: 'Close', style: 'cancel' },
        { 
          text: '🗺️ Get Directions', 
          onPress: () => openDirections(business)
        },
        {
          text: '📞 Contact',
          onPress: () => {
            Alert.alert(
              'Contact Options',
              `How would you like to contact ${business.businessName || business.name}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: '📧 Email',
                  onPress: () => {
                    const emailUrl = `mailto:${business.email}?subject=Inquiry about ${business.businessName || business.name}`;
                    Linking.openURL(emailUrl);
                  }
                }
              ]
            );
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
        <Text style={styles.title}>Baltimore-DC Area</Text>
      </View>

      {/* Full-Screen Interactive Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          followsUserLocation={false}
          showsCompass={true}
          showsScale={true}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={true}
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={true}
          onUserLocationChange={(event) => {
            const coordinate = event.nativeEvent.coordinate;
            console.log('📍 User location changed:', coordinate);
            
            // Update user location state when location changes
            if (coordinate) {
              setUserLocation({
                latitude: coordinate.latitude,
                longitude: coordinate.longitude
              });
            }
          }}
          onPress={() => {
            console.log('🗺️ Map pressed');
          }}
        >
          {/* Filtered Business Markers */}
          {console.log('🗺️ Rendering markers for', filteredBusinesses.length, 'businesses')}
          {filteredBusinesses.map((business) => (
            <Marker
              key={business.id}
              coordinate={{
                latitude: business.latitude,
                longitude: business.longitude,
              }}
              title={business.businessName || business.name}
              description={`${getBusinessTypeLabel(business.role)} • ${business.address ? `${business.address}, ` : ''}${business.city} • ${business.distance} mi away\n🗺️ Tap for directions`}
              pinColor={getMarkerColor(business.role)}
              onPress={() => handleMarkerPress(business)}
              onCalloutPress={() => handleCalloutPress(business)}
            />
          ))}
        </MapView>
        
        {/* Role Filter Buttons */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {getFilterOptions().map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterButton,
                  activeFilter === option.key && styles.filterButtonActive
                ]}
                onPress={() => updateRoleFilter(option.key)}
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
          </ScrollView>
        </View>
        
        {/* Distance Filter Buttons */}
        <View style={styles.distanceFilterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {getDistanceOptions().map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.distanceFilterButton,
                  distanceFilter === option.key && styles.distanceFilterButtonActive
                ]}
                onPress={() => updateDistanceFilter(option.key)}
              >
                <Text style={styles.filterIcon}>{option.icon}</Text>
                <Text style={[
                  styles.distanceFilterText,
                  distanceFilter === option.key && styles.distanceFilterTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Business Count Badge */}
        <View style={styles.businessCount}>
          <Text style={styles.businessCountText}>
            {filteredBusinesses.length} of {businesses.length} {filteredBusinesses.length === 1 ? 'Business' : 'Businesses'}
          </Text>
        </View>

        {/* Find Nearest Business FAB */}
        <TouchableOpacity 
          style={styles.nearestFab}
          onPress={findNearestBusiness}
        >
          <Text style={styles.nearestFabIcon}>🎯</Text>
          <Text style={styles.nearestFabText}>Nearest</Text>
        </TouchableOpacity>

        {/* Refresh Location FAB */}
        <TouchableOpacity 
          style={[styles.locationFab, locationLoading && styles.locationFabLoading]}
          onPress={getUserLocation}
          disabled={locationLoading}
        >
          <Text style={styles.locationFabIcon}>
            {locationLoading ? '⏳' : '📍'}
          </Text>
          <Text style={styles.locationFabText}>
            {locationLoading ? 'Loading' : 'Location'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom: 100, // Add padding for floating tab bar
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
  filterScrollContent: {
    paddingHorizontal: 8,
    gap: 8,
  },
  distanceFilterContainer: {
    position: 'absolute',
    bottom: 80, // Above role filters
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  distanceFilterButton: {
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
    marginHorizontal: 4,
  },
  distanceFilterButtonActive: {
    backgroundColor: 'rgba(66, 153, 225, 0.95)',
    borderColor: '#4299e1',
  },
  distanceFilterText: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '600',
  },
  distanceFilterTextActive: {
    color: 'white',
  },
  nearestFab: {
    position: 'absolute',
    bottom: 140, // Above the filter buttons
    right: 16,
    backgroundColor: 'rgba(66, 153, 225, 0.95)',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nearestFabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  nearestFabText: {
    fontSize: 8,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  locationFab: {
    position: 'absolute',
    bottom: 210, // Above the nearest button
    right: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.95)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  locationFabIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  locationFabText: {
    fontSize: 8,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  locationFabLoading: {
    backgroundColor: 'rgba(156, 163, 175, 0.95)',
  },
  customMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  markerIcon: {
    fontSize: 24,
  },
  calloutContainer: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 2,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#4a5568',
    marginBottom: 2,
  },
  calloutDistance: {
    fontSize: 12,
    color: '#4a5568',
    marginBottom: 4,
  },
  calloutHint: {
    fontSize: 11,
    color: '#3182ce',
    fontStyle: 'italic',
  },
});
