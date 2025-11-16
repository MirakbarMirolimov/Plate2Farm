import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Dimensions, Animated } from 'react-native';

const { width } = Dimensions.get('window');

// Custom Icon Components with Bigger Size
const ListingsIcon = ({ focused, size = 32 }) => (
  <View style={{
    width: size + 8,
    height: size + 8,
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <View style={{
      width: size,
      height: size,
      backgroundColor: focused ? '#10b981' : '#22c55e',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: focused ? '#10b981' : '#22c55e',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    }}>
      <Text style={{
        color: '#ffffff',
        fontSize: size * 0.5,
        fontWeight: '900',
      }}>
        ≡
      </Text>
    </View>
  </View>
);

const MapIcon = ({ focused, size = 32 }) => (
  <View style={{
    width: size + 8,
    height: size + 8,
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <View style={{
      width: size,
      height: size,
      backgroundColor: focused ? '#10b981' : '#22c55e',
      borderRadius: size * 0.5,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: focused ? '#10b981' : '#22c55e',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    }}>
      <Text style={{
        color: '#ffffff',
        fontSize: size * 0.6,
        fontWeight: '900',
      }}>
        ●
      </Text>
    </View>
  </View>
);

const ProfileIcon = ({ focused, size = 32 }) => (
  <View style={{
    width: size + 8,
    height: size + 8,
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <View style={{
      width: size,
      height: size,
      backgroundColor: focused ? '#10b981' : '#22c55e',
      borderRadius: size * 0.5,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: focused ? '#10b981' : '#22c55e',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    }}>
      <View style={{
        width: size * 0.35,
        height: size * 0.35,
        backgroundColor: '#ffffff',
        borderRadius: size * 0.175,
        marginBottom: 3,
      }} />
      <View style={{
        width: size * 0.6,
        height: size * 0.25,
        backgroundColor: '#ffffff',
        borderRadius: size * 0.125,
      }} />
    </View>
  </View>
);

// Simple Icon Component with Clean Animation
const TabIcon = ({ iconType, color, focused, size = 32 }) => {
  const scaleAnim = new Animated.Value(focused ? 1.1 : 1);

  React.useEffect(() => {
    // Simple scale animation
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  const renderIcon = () => {
    switch (iconType) {
      case 'listings':
        return <ListingsIcon focused={focused} size={size} />;
      case 'map':
        return <MapIcon focused={focused} size={size} />;
      case 'profile':
        return <ProfileIcon focused={focused} size={size} />;
      default:
        return <ListingsIcon focused={focused} size={size} />;
    }
  };

  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Simple Icon Container with Scale Animation */}
      <Animated.View style={{
        transform: [{ scale: scaleAnim }],
      }}>
        {renderIcon()}
      </Animated.View>
    </View>
  );
};

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#10b981',
          tabBarInactiveTintColor: '#22c55e',
          tabBarStyle: {
            backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundColor: '#6366f1', // Vibrant indigo gradient
            borderRadius: 30,
            marginHorizontal: 20,
            marginBottom: 25,
            paddingBottom: 12,
            paddingTop: 12,
            height: 95,
            shadowColor: '#6366f1',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 15,
            borderTopWidth: 0,
            borderWidth: 3,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '700',
            marginTop: 6,
            letterSpacing: 0.3,
          },
          tabBarItemStyle: {
            paddingVertical: 8,
            paddingHorizontal: 4,
            borderRadius: 20,
            marginHorizontal: 8,
          },
          tabBarBackground: () => (
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(99, 102, 241, 0.95)',
              borderRadius: 30,
              backdropFilter: 'blur(20px)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Decorative Elements */}
              <View style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }} />
              <View style={{
                position: 'absolute',
                bottom: -15,
                left: -15,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }} />
              <View style={{
                position: 'absolute',
                top: 10,
                left: '50%',
                width: 80,
                height: 2,
                borderRadius: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                transform: [{ translateX: -40 }],
              }} />
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="listings"
          options={{
            title: 'Listings',
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon 
                iconType="listings" 
                color={color} 
                focused={focused} 
                size={size} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon 
                iconType="map" 
                color={color} 
                focused={focused} 
                size={size} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon 
                iconType="profile" 
                color={color} 
                focused={focused} 
                size={size} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="create-listing"
          options={{
            href: null, // Hide from tab bar
            title: 'Create Listing',
          }}
        />
      </Tabs>
    </View>
  );
}
