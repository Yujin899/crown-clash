import { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, push, onValue, serverTimestamp } from 'firebase/database';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

const ChatSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  
  const { user } = useSelector((state) => state.auth);
  const rtdb = getDatabase(); 
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // تحميل الرسايل فقط لو الشات مفتوح (توفير للداتا)
    if (!isOpen) return;

    const chatRef = ref(rtdb, 'community_chat');
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      const loadedMessages = [];
      for (const key in data) {
        loadedMessages.push({ id: key, ...data[key] });
      }
      setMessages(loadedMessages.slice(-50));
    });

    return () => unsubscribe();
  }, [isOpen, rtdb]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const chatRef = ref(rtdb, 'community_chat');
    push(chatRef, {
      text: message,
      sender: user.displayName || "Unknown",
      senderId: user.uid,
      timestamp: serverTimestamp(),
      avatarIcon: user.photoURL || "👤" 
    });

    setMessage('');
  };

  return (
    <>
      {/* التعديل هنا: الزرار بيظهر فقط لو القائمة مقفولة 
        استخدمنا AnimatePresence عشان يختفي بنعومة
      */}
      <AnimatePresence>
        {!isOpen && (
            <motion.button 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-lg shadow-indigo-600/30 transition-transform hover:scale-110"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 w-80 md:w-96 bg-[#0b0f1a]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-40 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-indigo-900/20">
              <h3 className="font-bold text-white tracking-widest text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                COMMUNITY CHANNEL
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white text-xl font-bold">✕</button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => {
                const isMe = msg.senderId === user.uid;
                return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] border border-white/20">
                                {msg.avatarIcon || "👤"}
                            </div>
                            <div className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] break-words ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                                <span className="block text-[9px] opacity-50 font-bold mb-1 tracking-wider uppercase">{msg.sender}</span>
                                {msg.text}
                            </div>
                        </div>
                    </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/20">
                <div className="flex gap-2">
                    <input 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Broadcast message..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl">➤</button>
                </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatSidebar;