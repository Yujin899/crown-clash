import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Crosshair, Skull,AlertTriangle, XCircle, Target } from 'lucide-react';
import gunshotSfx from '../assets/sounds/gunshot.mp3';

const KillAnimation = ({ mode, enemyAvatar, onComplete }) => {
  const containerRef = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(gunshotSfx);
    audio.volume = 1.0;

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
        // KILL ANIMATION - Headshot sequence
        tl.fromTo('.crosshair',
          { scale: 0, rotate: -90 },
          { scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2)' }
        );

        tl.to('.crosshair', {
          scale: [1, 1.2, 1],
          duration: 0.3,
          repeat: 8,
          ease: 'power1.inOut'
        });

        // 2. Target zoom
        tl.to('.target-frame',
          { scale: 1.3, duration: 3, ease: 'power1.inOut' },
          '-=2.5'
        );

        // 3. Fire!
        tl.call(() => {
          audio.play().catch(() => {});
        });

        // 4. Muzzle flash
        tl.to('.muzzle-flash', {
          opacity: [0, 1, 0],
          duration: 0.15
        });

        // 5. Screen shake
        tl.to(containerRef.current, {
          x: [-10, 10, -10, 10, 0],
          y: [-5, 5, -5, 5, 0],
          duration: 0.4,
          ease: 'power2.inOut'
        }, '-=0.1');

        // 6. Impact effect on target
        tl.to('.target-frame', {
          scale: 1.1,
          border: '8px solid #dc2626',
          duration: 0.1
        }, '-=0.3');

        // 7. Blood splatter effect
        tl.fromTo('.blood-effect',
          { scale: 0, opacity: 1 },
          { scale: 2, opacity: 0, duration: 0.6, ease: 'power2.out' },
          '-=0.2'
        );

        // 8. Skull icon reveal
        tl.fromTo('.kill-icon',
          { scale: 0, rotate: -180, opacity: 0 },
          { scale: 1, rotate: 0, opacity: 1, duration: 0.5, ease: 'back.out(3)' },
          '-=0.4'
        );

        // 9. Grayscale target
        tl.to('.target-image', {
          filter: 'grayscale(100%)',
          duration: 0.3
        }, '-=0.3');

        // 10. "ELIMINATED" text
        tl.fromTo('.kill-text',
          { scale: 2, y: -50, opacity: 0 },
          { scale: 1, y: 0, opacity: 1, duration: 0.6, ease: 'elastic.out(1, 0.6)' },
          '-=0.2'
        );

        // 11. Hold for 1 second
        tl.to({}, { duration: 1 });

      } else if (mode === 'backfire') {
        // BACKFIRE ANIMATION - Weapon malfunction
        
        // 1. Warning flash
        tl.to('.warning-flash', {
          opacity: [0, 1, 0, 1, 0],
          duration: 0.8,
          ease: 'steps(5)'
        });

        // 2. Warning icon shake
        tl.fromTo('.warning-icon',
          { scale: 0, rotate: 0 },
          { scale: 1, rotate: [0, 5, -5, 0], duration: 0.5, ease: 'back.out(2)' },
          '-=0.4'
        );

        tl.to('.warning-icon', {
          rotate: [0, 5, -5, 0],
          duration: 0.2,
          repeat: 5,
          ease: 'power1.inOut'
        });

        // 3. Fire attempt (fails)
        tl.call(() => {
          // Play error sound or silenced gunshot
          const errorAudio = audio.cloneNode();
          errorAudio.volume = 0.3;
          errorAudio.playbackRate = 0.7;
          errorAudio.play().catch(() => {});
        });

        // 4. Explosion effect
        tl.fromTo('.explosion-effect',
          { scale: 0, opacity: 1 },
          { scale: 3, opacity: 0, duration: 0.8, ease: 'power2.out' }
        );

        // 5. Screen shake (stronger)
        tl.to(containerRef.current, {
          x: [-15, 15, -15, 15, -10, 10, 0],
          y: [-10, 10, -10, 10, -5, 5, 0],
          duration: 0.6,
          ease: 'power2.inOut'
        }, '-=0.7');

        // 6. Error X icon
        tl.fromTo('.error-icon',
          { scale: 0, rotate: 180 },
          { scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(3)' },
          '-=0.3'
        );

        // 7. "WEAPON JAMMED" text
        tl.fromTo('.backfire-text',
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
          '-=0.2'
        );

        // 8. Hold for 1 second
        tl.to({}, { duration: 1 });
      }

    }, containerRef);

    return () => {
      ctx.revert();
      audio.pause();
      audio.currentTime = 0;
    };
  }, [mode, onComplete]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[200] bg-[#0f1923] flex items-center justify-center overflow-hidden">
      
      {/* Muzzle flash */}
      <div className="muzzle-flash absolute inset-0 bg-white opacity-0 pointer-events-none z-50"></div>

      {mode === 'kill' && (
        <>
          {/* Background */}
          <div className="absolute inset-0 bg-red-950/20"></div>

          {/* Enemy Avatar (Target or Killer) */}
          {(mode === 'kill' || mode === 'victim') && (
            <div className="enemy-avatar relative w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-red-500 overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.5)] z-10 bg-black">
              <img 
                src={enemyAvatar} 
                alt="Enemy" 
                className="w-full h-full object-cover"
              />
              {mode === 'kill' && <div className="absolute inset-0 bg-red-500/20"></div>}
              
              {/* Victim: Muzzle flash overlay */}
              {mode === 'victim' && (
                <div className="absolute inset-0 bg-white/0 animate-ping"></div>
              )}
            </div>
          )}
          {/* Blood effect overlay */}
          <div className="blood-effect absolute inset-0 bg-red-600/60 rounded-full opacity-0"></div>
            
          {/* Kill icon */}
          <div className="kill-icon absolute inset-0 flex items-center justify-center opacity-0">
            <Skull size={120} className="text-white drop-shadow-2xl" />
          </div>

          {/* Crosshair HUD */}
          <div className="absolute inset-0 pointer-events-none z-20">
            {/* Vignette */}
            <div className="absolute inset-0 border-[40vw] border-black/90 rounded-full scale-150"></div>
            
            {/* Crosshair lines */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-[1px] bg-red-500/50"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-screen w-[1px] bg-red-500/50"></div>
            
            {/* Crosshair icon */}
            <div className="crosshair absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500">
              <Crosshair size={100} strokeWidth={1} />
            </div>
            
            {/* Status text */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-red-500 font-mono tracking-[0.5em] text-sm animate-pulse">
              ACQUIRING TARGET...
            </div>
          </div>

          {/* Kill Text */}
          <h1 className="kill-text absolute top-1/4 text-6xl md:text-8xl font-black text-white z-50 opacity-0 uppercase tracking-tight" style={{
            textShadow: '0 0 50px rgba(239, 68, 68, 1), 0 0 20px rgba(239, 68, 68, 0.8)'
          }}>
            ELIMINATED
          </h1>
        </>
      )}

      {mode === 'backfire' && (
        <>
          {/* Warning flash */}
          <div className="warning-flash absolute inset-0 bg-yellow-500/20 opacity-0"></div>

          {/* Background */}
          <div className="absolute inset-0 bg-red-900/30"></div>

          {/* Warning Content */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Warning Icon */}
            <div className="warning-icon text-yellow-500">
              <AlertTriangle size={150} strokeWidth={3} />
            </div>

            {/* Explosion effect */}
            <div className="explosion-effect absolute inset-0 flex items-center justify-center opacity-0">
              <div className="w-64 h-64 bg-orange-500 rounded-full blur-3xl"></div>
            </div>

            {/* Error X */}
            <div className="error-icon opacity-0">
              <XCircle size={200} className="text-red-600" strokeWidth={4} />
            </div>
          </div>

          {/* Backfire Text */}
          <div className="backfire-text absolute bottom-20 opacity-0">
            <div className="bg-black/80 px-8 py-4 border-4 border-red-600 relative">
              <h2 className="text-4xl md:text-6xl font-black text-red-600 uppercase tracking-tight">
                WEAPON JAMMED
              </h2>
              <p className="text-yellow-500 text-sm uppercase tracking-[0.3em] text-center mt-2 font-bold">
                CRITICAL ERROR
              </p>
              
              {/* Corner brackets */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-red-500"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-red-500"></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default KillAnimation;