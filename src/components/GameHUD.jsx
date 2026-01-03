import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

const GameHUD = ({ myPlayer, enemyPlayer, timer, myProgress, enemyProgress }) => {
  
  const formatTime = useMemo(() => (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`, []);
  const isCriticalTime = timer <= 10;

  return (
    <div className="absolute top-0 w-full p-4 md:p-6 flex flex-col md:flex-row justify-between items-center md:items-start gap-4 z-30 pointer-events-none select-none">
      
      {/* MY STATS (LEFT) */}
      <div className="w-full md:w-1/3 flex flex-col items-start relative">
        {/* Name Tag */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-6 bg-cyan-400"></div>
          <div className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mix-blend-screen">
             {myPlayer.name}
          </div>
          <div className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-400 font-mono tracking-widest">
            OPERATIVE
          </div>
        </div>
        
        {/* Progress Bar Container - Valorant Style (Angled) */}
        <div className="relative w-full max-w-[240px] h-4 bg-gray-900 border border-white/10 skew-x-[-15deg] overflow-hidden">
          {/* Background grid pattern */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '4px 4px', backgroundPosition: '0 0, 2px 2px' }}></div>
          
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${myProgress}%` }} 
            className="h-full bg-cyan-500 relative"
          >
             {/* Gloss effect */}
             <div className="absolute inset-0 bg-white/30 skew-x-[15deg] translate-x-[-50%] w-[20px] h-full blur-md"></div>
          </motion.div>
        </div>
        
        {/* Decorative stats under bar */}
        <div className="flex items-center gap-4 mt-1 text-[10px] text-cyan-400/60 font-mono tracking-widest">
           <span>HP /// 100</span>
           <span>SHIELD /// 50</span>
        </div>
      </div>

      {/* TIMER (CENTER) */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 md:relative md:top-0 md:left-0 md:translate-x-0 order-first md:order-none flex flex-col items-center">
        {/* Timer Container */}
        <div className="relative bg-gray-900/80 border-x-2 border-white/10 px-6 py-1 backdrop-blur-sm clip-path-polygon">
          <div className={`text-4xl md:text-5xl font-black font-mono tracking-tighter 
              ${isCriticalTime ? 'text-red-500 animate-pulse' : 'text-white'}`}
          >
            {formatTime(timer)}
          </div>
          
          {/* Decorative lines */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-white/20"></div>
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/20"></div>
        </div>
        
        {isCriticalTime && (
          <div className="mt-1 px-4 py-0.5 bg-red-500 text-black font-black text-[10px] tracking-[0.2em] animate-pulse">
            CRITICAL
          </div>
        )}
      </div>

      {/* ENEMY STATS (RIGHT) */}
      <div className="w-full md:w-1/3 flex flex-col items-end relative text-right">
        {/* Name Tag */}
        <div className="flex items-center gap-2 mb-1 flex-row-reverse">
          <div className="w-1 h-6 bg-red-500"></div>
          <div className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mix-blend-screen">
             {enemyPlayer.name}
          </div>
          <div className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-[10px] text-red-500 font-mono tracking-widest">
            OPPONENT
          </div>
        </div>

        {/* Progress Bar - Valorant Style (Angled) */}
        <div className="relative w-full max-w-[240px] h-4 bg-gray-900 border border-white/10 skew-x-[15deg] overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '4px 4px', backgroundPosition: '0 0, 2px 2px' }}></div>
          
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${enemyProgress}%` }} 
            className="h-full bg-red-600 relative float-right"
          />
        </div>

        {/* Decorative stats */}
        <div className="flex items-center gap-4 mt-1 text-[10px] text-red-500/60 font-mono tracking-widest flex-row-reverse">
           <span>THREAT /// HIGH</span>
           <span>LOC /// UNKNOWN</span>
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(GameHUD, (prevProps, nextProps) => {
  return (
    prevProps.timer === nextProps.timer &&
    prevProps.myProgress === nextProps.myProgress &&
    prevProps.enemyProgress === nextProps.enemyProgress &&
    prevProps.myPlayer === nextProps.myPlayer &&
    prevProps.enemyPlayer === nextProps.enemyPlayer
  );
});