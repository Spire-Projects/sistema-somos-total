import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import currencyReducer from './currencySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    currency: currencyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
