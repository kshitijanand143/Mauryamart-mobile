import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Camera from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';

import WebViewScreen from './src/screens/WebViewScreen';
import OfflineScreen from './src/components/OfflineScreen';
import { CONFIG } from './src/config';

// Keep splash visible until ready
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appReady,   setAppReady]   = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Request all permissions
        await requestPermissions();

        // Network listener
        NetInfo.addEventListener(state => {
          setIsConnected(state.isConnected ?? true);
        });

        // Check current network
        const net = await NetInfo.fetch();
        setIsConnected(net.isConnected ?? true);

      } catch (e) {
        console.warn('Init error:', e);
      } finally {
        setAppReady(true);
      }
    };

    init();
  }, []);

  const requestPermissions = async () => {
    try {
      // Camera
      await Camera.requestCameraPermissionsAsync();

      // Location
      await Location.requestForegroundPermissionsAsync();

      // Notifications
      await Notifications.requestPermissionsAsync();

      // Media library (for file uploads)
      await MediaLibrary.requestPermissionsAsync();

    } catch (e) {
      console.warn('Permission error:', e);
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <SafeAreaProvider>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={CONFIG.THEME_COLOR}
          translucent={false}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {isConnected ? (
            <WebViewScreen isConnected={isConnected} />
          ) : (
            <OfflineScreen onRetry={async () => {
              const net = await NetInfo.fetch();
              setIsConnected(net.isConnected ?? false);
            }} />
          )}
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: CONFIG.THEME_COLOR,
  },
  safeArea: {
    flex:            1,
    backgroundColor: '#ffffff',
  },
});
