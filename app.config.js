/**
 * Expo config — reads optional Google Maps keys from env for native builds.
 * Expo Go on iOS uses Apple Maps (Google Maps on iOS needs a dev client + key).
 * Expo Go on Android uses Google Maps with Expo's bundled key.
 */
const appJson = require('./app.json');

module.exports = () => {
  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    '';

  return {
    ...appJson.expo,
    ios: {
      ...appJson.expo.ios,
      ...(googleMapsApiKey
        ? {
            config: {
              ...(appJson.expo.ios?.config || {}),
              googleMapsApiKey,
            },
          }
        : {}),
    },
    android: {
      ...appJson.expo.android,
      ...(googleMapsApiKey
        ? {
            config: {
              ...(appJson.expo.android?.config || {}),
              googleMaps: {
                apiKey: googleMapsApiKey,
              },
            },
          }
        : {}),
    },
  };
};
