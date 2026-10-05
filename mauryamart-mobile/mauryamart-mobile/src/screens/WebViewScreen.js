import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  BackHandler,
  Alert,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { CONFIG } from '../config';
import LoadingIndicator from '../components/LoadingIndicator';
import OfflineScreen from '../components/OfflineScreen';

export default function WebViewScreen({ isConnected }) {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  // Back button handling with modern safe subscription cleanup
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

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBack);
    
    // Safe cleanup to completely prevent "undefined is not a function" crash
    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      } else if (BackHandler.removeEventListener) {
        BackHandler.removeEventListener('hardwareBackPress', onBack);
      }
    };
  }, [canGoBack]);

  const handleNavigation = (request) => {
    const { url } = request;
    if (url.startsWith('tel:')) { Linking.openURL(url); return false; }
    if (url.startsWith('mailto:')) { Linking.openURL(url); return false; }
    if (url.includes('wa.me') || url.includes('whatsapp')) { Linking.openURL(url); return false; }
    if (url.startsWith('upi://') || url.startsWith('gpay://') || url.startsWith('paytm://')) {
      Linking.openURL(url).catch(() => Alert.alert('App not found'));
      return false;
    }
    if (!url.includes('mauryamart.in') && !url.startsWith('about:') && !url.startsWith('blob:')) {
      Linking.openURL(url);
      return false;
    }
    return true;
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
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
        allowFileAccess={true}
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
        onError={() => setLoading(false)}
        androidHardwareAccelerationDisabled={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
      />
      {loading && <LoadingIndicator />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  webview: { flex: 1 },
});