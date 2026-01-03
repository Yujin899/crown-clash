import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, update, onDisconnect } from 'firebase/database';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { rtdb, db } from '../firebaseConfig';

/**
 * Custom hook to manage game state logic
 * Extracts all Firebase listeners and game state management
 */
export const useGameState = (roomId, user, navigate) => {
  const [game, setGame] = useState(null);
  const [combatTimer, setCombatTimer] = useState(180);
  const [myAnswers, setMyAnswers] = useState({});
  const [killMode, setKillMode] = useState(false);
  const [isShot, setIsShot] = useState(false);
  const [hasUpdatedXP, setHasUpdatedXP] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [localEndTime, setLocalEndTime] = useState(null);
  const [animationType, setAnimationType] = useState(null); // 'kill', 'backfire', 'victim'

  const processingRef = useRef(false);

  const myId = user?.uid;
  const enemyId = game?.players ? Object.keys(game.players).find(id => id !== myId) : null;
  const myPlayer = game?.players?.[myId];
  const enemyPlayer = game?.players?.[enemyId];
  const isHost = myPlayer?.isHost === true;

  // Optimized Firebase listener with proper cleanup
  useEffect(() => {
    if (!user || !roomId) return;

    const gameRef = ref(rtdb, `games/${roomId}`);
    
    // Setup disconnect handler
    if (myId) {
      // Ensure I am marked as connected immediately
      update(ref(rtdb, `games/${roomId}/players/${myId}`), { connected: true });
      onDisconnect(ref(rtdb, `games/${roomId}/players/${myId}/connected`)).set(false);
    }

    // Single optimized listener
    const unsub = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      
      if (!data) {
        navigate('/dashboard');
        return;
      }

      setGame(data);

      // Handle enemy disconnect - ONLY if game is in combat mode
      if (data.state === 'combat' && enemyId && data.players[enemyId]?.connected === false && !data.winner) {
        update(ref(rtdb, `games/${roomId}`), { 
          winner: myId, 
          reason: 'enemy_left' 
        });
      }

      // Handle enemy kill (VICTIM VIEW)
      if (data.winner && data.winner !== myId && data.winner !== 'DRAW' && !isShot) {
        setIsShot(true);
        // Trigger victim animation which will show the killer
        setAnimationType('victim');
      }
    });

    return () => {
      unsub();
      // Only relying on onDisconnect for now to prevent StrictMode flickering
    };
  }, [roomId, user, navigate, myId, enemyId]);

  // Start game logic
  useEffect(() => {
    if (!processingRef.current) {
      processingRef.current = true;
    }

    const safeStartTimer = setTimeout(() => {
      setIsOverlayVisible(false);
      const futureTime = Date.now() + 180000;
      setLocalEndTime(futureTime);

      if (isHost && roomId) {
        update(ref(rtdb, `games/${roomId}`), { 
          state: 'combat', 
          endTime: futureTime 
        }).catch(e => console.log("Lag"));
      }
    }, 5500);

    return () => clearTimeout(safeStartTimer);
  }, [isHost, roomId]);

  // Combat timer with optimized logic
  useEffect(() => {
    const shouldRun = (game?.state === 'combat') || (!isOverlayVisible && !game?.winner);
    if (!shouldRun) return;

    const interval = setInterval(() => {
      const now = Date.now();
      let targetTime = game?.endTime;
      
      if (targetTime && targetTime < now) targetTime = null;
      const finalTarget = targetTime || localEndTime;

      if (finalTarget) {
        const diff = finalTarget - now;
        const seconds = Math.ceil(diff / 1000);
        setCombatTimer(seconds > 0 ? seconds : 0);

        // Auto-end game on timeout (host only)
        // STRICT CHECK: Only trigger if game is actually in 'combat' state to prevent premature ends during startup
        if (seconds <= 0 && isHost && !game.winner && roomId && game.state === 'combat') {
          update(ref(rtdb, `games/${roomId}`), { winner: 'DRAW' });
        }
      } else {
        setCombatTimer(180);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [game?.state, isHost, game?.endTime, localEndTime, isOverlayVisible, game?.winner, roomId]);

  // Progress tracking
  useEffect(() => {
    if (!game || !game.questions || !myPlayer || !roomId || !myId) return;

    const total = game.questions.length;
    const answered = Object.keys(myAnswers).length;
    const newProgress = Math.floor((answered / total) * 100);

    if (myPlayer.progress !== newProgress) {
      update(ref(rtdb, `games/${roomId}/players/${myId}`), { 
        progress: newProgress 
      });
    }

    if (total > 0 && answered === total) {
      setKillMode(true);
    }
  }, [myAnswers, game, myId, myPlayer, roomId]);

  // Answer handler
  const handleAnswer = useCallback((qIndex, option) => {
    if (!roomId || !myId) return;
    
    setMyAnswers(prev => ({ ...prev, [qIndex]: option }));
    update(ref(rtdb, `games/${roomId}/players/${myId}/answers/${qIndex}`), option);
  }, [roomId, myId]);

  // Kill trigger
  const handleTriggerKill = useCallback(() => {
    if (animationType) return;

    let correctCount = 0;
    const questions = game?.questions || [];
    const totalQuestions = questions.length;

    questions.forEach((q, idx) => {
      if (myAnswers[idx] === q.correctAnswer) correctCount++;
    });

    const requiredCorrect = Math.ceil(totalQuestions / 3);
    const isBackfire = correctCount < requiredCorrect;

    setAnimationType(isBackfire ? 'backfire' : 'kill');
  }, [animationType, game?.questions, myAnswers]);

  // Animation complete handler
  const onAnimationComplete = useCallback(() => {
    if (!roomId) return;

    const isKill = animationType === 'kill';
    const winnerId = isKill ? myId : enemyId;
    const reason = isKill ? 'kill' : 'backfire';

    update(ref(rtdb, `games/${roomId}`), {
      winner: winnerId,
      reason: reason,
      state: 'finished'
    }).then(() => {
      setAnimationType(null);
    });
  }, [animationType, myId, enemyId, roomId]);

  // XP update logic (optimized)
  const updateXP = useCallback((earnedXP, iWon) => {
    if (hasUpdatedXP || !user?.uid) return;

    setHasUpdatedXP(true);
    updateDoc(doc(db, "players", user.uid), {
      xp: increment(earnedXP),
      wins: increment(iWon ? 1 : 0)
    }).catch(() => {});
  }, [hasUpdatedXP, user?.uid]);

  return {
    // State
    game,
    combatTimer,
    myAnswers,
    killMode,
    isShot,
    isOverlayVisible,
    animationType,
    
    // Players
    myId,
    enemyId,
    myPlayer,
    enemyPlayer,
    isHost,
    
    // Handlers
    handleAnswer,
    handleTriggerKill,
    onAnimationComplete,
    updateXP
  };
};
