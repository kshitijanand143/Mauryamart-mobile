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

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const showNavigationError = useCallback((message) => {
    setIsLoading(false);
    setErrorMessage(message);
  }, []);

  const isTrustedInAppUrl = useCallback((url) => {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      const isMauryaMart = hostname === 'mauryamart.in' || hostname.endsWith('.mauryamart.in');
      const isCashfree = hostname === 'cashfree.com' || hostname.endsWith('.cashfree.com');
      return parsed.protocol === 'https:' && (isMauryaMart || isCashfree);
    } catch {
      return false;
    }
  }, []);

  const openExternalUrl = useCallback((url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open link', 'Check your connection or try again later.');
    });
  }, []);

  // Turn an indefinitely loading page into an actionable error with a working retry.
  useEffect(() => {
    if (!isLoading || errorMessage) return undefined;
    const timer = setTimeout(() => {
      showNavigationError('MauryaMart is taking too long to respond. Check your connection and retry.');
    }, 30000);
    return () => clearTimeout(timer);
  }, [errorMessage, isLoading, showNavigationError]);

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

    if (isTrustedInAppUrl(url)) {
      return true;
    }

    if (url.startsWith('https://') || url.startsWith('http://') ||
        /^(tel|mailto|upi|gpay|phonepe|paytmmp|whatsapp|intent|sms|geo):/i.test(url)) {
      openExternalUrl(url);
      return false;
    }

    return false;
  }, [isTrustedInAppUrl, openExternalUrl]);

  const handleOpenWindow = useCallback((event) => {
    const url = event?.nativeEvent?.targetUrl || '';
    if (!url) return;

    if (isTrustedInAppUrl(url)) {
      webViewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(url)}; true;`);
      return;
    }

    if (url.startsWith('https://') || url.startsWith('http://') ||
        /^(tel|mailto|upi|gpay|phonepe|paytmmp|whatsapp|intent|sms|geo):/i.test(url)) {
      openExternalUrl(url);
    }
  }, [isTrustedInAppUrl, openExternalUrl]);

  const handleNavigationStateChange = useCallback((navState) => {
    canGoBackRef.current = Boolean(navState.canGoBack);
    if (navState.url) {
      try {
        const parsed = new URL(navState.url);
        currentPathRef.current = parsed.pathname || '/';
      } catch {}
    }
    setIsLoading(Boolean(navState.loading));
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
    setErrorMessage('');
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  const handleHttpError = useCallback((event) => {
    const { nativeEvent } = event;
    const statusCode = nativeEvent?.statusCode;
    const url = nativeEvent?.url || '';
    const isApi = url.startsWith('https://api.mauryamart.in/');
    const isCashfree = (() => {
      try {
        const hostname = new URL(url).hostname.toLowerCase();
        return hostname === 'cashfree.com' || hostname.endsWith('.cashfree.com');
      } catch {
        return false;
      }
    })();

    const isApiSessionError = isApi && (statusCode === 401 || statusCode === 403);
    if (nativeEvent?.isForMainFrame === false &&
        !(isApi && (statusCode >= 500 || isApiSessionError))) return;

    if (isCashfree) {
      showNavigationError('The payment page could not be reached. No payment has been confirmed; return to your order and check its status before trying again.');
    } else if (statusCode === 401 || statusCode === 403) {
      showNavigationError('Your session may have expired. Sign in again, then retry this page.');
    } else if (statusCode >= 500) {
      showNavigationError('MauryaMart services are temporarily unavailable. Your order or payment has not been confirmed; please retry later.');
    } else {
      showNavigationError(`MauryaMart could not load this page (HTTP ${statusCode || 'error'}). Please retry.`);
    }
  }, [showNavigationError]);

  const handleLoadError = useCallback((event) => {
    const { nativeEvent } = event;
    if (nativeEvent?.isTopFrame === false) return;

    const description = (nativeEvent?.description || '').toLowerCase();
    if (description.includes('err_internet_disconnected') ||
        description.includes('err_network_changed')) {
      showNavigationError('Internet connection unavailable. Check your connection and retry.');
    } else if (description.includes('err_name_not_resolved') ||
               description.includes('err_connection_refused') ||
               description.includes('err_timed_out')) {
      showNavigationError('MauryaMart could not reach the website. The server may be temporarily unavailable; please retry.');
    } else {
      showNavigationError('MauryaMart could not load this page. Check your connection and retry.');
    }
  }, [showNavigationError]);

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
        mixedContentMode="never"
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        overScrollMode="never"
        setSupportMultipleWindows={true}
        injectedJavaScript={SPA_NAVIGATION_BRIDGE}
        onMessage={handleMessage}
        onOpenWindow={handleOpenWindow}
        onLoadStart={() => {
          setErrorMessage('');
          setIsLoading(true);
        }}
        onLoadEnd={() => setIsLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onError={handleLoadError}
        onHttpError={handleHttpError}
        onRenderProcessGone={() => {
          showNavigationError('The MauryaMart page stopped unexpectedly. Reload it to continue.');
        }}
      />
      {isLoading && !errorMessage && (
        <View style={styles.loaderOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={CONFIG.THEME_COLOR} />
        </View>
      )}
      {!!errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorTitle}>Unable to continue</Text>
          <Text style={styles.errorSub}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
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
    fontSize: 48,
    fontWeight: '700',
    color: '#f97316',
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
