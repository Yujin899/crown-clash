import { memo } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationCenter = ({ 
  isOpen, 
  setIsOpen, 
  friendRequests, 
  onAcceptRequest 
}) => {
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Open notifications"
      >
        <Bell 
          size={18} 
          className={`md:w-5 md:h-5 ${friendRequests.length > 0 ? "text-indigo-400 animate-pulse" : "text-gray-400"}`} 
        />
        {friendRequests.length > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 10, scale: 0.95 }} 
            className="absolute right-0 top-12 w-72 sm:w-80 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-white/5 bg-indigo-900/20 text-xs font-bold text-white">
              NOTIFICATIONS
            </div>
            <div className="max-h-60 overflow-y-auto">
              {friendRequests.length > 0 ? (
                friendRequests.map(req => (
                  <div 
                    key={req.id} 
                    className="p-3 border-b border-white/5 flex items-center justify-between hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">{req.fromAvatar?.icon || "👤"}</span>
                      <div className="min-w-0">
                        <p className="text-xs text-white font-bold truncate">{req.fromName}</p>
                        <p className="text-[10px] text-gray-500">Wants to be allies</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onAcceptRequest(req)} 
                      className="bg-green-600 p-1.5 rounded hover:bg-green-500 transition-colors flex-shrink-0"
                      aria-label={`Accept friend request from ${req.fromName}`}
                    >
                      <Check size={12} className="text-white"/>
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-[10px] text-gray-500">
                  No new alerts
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(NotificationCenter, (prevProps, nextProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.friendRequests.length === nextProps.friendRequests.length
  );
});
