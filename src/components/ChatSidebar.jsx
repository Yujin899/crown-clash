import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { useSelector } from 'react-redux';
import { ref as dbRef, push, onValue, query, limitToLast } from 'firebase/database';
import { rtdb } from '../firebaseConfig';

const ChatSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isOpen) return;

    const messagesRef = dbRef(rtdb, 'globalChat');
    const messagesQuery = query(messagesRef, limitToLast(30));

    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const loadedMessages = [];
      snapshot.forEach((child) => {
        loadedMessages.push({ id: child.key, ...child.val() });
      });
      setMessages(loadedMessages);
    });

    return () => unsubscribe();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !user) return;

    push(dbRef(rtdb, 'globalChat'), {
      text: message,
      sender: user.displayName || user.email,
      uid: user.uid,
      timestamp: Date.now(),
    });

    setMessage('');
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-red-500 hover:bg-red-600 border-2 border-red-400 shadow-xl transition-all group"
      >
        <MessageCircle size={24} className="text-white" />
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>

      {/* Chat Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[#1a2332] border-l-2 border-red-500/30 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#0f1923] border-b-2 border-red-500/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle size={20} className="text-red-500" />
                <h3 className="text-white font-black uppercase tracking-wider text-sm">GLOBAL CHAT</h3>
              </div>
              <motion.button
                whileHover={{ rotate: 90 }}
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
              >
                <X size={20} className="text-red-500" />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0f1923]/50">
              {messages.map((msg) => {
                const isMyMessage = msg.uid === user?.uid;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] ${
                        isMyMessage
                          ? 'bg-red-500 text-white'
                          : 'bg-[#1a2332] text-white border border-red-500/20'
                      } px-4 py-2 relative`}
                    >
                      {!isMyMessage && (
                        <p className="text-red-500 text-[10px] font-bold uppercase mb-1">
                          {msg.sender}
                        </p>
                      )}
                      <p className="text-sm break-words">{msg.text}</p>
                      
                      {/* Corner accents */}
                      <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${isMyMessage ? 'border-red-400' : 'border-red-500/50'}`}></div>
                      <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${isMyMessage ? 'border-red-400' : 'border-red-500/50'}`}></div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-[#0f1923] border-t-2 border-red-500/30 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="TYPE MESSAGE..."
                  className="flex-1 bg-[#1a2332] border border-red-500/30 focus:border-red-500 px-4 py-3 text-white text-sm outline-none transition-all placeholder:text-gray-600 uppercase font-semibold"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/30 text-white px-4 py-3 transition-all"
                >
                  <Send size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(ChatSidebar);