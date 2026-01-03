import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  collection, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, 
  addDoc, query, where, writeBatch
} from 'firebase/firestore';
import { ref as dbRef, onValue, remove, orderByChild, limitToLast, query as rtdbQuery } from 'firebase/database';
import { db, rtdb } from '../firebaseConfig';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Users, Settings, BarChart3, Plus, Edit, Trash2, 
  Search, Download, Upload, Shield, Home, X, Save, ChevronRight,
  User as UserIcon, TrendingUp, ChevronLeft, FileJson, Loader, MessageCircle
} from 'lucide-react';

const Admin = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('subjects');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Navigation state
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user?.uid) {
        navigate('/dashboard');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'players', user.uid));
        const userData = userDoc.data();
        
        if (userData?.isAdmin === true) {
          setIsAdmin(true);
          setIsLoading(false);
        } else {
          toast.error('ACCESS DENIED - ADMIN ONLY');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Admin check error:', error);
        navigate('/dashboard');
      }
    };

    checkAdminRole();
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1923] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
          <p className="text-red-500 text-sm font-bold uppercase tracking-[0.3em]">VERIFYING ACCESS</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const tabs = [
    { id: 'subjects', label: 'SUBJECTS', icon: BookOpen },
    { id: 'users', label: 'USERS', icon: Users },
    { id: 'chat', label: 'CHAT', icon: MessageCircle },
    { id: 'analytics', label: 'ANALYTICS', icon: BarChart3 },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
  ];

  // Breadcrumb navigation
  const renderBreadcrumb = () => {
    const items = [];
    
    if (selectedSubject) {
      items.push(
        <button
          key="subjects"
          onClick={() => { setSelectedSubject(null); setSelectedQuiz(null); }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          Subjects
        </button>
      );
      items.push(<ChevronRight key="sep1" size={16} className="text-gray-600" />);
      items.push(
        <button
          key="subject"
          onClick={() => setSelectedQuiz(null)}
          className={selectedQuiz ? "text-gray-400 hover:text-white transition-colors" : "text-red-500"}
        >
          {selectedSubject.name}
        </button>
      );
    }
    
    if (selectedQuiz) {
      items.push(<ChevronRight key="sep2" size={16} className="text-gray-600" />);
      items.push(<span key="quiz" className="text-red-500">{selectedQuiz.title}</span>);
    }
    
    return items.length > 0 ? (
      <div className="flex items-center gap-2 mb-4 text-sm">
        {items}
      </div>
    ) : null;
  };

  return (
    <div className="min-h-screen bg-[#0f1923] text-white">
      {/* Background */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(239,68,68,0.5) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(239,68,68,0.5) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      {/* Header */}
      <div className="relative z-10 border-b border-red-500/30 bg-[#1a2332]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-red-500">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">ADMIN PANEL</h1>
              <p className="text-red-500 text-xs uppercase tracking-wider font-bold">SYSTEM CONTROL</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 border border-red-500/30 hover:border-red-500 hover:bg-red-500/10 transition-all"
          >
            <Home size={18} />
            <span className="hidden md:inline text-sm uppercase font-bold">Dashboard</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 border-b border-red-500/20 bg-[#1a2332]/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-red-500/30">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedSubject(null);
                  setSelectedQuiz(null);
                }}
                className={`flex items-center gap-2 px-6 py-4 font-bold text-sm uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-500 bg-red-500/10'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6">
        {renderBreadcrumb()}
        
        {activeTab === 'subjects' && !selectedSubject && (
          <SubjectsManager onSelectSubject={setSelectedSubject} />
        )}
        {activeTab === 'subjects' && selectedSubject && !selectedQuiz && (
          <QuizzesManager 
            subject={selectedSubject} 
            onSelectQuiz={setSelectedQuiz}
            onBack={() => setSelectedSubject(null)}
          />
        )}
        {activeTab === 'subjects' && selectedSubject && selectedQuiz && (
          <QuestionsManager 
            subject={selectedSubject}
            quiz={selectedQuiz}
            onBack={() => setSelectedQuiz(null)}
          />
        )}
        {activeTab === 'users' && <UsersManager />}
        {activeTab === 'chat' && <ChatManager />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
};

// SUBJECTS MANAGER (unchanged from before)
const SubjectsManager = ({ onSelectSubject }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const snap = await getDocs(collection(db, 'subjects'));
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subject) => {
    if (!window.confirm(`Delete "${subject.name}"? This will delete all quizzes and questions!`)) return;
    try {
      await deleteDoc(doc(db, 'subjects', subject.id));
      toast.success('Subject deleted');
      loadSubjects();
    } catch (error) {
      toast.error('Failed to delete subject');
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black uppercase">Subject Management</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 font-bold text-sm uppercase transition-all"
        >
          <Plus size={18} />
          Add Subject
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map(subject => (
          <div key={subject.id} className="bg-[#1a2332] border border-red-500/20 p-6 relative group">
            <h3 className="text-xl font-bold mb-2">{subject.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{subject.description || 'No description'}</p>
            
            <div className="flex gap-2">
              <button 
                onClick={() => onSelectSubject(subject)}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-sm uppercase font-bold transition-all"
              >
                <ChevronRight size={14} className="inline mr-1" />
                Quizzes
              </button>
              <button 
                onClick={() => setEditingSubject(subject)}
                className="px-3 py-2 border border-red-500/30 hover:bg-red-500/10 transition-all"
              >
                <Edit size={14} />
              </button>
              <button 
                onClick={() => handleDelete(subject)}
                className="px-3 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-red-500/50"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-red-500/50"></div>
          </div>
        ))}
      </div>

      <SubjectModal 
        isOpen={showCreateModal || editingSubject !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingSubject(null);
        }}
        subject={editingSubject}
        onSave={() => {
          loadSubjects();
          setShowCreateModal(false);
          setEditingSubject(null);
        }}
      />
    </div>
  );
};

// Subject Modal (unchanged)
const SubjectModal = ({ isOpen, onClose, subject, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (subject) {
      setName(subject.name || '');
      setDescription(subject.description || '');
      setIcon(subject.icon || '');
    } else {
      setName('');
      setDescription('');
      setIcon('');
    }
  }, [subject]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const data = { name, description, icon };
      
      if (subject) {
        await updateDoc(doc(db, 'subjects', subject.id), data);
        toast.success('Subject updated');
      } else {
        await addDoc(collection(db, 'subjects'), data);
        toast.success('Subject created');
      }
      
      onSave();
    } catch (error) {
      toast.error('Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a2332] border-2 border-red-500 p-6 w-full max-w-md relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        <h3 className="text-xl font-black uppercase mb-4">
          {subject ? 'EDIT SUBJECT' : 'CREATE SUBJECT'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0f1923] border border-red-500/30 px-4 py-2 text-white focus:border-red-500 outline-none"
              placeholder="Subject name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0f1923] border border-red-500/30 px-4 py-2 text-white focus:border-red-500 outline-none resize-none"
              rows={3}
              placeholder="Subject description"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Icon (emoji)</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full bg-[#0f1923] border border-red-500/30 px-4 py-2 text-white focus:border-red-500 outline-none"
              placeholder="📚"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-red-500 hover:bg-red-600 py-3 font-bold uppercase flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Subject'}
          </button>
        </div>

        <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-red-500"></div>
        <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-red-500"></div>
      </motion.div>
    </div>
  );
};

// QUIZZES MANAGER
const QuizzesManager = ({ subject, onSelectQuiz, onBack }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  useEffect(() => {
    loadQuizzes();
  }, [subject]);

  const loadQuizzes = async () => {
    try {
      // Query from SUBCOLLECTION
      const quizzesRef = collection(db, `subjects/${subject.id}/quizzes`);
      const snap = await getDocs(quizzesRef);
      setQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quiz) => {
    if (!window.confirm(`Delete "${quiz.title}"? This will delete all questions!`)) return;
    try {
      // Delete from SUBCOLLECTION
      await deleteDoc(doc(db, `subjects/${subject.id}/quizzes/${quiz.id}`));
      toast.success('Quiz deleted');
      loadQuizzes();
    } catch (error) {
      toast.error('Failed to delete quiz');
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black uppercase">{subject.name} - Quizzes</h2>
          <p className="text-gray-400 text-sm">{quizzes.length} quiz(zes)</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 font-bold text-sm uppercase transition-all"
        >
          <Plus size={18} />
          Add Quiz
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="bg-[#1a2332] border border-red-500/20 p-6 relative">
            <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
            <div className="text-sm text-gray-400 mb-4">
              <p>Difficulty: {quiz.difficulty || 'Medium'}</p>
              <p>Time: {quiz.timeLimit || 180}s</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => onSelectQuiz(quiz)}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-sm uppercase font-bold transition-all"
              >
                <ChevronRight size={14} className="inline mr-1" />
                Questions
              </button>
              <button 
                onClick={() => setEditingQuiz(quiz)}
                className="px-3 py-2 border border-red-500/30 hover:bg-red-500/10 transition-all"
              >
                <Edit size={14} />
              </button>
              <button 
                onClick={() => handleDelete(quiz)}
                className="px-3 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-red-500/50"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-red-500/50"></div>
          </div>
        ))}
      </div>

      <QuizModal 
        isOpen={showCreateModal || editingQuiz !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingQuiz(null);
        }}
        quiz={editingQuiz}
        subjectId={subject.id}
        onSave={() => {
          loadQuizzes();
          setShowCreateModal(false);
          setEditingQuiz(null);
        }}
      />
    </div>
  );
};

// Quiz Modal
const QuizModal = ({ isOpen, onClose, quiz, subjectId, onSave }) => {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [timeLimit, setTimeLimit] = useState(180);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title || '');
      setDifficulty(quiz.difficulty || 'Medium');
      setTimeLimit(quiz.timeLimit || 180);
    } else {
      setTitle('');
      setDifficulty('Medium');
      setTimeLimit(180);
    }
  }, [quiz]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const data = { title, difficulty, timeLimit: Number(timeLimit) };
      // Remove subjectId from data since it's in the path
      
      if (quiz) {
        // Update in SUBCOLLECTION
        await updateDoc(doc(db, `subjects/${subjectId}/quizzes/${quiz.id}`), data);
        toast.success('Quiz updated');
      } else {
        // Create in SUBCOLLECTION
        await addDoc(collection(db, `subjects/${subjectId}/quizzes`), data);
        toast.success('Quiz created');
      }
      
      onSave();
    } catch (error) {
      toast.error('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a2332] border-2 border-red-500 p-6 w-full max-w-md relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        <h3 className="text-xl font-black uppercase mb-4">
          {quiz ? 'EDIT QUIZ' : 'CREATE QUIZ'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0f1923] border border-red-500/30 px-4 py-2 text-white focus:border-red-500 outline-none"
              placeholder="Quiz title"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-[#0f1923] border border-red-500/30 px-4 py-2 text-white focus:border-red-500 outline-none"
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Time Limit (seconds)</label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              className="w-full bg-[#0f1923] border border-red-500/30 px-4 py-2 text-white focus:border-red-500 outline-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-red-500 hover:bg-red-600 py-3 font-bold uppercase flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>

        <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-red-500"></div>
        <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-red-500"></div>
      </motion.div>
    </div>
  );
};

// QUESTIONS MANAGER (will continue in next message due to length)
const QuestionsManager = ({ subject, quiz, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    loadQuestions();
  }, [quiz]);

  const loadQuestions = async () => {
    try {
      // Query from SUBCOLLECTION
      const questionsRef = collection(db, `subjects/${subject.id}/quizzes/${quiz.id}/questions`);
      const snap = await getDocs(questionsRef);
      setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (question) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      // Delete from SUBCOLLECTION
      await deleteDoc(doc(db, `subjects/${subject.id}/quizzes/${quiz.id}/questions/${question.id}`));
      toast.success('Question deleted');
      loadQuestions();
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black uppercase">{quiz.title} - Questions</h2>
          <p className="text-gray-400 text-sm">{questions.length} question(s)</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 font-bold text-sm uppercase transition-all"
          >
            <Upload size={18} />
            Upload JSON
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 font-bold text-sm uppercase transition-all"
          >
            <Plus size={18} />
            Add Question
          </button>
        </div>
      </div>

      {/* Game-style question cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-[#1a2332] border-2 border-red-500/30 p-6 relative">
            <div className="absolute top-2 right-2 text-red-500 font-bold text-sm">#{index + 1}</div>
            
            <h3 className="text-lg font-bold mb-4 pr-8">{question.question}</h3>
            
            <div className="space-y-2 mb-4">
              {question.options?.map((opt, i) => (
                <div 
                  key={i}
                  className={`px-4 py-2 border ${
                    opt === question.correctAnswer 
                      ? 'border-green-500 bg-green-500/10 text-green-400' 
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  {opt}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setEditingQuestion(question)}
                className="flex-1 py-2 border border-red-500/30 hover:bg-red-500/10 text-sm uppercase font-bold transition-all"
              >
                <Edit size={14} className="inline mr-1" />
                Edit
              </button>
              <button 
                onClick={() => handleDelete(question)}
                className="flex-1 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-sm uppercase font-bold transition-all"
              >
                <Trash2 size={14} className="inline mr-1" />
                Delete
              </button>
            </div>

            <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-red-500/50"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-red-500/50"></div>
          </div>
        ))}
      </div>

      <QuestionModal 
        isOpen={showCreateModal || editingQuestion !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingQuestion(null);
        }}
        question={editingQuestion}
        quizId={quiz.id}
        subjectId={subject.id}
        onSave={() => {
          loadQuestions();
          setShowCreateModal(false);
          setEditingQuestion(null);
        }}
      />

      <UploadQuestionsModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        quizId={quiz.id}
        subjectId={subject.id}
        onUpload={() => {
          loadQuestions();
          setShowUploadModal(false);
        }}
      />
    </div>
  );
};

// Question Modal - UPDATE SIGNATURE TO INCLUDE subjectId
const QuestionModal = ({ isOpen, onClose, question, quizId, subjectId, onSave }) => {
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (question) {
      setQuestionText(question.question || '');
      setOptions(question.options || ['', '', '', '']);
      setCorrectAnswer(question.correctAnswer || '');
    } else {
      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectAnswer('');
    }
  }, [question]);

  const handleSave = async () => {
    if (!questionText.trim()) {
      toast.error('Question is required');
      return;
    }
    if (options.some(opt => !opt.trim())) {
      toast.error('All options are required');
      return;
    }
    if (!correctAnswer) {
      toast.error('Please select correct answer');
      return;
    }

    setSaving(true);
    try {
      const data = { question: questionText, options, correctAnswer };
      // Remove quizId from data since it's in the path
      
      if (question) {
        // Update in SUBCOLLECTION
        await updateDoc(doc(db, `subjects/${subjectId}/quizzes/${quizId}/questions/${question.id}`), data);
        toast.success('Question updated');
      } else {
        // Create in SUBCOLLECTION
        await addDoc(collection(db, `subjects/${subjectId}/quizzes/${quizId}/questions`), data);
        toast.success('Question created');
      }
      
      onSave();
    } catch (error) {
      toast.error('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a2332] border-2 border-red-500 p-6 w-full max-w-2xl relative my-8"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        <h3 className="text-xl font-black uppercase mb-4">
          {question ? 'EDIT QUESTION' : 'CREATE QUESTION'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Question</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full bg-[#0f1923] border border-red-500/30 px-4 py-2 text-white focus:border-red-500 outline-none resize-none"
              rows={3}
              placeholder="Enter your question"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((opt, index) => (
              <div key={index}>
                <label className="block text-sm font-bold uppercase mb-2">Option {index + 1}</label>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = e.target.value;
                    setOptions(newOptions);
                  }}
                  className="w-full bg-[#0f1923] border border-red-500/30 px-4 py-2 text-white focus:border-red-500 outline-none"
                  placeholder={`Option ${index + 1}`}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Correct Answer</label>
            <select
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full bg-[#0f1923] border border-red-500/30 px-4 py-2 text-white focus:border-red-500 outline-none"
            >
              <option value="">Select correct answer...</option>
              {options.filter(opt => opt.trim()).map((opt, index) => (
                <option key={index} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-red-500 hover:bg-red-600 py-3 font-bold uppercase flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Question'}
          </button>
        </div>

        <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-red-500"></div>
        <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-red-500"></div>
      </motion.div>
    </div>
  );
};

// Upload Questions Modal - UPDATE SIGNATURE TO INCLUDE subjectId
const UploadQuestionsModal = ({ isOpen, onClose, quizId, subjectId, onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      toast.error('Please upload a JSON file');
      return;
    }

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      if (!Array.isArray(json)) {
        toast.error('JSON must be an array of questions');
        return;
      }

      // Validate each question
      const errors = [];
      json.forEach((q, index) => {
        if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
          errors.push(`Question ${index + 1}: Missing or empty question text`);
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          errors.push(`Question ${index + 1}: Must have exactly 4 options`);
        }
        if (q.options && q.options.some(opt => !opt || typeof opt !== 'string' || !opt.trim())) {
          errors.push(`Question ${index + 1}: All options must be non-empty strings`);
        }
        if (!q.correctAnswer || typeof q.correctAnswer !== 'string' || !q.correctAnswer.trim()) {
          errors.push(`Question ${index + 1}: Missing or empty correctAnswer`);
        }
        if (q.correctAnswer && q.options && !q.options.includes(q.correctAnswer)) {
          errors.push(`Question ${index + 1}: correctAnswer must be one of the options`);
        }
      });

      if (errors.length > 0) {
        toast.error(`Validation failed:\n${errors.slice(0, 3).join('\n')}`);
        console.error('All validation errors:', errors);
        return;
      }

      setPreview(json);
    } catch (error) {
      toast.error('Invalid JSON file: ' + error.message);
    }
  };

  const handleUpload = async () => {
    if (!preview || preview.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const batch = writeBatch(db);
      const total = preview.length;

      preview.forEach((q, index) => {
        // Double-check data is valid before adding to batch - with null safety
        if (!q.question || !q.options || !q.correctAnswer) {
          console.error(`Skipping invalid question at index ${index}:`, q);
          return;
        }

        // Create in SUBCOLLECTION
        const questionRef = doc(collection(db, `subjects/${subjectId}/quizzes/${quizId}/questions`));
        
        const questionData = {
          question: String(q.question).trim(),
          options: q.options.map(opt => String(opt || '').trim()),
          correctAnswer: String(q.correctAnswer).trim()
          // No quizId needed - it's in the path
        };

        batch.set(questionRef, questionData);
        setProgress(Math.round(((index + 1) / total) * 100));
      });

      await batch.commit();
      toast.success(`${total} questions uploaded successfully!`);
      onUpload();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a2332] border-2 border-red-500 p-6 w-full max-w-2xl relative max-h-[80vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
          <Upload size={24} />
          UPLOAD QUESTIONS (JSON)
        </h3>

        {!preview ? (
          <div>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-red-500/30 hover:border-red-500 p-12 text-center cursor-pointer transition-all"
            >
              <FileJson size={48} className="mx-auto mb-4 text-red-500" />
              <p className="text-gray-400 mb-2">Click to select JSON file</p>
              <p className="text-xs text-gray-500">Format: [{"{"}"question": "...", "options": [...], "correctAnswer": "..."{"}"}]</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div>
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30">
              <p className="text-green-400 font-bold">✓ {preview.length} questions ready to upload</p>
            </div>

            {uploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-[#0f1923] overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto mb-4 space-y-2">
              {preview.slice(0, 5).map((q, index) => (
                <div key={index} className="bg-[#0f1923] p-3 border border-red-500/20 text-sm">
                  <p className="font-bold mb-1">{index + 1}. {q.question}</p>
                  <p className="text-gray-400 text-xs">
                    Options: {q.options?.join(', ')} | Correct: {q.correctAnswer}
                  </p>
                </div>
              ))}
              {preview.length > 5 && (
                <p className="text-gray-400 text-center text-sm">
                  ...and {preview.length - 5} more
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPreview(null)}
                disabled={uploading}
                className="flex-1 py-3 border border-red-500/30 hover:bg-red-500/10 font-bold uppercase disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-red-500 hover:bg-red-600 py-3 font-bold uppercase flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload {preview.length} Questions
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-red-500"></div>
        <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-red-500"></div>
      </motion.div>
    </div>
  );
};

// USER MANAGER, ANALYTICS, SETTINGS (same as before but I'll include for completeness)
const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'players'));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId, currentValue) => {
    try {
      await updateDoc(doc(db, 'players', userId), { isAdmin: !currentValue });
      toast.success('Admin status updated');
      loadUsers();
    } catch (error) {
      toast.error('Failed to update admin status');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone!`)) return;

    try {
      await deleteDoc(doc(db, 'players', userId));
      toast.success('User deleted');
      loadUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black uppercase">User Management</h2>
        <div className="flex items-center gap-2 bg-[#1a2332] border border-red-500/30 px-4 py-2">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="bg-transparent outline-none text-white"
          />
        </div>
      </div>

      <div className="bg-[#1a2332] border border-red-500/20 overflow-hidden">
        <table className="w-full">
          <thead className="bg-red-500/10 border-b border-red-500/30">
            <tr>
              <th className="text-left p-4 font-bold uppercase text-sm">User</th>
              <th className="text-left p-4 font-bold uppercase text-sm">Stats</th>
              <th className="text-left p-4 font-bold uppercase text-sm">Admin</th>
              <th className="text-left p-4 font-bold uppercase text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className="border-b border-red-500/10 hover:bg-red-500/5">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {user.avatar?.url && (
                      <img src={user.avatar.url} alt="" className="w-10 h-10 border border-red-500" />
                    )}
                    <div>
                      <p className="font-bold">{user.displayName || 'No name'}</p>
                      <p className="text-xs text-gray-400">{user.email || 'No email'}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm">
                  <div className="flex gap-4">
                    <span className="text-gray-400">XP: <span className="text-white font-bold">{user.xp || 0}</span></span>
                    <span className="text-gray-400">Wins: <span className="text-white font-bold">{user.wins || 0}</span></span>
                  </div>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                    className={`px-3 py-1 text-xs font-bold uppercase ${
                      user.isAdmin 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {user.isAdmin ? 'ADMIN' : 'USER'}
                  </button>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleDeleteUser(user.id, user.displayName)}
                    className="text-red-500 hover:text-red-400 text-sm font-bold uppercase"
                  >
                    <Trash2 size={16} className="inline" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, admins: 0, totalXP: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'players'));
      const users = usersSnap.docs.map(d => d.data());
      
      setStats({
        totalUsers: users.length,
        admins: users.filter(u => u.isAdmin).length,
        totalXP: users.reduce((sum, u) => sum + (u.xp || 0), 0)
      });
    } catch (error) {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-black uppercase mb-6">Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={UserIcon} label="Total Users" value={stats.totalUsers} color="blue" />
        <StatCard icon={Shield} label="Admins" value={stats.admins} color="red" />
        <StatCard icon={TrendingUp} label="Total XP" value={stats.totalXP.toLocaleString()} color="green" />
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-500',
    red: 'border-red-500/30 bg-red-500/10 text-red-500',
    green: 'border-green-500/30 bg-green-500/10 text-green-500',
  };

  return (
    <div className={`border-2 ${colors[color]} p-6 relative`}>
      <Icon size={32} className="mb-2" />
      <p className="text-3xl font-black">{value}</p>
      <p className="text-sm uppercase font-bold text-gray-400">{label}</p>
      
      <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-current opacity-30"></div>
      <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-current opacity-30"></div>
    </div>
  );
};

const SettingsPanel = () => {
  return (
    <div>
      <h2 className="text-2xl font-black uppercase mb-6">Settings</h2>
      <div className="bg-[#1a2332] border border-red-500/20 p-6">
        <p className="text-gray-400">System settings will be added here.</p>
      </div>
    </div>
  );
};

// CHAT MANAGER
const ChatManager = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to last 50 messages
    const messagesRef = dbRef(rtdb, 'globalChat');
    const q = rtdbQuery(messagesRef, limitToLast(50));

    const unsubscribe = onValue(q, (snapshot) => {
      const data = [];
      snapshot.forEach((child) => {
        data.push({ id: child.key, ...child.val() });
      });
      // Reverse to show newest first for admin convenience
      setMessages(data.reverse());
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await remove(dbRef(rtdb, `globalChat/${msgId}`));
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('WARNING: THIS WILL DELETE ALL MESSAGES. Are you sure?')) return;
    try {
      await remove(dbRef(rtdb, 'globalChat'));
      toast.success('Chat cleared');
    } catch (error) {
      toast.error('Failed to clear chat');
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading messages...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black uppercase">Global Chat</h2>
          <p className="text-gray-400 text-sm">Moderation Console ({messages.length} messages)</p>
        </div>
        <button 
          onClick={handleClearChat}
          className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold text-sm uppercase transition-all"
        >
          <Trash2 size={18} />
          Clear All
        </button>
      </div>

      <div className="bg-[#1a2332] border border-red-500/20 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0f1923] border-b border-red-500/20">
              <tr>
                <th className="p-4 font-bold text-gray-400 text-sm uppercase">Time</th>
                <th className="p-4 font-bold text-gray-400 text-sm uppercase">User</th>
                <th className="p-4 font-bold text-gray-400 text-sm uppercase">Message</th>
                <th className="p-4 font-bold text-gray-400 text-sm uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-500/10">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 uppercase tracking-widest">
                    No messages found
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-gray-400 text-sm whitespace-nowrap">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-4 font-bold text-red-400 uppercase text-sm">
                      {msg.sender}
                    </td>
                    <td className="p-4 text-white text-sm max-w-md truncate">
                      {msg.text}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(msg.id)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete Message"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;