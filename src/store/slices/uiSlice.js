import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isSidebarOpen: false,
  modalType: null, // نوع المودال المفتوح: 'settings', 'editProfile', 'createRoom'
  toast: null,     // رسايل التنبيه: { message: "Success!", type: "success" }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    openModal: (state, action) => {
      state.modalType = action.payload; // ابعت اسم المودال اللي عايز تفتحه
    },
    closeModal: (state) => {
      state.modalType = null;
    },
    showToast: (state, action) => {
      state.toast = action.payload;
    },
    hideToast: (state) => {
      state.toast = null;
    }
  },
});

export const { toggleSidebar, openModal, closeModal, showToast, hideToast } = uiSlice.actions;
export default uiSlice.reducer;