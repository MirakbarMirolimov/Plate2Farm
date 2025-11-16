# Maps Setup Instructions

## Current Status
The map component has been updated to use React Native Maps with Google Maps integration.

## Installation
`react-native-maps` is currently being installed. Once complete, you'll need to configure it.

## Configuration Required

### 1. Android Setup (android/app/src/main/AndroidManifest.xml)
Add Google Maps API key:
```xml
<application>
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
</application>
```

### 2. iOS Setup (ios/YourApp/AppDelegate.m)
Add Google Maps API key:
```objc
#import <GoogleMaps/GoogleMaps.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"YOUR_GOOGLE_MAPS_API_KEY"];
  return YES;
}
```

### 3. Get Google Maps API Key
1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable Maps SDK for Android and iOS
4. Create credentials (API Key)
5. Restrict the key to your app's bundle ID

## Features Implemented

### Map Features
- ✅ Real Google Maps integration
- ✅ Color-coded markers (Green = Farms, Blue = Restaurants)
- ✅ Interactive markers with business info
- ✅ User location display
- ✅ Map controls (zoom, pan, my location button)

### Business Markers
- ✅ **Farms**: Green markers with 🚜 icon
- ✅ **Restaurants**: Blue markers with 🍽️ icon
- ✅ Tap markers to see business details
- ✅ Tap callouts for contact/directions

### Interactive Elements
- ✅ **Business Info Card**: Shows when marker is selected
- ✅ **Contact Button**: Shows business email and info
- ✅ **Directions Button**: Opens Google Maps for navigation
- ✅ **Legend**: Shows marker color meanings
- ✅ **Close Button**: Dismiss business info card

## Mock Data
Currently using mock coordinates around NYC area for demonstration. In production, you would:
1. Store real business coordinates in your database
2. Use geocoding to convert addresses to coordinates
3. Implement location-based queries for nearby businesses

## Testing
The map should work immediately after react-native-maps installation completes, showing:
- Map centered on NYC
- Mock business markers spread around the area
- Interactive features for all markers
