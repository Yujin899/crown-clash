import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Swords, Check, X } from 'lucide-react';
import inviteSfx from '../assets/sounds/invite_notification.mp3';

const InviteOverlay = ({ invite, onAccept, onDecline }) => {
  const containerRef = useRef(null);
  const timerBarRef = useRef(null);

  useEffect(() => {
    // Play invite sound
    const audio = new Audio(inviteSfx);
    audio.play().catch(() => {});

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

      // 3. Main content slam in
      tl.fromTo('.main-content', 
        { y: -50, opacity: 0, scale: 0.9 },
        { 
          y: 0, 
          opacity: 1, 
          scale: 1, 
          duration: 0.8, 
          ease: 'elastic.out(1, 0.7)' 
        },
        '-=0.2'
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
        <div className="main-content relative z-10 flex flex-col items-center justify-center w-full h-full max-w-4xl mx-auto px-6 text-center">
          
          {/* Animated glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-red-500/5 animate-pulse pointer-events-none"></div>


            {/* Header Text */}
            <div className="mb-12 scale-110 sm:scale-125">
              <div className="inline-block px-6 py-2 bg-red-500/10 border border-red-500/30 mb-8 backdrop-blur-sm">
                <span className="text-red-500 text-sm sm:text-base font-bold uppercase tracking-[0.3em] flex items-center gap-3">
                  <Swords size={16} /> INCOMING CHALLENGE
                </span>
              </div>
              
              <h3 className="glitch-text text-white font-black text-4xl sm:text-6xl md:text-7xl uppercase mb-6 leading-none tracking-tight drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                {invite?.fromName || 'Unknown Agent'}
              </h3>
              
              <p className="glitch-text text-gray-300 text-lg sm:text-2xl font-medium tracking-widest uppercase">
                HAS INVITED YOU TO <span className="text-red-500 font-bold drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">{invite?.quizTitle || 'BATTLE'}</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-8 w-full max-w-2xl">
              <button 
                onClick={onDecline}
                className="action-button group relative px-8 py-4 bg-black/40 border border-gray-500 hover:border-red-500 text-gray-400 hover:text-white transition-all w-full sm:w-auto min-w-[200px] backdrop-blur-md"
              >
                <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 transition-all duration-300"></div>
                <span className="flex items-center justify-center gap-3 font-bold uppercase tracking-wider text-sm sm:text-base">
                  <X size={20} />
                  DECLINE
                </span>
              </button>

              <button 
                onClick={onAccept}
                className="action-button group relative px-10 py-4 bg-red-600 hover:bg-red-500 text-white shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:shadow-[0_0_60px_rgba(220,38,38,0.6)] transition-all w-full sm:w-auto min-w-[200px]"
              >
                <span className="relative z-10 flex items-center justify-center gap-3 font-black uppercase tracking-wider text-sm sm:text-base">
                  <Check size={24} />
                  ACCEPT
                </span>
                
                {/* Button Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 bg-white"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-white"></div>
              </button>
            </div>
          
            {/* Timer Bar (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-900/50">
              <div 
                ref={timerBarRef}
                className="h-full bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] origin-left"
              ></div>
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