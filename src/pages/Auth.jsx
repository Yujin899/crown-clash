import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebaseConfig';     
import { loginSuccess, loginFailure, setLoading } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { Shield, UserPlus, LogIn } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("ALL FIELDS REQUIRED");
      return;
    }
    if (!isLogin && !formData.fullName) {
      toast.error("CODENAME REQUIRED");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("WEAK PASSCODE (MIN 6)");
      return;
    }

    dispatch(setLoading(true));
    const toastId = toast.loading("AUTHENTICATING...");

    try {
      let userCredential;

      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: formData.fullName });

        await setDoc(doc(db, "players", user.uid), {
            uid: user.uid,
            displayName: formData.fullName,
            email: formData.email,
            rank: "Unranked",     
            points: 0,            
            matchesPlayed: 0,     
            wins: 0,  
            avatar: null,
            isProfileComplete: false, 
            isAdmin: false,
            friends: [],
            friendRequests: [],
            createdAt: new Date().toISOString()
        });
      }

      const user = userCredential.user;
      dispatch(loginSuccess({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || formData.fullName,
        photoURL: user.photoURL
      }));

      toast.success("ACCESS GRANTED", { id: toastId });
      navigate('/dashboard');

    } catch (error) {
      console.error("Auth Error:", error.code);
      let errorMessage = "CONNECTION REFUSED";
      if (error.code === 'auth/email-already-in-use') errorMessage = "IDENTITY ALREADY REGISTERED";
      if (error.code === 'auth/invalid-credential') errorMessage = "INVALID CREDENTIALS";
      
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage, { id: toastId });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden">
      
      {/* Valorant corner brackets */}
      <div className="absolute top-8 left-8 w-24 h-24 border-l-2 border-t-2 border-red-500/30"></div>
      <div className="absolute top-8 right-8 w-24 h-24 border-r-2 border-t-2 border-red-500/30"></div>
      <div className="absolute bottom-8 left-8 w-24 h-24 border-l-2 border-b-2 border-red-500/30"></div>
      <div className="absolute bottom-8 right-8 w-24 h-24 border-r-2 border-b-2 border-red-500/30"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Red glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-red-600/20 blur-xl opacity-50"></div>
        
        {/* Main card */}
        <div className="relative bg-[#1a2332]/90 backdrop-blur-xl border border-red-500/30 overflow-hidden">
          
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
          
          <div className="p-8 md:p-10">
            
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-red-500/10 border-2 border-red-500/30 relative"
              >
                <Shield className="w-8 h-8 text-red-500" />
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-red-500"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-red-500"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-red-500"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-red-500"></div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="inline-block px-4 py-1 mb-3 border border-red-500/20 bg-red-500/5">
                  <span className="text-[10px] text-red-500 font-bold tracking-[0.3em] uppercase">
                    {isLogin ? "SECURE ACCESS" : "NEW AGENT"}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
                  {isLogin ? "AGENT LOGIN" : "REGISTRATION"}
                </h2>
              </motion.div>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-5">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-[10px] text-red-500 font-bold tracking-[0.2em] uppercase ml-1">
                      CODENAME
                    </label>
                    <input 
                      type="text" 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full bg-black/50 border border-red-500/20 focus:border-red-500 p-4 text-white outline-none transition-all uppercase placeholder:text-gray-600 font-semibold text-sm" 
                      placeholder="E.G. PHANTOM"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-[10px] text-red-500 font-bold tracking-[0.2em] uppercase ml-1">
                  EMAIL LINK
                </label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-red-500/20 focus:border-red-500 p-4 text-white outline-none transition-all placeholder:text-gray-600 text-sm" 
                  placeholder="agent@valorant.net"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-red-500 font-bold tracking-[0.2em] uppercase ml-1">
                  PASSCODE
                </label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-red-500/20 focus:border-red-500 p-4 text-white outline-none transition-all placeholder:text-gray-600 text-sm" 
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-4">
                <motion.button 
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.01 } : {}}
                  whileTap={!loading ? { scale: 0.99 } : {}}
                  className="group relative w-full bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-black py-4 transition-all tracking-[0.15em] uppercase text-sm overflow-hidden"
                >
                  {/* Animated background on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>PROCESSING...</>
                    ) : isLogin ? (
                      <><LogIn size={18} /> INITIALIZE</>
                    ) : (
                      <><UserPlus size={18} /> REGISTER</>
                    )}
                  </span>
                </motion.button>
              </div>
            </form>

            {/* Toggle */}
            <div className="pt-6 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="group text-xs text-gray-500 hover:text-red-500 transition-colors uppercase tracking-[0.15em] font-semibold"
              >
                <span className="border-b border-transparent group-hover:border-red-500 transition-all">
                  {isLogin ? "NEED ACCESS? REGISTER" : "HAVE CLEARANCE? LOGIN"}
                </span>
              </button>
            </div>
          </div>

          {/* Bottom accent bar */}
          <div className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;