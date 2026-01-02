import React from 'react';
import { motion } from 'framer-motion';

const GameHUD = ({ myPlayer, enemyPlayer, timer, myProgress, enemyProgress }) => {
  
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const isCriticalTime = timer <= 10;

  return (
    <div className="absolute top-0 w-full p-6 flex justify-between items-start z-30 pointer-events-none">
      
      {/* MY STATS (LEFT) */}
      <div className="w-1/3">
        <div className="text-xl font-black mb-1 flex items-center gap-2 text-cyan-400 uppercase italic tracking-tighter">
            {myPlayer.name}
        </div>
        {/* Progress Bar Container */}
        <div className="h-3 bg-gray-900/80 border border-cyan-900/50 rounded-full overflow-hidden w-full max-w-[180px] shadow-[0_0_10px_rgba(34,211,238,0.2)]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${myProgress}%` }} 
            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 relative"
          >
             <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_1s_infinite]"></div>
          </motion.div>
        </div>
      </div>

      {/* TIMER (CENTER) */}
      <div className="relative">
        <div className={`text-6xl font-black font-mono tracking-tighter drop-shadow-2xl 
            ${isCriticalTime ? 'text-red-500 animate-pulse' : 'text-white'}`}
        >
          {formatTime(timer)}
        </div>
        {isCriticalTime && <p className="text-center text-red-500 text-[10px] font-bold tracking-[0.5em]">HURRY UP</p>}
      </div>

      {/* ENEMY STATS (RIGHT) */}
      <div className="w-1/3 text-right flex flex-col items-end">
        <div className="text-xl font-black mb-1 text-red-500 uppercase italic tracking-tighter">
            {enemyPlayer.name}
        </div>
        <div className="h-3 bg-gray-900/80 border border-red-900/50 rounded-full overflow-hidden w-full max-w-[180px] shadow-[0_0_10px_rgba(239,68,68,0.2)]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${enemyProgress}%` }} 
            className="h-full bg-gradient-to-l from-red-600 to-red-800" 
          />
        </div>
      </div>
    </div>
  );
};

export default GameHUD;