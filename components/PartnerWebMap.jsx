import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Cross-platform map via Leaflet + OpenStreetMap inside a WebView.
 * Used on Android because Expo Go ships an expired Google Maps API key
 * (native react-native-maps tiles stay blank). Works without any API key.
 */
function buildHtml({ centerLat, centerLng, zoom }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #e8efe6; }
    .leaflet-container { background: #e8efe6; font-family: -apple-system, system-ui, sans-serif; }
    .pin {
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2.5px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
    }
    .pin span {
      transform: rotate(45deg);
      color: #fff; font-weight: 800; font-size: 12px; line-height: 1;
    }
    .pin-farm { background: #1F6B4A; }
    .pin-kitchen { background: #C45C26; }
    .pin-user {
      width: 16px; height: 16px; border-radius: 50%;
      background: #2563eb; border: 3px solid #fff;
      box-shadow: 0 0 0 6px rgba(37,99,235,0.25);
      transform: none;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function () {
      var map = L.map('map', {
        zoomControl: true,
        attributionControl: true
      }).setView([${centerLat}, ${centerLng}], ${zoom});

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      var markerLayer = L.layerGroup().addTo(map);
      var userMarker = null;
      var markerIndex = {};

      function post(type, payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
        }
      }

      function makeIcon(role) {
        var isFarm = role === 'farm';
        var cls = isFarm ? 'pin pin-farm' : 'pin pin-kitchen';
        var label = isFarm ? 'F' : 'K';
        return L.divIcon({
          className: '',
          html: '<div class="' + cls + '"><span>' + label + '</span></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -24]
        });
      }

      window.__setMarkers = function (items) {
        markerLayer.clearLayers();
        markerIndex = {};
        if (!items || !items.length) return;
        items.forEach(function (m) {
          if (typeof m.latitude !== 'number' || typeof m.longitude !== 'number') return;
          var marker = L.marker([m.latitude, m.longitude], { icon: makeIcon(m.role) });
          var title = m.title || 'Partner';
          var desc = m.description || '';
          marker.bindPopup('<strong>' + title + '</strong><br/>' + desc);
          marker.on('click', function () {
            post('markerPress', { id: m.id });
          });
          marker.addTo(markerLayer);
          markerIndex[m.id] = marker;
        });
      };

      window.__setUserLocation = function (lat, lng) {
        if (typeof lat !== 'number' || typeof lng !== 'number') return;
        if (userMarker) {
          userMarker.setLatLng([lat, lng]);
        } else {
          userMarker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: '',
              html: '<div class="pin-user"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            }),
            zIndexOffset: 1000
          }).addTo(map);
        }
      };

      window.__fitBounds = function (coords) {
        if (!coords || !coords.length) return;
        var bounds = L.latLngBounds(coords.map(function (c) {
          return [c.latitude, c.longitude];
        }));
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13, animate: true });
      };

      window.__animateTo = function (lat, lng, zoom) {
        map.setView([lat, lng], zoom || 13, { animate: true });
      };

      map.whenReady(function () {
        post('ready', {});
      });

      // Nudge size after layout (Android WebView quirk)
      setTimeout(function () { map.invalidateSize(true); }, 200);
      setTimeout(function () { map.invalidateSize(true); }, 800);
    })();
  </script>
</body>
</html>`;
}

const PartnerWebMap = forwardRef(function PartnerWebMap(
  {
    style,
    initialRegion,
    markers = [],
    userLocation = null,
    onMapReady,
    onMarkerPress,
  },
  ref
) {
  const webRef = useRef(null);
  const readyRef = useRef(false);
  const pendingRef = useRef([]);

  const centerLat = initialRegion?.latitude ?? 39.0458;
  const centerLng = initialRegion?.longitude ?? -76.6413;
  const zoom = 10;

  const html = useMemo(
    () => buildHtml({ centerLat, centerLng, zoom }),
    [centerLat, centerLng, zoom]
  );

  const runJs = useCallback((code) => {
    if (!webRef.current) return;
    if (!readyRef.current) {
      pendingRef.current.push(code);
      return;
    }
    webRef.current.injectJavaScript(`${code}\ntrue;`);
  }, []);

  const flushPending = useCallback(() => {
    const queue = pendingRef.current;
    pendingRef.current = [];
    queue.forEach((code) => {
      webRef.current?.injectJavaScript(`${code}\ntrue;`);
    });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      fitToCoordinates(coords = [], _options) {
        const clean = (coords || []).filter(
          (c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude)
        );
        runJs(`window.__fitBounds && window.__fitBounds(${JSON.stringify(clean)});`);
      },
      animateToRegion(region) {
        if (!region || !Number.isFinite(region.latitude) || !Number.isFinite(region.longitude)) return;
        const z =
          region.latitudeDelta && region.latitudeDelta < 0.25
            ? 13
            : region.latitudeDelta && region.latitudeDelta < 0.6
              ? 11
              : 10;
        runJs(
          `window.__animateTo && window.__animateTo(${region.latitude}, ${region.longitude}, ${z});`
        );
      },
    }),
    [runJs]
  );

  // Push markers
  useEffect(() => {
    const payload = (markers || []).map((m) => ({
      id: m.id,
      latitude: m.latitude,
      longitude: m.longitude,
      role: m.role,
      title: m.businessName || m.name || 'Partner',
      description: m.description || '',
    }));
    runJs(`window.__setMarkers && window.__setMarkers(${JSON.stringify(payload)});`);
  }, [markers, runJs]);

  // Push user location
  useEffect(() => {
    if (!userLocation) return;
    if (!Number.isFinite(userLocation.latitude) || !Number.isFinite(userLocation.longitude)) return;
    runJs(
      `window.__setUserLocation && window.__setUserLocation(${userLocation.latitude}, ${userLocation.longitude});`
    );
  }, [userLocation, runJs]);

  const onMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'ready') {
          readyRef.current = true;
          flushPending();
          onMapReady?.();
        } else if (data.type === 'markerPress' && data.payload?.id) {
          onMarkerPress?.(data.payload.id);
        }
      } catch {
        // ignore malformed messages
      }
    },
    [flushPending, onMapReady, onMarkerPress]
  );

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowsInlineMediaPlayback
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
        nestedScrollEnabled
        onLoadEnd={() => {
          // Fallback ready if postMessage is delayed
          setTimeout(() => {
            if (!readyRef.current) {
              readyRef.current = true;
              flushPending();
              onMapReady?.();
            }
            webRef.current?.injectJavaScript(
              'try{ var maps=document.querySelectorAll(".leaflet-container"); maps.forEach(function(){}); if (window.L) { /* force reflow */ window.dispatchEvent(new Event("resize")); } }catch(e){}; true;'
            );
          }, 400);
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#e8efe6',
  },
  web: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default PartnerWebMap;
