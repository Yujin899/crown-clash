import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from 'firebase/auth';
import { 
    collection, getDocs, doc, query, where, 
    updateDoc, arrayUnion, onSnapshot, addDoc, writeBatch, deleteDoc 
} from 'firebase/firestore'; 
import { auth, db } from '../firebaseConfig';
import { logout } from '../store/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ChatSidebar from '../components/ChatSidebar';
import InviteOverlay from '../components/InviteOverlay';
// Icons
import { Swords, LogOut, ShieldAlert, UserPlus, Search, Gamepad2, X, Check, BookOpen, Bell, Users } from 'lucide-react';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Data
  const [subjects, setSubjects] = useState([]);
  const [userData, setUserData] = useState(null);
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]); 
  const [friendRequests, setFriendRequests] = useState([]);
  const [activeInvite, setActiveInvite] = useState(null); // الدعوة النشطة (Full Screen)
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Modal
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectQuizzes, setSubjectQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;

    // 1. Fetch Static Data
    getDocs(collection(db, "subjects")).then(snap => setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    getDocs(collection(db, "players")).then(snap => setAllPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.id !== user.uid)));

    // 2. Listen to User Data
    const unsubUser = onSnapshot(doc(db, "players", user.uid), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (!data.isProfileComplete) { navigate('/setup'); return; }
            setUserData(data);
        }
    });

    // 3. Listen for Game Invites (PENDING ONLY)
    // بنسمع للدعوات اللي مبعوتة ليا وحالتها لسه pending
    const qInvites = query(
        collection(db, "game_invites"), 
        where("to", "==", user.uid), 
        where("status", "==", "pending")
    );
    
    const unsubInvites = onSnapshot(qInvites, (snap) => {
        if (!snap.empty) {
            // ناخد أحدث دعوة ونعرضها
            // (بنستخدم doc.id عشان هنحتاجه في التحديث)
            const inviteData = { id: snap.docs[0].id, ...snap.docs[0].data() };
            setActiveInvite(inviteData);
        } else {
            setActiveInvite(null);
        }
    });

    // 4. Listen Friend Requests
    const qRequests = query(collection(db, "friend_requests"), where("to", "==", user.uid), where("status", "==", "pending"));
    const unsubRequests = onSnapshot(qRequests, (snap) => {
        setFriendRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubInvites(); unsubRequests(); };
  }, [user, navigate]);


  // --- Game Invite Logic (Valorant Style) ---
  const handleAcceptInvite = async () => {
      if (!activeInvite) return;
      
      // التعديل المهم: بنحدث الحالة لـ accepted
      // ده هيخلي الراسل (في صفحة Lobby) يعرف إننا قبلنا ويدخل الجيم
      await updateDoc(doc(db, "game_invites", activeInvite.id), {
          status: 'accepted'
      });
      
      // وأنا كمان بدخل نفس الروم
      navigate(`/game/${activeInvite.roomId}`);
  };

  const handleDeclineInvite = async () => {
      if (!activeInvite) return;
      // لو رفضت، بمسح الدعوة، فالراسل هيعرف إنها "Cancelled"
      await deleteDoc(doc(db, "game_invites", activeInvite.id));
      setActiveInvite(null);
      toast("Challenge Declined", { icon: "🚫" });
  };


  // --- Friend & Search Logic ---
  const handleSearchChange = (e) => {
      const query = e.target.value;
      setSearchQuery(query);
      if (query.length >= 3) {
          setSearchResults(allPlayers.filter(p => p.displayName.toLowerCase().includes(query.toLowerCase())));
      } else { setSearchResults([]); }
  };

  const sendFriendRequest = async (targetPlayer) => {
      if (userData.friends && userData.friends.includes(targetPlayer.id)) return toast.error("Already allies!");
      try {
          await addDoc(collection(db, "friend_requests"), { 
              from: user.uid, fromName: userData.displayName, fromAvatar: userData.avatar || null, 
              to: targetPlayer.id, status: 'pending', timestamp: new Date() 
          });
          toast.success("Request Sent");
          setSearchQuery(''); setSearchResults([]);
      } catch (err) { toast.error("Failed"); }
  };

  const acceptFriendRequest = async (request) => {
      try {
          const batch = writeBatch(db);
          batch.update(doc(db, "players", user.uid), { friends: arrayUnion(request.from) });
          batch.update(doc(db, "players", request.from), { friends: arrayUnion(user.uid) });
          batch.update(doc(db, "friend_requests", request.id), { status: 'accepted' });
          await batch.commit();
          toast.success("Ally Recruited!");
      } catch (err) { toast.error("Error"); }
  };


  // --- Navigation & Modal Logic ---
  const handleSubjectClick = async (subject) => {
      setSelectedSubject(subject); setSelectedQuiz(null);
      const q = query(collection(db, "quizzes"), where("subjectId", "==", subject.id));
      const snap = await getDocs(q);
      setSubjectQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleModeSelection = (mode) => {
      navigate('/lobby', { state: { mode, quizId: selectedQuiz.id, subjectName: selectedSubject.name, quizTitle: selectedQuiz.title } });
  };
  const handleLogout = async () => { await signOut(auth); dispatch(logout()); };


  return (
    <div className="p-6 md:p-10 min-h-screen max-w-7xl mx-auto pb-20 relative">
      <ChatSidebar />

      {/* === INVITE OVERLAY (VALORANT STYLE) === */}
      <AnimatePresence>
          {activeInvite && (
              <InviteOverlay 
                  invite={activeInvite} 
                  onAccept={handleAcceptInvite} 
                  onDecline={handleDeclineInvite} 
              />
          )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 relative z-10">
        <div className="flex items-center gap-4">
           {userData?.avatar && (
             <div className="w-16 h-20 bg-white rounded-lg p-1 relative shadow-lg transform -rotate-6 border-2 border-indigo-500">
                <div className={`w-full h-full rounded bg-gradient-to-br ${userData.avatar.color} flex items-center justify-center text-2xl`}>{userData.avatar.icon}</div>
             </div>
           )}
           <div>
              <h1 className="text-3xl font-black uppercase italic text-white">Command <span className="text-indigo-500">Center</span></h1>
              <p className="text-gray-500 tracking-widest text-xs mt-1 uppercase flex items-center gap-2">OPERATOR: <span className="text-white font-bold">{userData?.displayName}</span></p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
            {/* Notification Center */}
            <div className="relative">
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <Bell size={20} className={friendRequests.length > 0 ? "text-indigo-400 animate-pulse" : "text-gray-400"} />
                    {friendRequests.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>}
                </button>
                <AnimatePresence>
                    {isNotifOpen && (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-12 w-80 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <div className="p-3 border-b border-white/5 bg-indigo-900/20 text-xs font-bold text-white">NOTIFICATIONS</div>
                            <div className="max-h-60 overflow-y-auto">
                                {friendRequests.length > 0 ? friendRequests.map(req => (
                                    <div key={req.id} className="p-3 border-b border-white/5 flex items-center justify-between hover:bg-white/5">
                                        <div className="flex items-center gap-2"><span className="text-lg">{req.fromAvatar?.icon || "👤"}</span><div><p className="text-xs text-white font-bold">{req.fromName}</p><p className="text-[10px] text-gray-500">Wants to be allies</p></div></div>
                                        <button onClick={() => acceptFriendRequest(req)} className="bg-green-600 p-1.5 rounded hover:bg-green-500"><Check size={12} className="text-white"/></button>
                                    </div>
                                )) : <div className="p-6 text-center text-[10px] text-gray-500">No new alerts</div>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {userData?.isAdmin && <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-xs text-indigo-400 font-bold border border-indigo-500/20 px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-all"><ShieldAlert size={14} /> ADMIN</button>}
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-red-500 font-bold border border-red-500/20 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-all"><LogOut size={14} /> LOGOUT</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ACTIVE ARENAS */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2"><BookOpen size={20} className="text-indigo-500"/> Active Arenas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((sub) => (
                <motion.div key={sub.id} onClick={() => handleSubjectClick(sub)} whileHover={{ scale: 1.02 }} className="bg-[#0b0f1a] border border-white/5 p-6 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-900/10 transition-all cursor-pointer relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/10"></div>
                    <h3 className="font-bold text-lg mb-1 text-white">{sub.name}</h3>
                    {sub.quizCount > 0 && <p className="text-[10px] text-gray-500 tracking-widest uppercase flex items-center gap-1"><Gamepad2 size={10} /> {sub.quizCount} Modules</p>}
                </motion.div>
                ))}
          </div>
        </div>

        {/* RECRUIT ALLIES */}
        <div className="space-y-6">
           <div className="bg-[#0b0f1a] border border-white/5 p-6 rounded-3xl">
              <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-4 flex items-center gap-2"><Search size={14} /> RECRUIT ALLIES</h3>
              <div className="relative"><input value={searchQuery} onChange={handleSearchChange} placeholder="Search name (3+ chars)..." className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 pl-8" /><Search className="absolute left-2 top-2.5 text-gray-500" size={14} /></div>
              <AnimatePresence>
                {searchResults.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 bg-black/50 rounded-lg overflow-hidden border border-white/10">
                        {searchResults.map(p => (
                            <div key={p.id} className="flex justify-between items-center p-2 hover:bg-white/5 transition-colors"><span className="text-xs text-gray-300">{p.displayName}</span><button onClick={() => sendFriendRequest(p)} className="text-green-400 hover:text-green-300"><UserPlus size={14} /></button></div>
                        ))}
                    </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {selectedSubject && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0f172a] border border-indigo-500/30 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-indigo-900/20">
                        <div><h2 className="text-2xl font-black italic text-white uppercase">{selectedSubject.name}</h2><p className="text-xs text-indigo-300 tracking-widest">SELECT OPERATION MODULE</p></div>
                        <button onClick={() => setSelectedSubject(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                    </div>
                    <div className="p-6 min-h-[300px]">
                        {!selectedQuiz ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {subjectQuizzes.length > 0 ? subjectQuizzes.map(quiz => (
                                    <div key={quiz.id} onClick={() => setSelectedQuiz(quiz)} className="bg-black/20 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/50 p-4 rounded-xl cursor-pointer transition-all group flex items-center gap-3">
                                        <div className="bg-white/5 p-2 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors"><Gamepad2 size={20}/></div>
                                        <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{quiz.title}</h4>
                                    </div>
                                )) : <p className="col-span-full text-center text-gray-500 py-10 flex flex-col items-center gap-2"><ShieldAlert size={40} /> No modules deployed yet.</p>}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                                <h3 className="text-xl font-bold text-white">Target: <span className="text-indigo-400">{selectedQuiz.title}</span></h3>
                                <div className="flex gap-4 w-full justify-center">
                                    <button onClick={() => handleModeSelection('random')} className="flex-1 max-w-[200px] bg-gradient-to-br from-purple-600 to-indigo-600 p-6 rounded-2xl hover:scale-105 transition-transform flex flex-col items-center gap-2"><Swords size={32} /><div className="font-bold text-sm uppercase">Random Opponent</div></button>
                                    <button onClick={() => handleModeSelection('friend')} className="flex-1 max-w-[200px] bg-gradient-to-br from-green-600 to-emerald-600 p-6 rounded-2xl hover:scale-105 transition-transform flex flex-col items-center gap-2"><Users size={32} /><div className="font-bold text-sm uppercase">Challenge Friend</div></button>
                                </div>
                                <button onClick={() => setSelectedQuiz(null)} className="text-xs text-gray-500 hover:text-white mt-4 flex items-center gap-1"><X size={12}/> Cancel</button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;