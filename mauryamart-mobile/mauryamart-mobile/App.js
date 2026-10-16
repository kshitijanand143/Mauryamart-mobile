import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, StatusBar, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import NetInfo from '@react-native-community/netinfo';
import WebViewScreen from './src/screens/WebViewScreen';

SplashScreen.preventAutoHideAsync();

function OfflineScreen({ onRetry }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <Text style={{ fontSize: 64, marginBottom: 16 }}>📡</Text>
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 8 }}>No Internet</Text>
      <Text style={{ fontSize: 15, color: '#666', marginBottom: 32, textAlign: 'center' }}>Please check your connection</Text>
      <TouchableOpacity onPress={onRetry} style={{ backgroundColor: '#f97316', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 16 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

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
      <View style={{ flex: 1, backgroundColor: '#f97316' }} onLayout={onLayout}>
        <StatusBar backgroundColor="#f97316" barStyle="light-content" translucent={false} />
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
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
