import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../api/services';

// ── Auth thunks ───────────────────────────────────────────────────────────────
export const loginAdmin = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.login(creds);
    if (!['admin'].includes(data.data.user.role)) throw new Error('Access restricted to administrators');
    localStorage.setItem('admin_access_token', data.data.accessToken);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || err.message || 'Login failed'); }
});

export const logoutAdmin = createAsyncThunk('auth/logout', async () => {
  try { await authAPI.logout(); } catch {}
  localStorage.removeItem('admin_access_token');
});

export const fetchAdminMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try { const { data } = await authAPI.me(); return data.data; }
  catch (err) { return rejectWithValue(err.message); }
});

const saved = localStorage.getItem('admin_access_token');

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, accessToken: saved || null, loading: false, error: null },
  reducers: {
    clearError: (s) => { s.error = null; },
    setCredentials: (s, { payload }) => { s.accessToken = payload.accessToken; s.user = payload.user; },
  },
  extraReducers: (b) => {
    b.addCase(loginAdmin.pending,    s => { s.loading = true; s.error = null; })
     .addCase(loginAdmin.fulfilled,  (s, { payload }) => { s.loading = false; s.user = payload.user; s.accessToken = payload.accessToken; })
     .addCase(loginAdmin.rejected,   (s, { payload }) => { s.loading = false; s.error = payload; })
     .addCase(logoutAdmin.fulfilled, s => { s.user = null; s.accessToken = null; })
     .addCase(fetchAdminMe.fulfilled,(s, { payload }) => { s.user = payload; });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export const selectAdmin      = s => s.auth;
export const selectIsLoggedIn = s => !!s.auth.accessToken && !!s.auth.user;

export const store = configureStore({
  reducer: { auth: authSlice.reducer },
  middleware: g => g({ serializableCheck: false }),
});
export default store;
