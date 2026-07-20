// ── orderSlice.js ─────────────────────────────────────────────────────────────
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderService } from '@/api/services';

export const fetchOrders = createAsyncThunk('order/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await orderService.getAll(params);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchOrderById = createAsyncThunk('order/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await orderService.getById(id);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const placeOrder = createAsyncThunk('order/place', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await orderService.place(payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    orders:     [],
    current:    null,
    tracking:   null,
    isLoading:  false,
    error:      null,
    pagination: { page: 1, total: 0, hasMore: true },
  },
  reducers: {
    setTracking: (state, { payload }) => { state.tracking = payload; },
    clearCurrent: (state) => { state.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchOrders.fulfilled, (s, { payload }) => {
        s.isLoading  = false;
        s.orders     = payload.orders;
        s.pagination = payload.pagination;
      })
      .addCase(fetchOrders.rejected,  (s, { payload }) => { s.isLoading = false; s.error = payload; })
      .addCase(fetchOrderById.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchOrderById.fulfilled, (s, { payload }) => { s.isLoading = false; s.current = payload; })
      .addCase(fetchOrderById.rejected,  (s) => { s.isLoading = false; })
      .addCase(placeOrder.fulfilled,     (s, { payload }) => { s.current = payload; });
  },
});

export const { setTracking, clearCurrent } = orderSlice.actions;
export const selectOrders  = (s) => s.order.orders;
export const selectCurrent = (s) => s.order.current;
export const selectTracking = (s) => s.order.tracking;
export default orderSlice.reducer;
