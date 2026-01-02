import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { doc, getDoc, collection, getDocs, query, where, addDoc, onSnapshot, deleteDoc } from 'firebase/firestore'; 
import { ref, set, update } from 'firebase/database';
import { db, rtdb } from '../firebaseConfig';
import toast from 'react-hot-toast';
import { Loader2, Users, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import inviteSfx from '../assets/sounds/invite_notification.mp3';

const Lobby = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { mode, quizId, quizTitle } = location.state || { mode: 'random' };

  const [status, setStatus] = useState('searching');
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [waitingInviteId, setWaitingInviteId] = useState(null);
  const [waitingForFriend, setWaitingForFriend] = useState(null);

  // --- Random Mode ---
  useEffect(() => {
    if (mode !== 'random') return;
    const matchTimer = setTimeout(async () => {
      setStatus('found');
      new Audio(inviteSfx).play().catch(()=>{});
      toast.success("Target Found!");
      
      const roomId = `MATCH_${user.uid}_${Date.now()}`;
      await createGameInRTDB(roomId, "BOT", { displayName: "Training Bot", avatar: null }, true);
      
      setTimeout(() => navigate(`/game/${roomId}`), 1000);
    }, 3000);
    return () => clearTimeout(matchTimer);
  }, [mode]);

  // --- Friend Mode ---
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
      if (waitingInviteId) new Audio(inviteSfx).play().catch(()=>{});
  }, [waitingInviteId]);

  // --- Create Game ---
  const createGameInRTDB = async (roomId, enemyId, enemyData, forceStart = false) => {
      if (!quizId) { toast.error("No Quiz ID"); return; }
      const qQuery = query(collection(db, "questions"), where("quizId", "==", quizId));
      const qSnap = await getDocs(qQuery);
      if (qSnap.empty) { toast.error("Empty Quiz!"); return; }

      const questions = qSnap.docs.map(d => d.data()).sort(() => 0.5 - Math.random()).slice(0, 5);

      const gameData = {
          state: forceStart ? 'starting' : 'waiting', 
          // 🔥 4 ثواني بس عشان نعرض مين ضد مين
          endTime: forceStart ? Date.now() + 4000 : 0, 
          questions: questions,
          winner: null,
          reason: null,
          players: {
              [user.uid]: { name: user.displayName, avatar: user.photoURL || null, hp: 100, progress: 0, connected: true, answers: {} },
              [enemyId]: { name: enemyData?.displayName || "Opponent", avatar: enemyData?.avatar || null, hp: 100, progress: 0, connected: true, answers: {} }
          }
      };

      await set(ref(rtdb, 'games/' + roomId), gameData);
      return roomId;
  };

  const handleInvite = async (friend) => {
      const toastId = toast.loading("Connecting...");
      try {
          const newRoomId = `FRIEND_${user.uid}_${Date.now()}`;
          await createGameInRTDB(newRoomId, friend.uid, friend, false);
          
          const inviteRef = await addDoc(collection(db, "game_invites"), {
              senderId: user.uid, senderName: user.displayName,
              to: friend.uid, roomId: newRoomId, quizId, quizTitle, 
              status: 'pending', timestamp: Date.now()
          });

          setWaitingInviteId(inviteRef.id);
          setWaitingForFriend(friend);
          toast.success("Sent!", { id: toastId });
      } catch (err) { toast.error("Failed", { id: toastId }); }
  };

  useEffect(() => {
      if (!waitingInviteId) return;
      const unsub = onSnapshot(doc(db, "game_invites", waitingInviteId), async (docSnap) => {
          if (!docSnap.exists()) {
              setWaitingInviteId(null); setWaitingForFriend(null);
              toast.error("Declined");
          } else if (docSnap.data().status === 'accepted') {
              toast.success("Accepted!");
              const roomId = docSnap.data().roomId;
              // Start Animation (4s)
              await update(ref(rtdb, `games/${roomId}`), {
                  state: 'starting',
                  endTime: Date.now() + 4000
              });
              navigate(`/game/${roomId}`);
          }
      });
      return () => unsub();
  }, [waitingInviteId, navigate]);

  const cancelInvite = async () => {
      if(waitingInviteId) try { await deleteDoc(doc(db, "game_invites", waitingInviteId)); } catch(e){}
      setWaitingInviteId(null); setWaitingForFriend(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#02040a] text-white overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-[600px] h-[600px] border border-indigo-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
        </div>

        <AnimatePresence>
           {waitingInviteId && waitingForFriend && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm">
                   <div className="relative mb-8">
                       <div className="w-24 h-24 rounded-full border-4 border-indigo-500 flex items-center justify-center bg-indigo-900/20 animate-pulse">
                            <span className="text-4xl">{waitingForFriend.avatar?.icon || "👤"}</span>
                       </div>
                       <Loader2 className="absolute -bottom-2 -right-2 text-white animate-spin bg-indigo-600 rounded-full p-2" size={32} />
                   </div>
                   <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-4">WAITING FOR RESPONSE</h2>
                   <button onClick={cancelInvite} className="px-8 py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-bold flex items-center gap-2">
                       <UserX size={18}/> CANCEL
                   </button>
               </motion.div>
           )}
       </AnimatePresence>

        {mode === 'random' ? (
            <div className="text-center z-10">
                <Loader2 className="animate-spin w-12 h-12 mx-auto mb-4 text-indigo-500"/>
                <h2 className="text-xl font-bold tracking-widest">{status === 'searching' ? 'SCANNING...' : 'MATCH FOUND'}</h2>
            </div>
        ) : (
            <div className="w-full max-w-md bg-[#0b0f1a]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 z-10">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><Users className="text-indigo-500"/> SQUAD SELECTION</h2>
                {loading ? <div className="text-center"><Loader2 className="animate-spin mx-auto"/></div> : 
                 friends.length > 0 ? friends.map(f => (
                    <div key={f.uid} className="bg-white/5 p-4 rounded-xl flex justify-between items-center mb-2 hover:bg-white/10 transition-colors">
                        <span className="font-bold text-sm">{f.displayName}</span>
                        <button onClick={() => handleInvite(f)} className="bg-white text-black px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">INVITE</button>
                    </div>
                )) : <p className="text-center text-gray-500">No online allies.</p>}
            </div>
        )}
    </div>
  );
};

export default Lobby;