import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  BackHandler,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';

export default function WebViewScreen() {
  const ref      = useRef(null);
  const [loading,   setLoading]   = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const handler = () => {
      if (canGoBack && ref.current) {
        ref.current.goBack();
        return true;
      }
      Alert.alert('Exit', 'Exit Mauryamart?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };
    BackHandler.addEventListener('hardwareBackPress', handler);
    return () => BackHandler.removeEventListener('hardwareBackPress', handler);
  }, [canGoBack]);

  const onRequest = (req) => {
    const { url } = req;
    if (url.startsWith('tel:') || url.startsWith('mailto:')) {
      Linking.openURL(url); return false;
    }
    if (url.includes('wa.me') || url.startsWith('upi://') || url.startsWith('gpay://')) {
      Linking.openURL(url).catch(() => {}); return false;
    }
    return true;
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={ref}
        source={{ uri: 'https://mauryamart.in' }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        thirdPartyCookiesEnabled
        overScrollMode="never"
        setSupportMultipleWindows={false}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={st => setCanGoBack(st.canGoBack)}
        onShouldStartLoadWithRequest={onRequest}
        onError={() => setLoading(false)}
      />
      {loading && (
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        </View>
      )}
    </View>
  );
}
