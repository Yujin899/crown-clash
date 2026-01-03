import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Trophy, Home, CheckCircle, XCircle, AlertTriangle, Award, Target } from 'lucide-react';
import victorySfx from '../assets/sounds/victory.mp3';
import defeatSfx from '../assets/sounds/defeat.mp3';

const GameResultOverlay = ({ result, myPlayer, enemyPlayer, questions, earnedXP, reason }) => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const xpCounterRef = useRef(null);
  const isVictory = result === 'victory';
  const isDraw = result === 'draw';

  useEffect(() => {
    // Play sound
    const audio = new Audio(isVictory ? victorySfx : defeatSfx);
    audio.volume = 0.5;
    audio.play().catch(() => {});

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. Screen flash
      tl.fromTo('.result-flash',
        { opacity: 1 },
        { opacity: 0, duration: 0.6, ease: 'power2.out' }
      );

      // 2. Result title explosion
      tl.fromTo('.result-title',
        { scale: 3, opacity: 0, rotateZ: -10 },
        { 
          scale: 1, 
          opacity: 1, 
          rotateZ: 0,
          duration: 0.8,
          ease: 'elastic.out(1, 0.5)'
        },
        '-=0.4'
      );

      // 3. Screen shake for defeat
      if (!isVictory && !isDraw) {
        tl.to(containerRef.current, {
          x: [-5, 5, -5, 5, 0],
          y: [-3, 3, -3, 3, 0],
          duration: 0.5,
          ease: 'power2.inOut'
        }, '-=0.5');
      }

      // 4. Subtitle fade in
      tl.fromTo('.result-subtitle',
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4 },
        '-=0.3'
      );

      // 5. Stats container slide in
      tl.fromTo('.stats-container',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.2'
      );

      // 6. Question results stagger in
      tl.fromTo('.question-row',
        { x: -30, opacity: 0 },
        { 
          x: 0, 
          opacity: 1, 
          duration: 0.4,
          stagger: 0.08,
          ease: 'power2.out'
        },
        '-=0.3'
      );

      // 7. XP Badge popup
      tl.fromTo('.xp-badge',
        { scale: 0, rotate: -180 },
        { 
          scale: 1, 
          rotate: 0,
          duration: 0.6,
          ease: 'back.out(3)'
        },
        '-=0.2'
      );

      // 8. Animated XP counter
      const xpCounter = { value: 0 };
      tl.to(xpCounter, {
        value: earnedXP,
        duration: 1,
        ease: 'power2.out',
        onUpdate: function() {
          if (xpCounterRef.current) {
            xpCounterRef.current.textContent = Math.floor(xpCounter.value);
          }
        }
      }, '-=0.4');

      // 9. Return button slide up
      tl.fromTo('.return-button',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
        '-=0.5'
      );

      // 10. Victory confetti effect
      if (isVictory) {
        tl.to('.confetti-particle', {
          y: '100vh',
          opacity: 0,
          duration: 2,
          stagger: 0.02,
          ease: 'none'
        }, '-=1');
      }

    }, containerRef);

    return () => ctx.revert();
  }, [isVictory, isDraw, earnedXP]);

  // Calculate stats
  const myCorrect = questions.filter((q, idx) => myPlayer.answers?.[idx] === q.correctAnswer).length;
  const enemyCorrect = questions.filter((q, idx) => enemyPlayer.answers?.[idx] === q.correctAnswer).length;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden">
      
      {/* Flash overlay */}
      <div className={`result-flash absolute inset-0 ${isVictory ? 'bg-green-500' : isDraw ? 'bg-yellow-500' : 'bg-red-500'}`}></div>

      {/* Background */}
      <div className={`absolute inset-0 ${isVictory ? 'bg-[#0a1f0f]' : isDraw ? 'bg-[#1f1a0a]' : 'bg-[#1f0a0a]'}`}>
        {/* Scanlines */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `linear-gradient(rgba(239,68,68,0.8) 1px, transparent 1px)`,
          backgroundSize: '100% 4px',
        }}></div>
        
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(239,68,68,0.5) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(239,68,68,0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
      </div>

      {/* Victory confetti */}
      {isVictory && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="confetti-particle absolute w-2 h-2 bg-yellow-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                boxShadow: '0 0 10px rgba(250, 204, 21, 0.8)'
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl px-4">
        
        {/* Result Title */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className={`result-title text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight mb-3 ${
            isVictory ? 'text-green-500' : isDraw ? 'text-yellow-500' : 'text-red-500'
          }`} style={{
            textShadow: `0 0 30px ${isVictory ? 'rgba(34, 197, 94, 0.6)' : isDraw ? 'rgba(234, 179, 8, 0.6)' : 'rgba(239, 68, 68, 0.6)'}`
          }}>
            {isVictory ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
          </h1>
          
          <p className="result-subtitle text-gray-400 text-sm md:text-base uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2">
            {reason === 'backfire' && <AlertTriangle size={16} className="text-yellow-500" />}
            {reason === 'backfire' ? (isVictory ? 'ENEMY WEAPON BACKFIRED' : 'WEAPON BACKFIRED - LOW ACCURACY') :
             reason === 'kill' ? (isVictory ? 'TARGET ELIMINATED' : 'KILLED IN ACTION') :
             reason === 'enemy_left' ? 'OPPONENT DISCONNECTED' :
             'MATCH ENDED'}
          </p>
          <p className="text-gray-400 font-mono text-sm tracking-widest mt-2 uppercase">
            {reason === 'kill' 
              ? (isVictory ? `TERMINATED ${enemyPlayer?.name}` : `ELIMINATED BY ${enemyPlayer?.name}`)
              : reason === 'backfire'
              ? 'SYSTEM OVERLOAD'
              : reason === 'enemy_left'
              ? 'OPPONENT DISCONNECTED'
              : 'TIME EXPIRED'}
          </p>
        </div>

        {/* Stats Container */}
        <div className="stats-container bg-[#1a2332]/90 backdrop-blur-sm border-2 border-red-500/30 p-6 md:p-8 mb-6 relative overflow-hidden">
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

          {/* Player comparison */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* My stats */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-2 border-2 border-blue-500 overflow-hidden">
                {myPlayer?.avatar?.url ? (
                  <img src={myPlayer.avatar.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-500/20 flex items-center justify-center">
                    <Target size={32} className="text-blue-500" />
                  </div>
                )}
              </div>
              <p className="text-white font-bold uppercase text-sm truncate">{myPlayer?.name || 'You'}</p>
              <p className="text-blue-500 text-2xl font-black">{myCorrect}/{questions.length}</p>
            </div>

            {/* VS */}
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-[#0f1923] border-2 border-red-500 flex items-center justify-center">
                <span className="text-red-500 font-black text-xl">VS</span>
              </div>
            </div>

            {/* Enemy stats */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-2 border-2 border-red-500 overflow-hidden">
                {enemyPlayer?.avatar?.url ? (
                  <img src={enemyPlayer.avatar.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-red-500/20 flex items-center justify-center">
                    <Target size={32} className="text-red-500" />
                  </div>
                )}
              </div>
              <p className="text-white font-bold uppercase text-sm truncate">{enemyPlayer?.name || 'Opponent'}</p>
              <p className="text-red-500 text-2xl font-black">{enemyCorrect}/{questions.length}</p>
            </div>
          </div>

          {/* Question breakdown */}
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-red-500/30 scrollbar-track-transparent">
            {questions.map((q, idx) => {
              const myAns = myPlayer.answers?.[idx];
              const enAns = enemyPlayer.answers?.[idx];
              const isMyCorrect = myAns === q.correctAnswer;
              const isEnCorrect = enAns === q.correctAnswer;

              return (
                <div key={idx} className="question-row grid grid-cols-3 gap-2 bg-black/20 p-2 border border-red-500/10">
                  <div className={`flex items-center gap-2 text-xs ${isMyCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isMyCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span className="truncate">{myAns || '-'}</span>
                  </div>
                  <div className="text-center text-white text-xs font-mono bg-black/40 py-1 px-2 rounded">
                    {q.correctAnswer}
                  </div>
                  <div className={`flex items-center justify-end gap-2 text-xs ${isEnCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    <span className="truncate">{enAns || '-'}</span>
                    {isEnCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        </div>

        {/* XP Badge */}
        <div className="flex justify-center mb-6">
          <div className="xp-badge relative bg-yellow-500 border-4 border-yellow-400 px-8 py-4">
            <div className="flex items-center gap-3">
              <Award size={32} className="text-yellow-900" />
              <div>
                <p className="text-yellow-900 text-xs uppercase font-bold tracking-wider">Experience Earned</p>
                <p className="text-yellow-900 text-3xl font-black">
                  +<span ref={xpCounterRef}>0</span> XP
                </p>
              </div>
            </div>
            {/* Corner brackets */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-yellow-300"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-yellow-300"></div>
          </div>
        </div>

        {/* Return Button */}
        <div className="flex justify-center">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="return-button group relative bg-red-500 hover:bg-red-600 text-white font-black px-12 py-4 uppercase tracking-[0.2em] text-sm overflow-hidden transition-all"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
            
            <span className="relative z-10 flex items-center gap-2">
              <Home size={18} />
              RETURN TO BASE
            </span>

            {/* Corner brackets */}
            <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-red-400"></div>
            <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-red-400"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResultOverlay;