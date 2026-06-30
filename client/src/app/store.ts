import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '@/features/auth/authSlice';

/**
 * Root Redux store. Feature slices are registered in the `reducer` map
 * as they are built (e.g. auth, ui, ...).
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
