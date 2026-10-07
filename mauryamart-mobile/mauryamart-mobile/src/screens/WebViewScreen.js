import React, { useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  BackHandler,
  Alert,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { CONFIG } from '../config';
import LoadingIndicator from '../components/LoadingIndicator';
import OfflineScreen from '../components/OfflineScreen';

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function WebViewScreen({ isConnected = true }) {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  // ── Back button handling ──────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit Mauryamart?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ]
        );
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => subscription.remove();
    }, [canGoBack])
  );

  // ── Handle external URLs ──────────────────────────────────────────────────
  const handleNavigation = (request) => {
    const { url } = request;

    if (url.startsWith('tel:')) {
      Linking.openURL(url);
      return false;
    }
    if (url.startsWith('mailto:')) {
      Linking.openURL(url);
      return false;
    }
    if (url.includes('wa.me') || url.includes('whatsapp')) {
      Linking.openURL(url);
      return false;
    }
    if (url.startsWith('upi://') || url.startsWith('gpay://') || url.startsWith('paytm://')) {
      Linking.openURL(url).catch(() => Alert.alert('App not found', 'Please install the payment app.'));
      return false;
    }
    if (!url.includes('mauryamart.in') && !url.startsWith('about:') && !url.startsWith('blob:') && !url.startsWith('data:')) {
      Linking.openURL(url);
      return false;
    }

    return true;
  };

  // ── JS injected into WebView ──────────────────────────────────────────────
  const INJECTED_JS = `
    (function() {
      document.body.style.webkitUserSelect = 'none';
      document.body.style.userSelect = 'none';
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'PAGE_LOADED', url: window.location.href })
      );
      true;
    })();
  `;

  // ── Handle messages from WebView ──────────────────────────────────────────
  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'REQUEST_LOCATION') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          webViewRef.current?.injectJavaScript(`
            window.dispatchEvent(new CustomEvent('nativeLocation', {
              detail: { lat: ${loc.coords.latitude}, lng: ${loc.coords.longitude} }
            })); true;
          `);
        }
      }
      if (data.type === 'REQUEST_NOTIFICATION') {
        await Notifications.requestPermissionsAsync();
      }
    } catch {}
  };

  if (!isConnected) {
    return <OfflineScreen onRetry={() => webViewRef.current?.reload()} />;
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: CONFIG.APP_URL }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        javaScriptCanOpenWindowsAutomatically={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        allowsBackForwardNavigationGestures={true}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        applicationNameForUserAgent={CONFIG.USER_AGENT}
        geolocationEnabled={true}
        startInLoadingState={false}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
        onShouldStartLoadWithRequest={handleNavigation}
        onMessage={handleMessage}
        injectedJavaScript={INJECTED_JS}
        onError={(e) => {
          console.warn('WebView error:', e.nativeEvent);
          setLoading(false);
        }}
        androidHardwareAccelerationDisabled={false}
        androidLayerType="hardware"
        overScrollMode="never"
        scalesPageToFit={false}
        setSupportMultipleWindows={true}
        onCreateWindow={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          const { targetUrl } = nativeEvent;
          if (targetUrl && webViewRef.current) {
            webViewRef.current.injectJavaScript(`window.location.href = '${targetUrl}';`);
          }
          return false;
        }}
      />
      {loading && <LoadingIndicator />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
});