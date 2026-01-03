import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Swords, Check, X, Clock, AlertTriangle } from 'lucide-react';
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
        <div className="main-card relative bg-gradient-to-br from-[#1a2332] to-[#0f1923] border-2 border-red-500 shadow-2xl max-w-md w-full mx-4 sm:mx-4 overflow-hidden clip-path-notch">
          {/* Animated glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent animate-pulse"></div>
          
          {/* Corner accents */}
          <div className="corner-accent absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-red-500"></div>
          <div className="corner-accent absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-red-500"></div>
          <div className="corner-accent absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-red-500"></div>
          <div className="corner-accent absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-red-500"></div>

          {/* Content */}
          <div className="relative z-10 p-4 sm:p-6 md:p-8">
            {/* Header */}
            <div className="header-section text-center mb-4 sm:mb-6">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <Swords className="icon-pulse text-red-500" size={32} />
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-red-500" style={{
                  textShadow: '0 0 20px rgba(239, 68, 68, 0.6)'
                }}>
                  CHALLENGE
                </h2>
                <Swords className="icon-pulse text-red-500" size={32} />
              </div>
              <div className="challenge-bar h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
            </div>

            {/* Sender Info with Avatar */}
            <div className="sender-info flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-black/30 border border-red-500/30 clip-path-notch">
              {invite?.fromAvatar?.url ? (
                <img 
                  src={invite.fromAvatar.url} 
                  alt={invite.fromName || 'Player'}
                  className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-red-500 clip-path-notch object-cover"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 border-2 border-red-500 clip-path-notch flex items-center justify-center">
                  <Swords size={24} className="text-red-500" />
                </div>
              )}
              <div className="text-left">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Challenger</p>
                <p className="text-white font-bold text-base sm:text-xl">{invite?.fromName || 'Unknown Player'}</p>
              </div>
            </div>

            {/* Challenge Details */}
            <div className="detail-section space-y-3 mb-6">
              <div className="bg-black/40 p-3 border-l-4 border-red-500">
                <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Quiz</p>
                <p className="text-white font-bold">{invite?.quizTitle || 'Unknown Quiz'}</p>
              </div>
              <div className="bg-black/40 p-3 border-l-4 border-yellow-500">
                <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Subject</p>
                <p className="text-white font-bold">{invite?.subjectName || 'Unknown Subject'}</p>
              </div>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-black px-4 py-1 tracking-[0.3em]">
              VS
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black uppercase text-white mb-2 sm:mb-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] px-2" style={{
            textShadow: '0 0 10px rgba(239,68,68,0.5)'
          }}>
            {invite.senderName}
          </h1>
          <p className="text-red-500 font-bold tracking-[0.15em] sm:tracking-[0.2em] text-xs sm:text-sm uppercase px-2">
            HAS CHALLENGED YOU
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 px-4">
          <button 
            onClick={onDecline}
            className="action-button group relative px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-gray-600 hover:border-red-500 text-gray-400 hover:text-white transition-all overflow-hidden order-2 sm:order-1"
          >
            <span className="flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-sm">
              <X size={18} />
              DECLINE
            </span>
          </button>

          <button 
            onClick={onAccept}
            className="action-button group relative px-8 sm:px-12 py-3 sm:py-4 bg-red-500 hover:bg-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all overflow-hidden order-1 sm:order-2"
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
        <div className="w-full max-w-md mx-auto px-4">
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