import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Linking,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { getUserProfile } from '../../lib/auth';
import { colors, spacing, radii, shadows, typography } from '../../constants/theme';

// Demo partners across Baltimore–DC so the map always has visible marks
const DEMO_FARMS = [
  { name: 'Greenway Farm', lat: 39.3558, lng: -76.7369, city: 'Towson, MD', address: '1234 Farm Rd' },
  { name: 'Chesapeake Bay Farm', lat: 39.1754, lng: -76.6688, city: 'Baltimore, MD', address: '567 Bay View Dr' },
  { name: 'Heritage Harvest Farm', lat: 39.0458, lng: -76.8413, city: 'Ellicott City, MD', address: '890 Heritage Ln' },
  { name: 'Patapsco Valley Farm', lat: 39.2347, lng: -76.8094, city: 'Catonsville, MD', address: '123 Valley Rd' },
  { name: 'Gunpowder Falls Farm', lat: 39.4347, lng: -76.4094, city: 'Bel Air, MD', address: '456 Falls Way' },
  { name: 'Severn River Farm', lat: 39.0347, lng: -76.5094, city: 'Annapolis, MD', address: '789 River Rd' },
  { name: 'Catoctin Mountain Farm', lat: 39.5347, lng: -77.4094, city: 'Frederick, MD', address: '321 Mountain View' },
  { name: 'Monocacy Valley Farm', lat: 39.4147, lng: -77.2594, city: 'Urbana, MD', address: '654 Valley Dr' },
  { name: 'Sugarloaf Farm', lat: 39.2547, lng: -77.3794, city: 'Poolesville, MD', address: '987 Sugar Rd' },
  { name: 'Potomac River Farm', lat: 39.0847, lng: -77.1494, city: 'Potomac, MD', address: '147 River Bend' },
  { name: 'Rock Creek Farm', lat: 38.9847, lng: -77.0294, city: 'Washington, DC', address: '258 Creek Ln' },
  { name: 'Anacostia Farm', lat: 38.8647, lng: -76.9794, city: 'Washington, DC', address: '369 Anacostia Ave' },
  { name: 'Capitol Hill Farm', lat: 38.8947, lng: -77.0094, city: 'Washington, DC', address: '741 Hill St' },
  { name: 'Georgetown Farm', lat: 38.9047, lng: -77.0694, city: 'Washington, DC', address: '852 M St NW' },
  { name: 'Fairfax County Farm', lat: 38.8447, lng: -77.3094, city: 'Fairfax, VA', address: '963 County Rd' },
  { name: 'Arlington Heights Farm', lat: 38.8947, lng: -77.0894, city: 'Arlington, VA', address: '159 Heights Dr' },
  { name: 'Alexandria Bay Farm', lat: 38.8147, lng: -77.0594, city: 'Alexandria, VA', address: '357 Bay St' },
  { name: 'Prince George Farm', lat: 38.7847, lng: -76.8694, city: 'College Park, MD', address: '468 Prince Ave' },
  { name: 'Montgomery Farm', lat: 39.1647, lng: -77.2094, city: 'Rockville, MD', address: '579 Montgomery Ln' },
  { name: 'Howard County Farm', lat: 39.2047, lng: -76.8594, city: 'Columbia, MD', address: '681 Howard Way' },
];

const DEMO_KITCHENS = [
  { name: 'The Prime Rib', lat: 39.2904, lng: -76.6122, city: 'Baltimore, MD', address: '1101 N Calvert St' },
  { name: 'Woodberry Kitchen', lat: 39.3299, lng: -76.6205, city: 'Baltimore, MD', address: '2010 Clipper Park Rd' },
  { name: 'Charleston', lat: 39.2847, lng: -76.6205, city: 'Baltimore, MD', address: '1000 Lancaster St' },
  { name: "Amicci's", lat: 39.2704, lng: -76.6022, city: 'Baltimore, MD', address: '231 S High St' },
  { name: 'Thames Street Oyster House', lat: 39.2834, lng: -76.6056, city: 'Baltimore, MD', address: '1728 Thames St' },
  { name: 'The Food Market', lat: 39.3199, lng: -76.6305, city: 'Baltimore, MD', address: '1017 W 36th St' },
  { name: 'Cinghiale', lat: 39.2944, lng: -76.6172, city: 'Baltimore, MD', address: '822 Lancaster St' },
  { name: 'Artifact Coffee', lat: 39.2799, lng: -76.6105, city: 'Baltimore, MD', address: '1500 Union Ave' },
  { name: 'Blue Moon Cafe', lat: 39.2899, lng: -76.5905, city: 'Baltimore, MD', address: '1621 Aliceanna St' },
  { name: 'Phillips Seafood', lat: 39.2864, lng: -76.6086, city: 'Baltimore, MD', address: '601 E Pratt St' },
  { name: 'Founding Farmers', lat: 38.8816, lng: -77.0910, city: 'Washington, DC', address: '1924 Pennsylvania Ave' },
  { name: 'Old Ebbitt Grill', lat: 38.8976, lng: -77.0365, city: 'Washington, DC', address: '675 15th St NW' },
  { name: 'Zaytinya', lat: 38.8938, lng: -77.0146, city: 'Washington, DC', address: '701 9th St NW' },
  { name: 'Rasika', lat: 38.8938, lng: -77.0246, city: 'Washington, DC', address: '633 D St NW' },
  { name: 'Blue Duck Tavern', lat: 38.9038, lng: -77.0546, city: 'Washington, DC', address: '1201 24th St NW' },
  { name: 'Busboys and Poets', lat: 38.9238, lng: -77.0346, city: 'Washington, DC', address: '2021 14th St NW' },
  { name: 'Compass Coffee', lat: 38.8838, lng: -77.0146, city: 'Washington, DC', address: '1535 7th St NW' },
  { name: 'Tysons Corner Center', lat: 38.9186, lng: -77.2297, city: 'McLean, VA', address: '1961 Chain Bridge Rd' },
  { name: 'Pentagon City Mall', lat: 38.8616, lng: -77.0592, city: 'Arlington, VA', address: '1100 S Hayes St' },
  { name: 'Westfield Montgomery', lat: 39.0896, lng: -77.1446, city: 'Bethesda, MD', address: '7101 Democracy Blvd' },
  { name: 'The Shops at National Harbor', lat: 38.7847, lng: -77.0169, city: 'Oxon Hill, MD', address: '171 Waterfront St' },
  { name: 'Arundel Mills', lat: 39.1547, lng: -76.7269, city: 'Hanover, MD', address: '7000 Arundel Mills Cir' },
  { name: 'Annapolis Mall', lat: 38.9947, lng: -76.5469, city: 'Annapolis, MD', address: '1 Annapolis Mall' },
  { name: 'Towson Town Center', lat: 39.4047, lng: -76.6069, city: 'Towson, MD', address: '825 Dulaney Valley Rd' },
];

const DEFAULT_REGION = {
  latitude: 39.0458,
  longitude: -76.6413,
  latitudeDelta: 0.85,
  longitudeDelta: 0.85,
};

// Google Maps needs an API key on iOS. Prefer Google when key is present; otherwise Apple Maps on iOS.
const GOOGLE_MAPS_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY ||
  '';
const USE_GOOGLE_PROVIDER =
  Platform.OS === 'android' || (Platform.OS === 'ios' && Boolean(GOOGLE_MAPS_KEY));

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function buildDemoBusinesses() {
  const list = [];
  DEMO_FARMS.forEach((farm, index) => {
    list.push({
      id: `demo_farm_${index}`,
      role: 'farm',
      name: farm.name,
      businessName: farm.name,
      email: `contact@${farm.name.toLowerCase().replace(/\s+/g, '')}.com`,
      latitude: farm.lat,
      longitude: farm.lng,
      city: farm.city,
      address: farm.address,
      distance: 0,
      source: 'demo',
    });
  });
  DEMO_KITCHENS.forEach((kitchen, index) => {
    list.push({
      id: `demo_kitchen_${index}`,
      role: 'restaurant',
      name: kitchen.name,
      businessName: kitchen.name,
      email: `info@${kitchen.name.toLowerCase().replace(/[^a-z0-9]+/gi, '')}.com`,
      latitude: kitchen.lat,
      longitude: kitchen.lng,
      city: kitchen.city,
      address: kitchen.address,
      distance: 0,
      source: 'demo',
    });
  });
  return list;
}

export default function MapTab() {
  const [userProfile, setUserProfile] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('both');
  const [distanceFilter, setDistanceFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const fittedOnce = useRef(false);

  const loadUserData = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { profile } = await getUserProfile(session.user.id);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  }, []);

  const withDistances = useCallback((list, origin) => {
    if (!origin) return list.map((b) => ({ ...b, distance: b.distance || 0 }));
    return list.map((b) => ({
      ...b,
      distance: calculateDistance(origin.latitude, origin.longitude, b.latitude, b.longitude),
    }));
  }, []);

  const loadBusinesses = useCallback(async (origin = null) => {
    try {
      const demo = buildDemoBusinesses();
      let networkPartners = [];

      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, name, email, role, address, city, state, latitude, longitude');

        if (error) {
          console.warn('⚠️ Profiles fetch failed, using demo markers only:', error.message);
        } else if (Array.isArray(profiles)) {
          networkPartners = profiles
            .map((p) => {
              const latitude = toNumber(p.latitude);
              const longitude = toNumber(p.longitude);
              if (latitude === null || longitude === null) return null;
              if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
              return {
                id: `profile_${p.id}`,
                role: p.role === 'farm' ? 'farm' : 'restaurant',
                name: p.name || 'Partner',
                businessName: p.name || 'Partner',
                email: p.email || '',
                latitude,
                longitude,
                city: [p.city, p.state].filter(Boolean).join(', ') || 'Local area',
                address: p.address || 'Address on file',
                distance: 0,
                source: 'network',
              };
            })
            .filter(Boolean);
        }
      } catch (networkError) {
        console.warn('⚠️ Network partners unavailable:', networkError);
      }

      // Prefer real geocoded profiles; always keep demo markers so the map stays populated
      const byId = new Map();
      demo.forEach((b) => byId.set(b.id, b));
      networkPartners.forEach((b) => byId.set(b.id, b));

      const merged = withDistances(Array.from(byId.values()), origin);
      console.log(
        '📍 Map markers ready:',
        merged.length,
        '(network:',
        merged.filter((b) => b.source === 'network').length,
        'demo:',
        merged.filter((b) => b.source === 'demo').length,
        ')'
      );
      setBusinesses(merged);
      fittedOnce.current = false;
    } catch (error) {
      console.error('❌ Error loading businesses:', error);
      setBusinesses(withDistances(buildDemoBusinesses(), origin));
    } finally {
      setLoading(false);
    }
  }, [withDistances]);

  const filteredBusinesses = useMemo(() => {
    let filtered = businesses;

    if (activeFilter === 'farms') {
      filtered = filtered.filter((b) => b.role === 'farm');
    } else if (activeFilter === 'restaurants') {
      filtered = filtered.filter((b) => b.role === 'restaurant');
    }

    if (distanceFilter !== 'all' && userLocation) {
      const maxDistance = parseFloat(distanceFilter);
      filtered = filtered.filter((b) => typeof b.distance === 'number' && b.distance <= maxDistance);
    }

    return filtered;
  }, [businesses, activeFilter, distanceFilter, userLocation]);

  const fitMarkers = useCallback(
    (markers = filteredBusinesses) => {
      if (!mapRef.current || !markers.length) return;

      const coords = markers
        .filter((b) => Number.isFinite(b.latitude) && Number.isFinite(b.longitude))
        .map((b) => ({ latitude: b.latitude, longitude: b.longitude }));

      if (!coords.length) return;

      try {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 48, bottom: 200, left: 48 },
          animated: true,
        });
        fittedOnce.current = true;
      } catch (e) {
        console.warn('fitToCoordinates failed', e);
      }
    },
    [filteredBusinesses]
  );

  const getUserLocation = useCallback(
    async ({ silent = false, recenter = true } = {}) => {
      if (locationLoading) return;

      try {
        setLocationLoading(true);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!silent) {
            Alert.alert(
              'Location access needed',
              'Enable location to measure distances to nearby farms and kitchens. Demo partners still show on the map.',
              [{ text: 'OK' }]
            );
          }
          const fallback = { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude };
          setUserLocation(fallback);
          setBusinesses((prev) => withDistances(prev.length ? prev : buildDemoBusinesses(), fallback));
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 60000,
        });

        const userCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(userCoords);
        setBusinesses((prev) => withDistances(prev.length ? prev : buildDemoBusinesses(), userCoords));

        if (recenter && mapRef.current) {
          mapRef.current.animateToRegion(
            {
              ...userCoords,
              latitudeDelta: 0.18,
              longitudeDelta: 0.18,
            },
            700
          );
        }

        if (!silent) {
          Alert.alert('Location updated', 'Map centered on you. Distances use your current position.');
        }
      } catch (error) {
        console.error('❌ Error getting user location:', error);
        if (!silent) {
          Alert.alert(
            'Location unavailable',
            'Could not read your position. Showing the Baltimore–DC harvest area.'
          );
        }
        const fallback = { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude };
        setUserLocation(fallback);
        setBusinesses((prev) => withDistances(prev.length ? prev : buildDemoBusinesses(), fallback));
      } finally {
        setLocationLoading(false);
      }
    },
    [locationLoading, withDistances]
  );

  useEffect(() => {
    loadUserData();
    loadBusinesses();
    getUserLocation({ silent: true, recenter: false });
  }, []);

  // If onMapReady never fires (rare native glitch), drop the overlay anyway
  useEffect(() => {
    if (loading || mapReady) return;
    const t = setTimeout(() => setMapReady(true), 2500);
    return () => clearTimeout(t);
  }, [loading, mapReady]);

  // After markers load and map is ready, frame them once
  useEffect(() => {
    if (!mapReady || loading || !filteredBusinesses.length || fittedOnce.current) return;
    const t = setTimeout(() => fitMarkers(filteredBusinesses), 350);
    return () => clearTimeout(t);
  }, [mapReady, loading, filteredBusinesses, fitMarkers]);

  // iOS pinColor only reliably supports named colors (green/red/purple/…)
  const getMarkerColor = (role) => (role === 'farm' ? 'green' : 'orange');
  const getBusinessTypeLabel = (role) => (role === 'farm' ? 'Farm' : 'Kitchen');

  const getFilterOptions = () => {
    if (!userProfile) {
      return [
        { key: 'both', label: 'All partners' },
        { key: 'farms', label: 'Farms' },
        { key: 'restaurants', label: 'Kitchens' },
      ];
    }
    if (userProfile.role === 'farm') {
      return [
        { key: 'restaurants', label: 'Kitchens' },
        { key: 'both', label: 'All partners' },
      ];
    }
    return [
      { key: 'farms', label: 'Farms' },
      { key: 'both', label: 'All partners' },
    ];
  };

  const getDistanceOptions = () => [
    { key: 'all', label: 'Any distance' },
    { key: '5', label: '5 mi' },
    { key: '10', label: '10 mi' },
    { key: '25', label: '25 mi' },
    { key: '50', label: '50 mi' },
  ];

  const openDirections = (business) => {
    const { latitude, longitude, businessName, name, address, city } = business;
    const destination = `${latitude},${longitude}`;
    const fullAddress = encodeURIComponent(`${address || ''}, ${city || ''}`.trim());

    Alert.alert(
      'Get directions',
      `Navigate to ${businessName || name}\n${address || ''}, ${city || ''}\n${business.distance} mi away`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Google Maps',
          onPress: () => {
            const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${fullAddress || destination}`;
            Linking.openURL(googleUrl).catch(() => {
              Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
            });
          },
        },
        {
          text: 'Apple Maps',
          onPress: () => {
            Linking.openURL(`http://maps.apple.com/?daddr=${fullAddress || destination}&dirflg=d`).catch(() => {
              Linking.openURL(`http://maps.apple.com/?daddr=${destination}&dirflg=d`);
            });
          },
        },
        {
          text: 'Waze',
          onPress: () => Linking.openURL(`https://waze.com/ul?ll=${destination}&navigate=yes&zoom=17`),
        },
      ]
    );
  };

  const handleMarkerPress = (business) => {
    Alert.alert(
      `${business.businessName || business.name}`,
      `${getBusinessTypeLabel(business.role)}\n${business.address || ''}, ${business.city || ''}\n${business.distance} mi away${
        business.source === 'network' ? '\n· On your Plate2Farm network' : ''
      }`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Get directions', onPress: () => openDirections(business) },
      ]
    );
  };

  const findNearestBusiness = () => {
    if (!filteredBusinesses.length) {
      Alert.alert('No partners nearby', 'No businesses match your current filters.');
      return;
    }
    const nearest = filteredBusinesses.reduce((closest, current) =>
      current.distance < closest.distance ? current : closest
    );
    Alert.alert(
      'Nearest partner',
      `${nearest.businessName || nearest.name}\n${getBusinessTypeLabel(nearest.role)}\n${nearest.address || ''}, ${
        nearest.city || ''
      }\n${nearest.distance} mi away`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Get directions', onPress: () => openDirections(nearest) },
        {
          text: 'Show on map',
          onPress: () => {
            mapRef.current?.animateToRegion(
              {
                latitude: nearest.latitude,
                longitude: nearest.longitude,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              },
              600
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Nearby</Text>
          <Text style={styles.subtitle}>Charting harvest partners…</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading map markers…</Text>
        </View>
      </View>
    );
  }

  const farmCount = filteredBusinesses.filter((b) => b.role === 'farm').length;
  const kitchenCount = filteredBusinesses.filter((b) => b.role === 'restaurant').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Nearby</Text>
          <Text style={styles.subtitle}>
            {filteredBusinesses.length} partners · {farmCount} farms · {kitchenCount} kitchens
          </Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={USE_GOOGLE_PROVIDER ? PROVIDER_GOOGLE : undefined}
          mapType="standard"
          initialRegion={DEFAULT_REGION}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          rotateEnabled
          scrollEnabled
          zoomEnabled
          pitchEnabled={false}
          moveOnMarkerPress={false}
          loadingEnabled
          loadingIndicatorColor={colors.primary}
          loadingBackgroundColor={colors.surfaceSoft}
          onMapReady={() => {
            console.log('🗺️ Map ready', USE_GOOGLE_PROVIDER ? 'google' : 'apple/default');
            setMapReady(true);
          }}
        >
          {filteredBusinesses.map((business) => (
            <Marker
              key={business.id}
              coordinate={{
                latitude: business.latitude,
                longitude: business.longitude,
              }}
              title={business.businessName || business.name}
              description={`${getBusinessTypeLabel(business.role)} · ${business.distance} mi · tap for directions`}
              pinColor={getMarkerColor(business.role)}
              onCalloutPress={() => handleMarkerPress(business)}
              tracksViewChanges={false}
            />
          ))}
        </MapView>

        {!mapReady && (
          <View style={styles.mapLoadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.mapLoadingText}>
              {USE_GOOGLE_PROVIDER ? 'Loading Google Maps…' : 'Loading map…'}
            </Text>
          </View>
        )}

        {/* Legend */}
        <View style={styles.legendCard}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Farm</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text style={styles.legendText}>Kitchen</Text>
          </View>
          <Text style={styles.legendCount}>{filteredBusinesses.length} shown</Text>
        </View>

        {/* Filters */}
        <View style={styles.controlsStack}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {getFilterOptions().map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.filterButton, activeFilter === option.key && styles.filterButtonActive]}
                onPress={() => {
                  setActiveFilter(option.key);
                  fittedOnce.current = false;
                }}
              >
                <Text
                  style={[styles.filterText, activeFilter === option.key && styles.filterTextActive]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

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
                  distanceFilter === option.key && styles.distanceFilterButtonActive,
                ]}
                onPress={() => {
                  setDistanceFilter(option.key);
                  fittedOnce.current = false;
                }}
              >
                <Text
                  style={[
                    styles.distanceFilterText,
                    distanceFilter === option.key && styles.distanceFilterTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.fitFab}
          onPress={() => {
            fittedOnce.current = false;
            fitMarkers(filteredBusinesses);
          }}
        >
          <Text style={styles.fabTitle}>Fit</Text>
          <Text style={styles.fabSub}>Marks</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nearestFab} onPress={findNearestBusiness}>
          <Text style={styles.fabTitle}>Near</Text>
          <Text style={styles.fabSub}>est</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.locationFab, locationLoading && styles.locationFabLoading]}
          onPress={() => getUserLocation({ silent: false, recenter: true })}
          disabled={locationLoading}
        >
          <Text style={styles.fabTitle}>{locationLoading ? '…' : 'Me'}</Text>
          <Text style={styles.fabSub}>{locationLoading ? 'GPS' : 'Locate'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    ...shadows.soft,
    zIndex: 2,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.primarySoft,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  // Tab bar is position:absolute — shrink map so filters sit above it
  mapContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.surfaceSoft,
    overflow: 'hidden',
    marginBottom: Platform.OS === 'ios' ? 96 : 88,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(242, 245, 240, 0.72)',
    gap: spacing.sm,
  },
  mapLoadingText: {
    ...typography.caption,
    color: colors.inkSoft,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.muted,
  },
  legendCard: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.soft,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: colors.inkSoft,
    fontWeight: '600',
  },
  legendCount: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  controlsStack: {
    position: 'absolute',
    bottom: spacing.md + (Platform.OS === 'ios' ? 8 : 4),
    left: 0,
    right: 0,
    gap: 8,
  },
  filterScrollContent: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  filterButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.soft,
  },
  filterButtonActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  filterText: {
    fontSize: 12,
    color: colors.inkSoft,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.white,
  },
  distanceFilterButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.soft,
  },
  distanceFilterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  distanceFilterText: {
    fontSize: 12,
    color: colors.inkSoft,
    fontWeight: '600',
  },
  distanceFilterTextActive: {
    color: colors.white,
  },
  fitFab: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primaryDark,
    borderRadius: radii.lg,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadows.float,
  },
  nearestFab: {
    position: 'absolute',
    top: spacing.md + 68,
    right: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadows.float,
  },
  locationFab: {
    position: 'absolute',
    top: spacing.md + 136,
    right: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadows.float,
  },
  locationFabLoading: {
    backgroundColor: colors.muted,
  },
  fabTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  fabSub: {
    fontSize: 9,
    color: colors.white,
    fontWeight: '600',
    opacity: 0.9,
  },
});
