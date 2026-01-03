import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Swords, Zap } from 'lucide-react';

const GameStartOverlay = ({ myPlayer, enemyPlayer, countdown: initialCountdown = 4 }) => {
  const containerRef = useRef(null);
  const vsRef = useRef(null);
  const [currentCount, setCurrentCount] = useState(initialCountdown);

  // Dynamic countdown logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentCount(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000); // 1 second interval

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      // ... (existing animations) ...
      
      // Animate countdown number change
      gsap.fromTo('.countdown-number span', 
        { scale: 1.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' }
      );
    }, containerRef);
    
    return () => ctx.revert();
  }, [currentCount]); // Re-run animation on count change

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. Dramatic screen flash with color shift
      tl.fromTo('.flash-overlay',
        { opacity: 1 },
        { opacity: 0, duration: 0.5, ease: 'power3.out' }
      );

      // 2. Corner brackets stagger in (professional touch)
      tl.fromTo('.corner-bracket',
        { scale: 0, opacity: 0 },
        { 
          scale: 1, 
          opacity: 1,
          duration: 0.4,
          stagger: 0.08,
          ease: 'back.out(2.5)'
        },
        '-=0.3'
      );

      // 3. VS badge explosive entrance with impact
      tl.fromTo(vsRef.current,
        { scale: 0, opacity: 0, rotate: -180 },
        { 
          scale: 1, 
          opacity: 1,
          rotate: 0,
          duration: 0.7, 
          ease: 'back.out(2.5)',
        },
        '-=0.2'
      );

      // 4. VS badge impact shake
      tl.to(vsRef.current, {
        x: [0, -4, 4, -2, 2, 0],
        duration: 0.3,
        ease: 'power2.out'
      }, '-=0.1');

      // 5. Player cards slam in from sides with stagger
      tl.fromTo('.player-card-left',
        { x: -150, opacity: 0, scale: 0.8 },
        { 
          x: 0, 
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: 'power4.out'
        },
        '-=0.4'
      );

      tl.fromTo('.player-card-right',
        { x: 150, opacity: 0, scale: 0.8 },
        { 
          x: 0, 
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: 'power4.out'
        },
        '-=0.6'
      );

      // 6. Player card content stagger (names and avatars)
      tl.fromTo('.player-content',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: 'power2.out'
        },
        '-=0.3'
      );

      // 7. Energy pulse effect
      tl.fromTo('.energy-pulse',
        { scale: 0.5, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out'
        },
        '-=0.2'
      );

      // 8. Countdown dramatic entrance
      tl.fromTo('.countdown-number',
        { scale: 0, opacity: 0, rotate: -90 },
        { 
          scale: 1, 
          opacity: 1,
          rotate: 0,
          duration: 0.5,
          ease: 'back.out(3)'
        },
        '-=0.2'
      );

      // 9. Continuous effects - optimized for performance
      tl.to('.vs-glow', {
        opacity: [0.4, 0.7, 0.4],
        duration: 2.5,
        repeat: -1,
        ease: 'sine.inOut'
      });

      // 10. Subtle scanline animation
      tl.to('.scanline-effect', {
        y: ['0%', '100%'],
        duration: 2,
        repeat: -1,
        ease: 'none'
      }, '-=2.5');

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden">
      
      {/* Flash overlay */}
      <div className="flash-overlay absolute inset-0 bg-red-500"></div>

      {/* Background */}
      <div className="absolute inset-0 bg-[#0f1923]">
        {/* Animated scanline effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="scanline-effect absolute inset-x-0 h-1 bg-gradient-to-b from-transparent via-red-500/20 to-transparent blur-sm"></div>
        </div>
        
        {/* Static scanlines */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `linear-gradient(rgba(239,68,68,0.8) 1px, transparent 1px)`,
          backgroundSize: '100% 4px',
        }}></div>
        
        {/* Red grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(239,68,68,0.5) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(239,68,68,0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Corner brackets - responsive sizes */}
      <div className="corner-bracket absolute top-4 left-4 w-8 h-8 md:top-8 md:left-8 md:w-16 md:h-16 border-l-2 border-t-2 md:border-l-4 md:border-t-4 border-red-500"></div>
      <div className="corner-bracket absolute top-4 right-4 w-8 h-8 md:top-8 md:right-8 md:w-16 md:h-16 border-r-2 border-t-2 md:border-r-4 md:border-t-4 border-red-500"></div>
      <div className="corner-bracket absolute bottom-4 left-4 w-8 h-8 md:bottom-8 md:left-8 md:w-16 md:h-16 border-l-2 border-b-2 md:border-l-4 md:border-b-4 border-red-500"></div>
      <div className="corner-bracket absolute bottom-4 right-4 w-8 h-8 md:bottom-8 md:right-8 md:w-16 md:h-16 border-r-2 border-b-2 md:border-r-4 md:border-b-4 border-red-500"></div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center justify-center gap-8 md:gap-12">
        
        {/* Players container */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 w-full">
          
          {/* Left Player Card */}
          <div className="player-card-left w-full max-w-[280px] sm:max-w-xs md:max-w-sm will-change-transform">
            <div className="relative bg-[#0f1923] border-2 border-red-500 p-4 md:p-6 overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-red-500/5"></div>
              
              <div className="player-content relative z-10">
                {/* Player avatar */}
                {myPlayer?.avatar?.url ? (
                  <div className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 md:mb-4 border-2 md:border-4 border-red-500 relative">
                    <img src={myPlayer.avatar.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-red-500"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-red-500"></div>
                  </div>
                ) : (
                  <div className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 md:mb-4 bg-red-500/20 border-2 md:border-4 border-red-500 flex items-center justify-center">
                    <Swords size={32} className="text-red-500 md:w-12 md:h-12" />
                  </div>
                )}
                
                <h3 className="text-lg md:text-xl font-black uppercase text-center text-white mb-1 md:mb-2 truncate">
                  {myPlayer?.name || 'YOU'}
                </h3>
                <p className="text-red-500 text-[9px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] text-center font-bold">
                  {myPlayer?.avatar?.role || 'AGENT'}
                </p>
              </div>

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-4 h-4 md:w-6 md:h-6 border-l-2 border-t-2 md:border-l-4 md:border-t-4 border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 md:w-6 md:h-6 border-r-2 border-b-2 md:border-r-4 md:border-b-4 border-red-500"></div>
            </div>
          </div>

          {/* VS Badge */}
          <div ref={vsRef} className="relative flex-shrink-0 will-change-transform">
            {/* Energy pulse rings */}
            <div className="energy-pulse absolute -inset-4 md:-inset-8">
              <div className="absolute inset-0 border-2 border-red-500/30 rounded-full animate-ping"></div>
              <div className="absolute inset-2 border border-red-500/20 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
            </div>
            
            {/* Glow effect */}
            <div className="vs-glow absolute inset-0 bg-red-500 blur-2xl md:blur-3xl opacity-50 scale-150"></div>
            
            <div className="relative w-16 h-16 md:w-28 md:h-28 bg-[#0f1923] border-2 md:border-4 border-red-500 flex items-center justify-center">
              <Swords size={24} className="vs-icon text-red-500 md:w-10 md:h-10" />
              
              {/* Pulsing rings */}
              <div className="absolute inset-0 border border-red-500 md:border-2 animate-ping opacity-20"></div>
              
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-3 h-3 md:w-5 md:h-5 border-l-2 border-t-2 md:border-l-4 md:border-t-4 border-red-500"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 md:w-5 md:h-5 border-r-2 border-t-2 md:border-r-4 md:border-t-4 border-red-500"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 md:w-5 md:h-5 border-l-2 border-b-2 md:border-l-4 md:border-b-4 border-red-500"></div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-5 md:h-5 border-r-2 border-b-2 md:border-r-4 md:border-b-4 border-red-500"></div>
            </div>

            <div className="absolute -bottom-5 md:-bottom-7 left-1/2 -translate-x-1/2 bg-red-500 px-3 md:px-5 py-0.5 md:py-1.5 whitespace-nowrap">
              <span className="text-white font-black text-xs md:text-base tracking-[0.2em] md:tracking-[0.3em] uppercase">VS</span>
            </div>
          </div>

          {/* Right Player Card */}
          <div className="player-card-right w-full max-w-[280px] sm:max-w-xs md:max-w-sm will-change-transform">
            <div className="relative bg-[#0f1923] border-2 border-red-500 p-4 md:p-6 overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-red-500/5"></div>
              
              <div className="player-content relative z-10">
                {/* Player avatar */}
                {enemyPlayer?.avatar?.url ? (
                  <div className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 md:mb-4 border-2 md:border-4 border-red-500 relative">
                    <img src={enemyPlayer.avatar.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-red-500"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-red-500"></div>
                  </div>
                ) : (
                  <div className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 md:mb-4 bg-red-500/20 border-2 md:border-4 border-red-500 flex items-center justify-center">
                    <Swords size={32} className="text-red-500 md:w-12 md:h-12" />
                  </div>
                )}
                
                <h3 className="text-lg md:text-xl font-black uppercase text-center text-white mb-1 md:mb-2 truncate">
                  {enemyPlayer?.name || 'OPPONENT'}
                </h3>
                <p className="text-red-500 text-[9px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] text-center font-bold">
                  {enemyPlayer?.avatar?.role || 'AGENT'}
                </p>
              </div>

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-4 h-4 md:w-6 md:h-6 border-l-2 border-t-2 md:border-l-4 md:border-t-4 border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 md:w-6 md:h-6 border-r-2 border-b-2 md:border-r-4 md:border-b-4 border-red-500"></div>
            </div>
          </div>
        </div>

        {/* Countdown - repositioned to be inside the viewport */}
        <div className="mt-4 md:mt-6 flex flex-col items-center">
          <div className="countdown-number flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-red-500 border-2 md:border-4 border-red-400 relative will-change-transform">
            <span className="text-3xl md:text-5xl font-black text-white">{currentCount === 0 ? 'GO!' : currentCount}</span>
            
            {/* Pulse ring */}
            <div className="absolute inset-0 border-2 md:border-4 border-red-500 animate-ping opacity-30"></div>
            
            {/* Corner brackets */}
            <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-l-2 border-t-2 border-white"></div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-r-2 border-b-2 border-white"></div>
          </div>
          <p className="text-red-500 text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold mt-2 md:mt-3 text-center">
            COMBAT STARTING
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameStartOverlay;