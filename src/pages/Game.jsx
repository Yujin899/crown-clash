import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Skull, DoorOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Custom hook for game state
import { useGameState } from '../hooks';

// Components
import GameStartOverlay from '../components/GameStartOverlay';
import GameResultOverlay from '../components/GameResultOverlay';
import GameHUD from '../components/GameHUD';
import CombatArena from '../components/CombatArena';
import KillAnimation from '../components/KillAnimation';

// Sounds
import inviteSfx from '../assets/sounds/invite_notification.mp3';
import flipSfx from '../assets/sounds/card_flip.mp3';
import { useEffect, useRef } from 'react';

const Game = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const audioRef = useRef(null);

  // Use custom hook for all game state management
  const {
    game,
    combatTimer,
    myAnswers,
    killMode,
    isShot,
    isOverlayVisible,
    animationType,
    myId,
    enemyId,
    myPlayer,
    enemyPlayer,
    handleAnswer,
    handleTriggerKill,
    onAnimationComplete,
    updateXP
  } = useGameState(roomId, user, navigate);

  // Play entrance sound once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(inviteSfx);
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // Enhanced answer handler with sound
  const handleAnswerWithSound = (qIndex, option) => {
    new Audio(flipSfx).play().catch(() => {});
    handleAnswer(qIndex, option);
  };

  // Loading state
  if (!game || !myPlayer || !enemyPlayer) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm tracking-widest uppercase">LOADING COMBAT DATA...</p>
        </div>
      </div>
    );
  }

  // Game result state
  if (game.winner && !animationType) {
    const iWon = game.winner === myId;
    const isDraw = game.winner === 'DRAW';
    const earnedXP = isDraw ? 20 : (iWon ? 150 : 20);
    
    // Update XP once
    updateXP(earnedXP, iWon);

    return (
      <>
        {isShot && (
          <div className="fixed inset-0 z-[100] bg-red-600/40 backdrop-blur-sm pointer-events-none flex items-center justify-center animate-ping">
            <div className="bg-black/50 p-10 rounded-full">
              <Skull size={120} className="text-white" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 z-[50]">
          <GameResultOverlay
            result={isDraw ? 'draw' : (iWon ? 'victory' : 'defeat')}
            myPlayer={myPlayer}
            enemyPlayer={enemyPlayer}
            questions={game.questions || []}
            earnedXP={earnedXP}
            reason={game.reason || 'normal'}
          />
        </div>
      </>
    );
  }

  // Main game view
  return (
    <div className={`h-screen text-white overflow-hidden relative font-sans transition-colors duration-300 ${isShot ? 'bg-red-900' : 'bg-[#0f1923]'}`}>
      
      {/* Kill Animation Layer */}
      {animationType && (
        <KillAnimation
          mode={animationType}
          enemyAvatar={enemyPlayer.avatar?.url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${enemyPlayer.name}`}
          onComplete={onAnimationComplete}
        />
      )}

      {/* Start Overlay */}
      <AnimatePresence mode='wait'>
        {isOverlayVisible && (
          <motion.div
            key="overlay"
            exit={{ opacity: 0, filter: "blur(20px)", transition: { duration: 0.8 } }}
            className="absolute inset-0 z-[100]"
          >
            <GameStartOverlay
              player={{
                ...myPlayer,
                avatarUrl: myPlayer.avatar?.url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${myPlayer.name}`,
                title: 'OPERATIVE'
              }}
              enemyPlayer={{
                ...enemyPlayer,
                avatarUrl: enemyPlayer.avatar?.url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${enemyPlayer.name}`,
                title: 'OPPONENT'
              }}
              countdown={4} // Pass static countdown or dynamic if tracked
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* HUD */}
      <GameHUD
        myPlayer={myPlayer}
        enemyPlayer={enemyPlayer}
        timer={combatTimer}
        myProgress={game.questions?.length ? (Object.keys(myAnswers).length / game.questions.length) * 100 : 0}
        enemyProgress={enemyPlayer.progress || 0}
      />

      {/* Combat Arena */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isOverlayVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <CombatArena
          questions={game.questions || []}
          myAnswers={myAnswers}
          onAnswer={handleAnswerWithSound}
          killMode={killMode}
          onKill={handleTriggerKill}
          didShoot={!!animationType}
        />
      </div>

      {/* Abort Button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="absolute bottom-6 left-6 text-red-500/30 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest z-50 flex items-center gap-2 transition-colors"
      >
        <DoorOpen size={14} /> ABORT MISSION
      </button>

    </div>
  );
};

export default Game;