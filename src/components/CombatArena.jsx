import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards } from 'swiper/modules';
import { Shield, Zap, Crosshair, CheckCircle } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/effect-cards';

const CombatArena = ({ 
    questions, 
    myAnswers, 
    onAnswer, 
    killMode, 
    onKill, 
    didShoot 
}) => {
  return (
    <div className={`absolute inset-0 flex items-center justify-center z-10 ${didShoot ? 'animate-recoil' : ''}`}>
        <div className="w-[350px] h-[550px] md:w-[400px] md:h-[600px] perspective-1000">
            <Swiper effect={'cards'} grabCursor={true} modules={[EffectCards]} className="w-full h-full">
                
                {/* 1. QUESTIONS CARDS */}
                {questions.map((q, qIndex) => (
                <SwiperSlide key={qIndex} className="bg-transparent rounded-2xl">
                    <div className="w-full h-full bg-[#0b0f1a] rounded-2xl border-2 border-cyan-500/30 p-6 flex flex-col shadow-2xl relative overflow-hidden backdrop-blur-md">
                        {/* Status Icon */}
                        {myAnswers[qIndex] && (
                            <div className="absolute top-4 right-4 animate-bounce">
                                <CheckCircle className="text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" size={28} />
                            </div>
                        )}
                        
                        {/* Header */}
                        <div className="flex justify-between text-cyan-400 mb-6 border-b border-white/5 pb-4 mt-2">
                            <Shield size={20} />
                            <span className="text-xs font-bold tracking-[0.3em]">TARGET_LOCK_{qIndex + 1}</span>
                            <Zap size={20} className="text-yellow-400" />
                        </div>

                        {/* Question Text */}
                        <h3 className="text-xl md:text-2xl font-bold text-center mb-6 flex-1 flex items-center justify-center text-white drop-shadow-md">
                            {q.text}
                        </h3>

                        {/* Options */}
                        <div className="space-y-3 mb-4">
                            {q.options.map((opt, idx) => {
                                const isSelected = myAnswers[qIndex] === opt;
                                return (
                                    <button 
                                        key={idx} 
                                        onClick={() => onAnswer(qIndex, opt)} 
                                        className={`w-full p-4 rounded-xl border text-left font-bold transition-all duration-200 flex justify-between items-center group
                                            ${isSelected 
                                                ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]' 
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400 hover:text-white hover:border-white/30'
                                            }
                                        `}
                                    >
                                        <span className="group-hover:translate-x-1 transition-transform">{opt}</span>
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </SwiperSlide>
                ))}

                {/* 2. THE KILL CARD (LAST SLIDE) */}
                <SwiperSlide className="bg-transparent rounded-2xl">
                    <div className={`w-full h-full bg-[#050505] rounded-2xl border-4 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden transition-all duration-500 
                        ${killMode 
                            ? 'border-red-600 shadow-[inset_0_0_50px_rgba(220,38,38,0.2)]' 
                            : 'border-gray-800 opacity-80'
                        }`}
                    >
                        {killMode ? (
                            <div className="text-center z-10 w-full px-6">
                                {/* Ready State */}
                                <div className="animate-[pulse_0.5s_infinite] mb-8 relative inline-block">
                                    <Crosshair size={100} className="text-red-500" />
                                    <div className="absolute inset-0 bg-red-500 blur-xl opacity-40 animate-ping"></div>
                                </div>
                                
                                <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-2 glitch-text">EXECUTE</h2>
                                <p className="text-red-400 text-xs font-mono mb-10 tracking-widest border border-red-900/50 bg-red-900/20 p-2 rounded">
                                    SYSTEM READY // AWAITING COMMAND
                                </p>
                                
                                <button 
                                    onClick={onKill} 
                                    className="w-full bg-red-600 hover:bg-red-500 text-white text-3xl font-black py-8 rounded-xl shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:scale-105 active:scale-95 transition-all skew-x-[-5deg]"
                                >
                                    FIRE
                                </button>
                            </div>
                        ) : (
                            // Locked State
                            <div className="text-center opacity-40 p-4">
                                <Shield size={80} className="text-gray-500 mx-auto mb-6" />
                                <h2 className="text-3xl font-black text-gray-400 uppercase tracking-widest">LOCKED</h2>
                                <p className="text-gray-500 text-sm mt-4 font-mono">COMPLETE ALL TARGETS TO UNLOCK ULTIMATE</p>
                            </div>
                        )}
                        
                        {/* Decor lines */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>
                    </div>
                </SwiperSlide>

            </Swiper>
        </div>
        
        <style jsx global>{`
            .animate-recoil { animation: recoil 0.2s cubic-bezier(.36,.07,.19,.97) both; }
            @keyframes recoil { 
                0% { transform: scale(1) translate(0, 0); } 
                10% { transform: scale(1.05) translate(0, 10px); }
                100% { transform: scale(1) translate(0, 0); } 
            }
        `}</style>
    </div>
  );
};

export default CombatArena;