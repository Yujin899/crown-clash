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
    
    // Validation
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!isLogin && !formData.fullName) {
      toast.error("Codename is required for new agents");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password too weak (min 6 chars)");
      return;
    }

    dispatch(setLoading(true));
    const toastId = toast.loading("Authenticating...");

    try {
      let userCredential;

      if (isLogin) {
        // === LOGIN LOGIC ===
        userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        // === SIGN UP LOGIC ===
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // تحديث بروفايل الـ Auth
        await updateProfile(user, { displayName: formData.fullName });

        // إنشاء ملف اللاعب في Firestore
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
            isAdmin: false, // <--- ضفنا ده: الافتراضي إنه مش أدمن
            friends: [],
            friendRequests: [],
            createdAt: new Date().toISOString()
        });
      }

      // النجاح وتحديث الريدكس
      const user = userCredential.user;
      dispatch(loginSuccess({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || formData.fullName,
        photoURL: user.photoURL
      }));

      toast.success("Access Granted", { id: toastId });
      
      // التوجيه للداشبورد (وهناك هيتشيك لو البروفايل كامل ولا لأ)
      navigate('/dashboard');

    } catch (error) {
      console.error("Auth Error:", error.code);
      let errorMessage = "Connection Refused.";
      if (error.code === 'auth/email-already-in-use') errorMessage = "Identity already registered.";
      if (error.code === 'auth/invalid-credential') errorMessage = "Invalid access credentials.";
      
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage, { id: toastId });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-[#02040a] selection:bg-indigo-500/30">
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group w-full max-w-md"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-[#0b0f1a]/80 border border-white/10 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl flex flex-col">
          
          <div className="text-center mb-6">
            <div className="inline-block px-3 py-1 mb-4 border border-indigo-500/30 rounded-full bg-indigo-500/10">
              <span className="text-[10px] text-indigo-400 font-bold tracking-[0.2em] uppercase">
                {isLogin ? "System Access" : "New Registration"}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {isLogin ? "Operator Login" : "Join The Grid"}
            </h2>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence>
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  <label className="text-xs text-gray-400 font-medium ml-2">CODENAME</label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-indigo-500 transition-all uppercase" 
                    placeholder="E.G. GHOST"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium ml-2">EMAIL LINK</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-indigo-500 transition-all" 
                placeholder="agent@crown.net"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium ml-2">PASSCODE</label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-indigo-500 transition-all" 
                placeholder="••••••••"
              />
            </div>

            <div className="pt-4">
              <motion.button 
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all tracking-widest"
              >
                {loading ? "PROCESSING..." : (isLogin ? "INITIALIZE SESSION" : "CREATE IDENTITY")}
              </motion.button>
            </div>
          </form>

          <div className="pt-4 text-center">
              <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                  {isLogin ? "Need Clearance? Register" : "Have Access? Login"}
              </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;