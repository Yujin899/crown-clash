import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'; 
import { ref as dbRef, set, remove, onValue, push, update } from 'firebase/database';
import { db, rtdb } from '../firebaseConfig';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import { Loader2, Users, UserX, Search, Swords, Target } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import inviteSfx from '../assets/sounds/invite_notification.mp3';

const Lobby = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  // Get quiz data from URL params (persists across refreshes) or location.state (fallback)
  const searchParams = new URLSearchParams(location.search);
  const mode = searchParams.get('mode') || location.state?.mode;
  const quizId = searchParams.get('quizId') || location.state?.quizId;
  const quizTitle = searchParams.get('quizTitle') || location.state?.quizTitle;
  const subjectId = searchParams.get('subjectId') || location.state?.subjectId;

  // Debug: Log what we received
  useEffect(() => {
    console.log('🎯 Lobby received:', { mode, quizId, quizTitle, subjectId });
    console.log('📍 URL params:', Object.fromEntries(searchParams));
    console.log('📦 Location state:', location.state);
    
    if (!quizId) {
      console.error('❌ NO QUIZ ID');
      toast.error('NO QUIZ SELECTED - Redirecting to Dashboard');
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  }, []);

  const [status, setStatus] = useState('searching');
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [waitingInviteId, setWaitingInviteId] = useState(null);
  const [waitingForResponse, setWaitingForResponse] = useState(null); // { friendName: string, avatar: string }

  const containerRef = useRef(null);
  const scannerRef = useRef(null);
  const friendListRef = useRef(null);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      if (mode === 'solo') {
        // Scanning animation - check if elements exist
        const scannerLine = document.querySelector('.scanner-line');
        if (scannerLine) {
          tl.fromTo(scannerLine,
            { scaleX: 0, opacity: 0 },
            { scaleX: 1, opacity: 1, duration: 0.5, ease: 'power2.out' }
          );
        }

        const radarPulse = document.querySelector('.radar-pulse');
        if (radarPulse) {
          tl.fromTo(radarPulse,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' },
            '-=0.3'
          );
        }

        // Pulsing radar
        const radarRings = gsap.utils.toArray('.radar-ring');
        if (radarRings.length > 0) {
          tl.to(radarRings, {
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.2, 0.5],
            duration: 2,
            repeat: -1,
            ease: 'power1.inOut'
          });
        }

        // Text glitch effect
        const searchText = document.querySelector('.search-text');
        if (searchText) {
          tl.fromTo(searchText,
            { x: -20, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' },
            '-=1.8'
          );
        }
      } else {
        // Friend list animation
        const friendContainer = document.querySelector('.friend-container');
        if (friendContainer) {
          tl.fromTo(friendContainer,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
          );
        }

        const friendCards = gsap.utils.toArray('.friend-card');
        if (friendCards.length > 0) {
          tl.fromTo(friendCards,
            { x: -50, opacity: 0 },
            { 
              x: 0, 
              opacity: 1, 
              duration: 0.4,
              stagger: 0.08,
              ease: 'power2.out' 
            },
            '-=0.3'
          );
        }
      }
    }, containerRef);

    return () => ctx.revert();
  }, [mode, friends, status]);

  // Match found animation
  useEffect(() => {
    if (status === 'found') {
      const ctx = gsap.context(() => {
        gsap.to('.scanner-pulse', {
          scale: [1, 1.5, 1],
          opacity: [1, 0.3, 1],
          duration: 0.5,
          repeat: 3,
          ease: 'power2.inOut'
        });
      }, containerRef);

      return () => ctx.revert();
    }
  }, [status]);

  // Solo Practice Mode - Instant Start (no waiting)
  useEffect(() => {
    if (mode !== 'solo') return;
    
    const startSoloGame = async () => {
      const roomId = `PRACTICE_${user.uid}_${Date.now()}`;
      await createSoloPractice(roomId);
      navigate(`/game/${roomId}`);
    };
    
    startSoloGame();
  }, [mode, user, navigate]); // Removed createSoloPractice from dependencies

  // Friend Mode
  useEffect(() => {
    if (mode !== 'friend') return;
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, "players", user.uid));
        const friendIds = userDoc.data()?.friends || [];
        if (friendIds.length > 0) {
          const q = query(collection(db, "players"), where("uid", "in", friendIds));
          const snap = await getDocs(q);
          setFriends(snap.docs.map(d => d.data()));
        }
      } catch (e) {}
      setLoading(false);
    };
    fetchFriends();
  }, [mode, user]);

  useEffect(() => {
    if (waitingInviteId) new Audio(inviteSfx).play().catch(() => {});
  }, [waitingInviteId]);

  const createSoloPractice = useCallback(async (roomId) => {
    if (!quizId || !user) {
      toast.error('NO QUIZ SELECTED');
      return null;
    }

    try {
      // SubjectId from URL params or location.state
      if (!subjectId) {
        toast.error('Subject information missing');
        return null;
      }

      // Fetch questions from SUBCOLLECTION
      const questionsRef = collection(db, `subjects/${subjectId}/quizzes/${quizId}/questions`);
      const questionsSnap = await getDocs(questionsRef);
      
      if (questionsSnap.empty) {
        toast.error('No questions found for this quiz');
        return null;
      }

      const allQuestions = questionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const selectedQuestions = allQuestions.sort(() => 0.5 - Math.random());

      const userAvatar = user.photoURL ? { url: user.photoURL } : null;

      const gameData = {
        players: {
          [user.uid]: {
            name: user.displayName,
            avatar: userAvatar,
            score: 0,
            progress: 0,
            answers: {},
            isHost: true,
            connected: true,
          },
        },
        questions: selectedQuestions,
        state: 'starting', // Solo mode starts immediately
        createdAt: Date.now(),
        quizId,
        hostId: user.uid,
        isSolo: true, // Mark as solo practice
      };

      await set(dbRef(rtdb, `games/${roomId}`), gameData);
      return roomId;
    } catch (error) {
      console.error('Solo practice creation error:', error);
      toast.error('Failed to create practice session');
      return null;
    }
  }, [quizId, user, subjectId]);

  const createGameInRTDB = useCallback(async (opponentId, accepted = false) => {
    if (!quizId || !user) {
      toast.error('NO QUIZ SELECTED');
      return null;
    }

    try {
      const gameId = push(dbRef(rtdb, 'games')).key;
      
      // SubjectId is now from URL params or location.state
      if (!subjectId) {
        toast.error('Subject information missing');
        return null;
      }

      // Fetch questions from SUBCOLLECTION
      const questionsRef = collection(db, `subjects/${subjectId}/quizzes/${quizId}/questions`);
      const questionsSnap = await getDocs(questionsRef);
      
      if (questionsSnap.empty) {
        toast.error('No questions found for this quiz');
        return null;
      }

      const allQuestions = questionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const selectedQuestions = allQuestions.sort(() => 0.5 - Math.random());

      const userAvatar = user.photoURL ? { url: user.photoURL } : null;

      const gameData = {
        players: {
          [user.uid]: {
            name: user.displayName,
            avatar: userAvatar,
            score: 0,
            progress: 0,
            answers: {},
            isHost: true,
            connected: true,
          },
          [opponentId]: {
            name: 'Waiting...',
            score: 0,
            progress: 0,
            answers: {},
            isHost: false,
            connected: false,
          },
        },
        questions: selectedQuestions,
        state: 'pending', // Game is pending until opponent accepts
        createdAt: Date.now(),
        quizId,
        hostId: user.uid,
      };

      await set(dbRef(rtdb, `games/${gameId}`), gameData);
      
      // Don't navigate yet - return gameId for invite tracking
      return gameId;
    } catch (error) {
      console.error('Game creation error:', error);
      toast.error('Failed to create game');
      return null;
    }
  }, [quizId, user, navigate, subjectId]);

  const handleInvite = async (friend) => {
    const toastId = toast.loading("ESTABLISHING CONNECTION...");
    try {
      // Call the new createGameInRTDB, which now doesn't navigate
      const gameId = await createGameInRTDB(friend.uid, false);
      if (!gameId) {
        toast.error("Failed to create game room.", { id: toastId });
        return;
      }
      
      // Create invite in both users' paths
      const inviteId = `${user.uid}_${friend.uid}_${Date.now()}`;
      const inviteData = {
        from: user.uid,
        fromName: user.displayName,
        to: friend.uid,
        gameId: gameId,
        quizId: quizId,
        quizTitle: quizTitle,
        status: 'pending',
        timestamp: Date.now()
      };

      // Store in recipient's path
      await set(dbRef(rtdb, `gameInvites/${friend.uid}/${inviteId}`), inviteData);
      
      setWaitingForResponse({
        friendName: friend.displayName,
        avatar: friend.avatar || null
      });
      // toast.success("INVITE SENT - WAITING FOR RESPONSE", { id: toastId });
      
      // Listen for invite acceptance
      const inviteRef = dbRef(rtdb, `gameInvites/${friend.uid}/${inviteId}`);
      const unsubscribe = onValue(inviteRef, async (snapshot) => {
        const data = snapshot.val();
        if (data?.status === 'accepted') {
          unsubscribe(); // Stop listening
          setWaitingForResponse(null);
          toast.success("INVITE ACCEPTED - STARTING GAME!");
          
          // Ensure game state is starting (only update state, preserve questions!)
          await update(dbRef(rtdb, `games/${gameId}`), {
            state: 'starting'
            // REMOVED endTime here to prevent race conditions
          });
          
          // Now navigate
          setTimeout(() => navigate(`/game/${gameId}`), 1000);
        } else if (data?.status === 'declined') {
          unsubscribe();
          setWaitingForResponse(null);
          toast.error("INVITE DECLINED");
          // Delete the game
          remove(dbRef(rtdb, `games/${gameId}`));
        } else if (!data) {
          // Invite removed (timeout or cancelled)
          setWaitingForResponse(null);
          unsubscribe();
        }
      });
      
    } catch (err) {
      console.error(err);
      toast.error("CONNECTION FAILED", { id: toastId });
    }
  };

  useEffect(() => {
    if (!waitingInviteId || !user?.uid) return;
    
    const inviteRef = dbRef(rtdb, `gameInvites/${user.uid}/${waitingInviteId}`);
    const unsub = onValue(inviteRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setWaitingInviteId(null);
        setWaitingForFriend(null);
        toast.error("INVITE DECLINED");
      } else {
        const data = snapshot.val();
        
        // Check if expired (30 minutes)
        if (Date.now() - data.timestamp >= 30 * 60 * 1000) {
          await remove(inviteRef);
          setWaitingInviteId(null);
          setWaitingForFriend(null);
          toast.error("INVITE EXPIRED");
          return;
        }
        
        if (data.status === 'accepted') {
          toast.success("ACCEPTED! DEPLOYING...");
          const roomId = data.roomId;
          // Start game animation
          await set(dbRef(rtdb, `games/${roomId}`), {
            ...data,
            state: 'starting',
            endTime: Date.now() + 4000
          });
          navigate(`/game/${roomId}`);
        }
      }
    });
    
    return () => unsub();
  }, [waitingInviteId, navigate, user?.uid]);

  const cancelInvite = async () => {
    if (waitingInviteId && user?.uid && waitingForFriend) {
      try {
        // Remove invite from both users
        await remove(dbRef(rtdb, `gameInvites/${user.uid}/${waitingInviteId}`));
        await remove(dbRef(rtdb, `gameInvites/${waitingForFriend.uid}/${waitingInviteId}`));
      } catch (e) {
        console.error('Cancel invite error:', e);
      }
    }
    setWaitingInviteId(null);
    setWaitingForFriend(null);
  };

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#0f1923] text-white overflow-hidden relative">
      
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(239,68,68,0.5) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(239,68,68,0.5) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      {/* Corner Brackets */}
      <div className="absolute top-4 left-4 w-12 h-12 sm:top-8 sm:left-8 sm:w-16 sm:h-16 border-l-2 border-t-2 border-red-500/30"></div>
      <div className="absolute top-4 right-4 w-12 h-12 sm:top-8 sm:right-8 sm:w-16 sm:h-16 border-r-2 border-t-2 border-red-500/30"></div>
      <div className="absolute bottom-4 left-4 w-12 h-12 sm:bottom-8 sm:left-8 sm:w-16 sm:h-16 border-l-2 border-b-2 border-red-500/30"></div>
      <div className="absolute bottom-4 right-4 w-12 h-12 sm:bottom-8 sm:right-8 sm:w-16 sm:h-16 border-r-2 border-b-2 border-red-500/30"></div>

      {/* Waiting Overlay */}
      <AnimatePresence>
        {waitingInviteId && waitingForFriend && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 border-4 border-red-500 flex items-center justify-center bg-[#1a2332] relative">
                {waitingForFriend.avatar?.url ? (
                  <img src={waitingForFriend.avatar.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users size={48} className="text-red-500" />
                )}
                
                {/* Pulsing ring */}
                <div className="absolute inset-0 border-2 border-red-500 animate-ping opacity-30"></div>
              </div>
              <Loader2 className="absolute -bottom-3 -right-3 text-white animate-spin bg-red-500 rounded-full p-2" size={32} />
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-wider uppercase mb-2">
                AWAITING RESPONSE
              </h2>
              <p className="text-red-500 text-sm uppercase tracking-wider">{waitingForFriend.displayName}</p>
            </div>
            
            <button 
              onClick={cancelInvite} 
              className="px-8 py-3 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <UserX size={18} />
              CANCEL INVITE
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {mode === 'solo' ? (
        <div className="text-center z-10 relative">
          {/* Scanner Display */}
          <div className="radar-pulse relative w-48 h-48 md:w-64 md:h-64 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-red-500 flex items-center justify-center bg-[#1a2332]">
              <div className="radar-ring absolute inset-0 border border-red-500"></div>
              <div className="radar-ring absolute inset-0 border border-red-500 delay-500"></div>
              <Target size={64} className={`text-red-500 ${status === 'found' ? 'scanner-pulse' : ''}`} />
            </div>
            
            {/* Scanner line */}
            <div className="scanner-line absolute top-1/2 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
          </div>

          <div className="search-text">
            <div className="inline-block px-3 sm:px-4 py-1 mb-3 sm:mb-4 border border-red-500/30 bg-red-500/10">
              <span className="text-[10px] text-red-500 font-bold tracking-[0.3em] uppercase">
                {status === 'searching' ? 'PREPARING QUIZ' : 'QUIZ READY'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-black tracking-wider uppercase text-white px-4">
              {status === 'searching' ? 'LOADING QUESTIONS' : 'READY TO START'}
            </h2>
          </div>
        </div>
      ) : (
        <div ref={friendListRef} className="friend-container w-full max-w-2xl bg-[#1a2332]/90 backdrop-blur-md p-4 sm:p-6 md:p-8 border-2 border-red-500/30 z-10 relative">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-l-2 sm:border-l-4 border-t-2 sm:border-t-4 border-red-500"></div>
          <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-r-2 sm:border-r-4 border-t-2 sm:border-t-4 border-red-500"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-l-2 sm:border-l-4 border-b-2 sm:border-b-4 border-red-500"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-r-2 sm:border-r-4 border-b-2 sm:border-b-4 border-red-500"></div>

          <div className="mb-4 sm:mb-6">
            <div className="inline-block px-3 py-1 mb-2 sm:mb-3 border border-red-500/30 bg-red-500/10">
              <span className="text-[10px] text-red-500 font-bold tracking-[0.3em] uppercase">
                SQUAD SELECT
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black flex items-center gap-2 sm:gap-3 text-white uppercase">
              <Users className="text-red-500" size={24} />
              YOUR ALLIES
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin w-12 h-12 mx-auto text-red-500" />
            </div>
          ) : friends.length > 0 ? (
            <div className="space-y-3">
              {friends.map((friend, index) => (
                <div 
                  key={friend.uid} 
                  className="friend-card group bg-[#0f1923]/50 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500 p-4 flex justify-between items-center transition-all relative"
                  style={{ '--delay': `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    {friend.avatar?.url && (
                      <div className="w-12 h-12 border border-red-500/30 overflow-hidden">
                        <img src={friend.avatar.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white uppercase">{friend.displayName}</p>
                      <p className="text-red-500 text-xs uppercase tracking-wider">{friend.avatar?.role || 'Agent'}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleInvite(friend)} 
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2"
                  >
                    <Swords size={14} />
                    INVITE
                  </button>

                  {/* Small corner accents */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-red-500/30 group-hover:border-red-500 transition-colors"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-red-500/30 group-hover:border-red-500 transition-colors"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users size={48} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 uppercase text-sm tracking-wider">No allies available</p>
            </div>
          )}
        </div>
      )}
      {/* WAITING OVERLAY */}
      <AnimatePresence>
        {waitingForResponse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
             {/* Animated red scanlines */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `linear-gradient(rgba(239,68,68,0.8) 1px, transparent 1px)`,
              backgroundSize: '100% 4px',
              animation: 'scan 8s linear infinite'
            }}></div>

            <div className="text-center relative z-10 p-6">
              {/* Spinner/Pulse */}
              <div className="relative w-32 h-32 mx-auto mb-12">
                <div className="absolute inset-0 border-4 border-red-500/30 rounded-full animate-ping"></div>
                <div className="absolute inset-0 border-4 border-t-red-500 rounded-full animate-spin"></div>
                {waitingForResponse.avatar?.url ? (
                  <div className="absolute inset-2 rounded-full overflow-hidden border-4 border-black/50">
                    <img src={waitingForResponse.avatar.url} className="w-full h-full object-cover opacity-80" alt="" />
                  </div>
                ) : (
                  <Users className="absolute inset-0 m-auto text-red-500" size={32} />
                )}
              </div>

              <h2 className="text-white text-3xl font-black uppercase tracking-wider mb-4 animate-pulse">
                AWAITING RESPONSE
              </h2>
              <p className="text-gray-400 text-sm uppercase tracking-widest bg-red-500/10 py-2 px-4 inline-block border border-red-500/20">
                CONTACTING <span className="text-red-500 font-bold ml-2">{waitingForResponse.friendName}</span>
              </p>

              <div className="mt-12">
                <button 
                  onClick={() => setWaitingForResponse(null)} // Local cancel only for now, potentially delete invite in future
                  className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 mx-auto group"
                >
                   <UserX size={14} className="group-hover:text-red-500 transition-colors" />
                   CANCEL REQUEST
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Lobby;