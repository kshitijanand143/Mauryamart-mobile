import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { CONFIG } from '../config';

export default function LoadingIndicator() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={CONFIG.THEME_COLOR} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:        'absolute',
    top:             0, left: 0, right: 0, bottom: 0,
    justifyContent:  'center',
    alignItems:      'center',
    backgroundColor: '#ffffff',
    zIndex:          999,
  },
});
