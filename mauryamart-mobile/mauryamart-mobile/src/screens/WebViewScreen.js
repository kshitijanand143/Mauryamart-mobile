import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  BackHandler,
  Alert,
  Linking,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { CONFIG } from '../config';

// Bridge script so React Router SPA (BrowserRouter pushState/popstate) updates Android Back button state
const SPA_NAVIGATION_BRIDGE = `
(function() {
  function notifyNav() {
    try {
      var isRoot = (window.location.pathname === '/' || window.location.pathname === '') && !window.location.search;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'NAV_STATE',
        url: window.location.href,
        pathname: window.location.pathname,
        canGoBack: !isRoot || window.history.length > 1
      }));
    } catch (e) {}
  }
  var origPushState = history.pushState;
  history.pushState = function() {
    var ret = origPushState.apply(this, arguments);
    notifyNav();
    return ret;
  };
  var origReplaceState = history.replaceState;
  history.replaceState = function() {
    var ret = origReplaceState.apply(this, arguments);
    notifyNav();
    return ret;
  };
  window.addEventListener('popstate', notifyNav);
  window.addEventListener('load', notifyNav);
  notifyNav();
})();
true;
`;

export default function WebViewScreen() {
  const webViewRef = useRef(null);
  const canGoBackRef = useRef(false);
  const currentPathRef = useRef('/');

  const [initialLoading, setInitialLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Safety fallback so initial loading spinner never gets stuck on screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // React Native 0.74+ compatible BackHandler subscription (.remove() instead of removed removeEventListener)
  useEffect(() => {
    const onHardwareBackPress = () => {
      const isAtHome = currentPathRef.current === '/' || currentPathRef.current === '';
      if ((canGoBackRef.current || !isAtHome) && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      Alert.alert('Exit', 'Exit Mauryamart?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
    return () => subscription.remove();
  }, []);

  const handleShouldStartLoad = useCallback((req) => {
    const url = req?.url || '';
    if (!url) return false;

    // Allow internal web URLs and standard web schemes inside the WebView
    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('about:') ||
      url.startsWith('blob:') ||
      url.startsWith('data:')
    ) {
      // Open WhatsApp links in external WhatsApp app if clicked
      if (url.includes('wa.me/') || url.includes('api.whatsapp.com/')) {
        Linking.openURL(url).catch(() => {});
        return false;
      }
      return true;
    }

    // Handle external deep links (phone call, email, UPI payment apps, WhatsApp)
    if (
      url.startsWith('tel:') ||
      url.startsWith('mailto:') ||
      url.startsWith('upi:') ||
      url.startsWith('gpay:') ||
      url.startsWith('phonepe:') ||
      url.startsWith('paytmmp:') ||
      url.startsWith('whatsapp:') ||
      url.startsWith('intent:')
    ) {
      Linking.openURL(url).catch(() => {});
      return false;
    }

    return true;
  }, []);

  const handleNavigationStateChange = useCallback((navState) => {
    canGoBackRef.current = Boolean(navState.canGoBack);
    if (navState.url) {
      try {
        const parsed = new URL(navState.url);
        currentPathRef.current = parsed.pathname || '/';
      } catch {}
    }
    if (!navState.loading) {
      setInitialLoading(false);
    }
  }, []);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === 'NAV_STATE') {
        currentPathRef.current = data.pathname || '/';
        canGoBackRef.current = Boolean(data.canGoBack);
      }
    } catch {}
  }, []);

  const handleRetry = () => {
    setHasError(false);
    setInitialLoading(true);
    webViewRef.current?.reload();
  };

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Could not load Mauryamart</Text>
        <Text style={styles.errorSub}>Please check your internet connection and try again.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
          <Text style={styles.retryText}>Reload</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: CONFIG.APP_URL }}
        style={styles.webview}
        originWhitelist={['*']}
        userAgent={CONFIG.USER_AGENT}
        javaScriptEnabled={true}
        javaScriptCanOpenWindowsAutomatically={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        geolocationEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        overScrollMode="never"
        setSupportMultipleWindows={false}
        injectedJavaScript={SPA_NAVIGATION_BRIDGE}
        onMessage={handleMessage}
        onLoadProgress={({ nativeEvent }) => {
          if (nativeEvent.progress >= 0.75) {
            setInitialLoading(false);
          }
        }}
        onLoadEnd={() => setInitialLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setInitialLoading(false);
          // Only show error screen if the main frame failed to load
          if (nativeEvent?.isTopFrame !== false && !nativeEvent?.url?.includes('favicon')) {
            setHasError(true);
          }
        }}
      />
      {initialLoading && (
        <View style={styles.loaderOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={CONFIG.THEME_COLOR} />
        </View>
      )}
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
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
  },
  errorIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#f97316',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
