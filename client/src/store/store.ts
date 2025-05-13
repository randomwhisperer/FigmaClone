import { configureStore } from '@reduxjs/toolkit';
import designReducer from './slices/designSlice';
import undoable from 'redux-undo';

export const store = configureStore({
  reducer: {
    design: undoable(designReducer)
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false // Disable serializable check for complex objects
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Define action creators for undo/redo functionality
import { ActionCreators } from 'redux-undo';
export const undoDesign = () => ActionCreators.undo();
export const redoDesign = () => ActionCreators.redo();