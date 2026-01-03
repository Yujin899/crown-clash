import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import toast from 'react-hot-toast';
import { CheckCircle, ArrowRight } from 'lucide-react';

// Import avatar images
import phantomImg from '../assets/avatars/phantom.png';
import viperImg from '../assets/avatars/viper.png';
import reconImg from '../assets/avatars/recon.png';
import shadowImg from '../assets/avatars/shadow.png';
import sentinelImg from '../assets/avatars/sentinel.png';
import roninImg from '../assets/avatars/ronin.png';
import spectreImg from '../assets/avatars/spectre.png';
import novaImg from '../assets/avatars/nova.png';
import vanguardImg from '../assets/avatars/vanguard.png';
import cipherImg from '../assets/avatars/cipher.png';

// Agent avatars with names
const AGENTS = [
  {
    id: 'phantom',
    name: 'PHANTOM',
    role: 'INFILTRATOR',
    image: phantomImg
  },
  {
    id: 'viper',
    name: 'VIPER',
    role: 'CONTROLLER',
    image: viperImg
  },
  {
    id: 'shadow',
    name: 'SHADOW',
    role: 'ASSASSIN',
    image: shadowImg
  },
  {
    id: 'sentinel',
    name: 'SENTINEL',
    role: 'DEFENDER',
    image: sentinelImg
  },
  {
    id: 'ronin',
    name: 'RONIN',
    role: 'DUELIST',
    image: roninImg
  },
  {
    id: 'spectre',
    name: 'SPECTRE',
    role: 'GHOST',
    image: spectreImg
  },
  {
    id: 'nova',
    name: 'NOVA',
    role: 'TACTICAL',
    image: novaImg
  },
  {
    id: 'vanguard',
    name: 'VANGUARD',
    role: 'TANK',
    image: vanguardImg
  },
  {
    id: 'cipher',
    name: 'CIPHER',
    role: 'HACKER',
    image: cipherImg
  }
];

const ProfileSetup = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleConfirm = async () => {
    if (!selectedAgent) {
      toast.error("SELECT AN AGENT");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("INITIALIZING AGENT...");

    try {
      await updateDoc(doc(db, "players", user.uid), {
        avatar: {
          id: selectedAgent.id,
          name: selectedAgent.name,
          role: selectedAgent.role,
          url: selectedAgent.image
        },
        isProfileComplete: true
      });

      toast.success("AGENT READY", { id: toastId });
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error("INITIALIZATION FAILED", { id: toastId });
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      
      {/* Valorant corner brackets */}
      <div className="absolute top-8 left-8 w-24 h-24 border-l-2 border-t-2 border-red-500/30"></div>
      <div className="absolute top-8 right-8 w-24 h-24 border-r-2 border-t-2 border-red-500/30"></div>
      <div className="absolute bottom-8 left-8 w-24 h-24 border-l-2 border-b-2 border-red-500/30"></div>
      <div className="absolute bottom-8 right-8 w-24 h-24 border-r-2 border-b-2 border-red-500/30"></div>

      <div className="max-w-7xl w-full z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <div className="inline-block px-4 py-1 mb-4 border border-red-500/20 bg-red-500/5">
            <span className="text-[10px] text-red-500 font-bold tracking-[0.3em] uppercase">
              AGENT SELECTION
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-3">
            SELECT YOUR AGENT
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
            Choose your tactical operative. Each agent brings unique style to the battlefield.
          </p>
        </motion.div>

        {/* Agent Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mb-8"
        >
          {AGENTS.map((agent) => (
            <motion.div
              key={agent.id}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedAgent(agent)}
              className={`
                relative cursor-pointer group overflow-hidden
                ${selectedAgent?.id === agent.id 
                  ? 'ring-2 ring-red-500 bg-red-500/10' 
                  : 'border border-red-500/20 hover:border-red-500/50 bg-[#1a2332]/50'
                }
                transition-all
              `}
            >
              {/* Selected indicator */}
              {selectedAgent?.id === agent.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 z-10"
                >
                  <CheckCircle className="w-5 h-5 text-red-500 fill-red-500" />
                </motion.div>
              )}

              {/* Agent image */}
              <div className="aspect-square bg-gradient-to-b from-transparent to-black/50 relative overflow-hidden">
                <img
                  src={agent.image}
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 transition-all"></div>
              </div>

              {/* Agent info */}
              <div className="p-3 bg-black/50">
                <h3 className="text-white font-black text-xs md:text-sm uppercase tracking-tight truncate">
                  {agent.name}
                </h3>
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider">
                  {agent.role}
                </p>
              </div>

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-red-500/50"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-red-500/50"></div>
            </motion.div>
          ))}
        </motion.div>

        {/* Selected Agent Display */}
        {selectedAgent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-[#1a2332]/70 backdrop-blur-sm border border-red-500/30 p-6 md:p-8 relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Agent preview */}
              <div className="relative">
                <div className="w-32 h-32 md:w-40 md:h-40 border-2 border-red-500 relative overflow-hidden">
                  <img
                    src={selectedAgent.image}
                    alt={selectedAgent.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Corner brackets */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-red-500"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-red-500"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-red-500"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-red-500"></div>
              </div>

              {/* Agent details */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-block px-3 py-1 mb-2 bg-red-500/10 border border-red-500/30">
                  <span className="text-[10px] text-red-500 font-bold tracking-[0.2em]">
                    {selectedAgent.role}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black uppercase text-white mb-2">
                  {selectedAgent.name}
                </h2>
                <p className="text-gray-400 text-sm">
                  Agent {selectedAgent.name} ready for deployment
                </p>
              </div>
            </div>

            {/* Accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
          </motion.div>
        )}

        {/* Confirm Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleConfirm}
          disabled={!selectedAgent || loading}
          whileHover={selectedAgent && !loading ? { scale: 1.02 } : {}}
          whileTap={selectedAgent && !loading ? { scale: 0.98 } : {}}
          className={`
            group relative w-full md:w-auto md:min-w-[300px] mx-auto block
            ${selectedAgent && !loading
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-red-500/30 cursor-not-allowed'
            }
            text-white font-black py-5 px-12 transition-all uppercase tracking-[0.15em] text-sm overflow-hidden
          `}
        >
          {/* Animated background */}
          {selectedAgent && !loading && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
          
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>DEPLOYING...</>
            ) : (
              <>
                CONFIRM AGENT
                <ArrowRight size={18} />
              </>
            )}
          </span>
        </motion.button>
      </div>
    </div>
  );
};

export default ProfileSetup;