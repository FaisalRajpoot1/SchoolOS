import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from './auth.types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True while the initial silent-refresh on app load is in flight. */
  isBootstrapping: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearCredentials(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
    setBootstrapped(state) {
      state.isBootstrapping = false;
    },
  },
});

export const { setCredentials, clearCredentials, setBootstrapped } = authSlice.actions;
export const authReducer = authSlice.reducer;
