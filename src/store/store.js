import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import gameReducer from './slices/gameSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    game: gameReducer,
    chat: chatReducer,
  },
  // عشان نتجنب تحذيرات الـ Serialization مع فايربيس (Dates & Objects)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});