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
  const isSoloMode = game?.isSolo === true;
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

    // Solo mode: start immediately, no overlay, no timer
    if (isSoloMode) {
      setIsOverlayVisible(false);
      if (isHost && roomId) {
        update(ref(rtdb, `games/${roomId}`), { 
          state: 'combat'
        }).catch(e => console.log("Lag"));
      }
      return;
    }

    // Multiplayer mode: normal flow with overlay and timer
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
  }, [isHost, roomId, isSoloMode]);

  // Combat timer with optimized logic (disabled in solo mode)
  useEffect(() => {
    if (isSoloMode) return; // No timer in solo mode
    
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
          // Instead of instantly setting DRAW, use the checkWinner logic
          checkWinner('timeout');
        }
      } else {
        setCombatTimer(180);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [game?.state, isHost, game?.endTime, localEndTime, isOverlayVisible, game?.winner, roomId, isSoloMode]);

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

    // In solo mode: auto-finish game after last question
    if (isSoloMode && total > 0 && answered === total && !game.winner) {
      console.log('🎯 Solo mode: All questions answered, finishing game...');
      // Calculate correct answers
      let myCorrect = 0;
      game.questions.forEach((q, idx) => {
        if (myAnswers[idx] === q.correctAnswer) myCorrect++;
      });
      
      // Directly finish game without kill mode
      update(ref(rtdb, `games/${roomId}`), {
        winner: myId,
        reason: 'solo_complete',
        state: 'finished',
        soloScore: myCorrect
      });
    } else if (!isSoloMode && total > 0 && answered === total) {
      setKillMode(true);
    }
  }, [myAnswers, game, myId, myPlayer, roomId, isSoloMode]);

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
      
      // SPAM CRITERIA: 5 answers in < 45s with 4+ wrong (Refined)
      if (timeSpan < 45 && wrongCount >= 4) {
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

  // Determine Winner Logic (New: Most Correct Answers)
  const checkWinner = useCallback((triggerReason = 'finish') => {
    if (animationType || !roomId || !game) return;

    const questions = game.questions || [];
    
    // Calculate stats
    let myCorrect = 0;
    let enemyCorrect = 0;
    
    // My stats
    questions.forEach((q, idx) => {
      if (myAnswers[idx] === q.correctAnswer) myCorrect++;
    });

    // Enemy stats (needed to determine winner locally if I am host, or just for verification)
    const enemyAnswersMap = enemyPlayer?.answers || {};
    questions.forEach((q, idx) => {
      if (enemyAnswersMap[idx] === q.correctAnswer) enemyCorrect++;
    });

    console.log('🏆 Checking Winner:', { myCorrect, enemyCorrect, reason: triggerReason });

    let finalWinner = null;
    let finalReason = triggerReason === 'timeout' ? 'timeout' : 'kill'; // kill means finished normally in this context for animation

    if (myCorrect > enemyCorrect) {
      finalWinner = myId;
    } else if (enemyCorrect > myCorrect) {
      finalWinner = enemyId;
    } else {
      finalWinner = 'DRAW';
    }

    // Update Firebase
    update(ref(rtdb, `games/${roomId}`), {
      winner: finalWinner,
      reason: finalReason,
      state: 'finished'
    }).then(() => {
      console.log('✅ Game updated:', { winner: finalWinner, reason: finalReason });
    }).catch(err => {
      console.error('❌ Failed to update game:', err);
    });
  }, [animationType, game, myAnswers, roomId, myId, enemyId, enemyPlayer]);

  // Handle game end trigger (renamed from handleTriggerKill)
  const handleGameEndCheck = useCallback(() => {
     checkWinner('normal_finish');
  }, [checkWinner]);

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

  // Trigger kill/backfire animation for both players when game ends (disabled for solo mode)
  useEffect(() => {
    if (!game?.winner || animationType || game.winner === 'DRAW' || animationShownRef.current || isSoloMode) return;
    
    // Solo mode: skip animation entirely
    // Multiplayer: show animation
    if (game.reason) {
      console.log('🎯 Triggering animation:', { winner: game.winner, reason: game.reason, myId });
      
      animationShownRef.current = true;
      
      const iWon = game.winner === myId;
      const reason = game.reason;
      const isDraw = game.winner === 'DRAW';
      
      if (isDraw) {
        setAnimationType('backfire'); // Use backfire/draw animation
      } else if (iWon) {
        setAnimationType('kill'); // Victory
      } else {
        if (reason === 'spam_detected') {
             setAnimationType('backfire'); // Spam punish
        } else {
             setAnimationType('victim'); // Defeated
        }
      }
      
      if (!iWon) {
        setIsShot(true);
      }
    }
  }, [game?.winner, game?.reason, animationType, myId, isSoloMode]);

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
    handleTriggerKill: handleGameEndCheck, // Expose as same name for compatibility with CombatArena
    onAnimationComplete,
    updateXP
  };
};
