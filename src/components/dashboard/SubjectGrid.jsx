import { memo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Gamepad2 } from 'lucide-react';

const SubjectGrid = ({ subjects, onSubjectClick }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
        <BookOpen size={18} className="md:w-5 md:h-5 text-indigo-500"/> 
        Active Arenas
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {subjects.map((sub) => (
          <motion.div 
            key={sub.id} 
            onClick={() => onSubjectClick(sub)} 
            whileHover={{ scale: 1.02 }} 
            className="bg-[#0b0f1a] border border-white/5 p-4 md:p-6 rounded-xl md:rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-900/10 transition-all cursor-pointer relative overflow-hidden group"
          >
            <div className="absolute right-0 top-0 w-20 h-20 md:w-24 md:h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
            <h3 className="font-bold text-base md:text-lg mb-1 text-white relative z-10">{sub.name}</h3>
            {sub.quizCount > 0 && (
              <p className="text-[10px] text-gray-500 tracking-widest uppercase flex items-center gap-1 relative z-10">
                <Gamepad2 size={10} /> {sub.quizCount} Modules
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Memoize component - only re-render when subjects array changes
export default memo(SubjectGrid, (prevProps, nextProps) => {
  return prevProps.subjects === nextProps.subjects;
});
