# Google Maps Setup Guide

## Overview
Your Plate2Farm app now has react-native-maps installed and configured! The map will show a basic map view, but for full Google Maps features, you'll need a Google Maps API key.

## Current Status ✅
- ✅ react-native-maps installed
- ✅ Real interactive map enabled
- ✅ Business markers with color coding
- ✅ User location support
- ✅ Map controls (zoom, pan, etc.)

## Optional: Google Maps API Key Setup

### 1. Get a Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Maps JavaScript API (for web)
4. Create credentials → API Key
5. Restrict the API key to your app's bundle ID

### 2. Add API Key to Your App (Optional)
If you want enhanced Google Maps features, add this to your `app.json`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_API_KEY"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_IOS_API_KEY"
      }
    }
  }
}
```

## What Works Without API Key ✅
- Basic map display
- Zoom and pan controls
- Custom markers
- User location (with permission)
- Map gestures and interactions

## What Requires API Key 🔑
- Satellite view
- Street view
- Places API integration
- Geocoding services
- Enhanced styling options

## Testing Your Map
1. Run `npm start` or `expo start`
2. Open on device/simulator
3. Navigate to the Map tab
4. You should see:
   - Interactive map centered on NYC
   - Green markers for farms
   - Blue markers for restaurants
   - Legend in top-right corner
   - Business list below the map

## Troubleshooting
- If map doesn't load: Check internet connection
- If markers don't show: Check console for data loading errors
- If location doesn't work: Grant location permissions in device settings
