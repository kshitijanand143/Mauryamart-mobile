import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { CONFIG } from '../config';

export default function OfflineScreen({ onRetry }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.title}>No Internet Connection</Text>
      <Text style={styles.subtitle}>
        Please check your connection and try again.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
    backgroundColor: '#f9fafb',
    padding:         32,
  },
  icon: {
    fontSize:     72,
    marginBottom: 24,
  },
  title: {
    fontSize:     22,
    fontWeight:   '700',
    color:        '#111827',
    marginBottom: 8,
    textAlign:    'center',
  },
  subtitle: {
    fontSize:     15,
    color:        '#6b7280',
    textAlign:    'center',
    lineHeight:   22,
    marginBottom: 36,
  },
  button: {
    backgroundColor: CONFIG.THEME_COLOR,
    paddingHorizontal: 40,
    paddingVertical:   14,
    borderRadius:      16,
    elevation:         2,
  },
  buttonText: {
    color:      '#ffffff',
    fontSize:   16,
    fontWeight: '700',
  },
});
