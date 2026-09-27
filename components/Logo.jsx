import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { radii } from '../constants/theme';

const Logo = ({ size = 'medium', style = {} }) => {
  const getLogoSize = () => {
    // main_logo.png is roughly square — keep height-driven sizing
    switch (size) {
      case 'small':
        return { width: 72, height: 72 };
      case 'medium':
        return { width: 112, height: 112 };
      case 'large':
        return { width: 148, height: 148 };
      default:
        return { width: 112, height: 112 };
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../assets/main_logo.png')}
        style={[styles.logo, getLogoSize()]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  logo: {
    // Keep image clean; parent screens supply card chrome
  },
});

export default Logo;
