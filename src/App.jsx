import { useEffect, useRef, useLayoutEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import gsap from 'gsap';

import { auth } from './firebaseConfig';
import { loginSuccess, logout, setLoading } from './store/slices/authSlice';

// الصفحات
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Admin from './pages/Admin';

// --- Guards ---
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

// --- GSAP UI ASSEMBLY WRAPPER (The Game Effect) ---
const GSAPPageWrapper = ({ children }) => {
  const containerRef = useRef(null);
  const location = useLocation();

  useLayoutEffect(() => {
    // إحنا هنا بنقول لـ GSAP: "دور على أي حاجة جوه الصفحة وحركها"
    const ctx = gsap.context(() => {
      
      // بنختار العناصر المهمة (العناوين، النصوص، الكروت، الزراير)
      // لو ملقتش كلاسات معينة، بياخد العناصر الرئيسية وخلاص
      const targets = gsap.utils.toArray("h1, h2, p, button, input, .card, .box, form > div");
      
      // لو الصفحة فاضية او معقدة، خد العناصر المباشرة
      const finalTargets = targets.length > 0 ? targets : containerRef.current.children;

      // === THE ASSEMBLY ANIMATION ===
      gsap.fromTo(finalTargets, 
        { 
          y: 50,       // جايين من تحت
          opacity: 0,  // مخفيين
          scale: 0.9,  // صغيرين شوية
          filter: "blur(10px)" // مغبشين (Motion Blur effect)
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.6,
          stagger: 0.05, // التتابع السحري: كل عنصر يظهر بعد اللي قبله بلمحة
          ease: "back.out(1.7)", // الارتداد: العنصر بيخبط ويرجع سنة (زي الجيمز)
          delay: 0.1 // استنى الصفحة القديمة تختفي
        }
      );

    }, containerRef);

    return () => ctx.revert();
  }, [location.pathname]);

  return (
    <motion.div
      ref={containerRef}
      className="w-full min-h-screen overflow-hidden bg-[#020205]"
      
      // === حركة الخروج (The Disassemble) ===
      // الصفحة القديمة مش هتختفي عادي، دي هتعمل Zoom In وتختفي كأنك دخلت جواها
      initial={{ opacity: 0 }} // البداية (GSAP بيمسكها، بس دي عشان الأمان)
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 1.1,      // تكبر في وشك
        filter: "blur(20px)", // تغبش جامد
        transition: { duration: 0.3, ease: "easeInOut" } 
      }}
    >
      {/* مفيش طبقات ولا ستائر.. المحتوى هو البطل */}
      {children}
    </motion.div>
  );
};

function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(setLoading(true));
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        dispatch(loginSuccess({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        }));
      } else {
        dispatch(logout());
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  if (loading) {
     return (
       <div className="h-screen w-full bg-[#020205] flex flex-col items-center justify-center gap-4">
         {/* لودينج خفيف ومتحرك */}
         <div className="flex gap-1 items-end h-8">
            <div className="w-2 h-4 bg-indigo-500 animate-[bounce_1s_infinite]"></div>
            <div className="w-2 h-6 bg-indigo-500 animate-[bounce_1s_infinite_0.1s]"></div>
            <div className="w-2 h-8 bg-indigo-500 animate-[bounce_1s_infinite_0.2s]"></div>
         </div>
         <p className="text-indigo-500 text-[10px] tracking-[0.4em] font-bold animate-pulse">SYSTEM BOOT</p>
       </div>
     );
  }

  return (
    <div className="relative min-h-screen bg-[#020205] text-white overflow-hidden font-sans">
      
      <Toaster position="top-center" toastOptions={{ style: { background: '#0f172a', color: '#fff', border: '1px solid rgba(99, 102, 241, 0.2)' } }} />

      {/* Background (متحركة ببطء شديد عشان تدي حياة) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e505_1px,transparent_1px),linear-gradient(to_bottom,#4f46e505_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        {/* Spotlights */}
        <div className="absolute -top-[20%] left-[20%] w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[0%] right-[0%] w-[400px] h-[400px] bg-purple-600/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            
            <Route path="/" element={<GSAPPageWrapper><Home /></GSAPPageWrapper>} />
            
            <Route path="/auth" element={
              <PublicRoute><GSAPPageWrapper><Auth /></GSAPPageWrapper></PublicRoute>
            } />

            <Route path="/setup" element={
              <ProtectedRoute><GSAPPageWrapper><ProfileSetup /></GSAPPageWrapper></ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute><GSAPPageWrapper><Dashboard /></GSAPPageWrapper></ProtectedRoute>
            } />
            
            <Route path="/lobby" element={
              <ProtectedRoute><GSAPPageWrapper><Lobby /></GSAPPageWrapper></ProtectedRoute>
            } />

            <Route path="/game/:roomId" element={
              <ProtectedRoute><GSAPPageWrapper><Game /></GSAPPageWrapper></ProtectedRoute>
            } />

             <Route path="/admin" element={
              <ProtectedRoute><GSAPPageWrapper><Admin /></GSAPPageWrapper></ProtectedRoute>
            } />

          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;