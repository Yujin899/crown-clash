import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Swords, Trophy, Users, Zap } from 'lucide-react';
import { useIsMobile } from '../hooks';

const Home = () => {
  const isMobile = useIsMobile();

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const features = [
    { icon: Swords, title: "Combat System", desc: "Engage in quiz-based battles" },
    { icon: Trophy, title: "Leaderboards", desc: "Compete for the top spot" },
    { icon: Users, title: "Multiplayer", desc: "Challenge friends in real-time" },
    { icon: Zap, title: "Fast-Paced", desc: "Quick 3-minute rounds" }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Valorant-style corner brackets */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-4 border-t-4 border-red-500 opacity-20"></div>
      <div className="absolute top-8 right-8 w-16 h-16 border-r-4 border-t-4 border-red-500 opacity-20"></div>
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-4 border-b-4 border-red-500 opacity-20"></div>
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-4 border-b-4 border-red-500 opacity-20"></div>

      {/* Main content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl w-full flex flex-col items-center text-center z-10"
      >
        
        {/* Logo/Title */}
        <motion.div variants={itemVariants} className="mb-8 md:mb-12">
          <div className="inline-block relative">
            {/* Glitch effect background */}
            <motion.div 
              animate={{ 
                x: [0, -2, 2, 0],
                opacity: [0.5, 0.7, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 text-red-500 blur-sm opacity-50"
            >
              <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter">
                CROWN CLASH
              </h1>
            </motion.div>
            
            {/* Main title */}
            <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter bg-gradient-to-r from-red-500 via-white to-red-500 bg-clip-text text-transparent relative">
              CROWN CLASH
            </h1>
          </div>
          
          <motion.div
            variants={itemVariants}
            className="mt-4 flex items-center justify-center gap-2"
          >
            <div className="h-px w-12 bg-red-500"></div>
            <p className="text-red-500 text-xs md:text-sm font-bold tracking-[0.3em] uppercase">
              Tactical Quiz Combat</p>
            <div className="h-px w-12 bg-red-500"></div>
          </motion.div>
        </motion.div>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-gray-400 text-sm md:text-base lg:text-lg max-w-2xl mb-10 md:mb-16 leading-relaxed"
        >
          Enter the arena where knowledge is your weapon. Challenge opponents in real-time quiz battles,
          climb the leaderboards, and prove your intellectual dominance.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center gap-4 mb-16 md:mb-24"
        >
          {/* Primary CTA */}
          <Link to="/auth">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-8 md:px-12 py-4 md:py-5 bg-red-500 hover:bg-red-600 text-white font-black text-sm md:text-base uppercase tracking-wider transition-all overflow-hidden"
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative z-10 flex items-center gap-2">
                <Swords size={20} />
                ENTER COMBAT
              </span>
            </motion.button>
          </Link>

          {/* Secondary CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 md:px-12 py-4 md:py-5 border-2 border-red-500/50 hover:border-red-500 hover:bg-red-500/10 text-white font-bold text-sm md:text-base uppercase tracking-wider transition-all"
          >
            Learn More
          </motion.button>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-5xl"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="p-6 bg-[#1a2332]/50 backdrop-blur-sm border border-red-500/20 hover:border-red-500/50 transition-all group"
            >
              <feature.icon className="w-10 h-10 text-red-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-bold text-base md:text-lg uppercase mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-xs md:text-sm">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 md:mt-24 h-px w-64 bg-gradient-to-r from-transparent via-red-500 to-transparent"
        />
      </motion.div>

      {/* Floating particles */}
      {!isMobile && (
        <>
          <motion.div
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-500 rounded-full blur-sm"
          />
          <motion.div
            animate={{
              y: [0, 20, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute top-1/3 right-1/4 w-2 h-2 bg-red-500 rounded-full blur-sm"
          />
          <motion.div
            animate={{
              y: [0, -15, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
            className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-red-500 rounded-full blur-sm"
          />
        </>
      )}
    </div>
  );
};

export default Home;