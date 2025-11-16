import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const Logo = ({ size = 'medium', style = {} }) => {
  const getLogoSize = () => {
    switch (size) {
      case 'small':
        return { width: 80, height: 40 };
      case 'medium':
        return { width: 120, height: 60 };
      case 'large':
        return { width: 160, height: 80 };
      default:
        return { width: 120, height: 60 };
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../assets/L2P_1.png')}
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
  },
  logo: {
    // Additional styling can be added here if needed
  },
});

export default Logo;
