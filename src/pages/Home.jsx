import { useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

const Home = () => {
  const comp = useRef(null); // الكونتينر الرئيسي
  
  // Refs للعناصر عشان نتحكم فيها
  const badgeRef = useRef(null);
  const titleLinesRef = useRef([]);
  const descRef = useRef(null);
  const btnRef = useRef(null);
  const bgRef = useRef(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // 1. Badge Animation (ينزل من فوق بنعومة)
      tl.from(badgeRef.current, {
        y: -50,
        opacity: 0,
        duration: 1.5,
        ease: "elastic.out(1, 0.5)"
      });

      // 2. Title Animation (Cinematic Skew Reveal)
      // التكنيك ده بيخلي النص يطلع من تحت مع ميلان
      tl.from(titleLinesRef.current, {
        y: 150,           // جاي من تحت اوي
        skewY: 7,         // مايل شوية كأنه بيجري
        opacity: 0,
        stagger: 0.15,    // تأخير بين السطر والتاني
        duration: 1.8,
      }, "-=1"); // يبدأ قبل ما البادج يخلص

      // 3. Description Fade Up
      tl.from(descRef.current, {
        y: 20,
        opacity: 0,
        duration: 1,
      }, "-=1.2");

      // 4. Button Pop (زي الانفجار الصغير)
      tl.from(btnRef.current, {
        scale: 0,
        opacity: 0,
        duration: 1,
        ease: "back.out(1.7)" // تأثير الارتداد
      }, "-=0.8");

      // 5. Background Ambient Motion (حركة مستمرة للخلفية)
      gsap.to(bgRef.current, {
        rotate: 360,
        duration: 100,
        repeat: -1,
        ease: "none" // حركة خطية لا نهائية
      });

    }, comp);

    return () => ctx.revert();
  }, []);

  // دالة عشان تأثير الماوس (Parallax)
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 20; // حركة خفيفة 20px
    const y = (clientY / window.innerHeight - 0.5) * 20;

    // نحرك العناصر بعكس اتجاه الماوس
    gsap.to(".parallax-item", {
      x: x,
      y: y,
      duration: 1,
      ease: "power2.out"
    });
    
    // الخلفية تتحرك ابطأ عشان تدي عمق
    gsap.to(bgRef.current, {
      x: x * 0.5,
      y: y * 0.5,
      duration: 1.5,
      ease: "power2.out"
    });
  };

  // دالة مساعدة لتجميع الـ Refs للنصوص
  const addToTitleRefs = (el) => {
    if (el && !titleLinesRef.current.includes(el)) {
      titleLinesRef.current.push(el);
    }
  };

  return (
    <div 
      ref={comp} 
      onMouseMove={handleMouseMove}
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-[#020205]"
    >
      {/* Background Decor (Cyberpunk Grid/Glow) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
         <div ref={bgRef} className="w-[800px] h-[800px] bg-gradient-to-r from-indigo-500/10 to-purple-600/10 rounded-full blur-[100px]"></div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl z-10 parallax-item"> {/* ضفنا كلاس parallax-item عشان يتحرك مع الماوس */}
        
        {/* Badge */}
        <div ref={badgeRef} className="inline-block overflow-hidden mb-6">
            <div className="px-4 py-1 border border-indigo-500/30 rounded-full bg-indigo-500/10 backdrop-blur-md">
               <span className="text-xs text-indigo-400 font-bold tracking-[0.3em] uppercase">Next Gen Education Platform</span>
            </div>
        </div>

        {/* Cinematic Title (Masked for Reveal Effect) */}
        {/* السر هنا: بنعمل div واخد overflow-hidden وجواه الـ span اللي بيتحرك */}
        <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter mb-8 leading-none">
          <div className="overflow-hidden">
            <span ref={addToTitleRefs} className="block">MASTER THE</span>
          </div>
          <div className="overflow-hidden">
            <span ref={addToTitleRefs} className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
              KNOWLEDGE GRID
            </span>
          </div>
        </h1>
        
        {/* Description */}
        <div ref={descRef} className="overflow-hidden mb-12">
            <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed tracking-wide">
            Challenge your peers, master your subjects, and climb the ranks in the ultimate competitive learning arena.
            </p>
        </div>

        {/* Interactive Button */}
        <div ref={btnRef}>
            <Link to="/auth">
            <button 
                className="group relative px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-all overflow-hidden"
                onMouseEnter={() => {
                    // GSAP Hover Effect
                    gsap.to(".btn-glow", { x: "100%", duration: 0.5, ease: "power2.inOut" })
                }}
                onMouseLeave={() => {
                    gsap.set(".btn-glow", { x: "-100%" }) // Reset position instantly
                }}
            >
                {/* Shine Effect */}
                <div className="btn-glow absolute top-0 left-0 w-full h-full bg-white/20 -skew-x-12 -translate-x-full pointer-events-none"></div>
                
                <span className="relative z-10 tracking-[0.2em] text-sm flex items-center gap-3 uppercase">
                Initialize System 
                <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </span>
            </button>
            </Link>
        </div>

      </div>

      {/* Footer Decor */}
      <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#020205] via-[#020205]/80 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Home;