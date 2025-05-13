import { configureStore } from '@reduxjs/toolkit';
import designReducer from './slices/designSlice';
import { ActionCreators } from 'redux-undo';

export const store = configureStore({
  reducer: {
    design: designReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Create helper actions for undo/redo
export const undoDesign = () => ActionCreators.undo();
export const redoDesign = () => ActionCreators.redo();