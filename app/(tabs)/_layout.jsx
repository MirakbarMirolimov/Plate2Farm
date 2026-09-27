import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadows } from '../../constants/theme';

/** Clean geometric tab icons drawn with Views (no extra icon dependency). */
function FeedIcon({ color, focused }) {
  return (
    <View style={styles.iconCanvas}>
      <View style={[styles.feedBar, styles.feedBarTop, { backgroundColor: color, opacity: focused ? 1 : 0.95 }]} />
      <View style={[styles.feedBar, styles.feedBarMid, { backgroundColor: color }]} />
      <View style={[styles.feedBar, styles.feedBarBot, { backgroundColor: color }]} />
      <View style={[styles.feedDot, { backgroundColor: color }]} />
    </View>
  );
}

function NearbyIcon({ color, focused }) {
  return (
    <View style={styles.iconCanvas}>
      <View style={[styles.pinOuter, { borderColor: color, backgroundColor: focused ? colors.primarySoft : 'transparent' }]}>
        <View style={[styles.pinInner, { backgroundColor: color }]} />
      </View>
      <View style={[styles.pinPoint, { borderTopColor: color }]} />
    </View>
  );
}

function AccountIcon({ color, focused }) {
  return (
    <View style={styles.iconCanvas}>
      <View style={[styles.avatarHead, { borderColor: color, backgroundColor: focused ? colors.primarySoft : 'transparent' }]} />
      <View style={[styles.avatarBody, { borderColor: color, backgroundColor: focused ? colors.primarySoft : 'transparent' }]} />
    </View>
  );
}

function TabIcon({ type, focused }) {
  const active = focused ? colors.white : colors.primary;
  const wrapStyle = [styles.iconWrap, focused && styles.iconWrapFocused];

  return (
    <View style={wrapStyle}>
      {type === 'feed' && <FeedIcon color={active} focused={focused} />}
      {type === 'nearby' && <NearbyIcon color={active} focused={focused} />}
      {type === 'account' && <AccountIcon color={active} focused={focused} />}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 10);

  return (
    <View style={styles.root}>
      <Tabs
        safeAreaInsets={{ bottom: 0, top: 0, left: 0, right: 0 }}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primaryDark,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: [
            styles.tabBar,
            {
              height: 72 + bottomPad,
              paddingBottom: bottomPad,
            },
          ],
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          tabBarBackground: () => (
            <View style={styles.tabBarBg}>
              <View style={styles.tabBarSheen} />
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="listings"
          options={{
            title: 'Feed',
            tabBarIcon: ({ focused }) => <TabIcon type="feed" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Nearby',
            tabBarIcon: ({ focused }) => <TabIcon type="nearby" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Account',
            tabBarIcon: ({ focused }) => <TabIcon type="account" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="create-listing"
          options={{
            href: null,
            title: 'Create Listing',
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderWidth: 0,
    paddingTop: 10,
    paddingHorizontal: 6,
    ...shadows.float,
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    overflow: 'hidden',
  },
  tabBarSheen: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: colors.primarySoft,
    opacity: 0.9,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  tabItem: {
    paddingVertical: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  iconWrapFocused: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
    ...shadows.soft,
  },
  iconCanvas: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedBar: {
    height: 2.5,
    borderRadius: 2,
    marginVertical: 1.5,
  },
  feedBarTop: {
    width: 16,
    alignSelf: 'flex-start',
    marginLeft: 3,
  },
  feedBarMid: {
    width: 18,
  },
  feedBarBot: {
    width: 12,
    alignSelf: 'flex-start',
    marginLeft: 3,
  },
  feedDot: {
    position: 'absolute',
    right: 1,
    top: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  pinOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -1,
  },
  pinInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  pinPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  avatarHead: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    marginBottom: 2,
  },
  avatarBody: {
    width: 16,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 0,
  },
});
