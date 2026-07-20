import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsLoggedIn, selectAccessToken, fetchCurrentUser } from '@/redux/slices/authSlice';
import { fetchCart } from '@/redux/slices/cartSlice';
import { connectSocket }          from '@/socket/socketClient';
import { notificationService }    from '@/api/services';
import AppRoutes    from '@/routes/AppRoutes';
import CartDrawer   from '@/components/cart/CartDrawer';

// Firebase FCM (lazy – only when logged in)
let fcmInitialized = false;
const initFCM = async (dispatch) => {
  if (fcmInitialized) return;
  try {
    const { initializeApp }     = await import('firebase/app');
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
    const firebaseConfig = {
      apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
      appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    };
    const app      = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    const token    = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
    if (token) await notificationService.saveFCMToken(token);
    onMessage(messaging, (payload) => {
      // in-app toast is handled by socket; FCM handles background
      console.info('[FCM]', payload);
    });
    fcmInitialized = true;
  } catch (err) {
    console.warn('[FCM] init failed:', err.message);
  }
};

export default function App() {
  const dispatch    = useDispatch();
  const isLoggedIn  = useSelector(selectIsLoggedIn);
  const accessToken = useSelector(selectAccessToken);

  // Bootstrap on login
  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchCurrentUser());
      dispatch(fetchCart());
      connectSocket(accessToken);
      initFCM(dispatch);
    }
  }, [isLoggedIn, accessToken, dispatch]);

  return (
    <>
      <AppRoutes />
      {isLoggedIn && <CartDrawer />}
    </>
  );
}
