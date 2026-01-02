import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, Home, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import victorySfx from '../assets/sounds/victory.mp3';
import defeatSfx from '../assets/sounds/defeat.mp3';

const GameResultOverlay = ({ result, myPlayer, enemyPlayer, questions, earnedXP, reason }) => {
  const navigate = useNavigate();
  const isVictory = result === 'victory';

  useEffect(() => {
    const audio = new Audio(isVictory ? victorySfx : defeatSfx);
    audio.volume = 0.5;
    audio.play().catch(()=>{});
  }, [isVictory]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#02040a]/95 backdrop-blur-xl p-4 overflow-hidden">
      
      {/* Background Ambience */}
      <div className={`absolute inset-0 opacity-20 ${isVictory ? 'bg-emerald-600' : 'bg-red-600'}`}></div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="z-10 w-full max-w-3xl flex flex-col h-full max-h-[90vh]"
      >
          {/* Header */}
          <div className="text-center mb-6 shrink-0">
              <h1 className={`text-6xl md:text-8xl font-black italic uppercase tracking-tighter ${isVictory ? 'text-emerald-500' : 'text-red-600'}`}>
                  {isVictory ? "VICTORY" : "DEFEAT"}
              </h1>
              <p className="text-sm md:text-lg text-gray-400 font-mono tracking-widest mt-2 uppercase flex items-center justify-center gap-2">
                  {reason === 'backfire' && <AlertTriangle className="text-yellow-500"/>}
                  {reason === 'backfire' ? (isVictory ? "ENEMY WEAPON BACKFIRED" : "YOUR WEAPON BACKFIRED (LOW ACCURACY)") : 
                   reason === 'kill' ? (isVictory ? "TARGET ELIMINATED" : "KILLED IN ACTION") : 
                   reason === 'enemy_left' ? "OPPONENT DISCONNECTED" :
                   "MISSION ENDED"}
              </p>
          </div>

          {/* COMPARISON TABLE CONTAINER */}
          <div className="bg-[#0b0f1a] border border-white/10 rounded-2xl p-4 flex-1 overflow-hidden shadow-2xl flex flex-col relative">
              
              {/* Table Header */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-b border-white/10 pb-2 shrink-0">
                  <div className="text-indigo-400 truncate px-1">{myPlayer.name}</div>
                  <div>ANSWER</div>
                  <div className="text-red-400 truncate px-1">{enemyPlayer.name}</div>
              </div>

              {/* Scrollable Rows */}
              <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
                  {questions.map((q, idx) => {
                      const myAns = myPlayer.answers ? myPlayer.answers[idx] : null;
                      const enAns = enemyPlayer.answers ? enemyPlayer.answers[idx] : null;
                      
                      const isMyCorrect = myAns === q.correctAnswer;
                      const isEnCorrect = enAns === q.correctAnswer;

                      return (
                          <motion.div 
                            initial={{ x: -20, opacity: 0 }} 
                            animate={{ x: 0, opacity: 1 }} 
                            transition={{ delay: idx * 0.1 }}
                            key={idx} 
                            className="grid grid-cols-3 gap-2 items-center bg-white/5 p-3 rounded-lg border border-white/5 text-xs"
                          >
                              {/* ME */}
                              <div className={`flex items-center justify-center gap-2 font-bold ${isMyCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {isMyCorrect ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                                  <span className="truncate max-w-[80px]">{myAns || "-"}</span>
                              </div>

                              {/* Correct Answer (Middle) */}
                              <div className="text-center text-white/70 font-mono bg-black/40 rounded py-1 px-2 text-[10px] truncate">
                                  {q.correctAnswer}
                              </div>

                              {/* ENEMY */}
                              <div className={`flex items-center justify-center gap-2 font-bold ${isEnCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                  <span className="truncate max-w-[80px]">{enAns || "-"}</span>
                                  {isEnCorrect ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                              </div>
                          </motion.div>
                      );
                  })}
              </div>
          </div>
          
          {/* Footer Actions */}
          <div className="mt-6 flex flex-col items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 text-yellow-400 font-black text-2xl">
                  <Trophy size={24}/> <span>+{earnedXP} XP</span>
              </div>
              <button onClick={() => navigate('/dashboard')} className="bg-white text-black font-black px-12 py-4 rounded-xl hover:scale-105 transition-transform uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  <Home size={20}/> RETURN TO BASE
              </button>
          </div>

      </motion.div>
    </div>
  );
};

export default GameResultOverlay;