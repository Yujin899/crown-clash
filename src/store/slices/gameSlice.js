import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  roomId: null,         // رقم الروم الحالية
  status: 'idle',       // 'idle', 'waiting', 'playing', 'finished'
  players: [],          // قائمة اللاعبين اللي في الروم
  gameState: null,      // تفاصيل اللعبة نفسها (positions, scores, etc.)
  winner: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    joinRoom: (state, action) => {
      state.roomId = action.payload.roomId;
      state.players = action.payload.players;
      state.status = 'waiting';
    },
    updateGameData: (state, action) => {
      // تحديث بيانات اللعبة لحظياً من Firestore
      state.gameState = action.payload;
    },
    startGame: (state) => {
      state.status = 'playing';
    },
    endGame: (state, action) => {
      state.status = 'finished';
      state.winner = action.payload;
    },
    leaveRoom: (state) => {
      // تصفير البيانات لما يخرج
      state.roomId = null;
      state.status = 'idle';
      state.players = [];
      state.gameState = null;
      state.winner = null;
    }
  },
});

export const { joinRoom, updateGameData, startGame, endGame, leaveRoom } = gameSlice.actions;
export default gameSlice.reducer;