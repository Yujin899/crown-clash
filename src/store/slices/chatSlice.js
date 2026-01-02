import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],       // مصفوفة الرسايل
  activeChannel: 'global', // 'global' or 'room_ID'
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload; // بنحط الرسايل كلها لما نحملها
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload); // بنضيف رسالة جديدة
    },
    clearChat: (state) => {
      state.messages = [];
    },
    setActiveChannel: (state, action) => {
      state.activeChannel = action.payload;
      state.messages = []; // نفضي الشات لما نغير القناة
    }
  },
});

export const { setMessages, addMessage, clearChat, setActiveChannel } = chatSlice.actions;
export default chatSlice.reducer;