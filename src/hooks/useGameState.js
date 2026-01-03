import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, update, onDisconnect, set } from 'firebase/database';
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
  const animationShownRef = useRef(false); // Track if animation already shown

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
      
      // Debug: Log game data when winner is set
      if (data.winner && data.state === 'finished') {
        console.log('🎮 Game finished - Full data:', {
          winner: data.winner,
          reason: data.reason,
          players: Object.keys(data.players || {}).map(pid => ({
            id: pid,
            name: data.players[pid].name,
            hasAnswers: !!data.players[pid].answers,
            answersCount: data.players[pid].answers ? Object.keys(data.players[pid].answers).length : 0
          }))
        });
      }

      // Handle enemy disconnect - ONLY if game is in combat mode  
      if (data.state === 'combat' && enemyId && data.players[enemyId]?.connected === false && !data.winner) {
        console.log('⚠️ Enemy disconnected - ending game');
        update(ref(rtdb, `games/${roomId}`), { 
          winner: myId, 
          reason: 'disconnect',
          state: 'finished'
        });
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

  // ⭐ IMPROVED: Answer handler with ANTI-SPAM detection
  const handleAnswer = useCallback(async (qIndex, option) => {
    if (!roomId || !myId || !game) return;
    
    const now = Date.now();
    
    // Save answer and timestamp
    setMyAnswers(prev => ({ ...prev, [qIndex]: option }));
    await set(ref(rtdb, `games/${roomId}/players/${myId}/answers/${qIndex}`), option);
    await set(ref(rtdb, `games/${roomId}/players/${myId}/answerTimestamps/${qIndex}`), now);

    // ANTI-SPAM DETECTION: Check last 5 answers
    const myPlayerData = game.players[myId];
    const allAnswers = { ...(myPlayerData?.answers || {}), [qIndex]: option };
    const allTimestamps = { ...(myPlayerData?.answerTimestamps || {}), [qIndex]: now };
    
    if (Object.keys(allAnswers).length >= 5) {
      // Get last 5 answers by sorting timestamps  
      const sortedEntries = Object.entries(allTimestamps).sort(([, a], [, b]) => b - a).slice(0, 5);
      const recentIndices = sortedEntries.map(([idx]) => idx);
      const timestamps = sortedEntries.map(([, ts]) => ts);
      const timeSpan = (Math.max(...timestamps) - Math.min(...timestamps)) / 1000; // seconds
      
      // Count wrong answers in recent 5
      const wrongCount = recentIndices.filter(idx => {
        const ans = allAnswers[idx];
        const q = game.questions[parseInt(idx)];
        return ans !== q?.correctAnswer;
      }).length;
      
      // SPAM CRITERIA: 5 answers in < 60s with 3+ wrong
      if (timeSpan < 60 && wrongCount >= 3) {
        console.log('🚨 SPAM DETECTED!', { timeSpan, wrongCount });
        const opponentId = Object.keys(game.players).find(id => id !== myId);
        await update(ref(rtdb, `games/${roomId}`), {
          winner: opponentId,
          reason: 'spam_detected',
          state: 'finished'
        });
      }
    }
  }, [roomId, myId, game]);

  // Kill trigger
  const handleTriggerKill = useCallback(() => {
    if (animationType || !roomId) return;

    let correctCount = 0;
    const questions = game?.questions || [];
    const totalQuestions = questions.length;

    questions.forEach((q, idx) => {
      if (myAnswers[idx] === q.correctAnswer) correctCount++;
    });

    const requiredCorrect = Math.ceil(totalQuestions / 3);
    const isBackfire = correctCount < requiredCorrect;

    console.log('🎯 Kill triggered:', { correctCount, requiredCorrect, isBackfire });

    // Update Firebase with winner and reason
    const winnerId = isBackfire ? enemyId : myId;
    const reason = isBackfire ? 'backfire' : 'kill';
    
    update(ref(rtdb, `games/${roomId}`), {
      winner: winnerId,
      reason: reason,
      state: 'finished'
    }).then(() => {
      console.log('✅ Game updated in Firebase with winner:', winnerId);
    }).catch(err => {
      console.error('❌ Failed to update game:', err);
    });
  }, [animationType, game?.questions, myAnswers, roomId, myId, enemyId]);

  // Animation complete handler
  const onAnimationComplete = useCallback(() => {
    console.log('🎬 Animation complete, clearing animation type');
    setAnimationType(null);
  }, []);

  // ⭐ IMPROVED: Dynamic XP calculation based on performance
  const updateXP = useCallback((iWon) => {
    if (hasUpdatedXP || !user?.uid || !game?.questions || !myPlayer) return;

    const questions = game.questions;
    const myCorrectCount = questions.filter((q, idx) => myPlayer.answers?.[idx] === q.correctAnswer).length;
    
    // Dynamic XP formula
    const baseXP = myCorrectCount * 10; // 10 XP per correct answer
    const winBonus = iWon ? 100 : 0; // +100 for winning
    const completionBonus = (Object.keys(myPlayer.answers || {}).length === questions.length) ? 50 : 0; // +50 for completing
    const earnedXP = baseXP + winBonus + completionBonus;

    console.log('💰 XP Calculation:', { myCorrectCount, baseXP, winBonus, completionBonus, total: earnedXP });

    setHasUpdatedXP(true);
    updateDoc(doc(db, "players", user.uid), {
      xp: increment(earnedXP),
      wins: increment(iWon ? 1 : 0),
      matches: increment(1)
    }).catch(() => {});
  }, [hasUpdatedXP, user?.uid, game?.questions, myPlayer]);

  // Trigger kill/backfire animation for both players when game ends
  useEffect(() => {
    if (!game?.winner || animationType || game.winner === 'DRAW' || animationShownRef.current) return;
    
    // If game ended due to kill, backfire, or spam, show animation
    if (game.reason === 'kill' || game.reason === 'backfire' || game.reason === 'spam_detected') {
      console.log('🎯 Triggering animation:', { winner: game.winner, reason: game.reason, myId });
      
      animationShownRef.current = true;
      
      const iWon = game.winner === myId;
      const reason = game.reason;
      
      if (iWon) {
        setAnimationType('kill'); // Victory
      } else {
        if (reason === 'kill') {
          setAnimationType('victim'); // Defeated
        } else {
          setAnimationType('backfire'); // Weapon jammed or spam
        }
      }
      
      if (!iWon) {
        setIsShot(true);
      }
    }
  }, [game?.winner, game?.reason, animationType, myId]);

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
