import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { AlertTriangle, X, Check } from 'lucide-react';

const ConfirmDeleteModal = ({ friendName, onConfirm, onCancel }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. Backdrop fade
      tl.fromTo('.delete-backdrop',
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: 'power2.out' }
      );

      // 2. Modal slide and scale
      tl.fromTo('.delete-modal',
        { y: -50, scale: 0.9, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' },
        '-=0.1'
      );

      // 3. Icon pulse
      tl.fromTo('.warning-icon',
        { scale: 0, rotate: -180 },
        { scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2)' },
        '-=0.2'
      );

      // 4. Buttons slide
      tl.fromTo('.action-btn',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, stagger: 0.1, ease: 'power2.out' },
        '-=0.2'
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="delete-backdrop absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onCancel}></div>

      {/* Modal */}
      <div className="delete-modal relative bg-[#1a2332] border-2 border-red-500 max-w-md w-full p-6 sm:p-8 clip-path-notch">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-red-500"></div>
        <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-red-500"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-red-500"></div>
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-red-500"></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className="warning-icon w-16 h-16 bg-red-500/20 border-2 border-red-500 flex items-center justify-center clip-path-notch">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-black uppercase text-center text-white mb-2">
            Remove Friend?
          </h2>

          {/* Message */}
          <p className="text-gray-400 text-center text-sm sm:text-base mb-6">
            Are you sure you want to remove <span className="text-red-500 font-bold">{friendName}</span> from your squad?
          </p>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent mb-6"></div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onCancel}
              className="action-btn flex-1 bg-transparent border-2 border-gray-600 hover:border-gray-500 hover:bg-gray-600/10 text-gray-400 hover:text-white px-6 py-3 font-bold uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <X size={18} />
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="action-btn flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 font-bold uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            >
              <Check size={18} />
              Remove
            </button>
          </div>
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
