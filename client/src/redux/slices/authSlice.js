import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '@/api/authService';
import { userService } from '@/api/services';

// ── Async thunks ──────────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await authService.login(credentials);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (form, { rejectWithValue }) => {
  try {
    const { data } = await authService.register(form);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await userService.getProfile();
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:        null,
    accessToken: null,
    isLoading:   false,
    error:       null,
    isHydrated:  false,
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.accessToken = payload.accessToken;
      if (payload.user) state.user = payload.user;
    },
    logout: (state) => {
      state.user        = null;
      state.accessToken = null;
      state.error       = null;
      localStorage.removeItem('app_state');
    },
    clearError: (state) => { state.error = null; },
    setHydrated: (state) => { state.isHydrated = true; },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(loginUser.pending,   (s) => { s.isLoading = true;  s.error = null; })
      .addCase(loginUser.fulfilled, (s, { payload }) => {
        s.isLoading   = false;
        s.user        = payload.user;
        s.accessToken = payload.accessToken;
      })
      .addCase(loginUser.rejected,  (s, { payload }) => { s.isLoading = false; s.error = payload; })
      // register
      .addCase(registerUser.pending,   (s) => { s.isLoading = true;  s.error = null; })
      .addCase(registerUser.fulfilled, (s, { payload }) => {
        s.isLoading   = false;
        s.user        = payload.user;
        s.accessToken = payload.accessToken;
      })
      .addCase(registerUser.rejected,  (s, { payload }) => { s.isLoading = false; s.error = payload; })
      // fetch me
      .addCase(fetchCurrentUser.fulfilled, (s, { payload }) => { s.user = payload; });
  },
});

export const { setCredentials, logout, clearError, setHydrated } = authSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectAuth        = (s) => s.auth;
export const selectUser        = (s) => s.auth.user;
export const selectIsLoggedIn  = (s) => !!s.auth.accessToken && !!s.auth.user;
export const selectAccessToken = (s) => s.auth.accessToken;

export default authSlice.reducer;
