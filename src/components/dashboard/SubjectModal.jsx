import { memo, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { X, Gamepad2, ShieldAlert, Swords, Users } from 'lucide-react';

const SubjectModal = ({ 
  selectedSubject, 
  onClose, 
  subjectQuizzes, 
  selectedQuiz, 
  onQuizSelect, 
  onModeSelection 
}) => {
  const modalRef = useRef(null);
  const backdropRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!selectedSubject) return;

    // Add small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline();

        // Only animate if elements exist
        if (backdropRef.current) {
          tl.fromTo(backdropRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.2, ease: 'power2.out' }
          );
        }

        if (contentRef.current) {
          tl.fromTo(contentRef.current,
            { y: -100, opacity: 0, scale: 0.8 },
            { 
              y: 0, 
              opacity: 1, 
              scale: 1, 
              duration: 0.6, 
              ease: 'elastic.out(1, 0.6)' 
            },
            '-=0.1'
          );
        }

        // Check if corner brackets exist
        const cornerBrackets = gsap.utils.toArray('.corner-bracket');
        if (cornerBrackets.length > 0) {
          tl.fromTo(cornerBrackets,
            { scale: 0, opacity: 0, rotate: 180 },
            { 
              scale: 1, 
              opacity: 1, 
              rotate: 0, 
              duration: 0.4, 
              stagger: 0.05,
              ease: 'back.out(2)' 
            },
            '-=0.4'
          );
        }

        // Check if quiz items exist
        const quizItems = gsap.utils.toArray('.quiz-item');
        if (quizItems.length > 0) {
          tl.fromTo(quizItems,
            { x: -30, opacity: 0, rotateY: -15 },
            { 
              x: 0, 
              opacity: 1, 
              rotateY: 0, 
              duration: 0.4, 
              stagger: 0.08,
              ease: 'power3.out' 
            },
            '-=0.3'
          );
        }

      }, modalRef);

      return () => ctx.revert();
    }, 50);

    return () => {
      clearTimeout(timer);
    };
  }, [selectedSubject]);

  if (!selectedSubject) return null;

  return (
    <AnimatePresence>
      <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center p-4">
        
        {/* Backdrop */}
        <div 
          ref={backdropRef}
          className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Animated red grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgba(239,68,68,0.5) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(239,68,68,0.5) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Modal Content */}
        <div 
          ref={contentRef}
          className="relative w-full max-w-2xl bg-[#1a2332] border-2 border-red-500/30 overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

          {/* Corner Brackets */}
          <div className="corner-bracket absolute top-2 left-2 w-8 h-8 border-l-4 border-t-4 border-red-500"></div>
          <div className="corner-bracket absolute top-2 right-2 w-8 h-8 border-r-4 border-t-4 border-red-500"></div>
          <div className="corner-bracket absolute bottom-2 left-2 w-8 h-8 border-l-4 border-b-4 border-red-500"></div>
          <div className="corner-bracket absolute bottom-2 right-2 w-8 h-8 border-r-4 border-b-4 border-red-500"></div>

          {/* Header */}
          <div className="p-6 border-b border-red-500/20 flex justify-between items-center bg-[#0f1923]">
            <div>
              <div className="inline-block px-3 py-1 mb-2 border border-red-500/30 bg-red-500/10">
                <span className="text-[10px] text-red-500 font-bold tracking-[0.3em] uppercase">
                  MISSION SELECT
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                {selectedSubject.name}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all group"
            >
              <X size={24} className="text-red-500 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 min-h-[300px]">
            {!selectedQuiz ? (
              // Quiz Selection
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectQuizzes.length > 0 ? (
                  subjectQuizzes.map((quiz, index) => (
                    <div 
                      key={quiz.id} 
                      onClick={() => onQuizSelect(quiz)} 
                      className="quiz-item group relative bg-[#0f1923]/50 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500 p-4 cursor-pointer transition-all overflow-hidden"
                      style={{ '--delay': `${index * 0.1}s` }}
                    >
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 transition-all"></div>
                      
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="bg-red-500/10 p-3 border border-red-500/30 group-hover:bg-red-500 group-hover:border-red-500 transition-all">
                          <Gamepad2 size={20} className="text-red-500 group-hover:text-white transition-colors"/>
                        </div>
                        <h4 className="font-bold text-white group-hover:text-red-500 transition-colors uppercase text-sm">
                          {quiz.title}
                        </h4>
                      </div>

                      {/* Small corner accents */}
                      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-red-500/30 group-hover:border-red-500 transition-colors"></div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-red-500/30 group-hover:border-red-500 transition-colors"></div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-center text-gray-500 py-10 flex flex-col items-center gap-2">
                    <ShieldAlert size={40} className="text-red-500/50" /> 
                    <span className="text-sm uppercase tracking-wider">No missions available</span>
                  </p>
                )}
              </div>
            ) : (
              // Mode Selection
              <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                <div className="quiz-item">
                  <h3 className="text-xl md:text-2xl font-black text-white mb-2 uppercase">
                    TARGET CONFIRMED
                  </h3>
                  <p className="text-red-500 font-bold uppercase tracking-wider">{selectedQuiz.title}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center quiz-item">
                  {/* Random Mode */}
                  <button 
                    onClick={() => onModeSelection('random')} 
                    className="group relative flex-1 max-w-[220px] bg-red-500 hover:bg-red-600 p-6 transition-all overflow-hidden"
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                    
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <Swords size={32} className="text-white" />
                      <div className="font-black text-sm uppercase tracking-wider text-white">Random Match</div>
                    </div>

                    {/* Corner brackets */}
                    <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-red-400"></div>
                    <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-red-400"></div>
                  </button>

                  {/* Friend Mode */}
                  <button 
                    onClick={() => onModeSelection('friend')} 
                    className="group relative flex-1 max-w-[220px] bg-transparent border-2 border-red-500 hover:bg-red-500/10 p-6 transition-all overflow-hidden"
                  >
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <Users size={32} className="text-red-500" />
                      <div className="font-black text-sm uppercase tracking-wider text-red-500">Challenge Friend</div>
                    </div>

                    {/* Corner brackets */}
                    <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-red-500"></div>
                    <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-red-500"></div>
                  </button>
                </div>
                
                <button 
                  onClick={() => onQuizSelect(null)} 
                  className="quiz-item text-xs text-gray-500 hover:text-red-500 mt-4 flex items-center gap-1 transition-colors uppercase tracking-wider"
                >
                  <X size={12}/> Go Back
                </button>
              </div>
            )}
          </div>

          {/* Bottom accent bar */}
          <div className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default memo(SubjectModal);
