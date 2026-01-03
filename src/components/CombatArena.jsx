import React, { memo, useRef, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards, Virtual } from 'swiper/modules';
import { Shield, Zap, Crosshair, CheckCircle, Target } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/virtual';

const CombatArena = ({ 
    questions, 
    myAnswers, 
    onAnswer, 
    killMode, 
    onKill, 
    didShoot 
}) => {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // OPTIMIZATION: Imperatively update Swiper lock state to prevent re-renders
  useEffect(() => {
    if (swiperRef.current) {
        const swiper = swiperRef.current;
        const isAnswered = myAnswers[activeIndex] !== undefined;
        // Allow next if answered or it's the kill screen (last slide)
        const isKillScreen = activeIndex >= questions.length;
        
        // Directly update Swiper instance properties
        swiper.allowSlideNext = isAnswered || isKillScreen;
        
        // Force update button state if needed, but usually not required for core mechanics
        swiper.update();
    }
  }, [activeIndex, myAnswers, questions.length]);

  return (
    <div className={`absolute inset-0 flex items-center justify-center z-10 ${didShoot ? 'animate-recoil' : ''}`}>
        <div className="w-[300px] h-[520px] sm:w-[340px] sm:h-[560px] md:w-[420px] md:h-[640px] perspective-1000">
            <Swiper 
                onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                    swiper.allowSlideNext = false;
                }}
                onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                effect={'cards'} 
                grabCursor={true} 
                modules={[EffectCards, Virtual]} 
                className="w-full h-full"
                speed={150}
                allowTouchMove={true}
                virtual
                observer={true}
                observeParents={true}
                cardsEffect={{
                    perSlideOffset: 8, // Reduce offset
                    perSlideRotate: 2, // Reduce rotation to minimize pixel shuffling
                    slideShadows: false, // Performance: Disable shadows on cards
                }}
            >
                
                {/* 1. QUESTIONS CARDS */}
                {questions.map((q, qIndex) => (
                <SwiperSlide key={q.id || qIndex} virtualIndex={qIndex} className="bg-transparent will-change-transform">
                    {/* VALORANT CARD STYLE */}
                    <div className="w-full h-full bg-[#1a2332] border border-white/10 relative overflow-hidden group clip-path-notch backface-hidden">
                        
                        {/* Status Icon */}
                        {myAnswers[qIndex] && (
                            <div className="absolute top-0 right-0 p-4 z-20">
                                <CheckCircle className="text-cyan-400 fill-cyan-400/20" size={28} />
                            </div>
                        )}
                        
                        {/* Decorative background elements */}
                        <div className="absolute top-0 left-0 w-2 h-16 bg-cyan-500"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-16 bg-white/20"></div>
                        <div className="absolute top-[10%] right-[10%] w-[80%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-6 border-b border-white/5 relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rotate-45"></div>
                                <span className="text-xs font-bold tracking-[0.2em] text-cyan-400">TARGET_{qIndex + 1}</span>
                            </div>
                            <div className="flex gap-1">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-1 h-3 bg-white/10 skew-x-[-15deg]"></div>
                                ))}
                            </div>
                        </div>

                        {/* Question Text */}
                        <div className="flex-1 flex items-center justify-center px-6 py-4 relative z-10">
                            <h3 className="text-lg md:text-2xl font-bold text-center text-white leading-tight drop-shadow-lg">
                                {q.question}
                            </h3>
                        </div>

                        {/* Options */}
                        <div className="px-6 pb-8 space-y-3">
                            {q.options.map((opt, idx) => {
                                const isSelected = myAnswers[qIndex] === opt;
                                return (
                                    <button 
                                        key={idx} 
                                        onClick={() => onAnswer(qIndex, opt)} 
                                        className={`w-full p-4 border transition-all duration-200 flex justify-between items-center group/btn relative overflow-hidden
                                            ${isSelected 
                                                ? 'bg-cyan-500/20 border-cyan-500 text-white' 
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 text-gray-400 hover:text-white'
                                            }
                                        `}
                                        style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                                    >
                                        {/* Hover fill effect */}
                                        <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover/btn:translate-x-0 transition-transform duration-300"></div>
                                        
                                        <span className="relative z-10 font-bold tracking-wide text-sm md:text-base flex items-center gap-3">
                                            <span className="text-[10px] font-mono opacity-50">0{idx + 1} //</span>
                                            {opt}
                                        </span>
                                        
                                        {isSelected && <div className="w-2 h-2 bg-cyan-400 rotate-45 animate-pulse"></div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </SwiperSlide>
                ))}

                {/* 2. THE KILL CARD (LAST SLIDE) */}
                <SwiperSlide key="kill-card" virtualIndex={questions.length} className="bg-transparent will-change-transform">
                    <div className={`w-full h-full bg-[#080808] border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 clip-path-notch
                        ${killMode 
                            ? 'border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.3)]' 
                            : 'border-white/10 opacity-80'
                        }`}
                    >
                        {killMode ? (
                            <div className="text-center z-10 w-full px-8 relative">
                                {/* Animated decorations */}
                                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                    <div className="absolute top-10 left-10 w-4 h-4 border-l-2 border-t-2 border-red-600"></div>
                                    <div className="absolute top-10 right-10 w-4 h-4 border-r-2 border-t-2 border-red-600"></div>
                                    <div className="absolute bottom-10 left-10 w-4 h-4 border-l-2 border-b-2 border-red-600"></div>
                                    <div className="absolute bottom-10 right-10 w-4 h-4 border-r-2 border-b-2 border-red-600"></div>
                                </div>

                                {/* Crosshair */}
                                <div className="mb-8 relative inline-flex items-center justify-center">
                                    <Crosshair size={100} className="text-red-500 animate-[spin_10s_linear_infinite]" />
                                    <div className="absolute inset-0 bg-red-500/20 blur-xl animate-pulse"></div>
                                    <Target size={40} className="text-white absolute" />
                                </div>
                                
                                <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-2 glitch-text">ELIMINATE</h2>
                                <p className="text-red-500 font-mono text-xs tracking-[0.5em] mb-12 uppercase">Target Vulnerable</p>
                                
                                <button 
                                    onClick={onKill} 
                                    className="w-full bg-red-600 hover:bg-red-500 text-white text-2xl font-black py-6 clip-path-button hover:translate-y-[-2px] active:translate-y-[1px] transition-all shadow-[0_10px_20px_rgba(220,38,38,0.4)] relative overflow-hidden group"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-4">
                                        <Crosshair size={28} />
                                        EXECUTE
                                    </span>
                                    {/* Scanline effect on button */}
                                    <div className="absolute inset-0 bg-white/20 -translate-y-[100%] group-hover:translate-y-[100%] transition-transform duration-500"></div>
                                </button>
                            </div>
                        ) : (
                            <div className="text-center opacity-30">
                                <Shield size={64} className="mx-auto mb-4 text-white" />
                                <h3 className="text-2xl font-black uppercase tracking-widest text-white">LOCKED</h3>
                                <p className="font-mono text-xs mt-2">COMPLETE OBJECTIVES</p>
                            </div>
                        )}
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
            /* Hardware acceleration helpers */
            .backface-hidden { -webkit-backface-visibility: hidden; backface-visibility: hidden; }
            .will-change-transform { will-change: transform; }
        `}</style>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(CombatArena, (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
        prevProps.myAnswers === nextProps.myAnswers &&
        prevProps.killMode === nextProps.killMode &&
        prevProps.didShoot === nextProps.didShoot &&
        prevProps.questions === nextProps.questions
    );
});