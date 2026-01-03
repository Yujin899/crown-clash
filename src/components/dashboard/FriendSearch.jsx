import { memo } from 'react';
import { useDebounce } from '../../hooks';
import { Search, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FriendSearch = ({ 
  searchQuery, 
  onSearchChange, 
  searchResults, 
  onSendRequest 
}) => {
  // Debounce search to reduce re-renders
  const debouncedQuery = useDebounce(searchQuery, 300);

  return (
    <div className="bg-[#0b0f1a] border border-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl">
      <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-4 flex items-center gap-2">
        <Search size={14} /> RECRUIT ALLIES
      </h3>
      <div className="relative">
        <input 
          value={searchQuery} 
          onChange={onSearchChange} 
          placeholder="Search name (3+ chars)..." 
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 pl-8" 
        />
        <Search className="absolute left-2 top-2.5 text-gray-500" size={14} />
      </div>
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: "auto" }} 
            exit={{ opacity: 0, height: 0 }} 
            className="mt-2 bg-black/50 rounded-lg overflow-hidden border border-white/10"
          >
            {searchResults.map(p => (
              <div 
                key={p.id} 
                className="flex justify-between items-center p-2 hover:bg-white/5 transition-colors"
              >
                <span className="text-xs text-gray-300">{p.displayName}</span>
                <button 
                  onClick={() => onSendRequest(p)} 
                  className="text-green-400 hover:text-green-300 transition-colors"
                  aria-label={`Send friend request to ${p.displayName}`}
                >
                  <UserPlus size={14} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
// Only re-render when search results or query changes
export default memo(FriendSearch, (prevProps, nextProps) => {
  return (
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.searchResults === nextProps.searchResults
  );
});
