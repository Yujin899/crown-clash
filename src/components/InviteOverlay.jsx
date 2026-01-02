import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Swords, Check, X, Clock } from 'lucide-react';

const InviteOverlay = ({ invite, onAccept, onDecline }) => {
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // 1. تشغيل أنيميشن الدخول العنيف (Valorant Style)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // الخلفية تضلم وتعمل Blur
      tl.fromTo(".overlay-backdrop", 
        { opacity: 0, backdropFilter: "blur(0px)" },
        { opacity: 1, backdropFilter: "blur(10px)", duration: 0.3 }
      )
      // البانر الرئيسي يرزع في الشاشة
      .fromTo(".main-card", 
        { scale: 2, opacity: 0, rotateX: 45 },
        { scale: 1, opacity: 1, rotateX: 0, duration: 0.5, ease: "elastic.out(1, 0.75)" }
      )
      // النصوص تتجمع (Glitch effect simulates)
      .fromTo(".glitch-text", 
        { x: -50, opacity: 0, skewX: 20 },
        { x: 0, opacity: 1, skewX: 0, stagger: 0.1, duration: 0.3 },
        "-=0.3"
      )
      // العداد يبدأ ينقص
      .to(".timer-bar", {
        width: "0%",
        duration: 30, // 30 ثانية
        ease: "linear",
        onComplete: onDecline // لما يخلص يرفض أوتوماتيك
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] flex items-center justify-center font-sans overflow-hidden">
      
      {/* 1. Backdrop */}
      <div className="overlay-backdrop absolute inset-0 bg-[#02040a]/90">
         {/* خطوط حمراء متحركة في الخلفية للتوتر */}
         <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,rgba(220,38,38,0.1)_50%,transparent_55%)] bg-[size:200%_200%] animate-[gradient_3s_linear_infinite]"></div>
      </div>

      {/* 2. Main Card */}
      <div className="main-card relative w-full max-w-3xl p-10 text-center">
         
         {/* Decoration Lines */}
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
         <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>

         <h2 className="glitch-text text-xl md:text-2xl text-red-500 font-bold tracking-[0.5em] uppercase mb-4">INCOMING CHALLENGE</h2>
         
         <div className="glitch-text flex flex-col items-center justify-center mb-10">
            <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full border-4 border-red-600 flex items-center justify-center bg-black/50 shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                    <Swords size={48} className="text-white animate-pulse" />
                </div>
                <div className="absolute -bottom-3 bg-red-600 text-white text-xs font-bold px-3 py-1 skew-x-[-10deg]">
                    VS
                </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black italic text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                {invite.senderName}
            </h1>
            <p className="text-gray-400 mt-2 tracking-widest text-sm">HAS CHALLENGED YOU TO A DUEL</p>
         </div>

         {/* Actions */}
         <div className="glitch-text flex justify-center gap-8">
             <button 
                onClick={onDecline}
                className="group relative px-8 py-4 bg-transparent border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-all skew-x-[-10deg]"
             >
                 <span className="flex items-center gap-2 skew-x-[10deg] font-bold">
                    <X size={20} /> DECLINE
                 </span>
             </button>

             <button 
                onClick={onAccept}
                className="group relative px-12 py-4 bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all skew-x-[-10deg] overflow-hidden"
             >
                 {/* Shine Effect */}
                 <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                 <span className="flex items-center gap-2 skew-x-[10deg] font-black tracking-widest text-lg">
                    <Check size={24} /> ACCEPT MATCH
                 </span>
             </button>
         </div>

         {/* Timer Bar */}
         <div className="mt-12 w-full max-w-md mx-auto h-2 bg-gray-800 rounded-full overflow-hidden relative">
             <div className="timer-bar h-full bg-red-500 w-full shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
             <div className="absolute top-0 right-0 h-full flex items-center pr-1">
                <Clock size={10} className="text-black/50" />
             </div>
         </div>
         <p className="text-red-500/50 text-[10px] mt-2 font-mono">AUTO DECLINE IN 30s</p>

      </div>
    </div>
  );
};

export default InviteOverlay;