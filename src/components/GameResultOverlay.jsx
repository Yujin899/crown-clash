import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Trophy, Home, CheckCircle, XCircle, AlertTriangle, Award, Target } from 'lucide-react';

const GameResultOverlay = ({ result, myPlayer, enemyPlayer, questions, earnedXP, reason, myLocalAnswers, enemyLocalAnswers }) => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const xpCounterRef = useRef(null);
  const isVictory = result === 'victory';
  const isDraw = result === 'draw';

  useEffect(() => {
    console.log('🎊 Result overlay mounted:', { result, myPlayer: myPlayer?.name, enemyPlayer: enemyPlayer?.name });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. Screen flash
      tl.fromTo('.result-flash',
        { opacity: 1 },
        { opacity: 0, duration: 0.6, ease: 'power2.out' }
      );

      // 2. Result title explosion
      tl.fromTo('.result-title',
        { scale: 0, rotateY: 180, opacity: 0 },
        { scale: 1, rotateY: 0, opacity: 1, duration: 0.8, ease: 'back.out(2)' }
      );

      // 3. Subtitle slide
      tl.fromTo('.result-subtitle',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
        '-=0.4'
      );

      // 4. Stats container entrance
      tl.fromTo('.stats-container',
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.2'
      );

      // 5. Question rows stagger
      tl.fromTo('.question-row',
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' },
        '-=0.3'
      );

      // 6. XP badge entrance
      tl.fromTo('.xp-badge',
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'power2.out' },
        '-=0.2'
      );

      // 7. Counter animation
      tl.to(xpCounterRef.current, {
        innerText: earnedXP,
        duration: 1,
        snap: { innerText: 1 },
        ease: 'power1.out'
      }, '-=0.3');

      // 8. Return button entrance
      tl.fromTo('.return-button',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
        '-=0.5'
      );

      // REMOVED: 9. Final bounce (User requested removal)

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

  // Use local answers as primary source, Firebase as fallback
  const myAnswers = myLocalAnswers || myPlayer?.answers || {};
  const enemyAnswers = enemyLocalAnswers || enemyPlayer?.answers || {};

  // Calculate stats - SAFE: Handle missing answers
  const myCorrect = questions.filter((q, idx) => {
    const myAns = myAnswers[idx];
    return myAns && myAns === q.correctAnswer;
  }).length;
  
  const enemyCorrect = questions.filter((q, idx) => {
    const enAns = enemyAnswers[idx];
    return enAns && enAns === q.correctAnswer;
  }).length;

  console.log('📊 Result overlay stats:', { 
    result, 
    myPlayer: myPlayer?.name, 
    enemyPlayer: enemyPlayer?.name,
    myAnswers,
    enemyAnswers,
    myCorrect,
    enemyCorrect,
    questionsCount: questions.length
  });

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-[#0f1923] h-screen w-screen">
      
      {/* Flash overlay */}
      <div className={`result-flash absolute inset-0 ${isVictory ? 'bg-green-500' : isDraw ? 'bg-yellow-500' : 'bg-red-500'}`}></div>

      {/* Background */}
      <div className="absolute inset-0 bg-[#0f1923]">
        {/* Subtle Color Tint - reduced opacity */}
        <div className={`absolute inset-0 opacity-10 ${isVictory ? 'bg-green-900' : isDraw ? 'bg-yellow-900' : 'bg-red-900'}`}></div>

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

        {/* Stats Container with clip-path-notch */}
        <div className="stats-container bg-[#0f1923] border border-white/10 p-6 md:p-8 mb-6 relative overflow-hidden clip-path-notch">
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

          {/* Player comparison */}
          <div className="grid grid-cols-3 gap-4 mb-6 items-center">
            {/* My stats */}
            <div className="text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 border-2 border-blue-500 overflow-hidden clip-path-notch relative">
                {myPlayer?.avatar?.url ? (
                  <img src={myPlayer.avatar.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-500/20 flex items-center justify-center">
                    <Target size={32} className="text-blue-500" />
                  </div>
                )}
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-blue-400"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-blue-400"></div>
              </div>
              <p className="text-white font-bold uppercase text-sm truncate px-2">{myPlayer?.name || 'You'}</p>
              <p className="text-blue-500 text-3xl font-black">{myCorrect}<span className="text-sm text-gray-500">/{questions.length}</span></p>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#0f1923] border-2 border-white/20 flex items-center justify-center clip-path-notch mb-2">
                <span className="text-white font-black text-xl italic">VS</span>
              </div>
            </div>

            {/* Enemy stats */}
            <div className="text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 border-2 border-red-500 overflow-hidden clip-path-notch relative">
                {enemyPlayer?.avatar?.url ? (
                  <img src={enemyPlayer.avatar.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-red-500/20 flex items-center justify-center">
                    <Target size={32} className="text-red-500" />
                  </div>
                )}
                 {/* Corner accents */}
                 <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-red-400"></div>
                 <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-red-400"></div>
              </div>
              <p className="text-white font-bold uppercase text-sm truncate px-2">{enemyPlayer?.name || 'Opponent'}</p>
              <p className="text-red-500 text-3xl font-black">{enemyCorrect}<span className="text-sm text-gray-500">/{questions.length}</span></p>
            </div>
          </div>

          {/* Question breakdown - ALWAYS SHOW for both victory and defeat */}
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-red-500/30 scrollbar-track-transparent">
            {questions.map((q, idx) => {
              const myAns = myAnswers[idx];
              const enAns = enemyAnswers[idx];
              const isMyCorrect = myAns === q.correctAnswer;
              const isEnCorrect = enAns === q.correctAnswer;

              return (
                <div key={idx} className="question-row grid grid-cols-3 gap-2 bg-black/20 p-2 border border-white/10">
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