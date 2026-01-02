// src/store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true, // <--- دي لازم تكون true في البداية
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false; 
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false; 
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    loginFailure: (state, action) => {
        state.loading = false;
        state.error = action.payload;
    }
  },
});

export const { loginSuccess, logout, setLoading, loginFailure } = authSlice.actions;
export default authSlice.reducer;