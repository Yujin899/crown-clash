import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// تصميم كروت الكوتشينة (Avatars)
const AVATARS = [
  { id: 'wolf', icon: '🐺', name: 'THE WOLF', color: 'from-indigo-500 to-purple-600', rank: 'K' },
  { id: 'lion', icon: '🦁', name: 'THE LION', color: 'from-amber-500 to-orange-600', rank: 'A' },
  { id: 'dragon', icon: '🐲', name: 'THE DRAGON', color: 'from-red-500 to-rose-600', rank: 'J' },
  { id: 'snake', icon: '🐍', name: 'THE VIPER', color: 'from-emerald-500 to-green-600', rank: 'Q' },
];

const ProfileSetup = () => {
  const [username, setUsername] = useState(auth.currentUser?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSaveProfile = async () => {
    if (!username.trim() || !selectedAvatar) {
      toast.error("Codename and Avatar Card required.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Finalizing Identity...");

    try {
      const userRef = doc(db, "players", auth.currentUser.uid);
      
      // تحديث البيانات وفتح البروفايل
      await updateDoc(userRef, {
        displayName: username,
        avatar: selectedAvatar,
        isProfileComplete: true, // <--- كده خلاص بقا جاهز
        rank: "Bronze I" // بنديله رانك ابتدائي
      });

      toast.success("Identity Confirmed. Welcome Operator.", { id: toastId });
      navigate('/dashboard');

    } catch (error) {
      console.error(error);
      toast.error("System Error. Try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.05)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-5xl text-center"
      >
        <h1 className="text-4xl md:text-6xl font-black italic uppercase mb-2">Operator <span className="text-indigo-500">Setup</span></h1>
        <p className="text-gray-400 tracking-[0.3em] text-xs md:text-sm mb-12">CHOOSE YOUR CALLSIGN & EMBLEM</p>

        {/* 1. Input Name */}
        <div className="max-w-md mx-auto mb-16 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
            <input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ENTER CALLSIGN"
                className="relative w-full bg-[#0b0f1a] border border-white/10 p-6 rounded-xl text-center text-2xl font-black text-white outline-none focus:border-indigo-500 transition-all uppercase tracking-widest placeholder:text-gray-700"
            />
        </div>

        {/* 2. Avatar Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 px-4">
            {AVATARS.map((av) => {
                const isSelected = selectedAvatar?.id === av.id;
                return (
                    <motion.div
                        key={av.id}
                        onClick={() => setSelectedAvatar(av)}
                        whileHover={{ y: -15, scale: 1.05, rotateZ: 2 }}
                        className={`relative aspect-[2/3] rounded-2xl cursor-pointer transition-all duration-300
                            ${isSelected ? 'ring-4 ring-indigo-500 shadow-[0_0_50px_rgba(79,70,229,0.5)] z-10 scale-105 -translate-y-4' : 'hover:opacity-100 opacity-60 grayscale hover:grayscale-0'}
                        `}
                    >
                        {/* Card Body */}
                        <div className="absolute inset-0 bg-white text-black rounded-xl p-4 flex flex-col justify-between overflow-hidden shadow-2xl border-4 border-white">
                            {/* Top Left */}
                            <div className="text-left leading-none">
                                <span className="block font-black text-2xl">{av.rank}</span>
                                <span className="text-lg">{av.icon}</span>
                            </div>

                            {/* Center */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${av.color} flex items-center justify-center text-5xl shadow-inner border-4 border-white`}>
                                    {av.icon}
                                </div>
                            </div>
                            
                            {/* Bottom Right (Inverted) */}
                            <div className="text-left leading-none rotate-180">
                                <span className="block font-black text-2xl">{av.rank}</span>
                                <span className="text-lg">{av.icon}</span>
                            </div>
                        </div>

                        {/* Label */}
                        <div className={`absolute -bottom-10 w-full text-center text-xs font-black tracking-widest transition-colors uppercase ${isSelected ? 'text-indigo-400' : 'text-gray-600'}`}>
                            {av.name}
                        </div>
                    </motion.div>
                );
            })}
        </div>

        {/* 3. Confirm Button */}
        <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveProfile}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 px-16 rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all tracking-widest text-lg uppercase"
        >
            {loading ? "INITIALIZING..." : "CONFIRM & DEPLOY"}
        </motion.button>

      </motion.div>
    </div>
  );
};

export default ProfileSetup;