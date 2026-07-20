import { configureStore } from '@reduxjs/toolkit';
import authReducer      from './slices/authSlice';
import cartReducer      from './slices/cartSlice';
import orderReducer     from './slices/orderSlice';
import uiReducer        from './slices/uiSlice';
import locationReducer  from './slices/locationSlice';

// Lightweight manual persistence for auth + cart
const loadState = () => {
  try {
    const raw = localStorage.getItem('app_state');
    return raw ? JSON.parse(raw) : undefined;
  } catch { return undefined; }
};

const saveState = (state) => {
  try {
    localStorage.setItem('app_state', JSON.stringify({
      auth: { accessToken: state.auth.accessToken, user: state.auth.user },
      cart: state.cart,
    }));
  } catch {}
};

const preloaded = loadState();

export const store = configureStore({
  reducer: {
    auth:     authReducer,
    cart:     cartReducer,
    order:    orderReducer,
    ui:       uiReducer,
    location: locationReducer,
  },
  preloadedState: preloaded,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

store.subscribe(() => saveState(store.getState()));

export default store;
