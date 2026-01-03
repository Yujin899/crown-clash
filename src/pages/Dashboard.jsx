import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from 'firebase/auth';
import { 
    collection, getDocs, doc, query, where, 
    updateDoc, arrayUnion, onSnapshot 
} from 'firebase/firestore'; 
import { ref, push, onValue, set, remove, update as rtdbUpdate } from 'firebase/database';
import { auth, db, rtdb } from '../firebaseConfig';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import { Swords, Users, User, Bell, LogOut, Trophy, Target, Shield, Search, UserPlus, CheckCircle, XCircle } from 'lucide-react';

// Components
import ChatSidebar from '../components/ChatSidebar';
import InviteOverlay from '../components/InviteOverlay';
import { SubjectModal } from '../components/dashboard';

// Utils
import { getRankFromXP } from '../utils/rankingSystem';
import { runCleanupTasks } from '../utils/cleanup';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('combat');
  
  // Data
  const [subjects, setSubjects] = useState([]);
  const [userData, setUserData] = useState(null);
  
  // Community
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]); 
  const [friendRequests, setFriendRequests] = useState([]);
  
  // Game
  const [activeInvite, setActiveInvite] = useState(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Modal
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectQuizzes, setSubjectQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    if (!isNotifOpen) return;
    
    const handleClickOutside = (e) => {
      if (!e.target.closest('.notification-dropdown') && !e.target.closest('.notification-bell')) {
        setIsNotifOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isNotifOpen]);

  // Cleanup old game data on mount (runs once per session)
  useEffect(() => {
    runCleanupTasks();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    // Fetch user data
    const userDocRef = doc(db, 'players', user.uid);
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        
        if (!data.isProfileComplete) {
          navigate('/setup');
        }
      }
    });

    // Fetch subjects
    getDocs(collection(db, 'subjects')).then((snapshot) => {
      setSubjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch all players for search
    getDocs(collection(db, 'players')).then((snapshot) => {
      setAllPlayers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubUser();
  }, [user?.uid, navigate]);

  // Friend requests listener - using Realtime Database
  useEffect(() => {
    if (!user?.uid) return;
    
    const requestsRef = ref(rtdb, `friendRequests/${user.uid}`);
    const unsub = onValue(requestsRef, (snapshot) => {
      const requests = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        // Check if expired (30 minutes)
        if (Date.now() - data.timestamp < 30 * 60 * 1000) {
          requests.push({ id: childSnapshot.key, ...data });
        } else {
          // Auto-delete expired request
          remove(ref(rtdb, `friendRequests/${user.uid}/${childSnapshot.key}`));
        }
      });
      setFriendRequests(requests);
    });
    
    return () => unsub();
  }, [user?.uid]);

  // Invite listener - using Realtime Database
  useEffect(() => {
    if (!user?.uid) return;
    
    const invitesRef = ref(rtdb, `gameInvites/${user.uid}`);
    const unsub = onValue(invitesRef, (snapshot) => {
      let latestInvite = null;
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        // Check if expired (30 minutes)
        if (data.status === 'pending' && Date.now() - data.timestamp < 30 * 60 * 1000) {
          latestInvite = { id: childSnapshot.key, ...data };
        } else if (Date.now() - data.timestamp >= 30 * 60 * 1000) {
          // Auto-delete expired invite
          remove(ref(rtdb, `gameInvites/${user.uid}/${childSnapshot.key}`));
        }
      });
      setActiveInvite(latestInvite);
    });
    
    return () => unsub();
  }, [user?.uid]);

  // Search players
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = allPlayers.filter(p => 
      p.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) && 
      p.uid !== user.uid
    ).slice(0, 5);
    setSearchResults(filtered);
  }, [searchQuery, allPlayers, user.uid]);

  // --- Handlers ---
  const handleAcceptInvite = useCallback(async () => {
    if (!activeInvite) return;
    
    console.log('✅ Accepting invite:', activeInvite);
    
    // Update invite status in Realtime DB
    await rtdbUpdate(ref(rtdb, `gameInvites/${user.uid}/${activeInvite.id}`), { status: 'accepted' });
    // Also notify sender
    await rtdbUpdate(ref(rtdb, `gameInvites/${activeInvite.from}/${activeInvite.id}`), { status: 'accepted' });
    
    // Update game to mark this player as connected
    const gameId = activeInvite.gameId;
    if (gameId) {
      await rtdbUpdate(ref(rtdb, `games/${gameId}/players/${user.uid}`), {
        name: user.displayName,
        connected: true
      });
      
      // Transition game state from pending → starting (only update these fields!)
      await rtdbUpdate(ref(rtdb, `games/${gameId}`), {
        state: 'starting'
        // REMOVED endTime here to prevent race conditions with useGameState logic
      });
      
      // Navigate directly to the game
      console.log('🎮 Joining game and starting countdown:', gameId);
      navigate(`/game/${gameId}`);
    } else {
      toast.error('Invalid game invite');
    }
  }, [activeInvite, navigate, user?.uid, user?.displayName]);

  const handleDeclineInvite = useCallback(async () => {
    if (!activeInvite) return;
    // Remove invite from both users
    await remove(ref(rtdb, `gameInvites/${user.uid}/${activeInvite.id}`));
    await remove(ref(rtdb, `gameInvites/${activeInvite.from}/${activeInvite.id}`));
    setActiveInvite(null);
  }, [activeInvite, user?.uid]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const sendFriendRequest = useCallback(async (targetPlayer) => {
    // Check if already friends
    if (userData?.friends?.includes(targetPlayer.uid)) {
      toast.error('ALREADY ALLIES');
      return;
    }

    try {
      const requestId = push(ref(rtdb, `friendRequests/${targetPlayer.uid}`)).key;
      const requestData = {
        from: user.uid,
        to: targetPlayer.uid,
        fromName: userData?.displayName || user.displayName,
        toName: targetPlayer.displayName,
        status: 'pending',
        timestamp: Date.now()
      };
      
      await set(ref(rtdb, `friendRequests/${targetPlayer.uid}/${requestId}`), requestData);
      toast.success(`REQUEST SENT TO ${targetPlayer.displayName.toUpperCase()}`);
      setSearchQuery('');
    } catch (error) {
      console.error('Friend request error:', error);
      toast.error('FAILED TO SEND REQUEST');
    }
  }, [user, userData]);

  const acceptFriendRequest = useCallback(async (request) => {
    try {
      // Update both players' friend lists in Firestore (this triggers real-time updates via onSnapshot)
      await Promise.all([
        updateDoc(doc(db, 'players', user.uid), { friends: arrayUnion(request.from) }),
        updateDoc(doc(db, 'players', request.from), { friends: arrayUnion(user.uid) })
      ]);
      
      // Remove request from Realtime DB
      await remove(ref(rtdb, `friendRequests/${user.uid}/${request.id}`));
      
      toast.success('FRIEND ADDED');
    } catch (error) {
      console.error('Accept friend error:', error);
      toast.error('FAILED TO ACCEPT');
    }
  }, [user.uid]);

  const deleteFriend = useCallback(async (friendUid, friendName) => {
    try {
      // Import arrayRemove from firestore
      const { arrayRemove } = await import('firebase/firestore');
      
      // Remove friend from both users' friend lists
      await Promise.all([
        updateDoc(doc(db, 'players', user.uid), { friends: arrayRemove(friendUid) }),
        updateDoc(doc(db, 'players', friendUid), { friends: arrayRemove(user.uid) })
      ]);
      
      toast.success(`REMOVED ${friendName.toUpperCase()} FROM SQUAD`);
    } catch (error) {
      console.error('Delete friend error:', error);
      toast.error('FAILED TO REMOVE FRIEND');
    }
  }, [user.uid]);

  const handleSubjectClick = useCallback(async (subject) => {
    console.log('🎯 Subject clicked:', subject);
    setSelectedSubject(subject); 
    setSelectedQuiz(null);
    
    // Query from SUBCOLLECTION instead of top-level
    const quizzesRef = collection(db, `subjects/${subject.id}/quizzes`);
    console.log('📚 Querying quizzes from:', `subjects/${subject.id}/quizzes`);
    const snap = await getDocs(quizzesRef);
    const quizzes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log('📝 Found quizzes:', quizzes);
    setSubjectQuizzes(quizzes);
    
    // Auto-select first quiz if available
    if (quizzes.length > 0) {
      console.log('✅ Auto-selecting first quiz:', quizzes[0]);
      setSelectedQuiz(quizzes[0]);
    } else {
      console.warn('⚠️ No quizzes found for subject:', subject.id);
    }
  }, []);

  const handleModeSelection = useCallback((mode) => {
    console.log('🎮 Mode selected:', mode);
    console.log('📊 Current state:', { selectedQuiz, selectedSubject });
    
    if (!selectedQuiz || !selectedQuiz.id) {
      toast.error('PLEASE SELECT A QUIZ FIRST');
      console.error('❌ Missing quiz data:', { selectedQuiz, selectedSubject });
      return;
    }
    
    // Pass data via URL params for persistence across refreshes
    const params = new URLSearchParams({
      mode,
      quizId: selectedQuiz.id,
      subjectId: selectedSubject.id,
      quizTitle: selectedQuiz.title,
      subjectName: selectedSubject.name
    });
    
    console.log('🚀 Navigating to lobby with params:', params.toString());
    navigate(`/lobby?${params.toString()}`);
  }, [selectedQuiz, selectedSubject, navigate]);

  const handleLogout = useCallback(async () => { 
    await signOut(auth); 
    dispatch(logout()); 
  }, [dispatch]);

  const hasNotifications = useMemo(() => friendRequests.length > 0, [friendRequests.length]);

  // Tabs configuration
  const tabs = [
    { id: 'combat', label: 'COMBAT', icon: Swords },
    { id: 'community', label: 'COMMUNITY', icon: Users },
    { id: 'profile', label: 'PROFILE', icon: User }
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pb-20 relative">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8"
      >
        {/* User Info */}
        <div className="flex items-center gap-4">
          {userData?.avatar?.url && (
            <div className="relative w-16 h-16 md:w-20 md:h-20 border-2 border-red-500 overflow-hidden">
              <img src={userData.avatar.url} alt="Avatar" className="w-full h-full object-cover" />
              <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-red-500"></div>
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
              {userData?.displayName || user?.displayName}
            </h1>
            <p className="text-red-500 text-xs font-bold uppercase tracking-wider">
              {userData?.avatar?.role || 'AGENT'}
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="notification-bell relative p-3 bg-[#1a2332] border border-red-500/30 hover:border-red-500 transition-all"
          >
            <Bell size={20} className="text-red-500" />
            {hasNotifications && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
              >
                <span className="text-[10px] font-bold text-white">{friendRequests.length}</span>
              </motion.div>
            )}
          </motion.button>

          {/* Logout */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="p-3 bg-[#1a2332] border border-red-500/30 hover:border-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} className="text-red-500" />
          </motion.button>

          {/* Admin Panel (only for admins) */}
          {userData?.isAdmin === true && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin')}
              className="p-3 bg-red-500 hover:bg-red-600 transition-all"
              title="Admin Panel"
            >
              <Shield size={20} className="text-white" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isNotifOpen && friendRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="notification-dropdown absolute top-24 right-4 md:right-8 z-50 w-80 max-w-[calc(100vw-2rem)] bg-[#1a2332] border-2 border-red-500/30 shadow-2xl"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold uppercase text-sm flex items-center gap-2">
                  <Bell size={16} className="text-red-500" />
                  FRIEND REQUESTS
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNotifOpen(false);
                  }}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <XCircle size={18} />
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {friendRequests.map((req) => (
                  <div key={req.id} className="bg-black/30 p-3 border border-red-500/20 relative">
                    <p className="text-white text-sm font-semibold mb-2 uppercase">{req.fromName}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          acceptFriendRequest(req);
                          if (friendRequests.length === 1) setIsNotifOpen(false);
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-3 uppercase transition-all"
                      >
                        <CheckCircle size={14} className="inline mr-1" />
                        Accept
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await remove(ref(rtdb, `friendRequests/${user.uid}/${req.id}`));
                          if (friendRequests.length === 1) setIsNotifOpen(false);
                        }}
                        className="flex-1 bg-transparent border border-red-500/50 hover:bg-red-500/10 text-red-500 text-xs font-bold py-2 px-3 uppercase transition-all"
                      >
                        <XCircle size={14} className="inline mr-1" />
                        Decline
                      </button>
                    </div>
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-red-500/50"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-red-500/50"></div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-red-500/20">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              whileHover={{ y: -2 }}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-2 px-6 py-3 font-bold uppercase text-sm tracking-wider transition-all
                ${activeTab === tab.id 
                  ? 'text-red-500 bg-red-500/10' 
                  : 'text-gray-500 hover:text-white'
                }
              `}
            >
              <Icon size={18} />
              <span className="hidden md:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'combat' && (
          <CombatTab 
            subjects={subjects}
            onSubjectClick={handleSubjectClick}
            userData={userData}
          />
        )}

        {activeTab === 'community' && (
          <CommunityTab
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            searchResults={searchResults}
            onSendRequest={sendFriendRequest}
            onDeleteFriend={deleteFriend}
            userData={userData}
            allPlayers={allPlayers}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab userData={userData} user={user} />
        )}
      </motion.div>

      {/* Modals & Overlays */}
      {selectedSubject && (
        <SubjectModal
          selectedSubject={selectedSubject}
          onClose={() => setSelectedSubject(null)}
          subjectQuizzes={subjectQuizzes}
          selectedQuiz={selectedQuiz}
          onQuizSelect={setSelectedQuiz}
          onModeSelection={handleModeSelection}
        />
      )}

      {activeInvite && (
        <InviteOverlay
          invite={activeInvite}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite}
        />
      )}

      <ChatSidebar />
    </div>
  );
};

// Combat Tab Component
const CombatTab = memo(({ subjects, onSubjectClick, userData }) => (
  <div className="space-y-6">
    {/* Stats Row */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <StatCard icon={Trophy} label="WINS" value={userData?.wins || 0} color="red" />
      <StatCard icon={Target} label="MATCHES" value={userData?.matches || 0} color="red" />
      <StatCard icon={Shield} label="XP" value={userData?.xp || 0} color="red" />
      <StatCard icon={Swords} label="RANK" value={getRankFromXP(userData?.xp || 0).name} color="red" isText />
    </div>

    {/* Subjects Grid */}
    <div>
      <h2 className="text-white font-black uppercase text-lg mb-4 flex items-center gap-2">
        <Swords size={20} className="text-red-500" />
        SELECT BATTLEFIELD
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((subject) => (
          <motion.div
            key={subject.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSubjectClick(subject)}
            className="group relative bg-[#1a2332]/70 backdrop-blur-sm border border-red-500/30 hover:border-red-500 p-6 cursor-pointer transition-all overflow-hidden clip-path-notch"
          >
            {/* Hover effect */}
            <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 transition-all"></div>
            
            <div className="relative z-10">
              <h3 className="text-white font-black text-xl uppercase mb-2">{subject.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{subject.description}</p>
              <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase">
                <Swords size={14} />
                ENGAGE
              </div>
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-red-500/50"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-red-500/50"></div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
));

// Community Tab Component
const CommunityTab = memo(({ searchQuery, onSearchChange, searchResults, onSendRequest, onDeleteFriend, userData, allPlayers }) => {
  const friends = useMemo(() => {
    if (!userData?.friends) return [];
    return allPlayers.filter(p => userData.friends.includes(p.uid));
  }, [userData?.friends, allPlayers]);

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div>
        <h2 className="text-white font-black uppercase text-lg mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-red-500" />
          RECRUIT AGENTS
        </h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="SEARCH BY CODENAME..."
            className="w-full bg-[#1a2332] border border-red-500/30 focus:border-red-500 pl-12 pr-4 py-4 text-white outline-none transition-all uppercase placeholder:text-gray-600 text-sm font-semibold"
          />
        </div>
        
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((player) => (
              <div key={player.uid} className="bg-[#1a2332]/70 border border-red-500/20 p-4 flex items-center justify-between clip-path-notch">
                <div className="flex items-center gap-3">
                  {player.avatar?.url && (
                    <div className="w-10 h-10 border border-red-500/30 overflow-hidden">
                      <img src={player.avatar.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="text-white font-bold text-sm">{player.displayName}</p>
                    <p className="text-red-500 text-xs uppercase">{player.avatar?.role || 'Agent'}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSendRequest(player)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase"
                >
                  <UserPlus size={14} className="inline mr-1" />
                  ADD
                </motion.button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Friends List */}
      <div>
        <h2 className="text-white font-black uppercase text-lg mb-4 flex items-center gap-2">
          <Users size={20} className="text-red-500" />
          YOUR SQUAD ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <div className="bg-[#1a2332]/50 border border-red-500/20 p-8 text-center">
            <Users size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm uppercase">NO ALLIES YET</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {friends.map((friend) => (
              <div key={friend.uid} className="bg-[#1a2332]/70 border border-red-500/20 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {friend.avatar?.url && (
                    <div className="w-12 h-12 border border-red-500/30 overflow-hidden">
                      <img src={friend.avatar.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="text-white font-bold text-sm">{friend.displayName}</p>
                    <p className="text-red-500 text-xs uppercase">{friend.avatar?.role || 'Agent'}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (window.confirm(`Remove ${friend.displayName} from your squad?`)) {
                      onDeleteFriend(friend.uid, friend.displayName);
                    }
                  }}
                  className="bg-transparent border border-red-500/50 hover:bg-red-500/10 hover:border-red-500 text-red-500 px-3 py-2 text-xs font-bold uppercase transition-all"
                  title="Remove friend"
                >
                  <XCircle size={14} />
                </motion.button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// Profile Tab Component
const ProfileTab = memo(({ userData, user }) => (
  <div className="max-w-2xl mx-auto space-y-6">
    {/* Profile Card */}
    <div className="bg-[#1a2332]/70 border border-red-500/30 p-6 md:p-8 relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {userData?.avatar?.url && (
          <div className="relative">
            <div className="w-32 h-32 border-2 border-red-500 overflow-hidden">
              <img src={userData.avatar.url} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-red-500"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-red-500"></div>
          </div>
        )}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-block px-3 py-1 mb-2 bg-red-500/10 border border-red-500/30">
            <span className="text-[10px] text-red-500 font-bold tracking-[0.2em]">
              {userData?.avatar?.role || 'AGENT'}
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase text-white mb-2">{userData?.displayName || user?.displayName}</h2>
          <p className="text-gray-400 text-sm mb-4">{user?.email}</p>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <div className="bg-black/30 px-4 py-2 border border-red-500/20">
              <p className="text-red-500 text-xs font-bold">RANK</p>
              <p className="text-white text-lg font-black">{getRankFromXP(userData?.xp || 0).name}</p>
            </div>
            <div className="bg-black/30 px-4 py-2 border border-red-500/20">
              <p className="text-red-500 text-xs font-bold">TOTAL XP</p>
              <p className="text-white text-lg font-black">{userData?.xp || 0}</p>
            </div>
            <div className="bg-black/30 px-4 py-2 border border-red-500/20">
              <p className="text-red-500 text-xs font-bold">W/L</p>
              <p className="text-white text-lg font-black">{userData?.wins || 0}/{Math.max(0, (userData?.matches || 0) - (userData?.wins || 0))}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-[#1a2332]/70 border border-red-500/20 p-6 text-center">
        <Trophy size={32} className="text-red-500 mx-auto mb-2" />
        <p className="text-3xl font-black text-white mb-1">{userData?.wins || 0}</p>
        <p className="text-red-500 text-xs font-bold uppercase">Victories</p>
      </div>
      <div className="bg-[#1a2332]/80 backdrop-blur-sm border border-red-500/20 p-6 clip-path-notch">
        <p className="text-red-500 text-xs font-bold uppercase tracking-wider mb-2">Matches Played</p>
        <p className="text-3xl font-black text-white mb-1">{userData?.matches || 0}</p>
        <p className="text-gray-400 text-xs">Total engagements</p>
      </div>
    </div>
  </div>
));

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, isText = false }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-[#1a2332]/70 border border-red-500/20 p-4 relative overflow-hidden group"
  >
    <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 transition-all"></div>
    <div className="relative z-10">
      <Icon size={24} className="text-red-500 mb-2" />
      <p className={`${isText ? 'text-lg' : 'text-2xl'} font-black text-white mb-1`}>{value}</p>
      <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider">{label}</p>
    </div>
  </motion.div>
);

export default memo(Dashboard);