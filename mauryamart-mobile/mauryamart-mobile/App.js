import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import NetInfo from '@react-native-community/netinfo';
import WebViewScreen from './src/screens/WebViewScreen';
import OfflineScreen from './src/components/OfflineScreen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [ready,       setReady]       = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const state = await NetInfo.fetch();
        setIsConnected(state.isConnected ?? true);
        NetInfo.addEventListener(s => setIsConnected(s.isConnected ?? true));
      } catch {}
      finally { setReady(true); }
    };
    init();
  }, []);

  const onLayout = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <View style={styles.root} onLayout={onLayout}>
        <StatusBar backgroundColor="#f97316" barStyle="light-content" translucent={false} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          {isConnected
            ? <WebViewScreen />
            : <OfflineScreen onRetry={async () => {
                const s = await NetInfo.fetch();
                setIsConnected(s.isConnected ?? false);
              }} />
          }
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f97316' },
  safe: { flex: 1, backgroundColor: '#fff' },
});
