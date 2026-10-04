import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import * as SplashScreen from 'expo-splash-screen';
import { PermissionsAndroid, Platform } from 'react-native';

import WebViewScreen from './src/screens/WebViewScreen';
import OfflineScreen from './src/components/OfflineScreen';
import { CONFIG } from './src/config';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appReady,    setAppReady]    = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Network
        const net = await NetInfo.fetch();
        setIsConnected(net.isConnected ?? true);
        NetInfo.addEventListener(state => {
          setIsConnected(state.isConnected ?? true);
        });

        // Android permissions
        if (Platform.OS === 'android') {
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          ]);
        }
      } catch (e) {
        console.warn('Init error:', e);
      } finally {
        setAppReady(true);
      }
    };
    init();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) await SplashScreen.hideAsync();
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
          {isConnected
            ? <WebViewScreen isConnected={isConnected} />
            : <OfflineScreen onRetry={async () => {
                const net = await NetInfo.fetch();
                setIsConnected(net.isConnected ?? false);
              }} />
          }
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CONFIG.THEME_COLOR },
  safeArea:  { flex: 1, backgroundColor: '#ffffff' },
});