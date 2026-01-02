import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Skull, AlertTriangle, XCircle } from 'lucide-react';

import gunshotSfx from '../assets/sounds/gunshot.mp3'; 

const KillAnimation = ({ mode, enemyAvatar, onComplete }) => {
  const [stage, setStage] = useState('aim'); 
  const completedRef = useRef(false);

  // استخدمنا ref للصوت عشان نضمن انه ميتكررش
  const audioRef = useRef(null);

  useEffect(() => {
    let timers = [];
    
    // تشغيل الصوت مرة واحدة فقط
    if (!audioRef.current) {
        audioRef.current = new Audio(gunshotSfx);
        audioRef.current.volume = 1.0;
    }
    
    const playSequence = async () => {
       try { 
           // ريست للصوت عشان لو اشتغل قبل كدا
           audioRef.current.currentTime = 0;
           await audioRef.current.play(); 
       } catch(e) { 
           console.log("Audio Error", e); 
       }

       // 1. مرحلة الاطلاق (تتزامن مع الخبطة في الثانية 4.5)
       timers.push(setTimeout(() => {
           setStage('fire');
       }, 4500));

       // 2. مرحلة التأثير (بعدها بـ 100 مللي ثانية)
       timers.push(setTimeout(() => {
           setStage('impact');
       }, 4600));

       // 3. النهاية (عند الثانية 5.5 لإعطاء وقت كافي لرؤية النتيجة)
       timers.push(setTimeout(() => {
           if (!completedRef.current) {
               completedRef.current = true;
               onComplete(); 
           }
       }, 5500));
    };

    playSequence();

    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        timers.forEach(t => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ المصفوفة فاضية عشان يشتغل مرة واحدة بس عند الفتح

  // Framer Motion Variants
  const shakeVariant = {
    aim: { scale: 1, x: 0, y: 0 },
    impact: { 
        x: [0, -20, 20, -20, 20, 0], 
        y: [0, -10, 10, -10, 10, 0],
        scale: 1.1,
        transition: { duration: 0.4 } 
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden">
      
      {/* Muzzle Flash */}
      <AnimatePresence>
        {stage === 'fire' && (
            <motion.div 
                initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                className="absolute inset-0 bg-white z-[250]"
            />
        )}
      </AnimatePresence>

      {/* --- SCENARIO 1: KILL (Win) --- */}
      {mode === 'kill' && (
        <motion.div className="relative w-full h-full flex items-center justify-center" variants={shakeVariant} animate={stage}>
            <div className="absolute inset-0 bg-red-900/20 mix-blend-multiply"></div>
            
            <motion.div 
                animate={stage === 'aim' ? { scale: [1, 1.3], rotate: [0, 2, -2, 0] } : { scale: 1 }}
                transition={{ duration: 4.5, ease: "linear" }}
                className="relative z-10"
            >
                <div className={`w-72 h-72 border-8 rounded-full overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] transition-all duration-300 ${stage === 'impact' ? 'border-red-600 grayscale' : 'border-white/50'}`}>
                    <img src={enemyAvatar} alt="Target" className="w-full h-full object-cover" />
                    {stage === 'impact' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-red-600/60 flex items-center justify-center">
                            <Skull size={180} className="text-white drop-shadow-2xl animate-pulse" />
                        </motion.div>
                    )}
                </div>
            </motion.div>

            <div className="absolute inset-0 pointer-events-none z-20">
                <div className="absolute inset-0 border-[40vw] border-black/90 rounded-full scale-150 origin-center"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-[1px] bg-red-500/50"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-screen w-[1px] bg-red-500/50"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500">
                    <Crosshair size={100} strokeWidth={1} className={stage === 'aim' ? "animate-ping" : ""} />
                </div>
                {stage === 'aim' && <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-red-500 font-mono tracking-[0.5em] text-sm animate-pulse">ACQUIRING TARGET...</div>}
            </div>
            
            {stage === 'impact' && (
                <motion.h1 initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} className="absolute top-1/4 text-8xl font-black text-white z-50 drop-shadow-[0_0_10px_red]" style={{ textShadow: "0 0 50px red" }}>HEADSHOT</motion.h1>
            )}
        </motion.div>
      )}

      {/* --- SCENARIO 2: BACKFIRE (Loss) --- */}
      {mode === 'backfire' && (
        <motion.div className="relative w-full h-full flex flex-col items-center justify-center bg-black" variants={shakeVariant} animate={stage}>
            <div className={`absolute inset-0 bg-red-500/10 ${stage === 'aim' ? 'animate-pulse' : ''}`}></div>
            <div className="z-10 relative">
                 {stage === 'aim' && (
                    <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 0.2 }} className="text-yellow-500 flex flex-col items-center">
                        <AlertTriangle size={150} />
                        <p className="mt-8 text-2xl font-mono tracking-widest text-yellow-500 bg-black/50 px-4">CRITICAL ERROR...</p>
                    </motion.div>
                 )}
                 {stage === 'impact' && (
                    <div className="relative">
                        <XCircle size={200} className="text-red-600" />
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 3, opacity: 0 }} className="absolute inset-0 bg-orange-500 rounded-full blur-2xl" />
                    </div>
                 )}
            </div>
            {stage === 'impact' && (
                <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-10 w-full text-center">
                        <h2 className="text-6xl font-black text-red-600 uppercase tracking-tighter bg-black inline-block px-6">WEAPON JAMMED</h2>
                    </motion.div>
                </div>
            )}
        </motion.div>
      )}

    </div>
  );
};

export default KillAnimation;