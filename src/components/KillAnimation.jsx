import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import gunshotSfx from '../assets/sounds/gunshot.mp3';

const KillAnimation = ({ mode, enemyAvatar, onComplete }) => {
  const containerRef = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(gunshotSfx);
    audio.volume = 0.6;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          if (!completedRef.current) {
            completedRef.current = true;
            onComplete();
          }
        }
      });

      if (mode === 'kill') {
        // VALORANT-STYLE VICTORY ANIMATION
        
        // 1. Background fade in
        tl.to('.victory-bg', {
          opacity: 1,
          duration: 0.3,
          ease: 'power2.out'
        });

        // 2. Main text slide and scale
        tl.fromTo('.victory-main-text',
          { y: 50, scale: 0.8, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'power3.out' }
        );

        // 3. Glow effect
        tl.to('.victory-glow', {
          opacity: 0.6,
          scale: 1.1,
          duration: 0.8,
          ease: 'sine.inOut'
        }, '-=0.4');

        // 4. Accent lines expand
        tl.fromTo('.victory-line',
          { scaleX: 0 },
          { scaleX: 1, duration: 0.5, ease: 'power2.out', stagger: 0.1 },
          '-=0.3'
        );

        // 5. Subtitle fade
        tl.fromTo('.victory-subtitle',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4 },
          '-=0.2'
        );

        // Hold for 2 seconds
        tl.to({}, { duration: 2 });

      } else if (mode === 'victim') {
        // VALORANT-STYLE DEFEAT ANIMATION
        
        // 1. Quick gunshot sound
        tl.call(() => {
          audio.play().catch(() => {});
        });

        // 2. Red flash
        tl.to('.defeat-flash', {
          opacity: 0.4,
          duration: 0.1
        });

        tl.to('.defeat-flash', {
          opacity: 0,
          duration: 0.2
        });

        // 3. Background darken
        tl.to('.defeat-bg', {
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out'
        }, '-=0.15');

        // 4. Main text impact
        tl.fromTo('.defeat-main-text',
          { y: -30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
        );

        // 5. Red accent lines
        tl.fromTo('.defeat-line',
          { scaleX: 0 },
          { scaleX: 1, duration: 0.4, ease: 'power2.out', stagger: 0.08 },
          '-=0.3'
        );

        // 6. Subtitle
        tl.fromTo('.defeat-subtitle',
          { opacity: 0 },
          { opacity: 1, duration: 0.3 },
          '-=0.1'
        );

        // Hold for 2 seconds
        tl.to({}, { duration: 2 });

      } else if (mode === 'backfire') {
        // BACKFIRE - Simpler version
        
        // 1. Warning flash
        tl.to('.backfire-flash', {
          opacity: [0, 0.3, 0, 0.3, 0],
          duration: 0.6,
          ease: 'steps(5)'
        });

        // 2. Background
        tl.to('.backfire-bg', {
          opacity: 1,
          duration: 0.3
        });

        // 3. Text
        tl.fromTo('.backfire-text',
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }
        );

        // 4. Error lines
        tl.fromTo('.backfire-line',
          { scaleX: 0 },
          { scaleX: 1, duration: 0.3, stagger: 0.1 },
          '-=0.2'
        );

        // Hold
        tl.to({}, { duration: 1.8 });
      }

    }, containerRef);

    return () => {
      ctx.revert();
      audio.pause();
      audio.currentTime = 0;
    };
  }, [mode, onComplete]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#0f1923]">
      
      {mode === 'kill' && (
        <>
          {/* Victory Background */}
          <div className="victory-bg absolute inset-0 bg-gradient-to-b from-emerald-950/40 to-[#0f1923] opacity-0"></div>
          
          {/* Glow effect */}
          <div className="victory-glow absolute w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[100px] opacity-0"></div>

          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Top accent line */}
            <div className="victory-line h-[2px] w-64 mx-auto mb-8 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>

            {/* Main Text */}
            <h1 className="victory-main-text text-8xl md:text-9xl font-black uppercase tracking-tight opacity-0" style={{
              color: '#10b981',
              textShadow: '0 0 40px rgba(16, 185, 129, 0.5)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.05em'
            }}>
              VICTORY
            </h1>

            {/* Bottom accent line */}
            <div className="victory-line h-[2px] w-64 mx-auto mt-8 mb-6 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>

            {/* Subtitle */}
            <p className="victory-subtitle text-emerald-300 text-xl font-semibold uppercase tracking-[0.3em] opacity-0">
              Mission Success
            </p>
          </div>
        </>
      )}

      {mode === 'victim' && (
        <>
          {/* Red flash */}
          <div className="defeat-flash absolute inset-0 bg-red-600 opacity-0"></div>

          {/* Defeat Background */}
          <div className="defeat-bg absolute inset-0 bg-gradient-to-b from-red-950/60 to-[#0f1923] opacity-0"></div>

          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Top accent line */}
            <div className="defeat-line h-[3px] w-72 mx-auto mb-8 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

            {/* Main Text */}
            <h1 className="defeat-main-text text-8xl md:text-9xl font-black uppercase tracking-tight opacity-0" style={{
              color: '#ef4444',
              textShadow: '0 0 40px rgba(239, 68, 68, 0.6)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.05em'
            }}>
              DEFEAT
            </h1>

            {/* Bottom accent line */}
            <div className="defeat-line h-[3px] w-72 mx-auto mt-8 mb-6 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

            {/* Subtitle */}
            <p className="defeat-subtitle text-red-300 text-lg font-medium uppercase tracking-[0.4em] opacity-0">
              Eliminated
            </p>
          </div>
        </>
      )}

      {mode === 'backfire' && (
        <>
          {/* Warning flash */}
          <div className="backfire-flash absolute inset-0 bg-yellow-500/30 opacity-0"></div>

          {/* Background */}
          <div className="backfire-bg absolute inset-0 bg-gradient-to-b from-orange-950/50 to-[#0f1923] opacity-0"></div>

          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Top line */}
            <div className="backfire-line h-[2px] w-64 mx-auto mb-6 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>

            {/* Text */}
            <div className="backfire-text opacity-0">
              <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tight mb-4" style={{
                color: '#f59e0b',
                textShadow: '0 0 30px rgba(245, 158, 11, 0.5)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                WEAPON JAMMED
              </h1>
              <p className="text-orange-300 text-base uppercase tracking-[0.3em] font-medium">
                Low Accuracy - Mission Failed
              </p>
            </div>

            {/* Bottom line */}
            <div className="backfire-line h-[2px] w-64 mx-auto mt-6 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
          </div>
        </>
      )}
    </div>
  );
};

export default KillAnimation;