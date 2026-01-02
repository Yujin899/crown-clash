import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Zap, Swords, Trophy } from 'lucide-react';

// Player Card Component (نفسه بدون تغيير بس للتأكيد)
const PlayerCard = ({ player, isOpponent = false }) => {
  return (
    <div className={`player-card relative flex flex-col items-center justify-center w-full md:w-1/2 h-full 
      ${isOpponent ? 'items-end md:items-end text-right' : 'items-start md:items-start text-left'}
    `}>
      <div className={`absolute inset-0 opacity-20 transform 
        ${isOpponent ? 'bg-gradient-to-l from-red-900 via-transparent' : 'bg-gradient-to-r from-cyan-900 via-transparent'}
      `}></div>

      <div className={`relative z-10 p-8 md:p-16 flex flex-col ${isOpponent ? 'items-end' : 'items-start'}`}>
        <div className="avatar-box relative mb-6 group">
            <div className={`absolute -inset-2 skew-x-[-10deg] opacity-75 blur-sm ${isOpponent ? 'bg-red-600' : 'bg-cyan-500'}`}></div>
            <div className={`relative w-32 h-32 md:w-48 md:h-48 skew-x-[-10deg] overflow-hidden border-4 bg-black ${isOpponent ? 'border-red-600' : 'border-cyan-500'}`}>
                <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover skew-x-[10deg] scale-110" />
            </div>
        </div>
        <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg mb-2">{player.name}</h2>
        <p className={`text-sm md:text-base font-mono tracking-[0.3em] uppercase ${isOpponent ? 'text-red-400' : 'text-cyan-400'}`}>{player.title}</p>
      </div>
    </div>
  );
};

const GameStartOverlay = ({ player, opponent, onAnimationComplete }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
             // بمجرد انتهاء الانيميشن نبلغ الأب فوراً
             if (onAnimationComplete) onAnimationComplete();
        }
      });

      // Setup
      gsap.set(".player-card", { x: (i) => i === 0 ? "-100%" : "100%", opacity: 0 });
      gsap.set(".vs-divider", { scaleY: 0, opacity: 0 });
      gsap.set(".vs-text", { scale: 5, opacity: 0 });

      // Animation
      tl.to(".overlay-bg", { opacity: 1, duration: 0.5 })
        .to(".player-card", { x: "0%", opacity: 1, duration: 0.8, ease: "power4.out", stagger: 0.2 })
        .to(".vs-divider", { scaleY: 1, opacity: 1, duration: 0.4 }, "-=0.4")
        .to(".vs-text", { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" }, "-=0.2")
        .to(".loading-text", { opacity: 1, duration: 0.5, repeat: 1, yoyo: true }) // قللنا التكرار عشان السرعة
        
        // IMPORTANT: لا تخفي الـ Overlay هنا، سيب الـ Game Component هو اللي يخفيه لما الحالة تتغير
    }, containerRef);

    return () => ctx.revert();
  }, []); // Run once

  return (
    <div ref={containerRef} className="game-start-overlay fixed inset-0 z-[200] flex items-center justify-center font-sans overflow-hidden bg-[#02040a]">
      <div className="overlay-bg absolute inset-0 bg-[#050505] opacity-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
         <PlayerCard player={player} />
         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center">
            <div className="vs-divider w-[2px] h-[200vh] bg-gradient-to-b from-transparent via-white to-transparent shadow-[0_0_20px_white] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="vs-text relative">
                <div className="relative w-24 h-24 bg-black border-2 border-white/20 rotate-45 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                    <span className="-rotate-45 text-4xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-500">VS</span>
                </div>
            </div>
         </div>
         <PlayerCard player={opponent} isOpponent={true} />
      </div>

      <div className="loading-text absolute bottom-10 left-0 w-full text-center opacity-0">
          <p className="text-gray-500 text-xs tracking-[1em] font-mono animate-pulse">SYNCING BATTLE DATA...</p>
      </div>
    </div>
  );
};

export default GameStartOverlay;