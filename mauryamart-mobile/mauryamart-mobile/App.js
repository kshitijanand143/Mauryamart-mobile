import React, { useState, useEffect, useCallback } from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import NetInfo from '@react-native-community/netinfo';
import WebViewScreen from './src/screens/WebViewScreen';
import OfflineScreen from './src/components/OfflineScreen';
import { CONFIG } from './src/config';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [ready, setReady] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    let unsubscribe = null;
    let mounted = true;

    const init = async () => {
      try {
        const state = await NetInfo.fetch();
        if (mounted) {
          setIsConnected(state.isConnected !== false);
        }
        unsubscribe = NetInfo.addEventListener((s) => {
          if (mounted) {
            setIsConnected(s.isConnected !== false);
          }
        });
      } catch {
        if (mounted) setIsConnected(true);
      } finally {
        if (mounted) setReady(true);
      }
    };

    init();

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  const onLayout = useCallback(async () => {
    if (ready) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: CONFIG.THEME_COLOR }} onLayout={onLayout}>
        <StatusBar backgroundColor={CONFIG.THEME_COLOR} barStyle="light-content" translucent={false} />
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
          {isConnected ? (
            <WebViewScreen />
          ) : (
            <OfflineScreen
              onRetry={async () => {
                try {
                  const s = await NetInfo.fetch();
                  setIsConnected(s.isConnected !== false);
                } catch {
                  setIsConnected(true);
                }
              }}
            />
          )}
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}
