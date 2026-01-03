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
      // ... existing setup animations ...

      // 1. Screen flash
      tl.fromTo('.flash-overlay',
        { opacity: 1 },
        { opacity: 0, duration: 0.5, ease: 'power2.out' }
      );

      // 2. VS badge explosive entrance
      tl.fromTo(vsRef.current,
        { scale: 0, rotate: 180, opacity: 0 },
        { 
          scale: 1, 
          rotate: 0, 
          opacity: 1, 
          duration: 0.8, 
          ease: 'back.out(4)',
        },
        '-=0.3'
      );

      // 3. VS icon pulse
      tl.to('.vs-icon', {
        scale: [1, 1.3, 1],
        duration: 0.4,
        ease: 'power2.inOut'
      });

      // 4. Player cards slam in from sides with 3D rotation
      tl.fromTo('.player-card-left',
        { x: -400, rotateY: -90, opacity: 0 },
        { 
          x: 0, 
          rotateY: 0, 
          opacity: 1, 
          duration: 0.8,
          ease: 'power4.out'
        },
        '-=0.6'
      );

      tl.fromTo('.player-card-right',
        { x: 400, rotateY: 90, opacity: 0 },
        { 
          x: 0, 
          rotateY: 0, 
          opacity: 1, 
          duration: 0.8,
          ease: 'power4.out'
        },
        '-=0.8'
      );

      // 5. Energy lines between players
      tl.fromTo('.energy-line',
        { scaleX: 0 },
        { scaleX: 1, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      );

      // 6. Countdown glitch entrance
      tl.fromTo('.countdown-number',
        { scale: 3, opacity: 0, y: -50 },
        { 
          scale: 1, 
          opacity: 1, 
          y: 0,
          duration: 0.4,
          ease: 'back.out(2)'
        },
        '-=0.2'
      );

      // 7. Corner brackets animate in
      tl.fromTo('.corner-bracket',
        { scale: 0, rotate: 45 },
        { 
          scale: 1, 
          rotate: 0, 
          duration: 0.3,
          stagger: 0.05,
          ease: 'back.out(3)'
        },
        '-=0.3'
      );

      // 8. Continuous glow pulse on VS badge
      tl.to('.vs-glow', {
        opacity: [0.3, 0.8, 0.3],
        scale: [1, 1.2, 1],
        duration: 1.5,
        repeat: -1,
        ease: 'sine.inOut'
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden">
      
      {/* Flash overlay */}
      <div className="flash-overlay absolute inset-0 bg-red-500"></div>

      {/* Background */}
      <div className="absolute inset-0 bg-[#0f1923]">
        {/* Scanlines */}
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

      {/* Corner brackets */}
      <div className="corner-bracket absolute top-8 left-8 w-20 h-20 border-l-4 border-t-4 border-red-500"></div>
      <div className="corner-bracket absolute top-8 right-8 w-20 h-20 border-r-4 border-t-4 border-red-500"></div>
      <div className="corner-bracket absolute bottom-8 left-8 w-20 h-20 border-l-4 border-b-4 border-red-500"></div>
      <div className="corner-bracket absolute bottom-8 right-8 w-20 h-20 border-r-4 border-b-4 border-red-500"></div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-6xl px-4">
        <div className="flex items-center justify-between gap-8">
          
          {/* Left Player Card */}
          <div className="player-card-left flex-1 max-w-md">
            <div className="relative bg-[#1a2332] border-2 border-red-500 p-6 overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-red-500/5"></div>
              
              <div className="relative z-10">
                {/* Player avatar */}
                {myPlayer?.avatar?.url ? (
                  <div className="w-32 h-32 mx-auto mb-4 border-4 border-red-500 relative">
                    <img src={myPlayer.avatar.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-red-500"></div>
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-red-500"></div>
                  </div>
                ) : (
                  <div className="w-32 h-32 mx-auto mb-4 bg-red-500/20 border-4 border-red-500 flex items-center justify-center">
                    <Swords size={48} className="text-red-500" />
                  </div>
                )}
                
                <h3 className="text-2xl font-black uppercase text-center text-white mb-2">
                  {myPlayer?.name || 'YOU'}
                </h3>
                <p className="text-red-500 text-xs uppercase tracking-[0.2em] text-center font-bold">
                  {myPlayer?.avatar?.role || 'AGENT'}
                </p>
              </div>

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-red-500"></div>
            </div>
          </div>

          {/* VS Badge */}
          <div ref={vsRef} className="relative flex-shrink-0">
            {/* Glow effect */}
            <div className="vs-glow absolute inset-0 bg-red-500 blur-3xl opacity-50 scale-150"></div>
            
            <div className="relative w-32 h-32 bg-[#1a2332] border-4 border-red-500 flex items-center justify-center">
              <Swords size={48} className="vs-icon text-red-500" />
              
              {/* Pulsing rings */}
              <div className="absolute inset-0 border-2 border-red-500 animate-ping opacity-20"></div>
              
              {/* Corner brackets */}
              <div className="absolute -top-2 -left-2 w-6 h-6 border-l-4 border-t-4 border-red-500"></div>
              <div className="absolute -top-2 -right-2 w-6 h-6 border-r-4 border-t-4 border-red-500"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-4 border-b-4 border-red-500"></div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-4 border-b-4 border-red-500"></div>
            </div>

            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-red-500 px-6 py-2 whitespace-nowrap">
              <span className="text-white font-black text-lg tracking-[0.3em] uppercase">VS</span>
            </div>
          </div>

          {/* Right Player Card */}
          <div className="player-card-right flex-1 max-w-md">
            <div className="relative bg-[#1a2332] border-2 border-red-500 p-6 overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-red-500/5"></div>
              
              <div className="relative z-10">
                {/* Player avatar */}
                {enemyPlayer?.avatar?.url ? (
                  <div className="w-32 h-32 mx-auto mb-4 border-4 border-red-500 relative">
                    <img src={enemyPlayer.avatar.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-red-500"></div>
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-red-500"></div>
                  </div>
                ) : (
                  <div className="w-32 h-32 mx-auto mb-4 bg-red-500/20 border-4 border-red-500 flex items-center justify-center">
                    <Swords size={48} className="text-red-500" />
                  </div>
                )}
                
                <h3 className="text-2xl font-black uppercase text-center text-white mb-2">
                  {enemyPlayer?.name || 'OPPONENT'}
                </h3>
                <p className="text-red-500 text-xs uppercase tracking-[0.2em] text-center font-bold">
                  {enemyPlayer?.avatar?.role || 'AGENT'}
                </p>
              </div>

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-red-500"></div>
            </div>
          </div>
        </div>

        {/* Energy lines connecting players */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 flex items-center justify-center">
          <div className="energy-line w-full h-full bg-gradient-to-r from-red-500 via-red-600 to-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]"></div>
        </div>

        {/* Countdown */}
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 text-center">
          <div className="countdown-number inline-flex items-center justify-center w-24 h-24 bg-red-500 border-4 border-red-400 relative">
            <span className="text-6xl font-black text-white">{currentCount === 0 ? 'GO!' : currentCount}</span>
            
            {/* Pulse ring */}
            <div className="absolute inset-0 border-4 border-red-500 animate-ping opacity-30"></div>
            
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-white"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-white"></div>
          </div>
          <p className="text-red-500 text-xs uppercase tracking-[0.3em] font-bold mt-4">
            COMBAT STARTING
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameStartOverlay;