import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Swords, Check, X, Clock, AlertTriangle } from 'lucide-react';

const InviteOverlay = ({ invite, onAccept, onDecline }) => {
  const containerRef = useRef(null);
  const timerBarRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. Dramatic backdrop entrance
      tl.fromTo('.overlay-backdrop', 
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );

      // 2. Warning flash effect
      tl.to('.overlay-backdrop', {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        repeat: 2,
        yoyo: true,
        duration: 0.15
      });

      // 3. Main card slam in from top
      tl.fromTo('.main-card', 
        { y: -200, opacity: 0, rotateX: 45, scale: 0.8 },
        { 
          y: 0, 
          opacity: 1, 
          rotateX: 0, 
          scale: 1,
          duration: 0.8, 
          ease: 'elastic.out(1, 0.7)' 
        },
        '-=0.3'
      );

      // 4. Corner brackets animation
      tl.fromTo('.corner-accent',
        { scale: 0, rotate: 180 },
        { 
          scale: 1, 
          rotate: 0, 
          duration: 0.4, 
          stagger: 0.05,
          ease: 'back.out(2)' 
        },
        '-=0.5'
      );

      // 5. Text elements glitch in
      tl.fromTo('.glitch-text', 
        { x: -50, opacity: 0, skewX: 20 },
        { 
          x: 0, 
          opacity: 1, 
          skewX: 0, 
          stagger: 0.08, 
          duration: 0.3,
          ease: 'power3.out' 
        },
        '-=0.4'
      );

      // 6. VS Icon pulse
      tl.fromTo('.vs-icon',
        { scale: 0, rotate: -180 },
        { 
          scale: 1, 
          rotate: 0, 
          duration: 0.5,
          ease: 'back.out(3)' 
        },
        '-=0.3'
      );

      // 7. Buttons slide in
      tl.fromTo('.action-button',
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          stagger: 0.1,
          duration: 0.4,
          ease: 'power3.out' 
        },
        '-=0.2'
      );

      // 8. Timer bar countdown (30 seconds)
      tl.to(timerBarRef.current, {
        scaleX: 0,
        transformOrigin: 'left',
        duration: 30,
        ease: 'linear',
        onComplete: onDecline
      });

      // 9. Pulsing warning at 10 seconds remaining
      tl.to('.warning-pulse', {
        scale: [1, 1.1, 1],
        opacity: [0.5, 1, 0.5],
        duration: 0.5,
        repeat: -1,
        ease: 'power1.inOut'
      }, '-=10');

    }, containerRef);

    return () => ctx.revert();
  }, [onDecline]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] flex items-center justify-center font-sans overflow-hidden">
      
      {/* Backdrop */}
      <div className="overlay-backdrop absolute inset-0 bg-black/95 backdrop-blur-sm">
        {/* Animated red scanlines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(239,68,68,0.8) 1px, transparent 1px)`,
          backgroundSize: '100% 4px',
          animation: 'scan 8s linear infinite'
        }}></div>
        
        {/* Red vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(239,68,68,0.1)_100%)]"></div>
      </div>

      {/* Main Card */}
      <div className="main-card relative w-full max-w-3xl p-8 md:p-12 text-center">
        
        {/* Corner Brackets */}
        <div className="corner-accent absolute top-0 left-0 w-16 h-16 border-l-4 border-t-4 border-red-500"></div>
        <div className="corner-accent absolute top-0 right-0 w-16 h-16 border-r-4 border-t-4 border-red-500"></div>
        <div className="corner-accent absolute bottom-0 left-0 w-16 h-16 border-l-4 border-b-4 border-red-500"></div>
        <div className="corner-accent absolute bottom-0 right-0 w-16 h-16 border-r-4 border-b-4 border-red-500"></div>

        {/* Warning Label */}
        <div className="glitch-text inline-flex items-center gap-2 px-4 py-2 mb-4 bg-red-500/10 border-2 border-red-500/50">
          <AlertTriangle size={16} className="text-red-500" />
          <span className="text-[10px] text-red-500 font-bold tracking-[0.4em] uppercase">
            INCOMING CHALLENGE
          </span>
        </div>

        {/* VS Section */}
        <div className="glitch-text flex flex-col items-center justify-center mb-8">
          <div className="relative mb-6">
            <div className="vs-icon w-24 h-24 md:w-32 md:h-32 border-4 border-red-500 flex items-center justify-center bg-[#1a2332] shadow-[0_0_50px_rgba(239,68,68,0.6)] relative">
              <Swords size={48} className="text-red-500" />
              
              {/* Pulsing rings */}
              <div className="absolute inset-0 border-2 border-red-500 animate-ping opacity-20"></div>
              <div className="absolute inset-[-8px] border border-red-500/30"></div>
            </div>
            
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-black px-4 py-1 tracking-[0.3em]">
              VS
            </div>
          </div>
          
          {/* Opponent Name */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase text-white mb-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]" style={{
            textShadow: '0 0 10px rgba(239,68,68,0.5)'
          }}>
            {invite.senderName}
          </h1>
          <p className="text-red-500 font-bold tracking-[0.2em] text-sm uppercase">
            HAS CHALLENGED YOU
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <button 
            onClick={onDecline}
            className="action-button group relative px-8 py-4 bg-transparent border-2 border-gray-600 hover:border-red-500 text-gray-400 hover:text-white transition-all overflow-hidden"
          >
            <span className="flex items-center justify-center gap-2 font-bold uppercase tracking-wider">
              <X size={20} />
              DECLINE
            </span>
          </button>

          <button 
            onClick={onAccept}
            className="action-button group relative px-12 py-4 bg-red-500 hover:bg-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all overflow-hidden"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
            
            <span className="relative z-10 flex items-center justify-center gap-2 font-black uppercase tracking-[0.15em]">
              <Check size={24} />
              ACCEPT
            </span>

            {/* Corner accents */}
            <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-red-400"></div>
            <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-red-400"></div>
          </button>
        </div>

        {/* Timer Bar */}
        <div className="w-full max-w-md mx-auto">
          <div className="h-2 bg-gray-800/50 border border-red-500/30 overflow-hidden relative">
            <div 
              ref={timerBarRef}
              className="h-full bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] origin-left"
            ></div>
            
            {/* Warning pulse overlay */}
            <div className="warning-pulse absolute inset-0 bg-red-500/50 opacity-0"></div>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <Clock size={12} className="text-red-500/70" />
            <p className="text-red-500/70 text-[10px] font-mono uppercase tracking-wider">
              AUTO-DECLINE IN <span className="text-red-500 font-bold">30 SECONDS</span>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};

export default InviteOverlay;