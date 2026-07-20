import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch }      from 'react-redux';
import { setLocation }      from '@/redux/slices/locationSlice';
import { connectSocket, getSocket } from '@/socket/socketClient';

// ── useDebounce ───────────────────────────────────────────────────────────────
export const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// ── useGeoLocation ────────────────────────────────────────────────────────────
export const useGeoLocation = () => {
  const dispatch = useDispatch();
  const [state, setState] = useState({ loading: false, error: null });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ loading: false, error: 'Geolocation not supported' });
      return;
    }
    setState({ loading: true, error: null });
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`,
          );
          const json = await res.json();
          const formatted = json.results?.[0]?.formatted_address || 'Current location';
          const city = json.results?.[0]?.address_components?.find(
            (c) => c.types.includes('locality'),
          )?.long_name || '';
          dispatch(setLocation({ coords: { lat: coords.latitude, lng: coords.longitude }, address: formatted, city }));
          setState({ loading: false, error: null });
        } catch {
          setState({ loading: false, error: 'Could not fetch address' });
        }
      },
      (err) => setState({ loading: false, error: err.message }),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, [dispatch]);

  return { ...state, requestLocation };
};

// ── useSocket ─────────────────────────────────────────────────────────────────
export const useSocket = (token) => {
  const socketRef = useRef(null);
  useEffect(() => {
    if (!token) return;
    socketRef.current = connectSocket(token);
    return () => { /* keep socket alive across navigations */ };
  }, [token]);
  return socketRef;
};

// ── useOrderTracking ──────────────────────────────────────────────────────────
export const useOrderTracking = (orderId, onStatusChange, onLocationUpdate) => {
  useEffect(() => {
    if (!orderId) return;
    const s = getSocket();
    s.emit('join:order', orderId);
    s.on('order:status',   onStatusChange);
    s.on('rider:location', onLocationUpdate);
    return () => {
      s.emit('leave:order', orderId);
      s.off('order:status',   onStatusChange);
      s.off('rider:location', onLocationUpdate);
    };
  }, [orderId, onStatusChange, onLocationUpdate]);
};

// ── useIntersectionObserver ───────────────────────────────────────────────────
export const useIntersectionObserver = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);
  return [ref, isVisible];
};

// ── useLocalStorage ───────────────────────────────────────────────────────────
export const useLocalStorage = (key, initialValue) => {
  const [stored, setStored] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });
  const setValue = (value) => {
    try {
      setStored(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  };
  return [stored, setValue];
};
