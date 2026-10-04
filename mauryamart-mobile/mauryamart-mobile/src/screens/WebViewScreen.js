import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  BackHandler,
  RefreshControl,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
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
    shouldSetBadge:  true,
  }),
});

export default function WebViewScreen({ isConnected }) {
  const webViewRef  = useRef(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  // ── Back button handling ──────────────────────────────────────────────────
  useEffect(() => {
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
  BackHandler.addEventListener('hardwareBackPress', onBack);
  return () => BackHandler.removeEventListener('hardwareBackPress', onBack);
}, [canGoBack]);

  // ── Pull to refresh ───────────────────────────────────────────────────────
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    webViewRef.current?.reload();
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  // ── Handle external URLs ──────────────────────────────────────────────────
  const handleNavigation = (request) => {
    const { url } = request;

    // tel: links — open dialer
    if (url.startsWith('tel:')) {
      Linking.openURL(url);
      return false;
    }

    // mailto: links
    if (url.startsWith('mailto:')) {
      Linking.openURL(url);
      return false;
    }

    // whatsapp links
    if (url.includes('wa.me') || url.includes('whatsapp')) {
      Linking.openURL(url);
      return false;
    }

    // upi:// links
    if (url.startsWith('upi://') || url.startsWith('gpay://') || url.startsWith('paytm://')) {
      Linking.openURL(url).catch(() => Alert.alert('App not found', 'Please install the payment app.'));
      return false;
    }

    // External URLs — open in browser
    if (!url.includes('mauryamart.in') && !url.startsWith('about:') && !url.startsWith('blob:')) {
      Linking.openURL(url);
      return false;
    }

    return true;
  };

  // ── JS injected into WebView ──────────────────────────────────────────────
  const INJECTED_JS = `
    (function() {
      // Disable text selection
      document.body.style.webkitUserSelect = 'none';
      document.body.style.userSelect = 'none';

      // Notify app of navigation
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'PAGE_LOADED', url: window.location.href })
      );

      // Override file input for native file picker
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

  // ── Offline screen ────────────────────────────────────────────────────────
  if (!isConnected) {
    return <OfflineScreen onRetry={() => webViewRef.current?.reload()} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[CONFIG.THEME_COLOR]}
            tintColor={CONFIG.THEME_COLOR}
          />
        }>
        <WebView
          ref={webViewRef}
          source={{ uri: CONFIG.APP_URL }}
          style={styles.webview}

          // JS & Storage
          javaScriptEnabled={true}
          domStorageEnabled={true}
          javaScriptCanOpenWindowsAutomatically={true}

          // Media
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={true}

          // Files
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          allowsBackForwardNavigationGestures={true}

          // Security
          mixedContentMode="compatibility"
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}

          // User agent
          applicationNameForUserAgent={CONFIG.USER_AGENT}

          // Geolocation
          geolocationEnabled={true}

          // Edge to edge
          contentInsetAdjustmentBehavior="automatic"

          // Loading
          startInLoadingState={false}
          renderLoading={() => <LoadingIndicator />}

          // Callbacks
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => { setLoading(false); setRefreshing(false); }}
          onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
          onShouldStartLoadWithRequest={handleNavigation}
          onMessage={handleMessage}
          injectedJavaScript={INJECTED_JS}

          onError={(e) => {
            console.warn('WebView error:', e.nativeEvent);
            setLoading(false);
          }}

          onHttpError={(e) => {
            console.warn('HTTP error:', e.nativeEvent.statusCode);
          }}

          // Android specific
          androidHardwareAccelerationDisabled={false}
          androidLayerType="hardware"
          overScrollMode="never"
          scalesPageToFit={false}
          setSupportMultipleWindows={false}
          forceDarkOn={false}
        />
      </ScrollView>

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
