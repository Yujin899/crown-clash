import { useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import gsap from 'gsap';

import { auth } from './firebaseConfig';
import { loginSuccess, logout, setLoading } from './store/slices/authSlice';
import { useIsMobile, usePrefersReducedMotion } from './hooks';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Game = lazy(() => import('./pages/Game'));
const Admin = lazy(() => import('./pages/Admin'));

// Guards
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

// Valorant-style Loading
const PageLoader = () => (
  <div className="h-screen bg-[#0f1923] flex flex-col items-center justify-center relative overflow-hidden">
    {/* Animated background */}
    <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-[#0f1923] to-red-950/10"></div>
    
    {/* Loader */}
    <div className="relative z-10 flex flex-col items-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-red-500/30 rounded-full animate-ping"></div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-2"
      >
        <p className="text-red-500 font-bold text-sm tracking-[0.3em] uppercase">LOADING</p>
        <div className="flex gap-1">
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-red-500 rounded-full"></motion.div>
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} className="w-1.5 h-1.5 bg-red-500 rounded-full"></motion.div>
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }} className="w-1.5 h-1.5 bg-red-500 rounded-full"></motion.div>
        </div>
      </motion.div>
    </div>
  </div>
);

// Minimal GSAP - Only for page transitions
const GSAPPageWrapper = ({ children }) => {
  const containerRef = useRef(null);
  const location = useLocation();
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    // Only page-level fade transition with GSAP
    if (isMobile) {
      gsap.fromTo(container, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    } else {
      gsap.fromTo(container,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [location.pathname, isMobile, prefersReducedMotion]);

  return <div ref={containerRef}>{children}</div>;
};

function App() {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    dispatch(setLoading(true));
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        dispatch(loginSuccess({ 
          uid: firebaseUser.uid, 
          email: firebaseUser.email,
          displayName: firebaseUser.displayName 
        }));
      } else {
        dispatch(logout());
      }
      dispatch(setLoading(false));
    });
    return () => unsub();
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#0f1923] text-white relative overflow-hidden">
      {/* Valorant Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Red gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-[#0f1923] to-red-950/10"></div>
        
        {/* Subtle red grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(239,68,68,0.5) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(239,68,68,0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Red accent lights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/10 blur-[120px]"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <Suspense fallback={<PageLoader />}>
          <GSAPPageWrapper>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
              <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
              <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
              <Route path="/game/:roomId" element={<ProtectedRoute><Game /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            </Routes>
          </GSAPPageWrapper>
        </Suspense>
      </div>

      {/* Valorant-style Toaster */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a2332',
            color: '#fff',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '4px',
            fontWeight: '700',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
          success: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;