import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartService } from '@/api/services';
import { FREE_DELIVERY_THRESHOLD, PLATFORM_FEE } from '@/utils/constants';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await cartService.get();
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const { data } = await cartService.add(productId, quantity);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const updateCartItem = createAsyncThunk(
  'cart/update',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const { data } = await cartService.update(productId, quantity);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const removeFromCart = createAsyncThunk(
  'cart/remove',
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await cartService.remove(productId);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const clearCart = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try {
    await cartService.clear();
    return [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const computeTotals = (items) => {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const delivery  = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 49;
  const total     = subtotal + delivery + PLATFORM_FEE;
  return { subtotal, delivery, platformFee: PLATFORM_FEE, total };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items:       [],
    vendorId:    null,
    coupon:      null,
    discount:    0,
    totals:      { subtotal: 0, delivery: 49, platformFee: PLATFORM_FEE, total: 0 },
    isLoading:   false,
    error:       null,
  },
  reducers: {
    applyCoupon: (state, { payload }) => {
      state.coupon   = payload.coupon;
      state.discount = payload.discount;
    },
    removeCoupon: (state) => {
      state.coupon   = null;
      state.discount = 0;
    },
    setLocalCart: (state, { payload }) => {
      state.items   = payload;
      state.totals  = computeTotals(payload);
    },
  },
  extraReducers: (builder) => {
    const setCart = (state, { payload }) => {
      state.isLoading = false;
      state.items     = payload?.items || [];
      state.vendorId  = payload?.vendorId || null;
      state.totals    = computeTotals(state.items);
    };
    builder
      .addCase(fetchCart.pending,       (s) => { s.isLoading = true; })
      .addCase(fetchCart.fulfilled,     setCart)
      .addCase(fetchCart.rejected,      (s) => { s.isLoading = false; })
      .addCase(addToCart.pending,       (s) => { s.isLoading = true; })
      .addCase(addToCart.fulfilled,     setCart)
      .addCase(addToCart.rejected,      (s, { payload }) => { s.isLoading = false; s.error = payload; })
      .addCase(updateCartItem.fulfilled, setCart)
      .addCase(removeFromCart.fulfilled, setCart)
      .addCase(clearCart.fulfilled,     (s) => {
        s.items    = [];
        s.vendorId = null;
        s.coupon   = null;
        s.discount = 0;
        s.totals   = computeTotals([]);
      });
  },
});

export const { applyCoupon, removeCoupon, setLocalCart } = cartSlice.actions;

// Selectors
export const selectCart       = (s) => s.cart;
export const selectCartItems  = (s) => s.cart.items;
export const selectCartCount  = (s) => s.cart.items.reduce((n, i) => n + i.quantity, 0);
export const selectCartTotals = (s) => s.cart.totals;

export default cartSlice.reducer;
