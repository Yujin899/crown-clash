import { useEffect, useState, useRef, useCallback } from 'react'; // ✅ Import useCallback
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ref, onValue, update, onDisconnect, remove } from 'firebase/database';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { rtdb, db } from '../firebaseConfig';
import { Skull, DoorOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import GameStartOverlay from '../components/GameStartOverlay';
import GameResultOverlay from '../components/GameResultOverlay';
import GameHUD from '../components/GameHUD';
import CombatArena from '../components/CombatArena';
import KillAnimation from '../components/KillAnimation'; 

import inviteSfx from '../assets/sounds/invite_notification.mp3';
import flipSfx from '../assets/sounds/card_flip.mp3'; 

const Game = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [game, setGame] = useState(null);
  const [combatTimer, setCombatTimer] = useState(180);
  const [myAnswers, setMyAnswers] = useState({}); 
  const [killMode, setKillMode] = useState(false); 
  const [isShot, setIsShot] = useState(false); 
  const [hasUpdatedXP, setHasUpdatedXP] = useState(false);
  
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [localEndTime, setLocalEndTime] = useState(null);

  const [animationType, setAnimationType] = useState(null); 

  const processingRef = useRef(false);

  const myId = user?.uid;
  const enemyId = game?.players ? Object.keys(game.players).find(id => id !== myId) : null;
  const myPlayer = game?.players?.[myId];
  const enemyPlayer = game?.players?.[enemyId];
  const isHost = myPlayer?.isHost === true;

  // --- Sync Logic ---
  useEffect(() => {
    if (!user || !roomId) return;
    const gameRef = ref(rtdb, `games/${roomId}`);
    if (myId) onDisconnect(ref(rtdb, `games/${roomId}/players/${myId}/connected`)).set(false);

    const unsub = onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) { navigate('/dashboard'); return; }
        setGame(data);

        if (enemyId && data.players[enemyId]?.connected === false && !data.winner) {
            update(ref(rtdb, `games/${roomId}`), { winner: myId, reason: 'enemy_left' });
        }
        if (data.winner && data.winner !== myId && data.winner !== 'DRAW') setIsShot(true);
    });
    return () => unsub();
  }, [roomId, user, navigate, myId, enemyId]);


  // --- Start Logic ---
  useEffect(() => {
      if (!processingRef.current) {
         new Audio(inviteSfx).play().catch(()=>{});
         processingRef.current = true;
      }
      const safeStartTimer = setTimeout(() => {
          setIsOverlayVisible(false);
          const futureTime = Date.now() + 180000;
          setLocalEndTime(futureTime);
          if (isHost) {
              update(ref(rtdb, `games/${roomId}`), { state: 'combat', endTime: futureTime }).catch(e => console.log("Lag"));
          }
      }, 5500);
      return () => clearTimeout(safeStartTimer);
  }, [isHost, roomId]);


  // --- Combat Timer ---
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
              if (seconds <= 0 && isHost && !game.winner) {
                  update(ref(rtdb, `games/${roomId}`), { winner: 'DRAW' });
              }
          } else { setCombatTimer(180); }
      }, 1000);
      return () => clearInterval(interval);
  }, [game?.state, isHost, game?.endTime, localEndTime, isOverlayVisible, game?.winner]);


  // --- Handlers ---
  const handleAnswer = (qIndex, option) => {
      new Audio(flipSfx).play().catch(() => {});
      setMyAnswers(prev => ({ ...prev, [qIndex]: option }));
      update(ref(rtdb, `games/${roomId}/players/${myId}/answers/${qIndex}`), option);
  };

  // ✅ استخدمنا useCallback عشان الدالة دي متتغيرش مع كل ريندر
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

  // ✅ استخدمنا useCallback هنا برضو للأمان
  const onAnimationComplete = useCallback(() => {
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
  
  useEffect(() => {
      if (!game || !myPlayer) return;
      const total = game.questions.length;
      const answered = Object.keys(myAnswers).length;
      const newProgress = Math.floor((answered/total)*100);
      if (myPlayer.progress !== newProgress) update(ref(rtdb, `games/${roomId}/players/${myId}`), { progress: newProgress });
      if (answered === total) setKillMode(true);
  }, [myAnswers, game, myId, myPlayer]);


  // --- Render ---
  if (!game || !myPlayer || !enemyPlayer) return <div className="h-screen bg-black flex items-center justify-center text-white">LOADING...</div>;

  if (game.winner && !animationType) {
      const iWon = game.winner === myId;
      const isDraw = game.winner === 'DRAW';
      const earnedXP = isDraw ? 20 : (iWon ? 150 : 20);
      if(!hasUpdatedXP) {
          setHasUpdatedXP(true);
          updateDoc(doc(db, "players", user.uid), { xp: increment(earnedXP), wins: increment(iWon ? 1 : 0) }).catch(()=>{});
      }
      return (
          <>
             {isShot && <div className="fixed inset-0 z-[100] bg-red-600/40 backdrop-blur-sm pointer-events-none flex items-center justify-center animate-ping"><div className="bg-black/50 p-10 rounded-full"><Skull size={120} className="text-white"/></div></div>}
             <div className="absolute inset-0 z-[50]">
                <GameResultOverlay result={isDraw ? 'draw' : (iWon ? 'victory' : 'defeat')} myPlayer={myPlayer} enemyPlayer={enemyPlayer} questions={game.questions} earnedXP={earnedXP} reason={game.reason || 'normal'} />
             </div>
          </>
      );
  }

  return (
    <div className={`h-screen text-white overflow-hidden relative font-sans transition-colors duration-300 ${isShot ? 'bg-red-900' : 'bg-[#02040a]'}`}>
      
      {/* Animation Layer */}
      {animationType && (
          <KillAnimation 
             mode={animationType} 
             enemyAvatar={enemyPlayer.avatar?.url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${enemyPlayer.name}`}
             onComplete={onAnimationComplete} 
          />
      )}

      {/* Overlay */}
      <AnimatePresence mode='wait'>
        {isOverlayVisible && (
             <motion.div key="overlay" exit={{ opacity: 0, filter: "blur(20px)", transition: { duration: 0.8 } }} className="absolute inset-0 z-[100]">
                 <GameStartOverlay player={{ ...myPlayer, avatarUrl: myPlayer.avatar?.url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${myPlayer.name}`, title: 'OPERATIVE' }} opponent={{ ...enemyPlayer, avatarUrl: enemyPlayer.avatar?.url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${enemyPlayer.name}`, title: 'TARGET' }} />
             </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <GameHUD myPlayer={myPlayer} enemyPlayer={enemyPlayer} timer={combatTimer} myProgress={(Object.keys(myAnswers).length / game.questions.length) * 100} enemyProgress={enemyPlayer.progress || 0} />

      <div className={`absolute inset-0 transition-opacity duration-1000 ${isOverlayVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <CombatArena 
            questions={game.questions} myAnswers={myAnswers} onAnswer={handleAnswer}
            killMode={killMode} onKill={handleTriggerKill} didShoot={!!animationType} 
        />
      </div>
      
      <button onClick={() => navigate('/dashboard')} className="absolute bottom-6 left-6 text-red-500/30 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest z-50 flex items-center gap-2 transition-colors">
        <DoorOpen size={14}/> ABORT MISSION
      </button>

    </div>
  );
};

export default Game;