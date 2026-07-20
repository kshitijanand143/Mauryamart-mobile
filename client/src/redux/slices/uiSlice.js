import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_LOCATION } from '@/utils/constants';

// ── uiSlice ───────────────────────────────────────────────────────────────────
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    isCartOpen:         false,
    isLocationModalOpen: false,
    isSearchOpen:       false,
    globalLoader:       false,
    notification:       { count: 0 },
  },
  reducers: {
    openCart:          (s) => { s.isCartOpen = true; },
    closeCart:         (s) => { s.isCartOpen = false; },
    toggleCart:        (s) => { s.isCartOpen = !s.isCartOpen; },
    openLocationModal: (s) => { s.isLocationModalOpen = true; },
    closeLocationModal:(s) => { s.isLocationModalOpen = false; },
    setGlobalLoader:   (s, { payload }) => { s.globalLoader = payload; },
    setNotifCount:     (s, { payload }) => { s.notification.count = payload; },
  },
});

export const {
  openCart, closeCart, toggleCart,
  openLocationModal, closeLocationModal,
  setGlobalLoader, setNotifCount,
} = uiSlice.actions;

export const selectIsCartOpen    = (s) => s.ui.isCartOpen;
export const selectNotifCount    = (s) => s.ui.notification.count;
export const uiReducer = uiSlice.reducer;
export default uiSlice.reducer;

// ── locationSlice ─────────────────────────────────────────────────────────────
const locationSlice = createSlice({
  name: 'location',
  initialState: {
    coords:  DEFAULT_LOCATION,
    address: 'Select your location',
    city:    '',
    granted: false,
  },
  reducers: {
    setLocation: (state, { payload }) => {
      state.coords  = payload.coords;
      state.address = payload.address;
      state.city    = payload.city || '';
      state.granted = true;
    },
    clearLocation: (state) => {
      state.coords  = DEFAULT_LOCATION;
      state.address = 'Select your location';
      state.granted = false;
    },
  },
});

export const { setLocation, clearLocation } = locationSlice.actions;
export const selectLocation = (s) => s.location;
export const locationReducer = locationSlice.reducer;
