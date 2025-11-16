# Location Setup Instructions

## Current Status
The map functionality is temporarily using mock data because `expo-location` is still being installed.

## Once expo-location installation completes:

1. **Uncomment the import in `app/(tabs)/map.jsx`:**
   ```javascript
   import * as Location from 'expo-location';
   ```

2. **Uncomment the location permission request:**
   ```javascript
   const { status } = await Location.requestForegroundPermissionsAsync();
   ```

3. **Uncomment the real location fetching:**
   ```javascript
   const currentLocation = await Location.getCurrentPositionAsync({
     accuracy: Location.Accuracy.Balanced,
   });
   ```

4. **Remove the mock location data**

## Current Mock Behavior
- Uses New York City coordinates (40.7128, -74.0060)
- Shows simulated nearby businesses
- All other functionality works normally

## Testing
The app should build and run now with the mock location data. Once expo-location is installed, you can enable real location services.
