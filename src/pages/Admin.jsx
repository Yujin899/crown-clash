import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, writeBatch, doc, query, where, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import { Loader2, Upload, FileJson, CheckCircle, Save, X, Edit, Trash2, LayoutGrid, FileText } from 'lucide-react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('subject');
  const [loading, setLoading] = useState(false);
  
  // Upload Progress State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Lists Data
  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);

  // Edit State
  const [editingId, setEditingId] = useState(null);

  // Form States
  const [subjectName, setSubjectName] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [selectedSubjectForQuiz, setSelectedSubjectForQuiz] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [answers, setAnswers] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);

  const cardsContainerRef = useRef(null);

  useEffect(() => { fetchSubjects(); }, []);

  // GSAP Animation for Cards
  useEffect(() => {
    if (questions.length > 0 && cardsContainerRef.current) {
        gsap.fromTo(cardsContainerRef.current.children, 
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: "power2.out" }
        );
    }
  }, [questions]);

  // --- Fetching Functions ---
  const fetchSubjects = async () => {
    const snapshot = await getDocs(collection(db, "subjects"));
    setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchQuizzes = async (subjectId) => {
    if (!subjectId) { setQuizzes([]); return; }
    const q = query(collection(db, "quizzes"), where("subjectId", "==", subjectId));
    const snapshot = await getDocs(q);
    setQuizzes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchQuestions = async (quizId) => {
    if (!quizId) { setQuestions([]); return; }
    const q = query(collection(db, "questions"), where("quizId", "==", quizId));
    const snapshot = await getDocs(q);
    setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // --- Reset Forms ---
  const resetForms = () => {
      setEditingId(null);
      setSubjectName('');
      setQuizTitle('');
      setQuestionText('');
      setAnswers(['', '', '', '']);
      setCorrectIndex(0);
  };

  // --- 1. JSON Upload Logic (With Progress Bar) ---
  const handleJsonUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedQuiz) return toast.error("Select Quiz & JSON File");

    const reader = new FileReader();
    reader.onload = async (event) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        const jsonData = JSON.parse(event.target.result);
        if (!Array.isArray(jsonData)) throw new Error("JSON must be an array");

        const totalItems = jsonData.length;
        const chunkSize = 50; // نقسم الملف لمجموعات صغيرة عشان العداد يبان
        let processed = 0;

        // تقسيم البيانات لـ Chunks
        for (let i = 0; i < totalItems; i += chunkSize) {
            const chunk = jsonData.slice(i, i + chunkSize);
            const batch = writeBatch(db);

            chunk.forEach((q) => {
                const docRef = doc(collection(db, "questions"));
                batch.set(docRef, {
                    quizId: selectedQuiz,
                    subjectId: selectedSubject,
                    text: q.question,
                    options: q.options,
                    correctAnswer: q.answer,
                    type: 'mcq'
                });
            });

            await batch.commit();
            
            // تحديث النسبة المئوية
            processed += chunk.length;
            const percentage = Math.round((processed / totalItems) * 100);
            setUploadProgress(percentage);
            
            // تأخير بسيط عشان العين تلحق تشوف الانميشن (اختياري)
            await new Promise(r => setTimeout(r, 100));
        }

        toast.success(`Complete! Uploaded ${totalItems} cards.`);
        fetchQuestions(selectedQuiz);
      } catch (err) {
        console.error(err);
        toast.error("Invalid JSON Format");
      }
      
      // Reset after delay
      setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          e.target.value = null; // Clear input
      }, 1000);
    };
    reader.readAsText(file);
  };

  // --- 2. Save Logic ---
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!subjectName) return toast.error("Name required");
    setLoading(true);
    try {
        if (editingId) {
            await updateDoc(doc(db, "subjects", editingId), { name: subjectName });
            toast.success("Subject Updated");
        } else {
            await addDoc(collection(db, "subjects"), { name: subjectName, createdAt: new Date(), quizCount: 0 });
            toast.success("Subject Created");
        }
        resetForms();
        fetchSubjects();
    } catch (err) { toast.error("Failed"); }
    setLoading(false);
  };

  const handleSaveQuiz = async (e) => {
      e.preventDefault();
      if (!quizTitle || !selectedSubjectForQuiz) return toast.error("Fields required");
      setLoading(true);
      try {
          if (editingId) {
              await updateDoc(doc(db, "quizzes", editingId), { title: quizTitle, subjectId: selectedSubjectForQuiz });
              toast.success("Quiz Updated");
          } else {
              await addDoc(collection(db, "quizzes"), { title: quizTitle, subjectId: selectedSubjectForQuiz, createdAt: new Date() });
              // تحديث عدد الكويزات في المادة
              await updateDoc(doc(db, "subjects", selectedSubjectForQuiz), { quizCount: increment(1) });
              toast.success("Quiz Created");
          }
          resetForms();
          if (selectedSubjectForQuiz) fetchQuizzes(selectedSubjectForQuiz);
      } catch (err) { toast.error("Failed"); }
      setLoading(false);
  };

  const handleSaveQuestion = async (e) => {
      e.preventDefault();
      if (!selectedQuiz || !questionText) return toast.error("Fields required");
      setLoading(true);
      try {
          const qData = {
            quizId: selectedQuiz,
            subjectId: selectedSubject,
            text: questionText,
            options: answers,
            correctAnswer: answers[correctIndex],
            type: 'mcq',
          };

          if (editingId) {
              await updateDoc(doc(db, "questions", editingId), qData);
              toast.success("Card Updated");
          } else {
              await addDoc(collection(db, "questions"), qData);
              toast.success("Card Added");
          }
          
          setQuestionText('');
          setAnswers(['', '', '', '']);
          setEditingId(null);
          fetchQuestions(selectedQuiz);
      } catch (err) { toast.error("Failed"); }
      setLoading(false);
  };

  // --- Delete & Edit Handlers ---
  const handleDeleteSubject = async (id) => {
      if(!window.confirm("Delete subject?")) return;
      await deleteDoc(doc(db, "subjects", id));
      toast.success("Deleted");
      fetchSubjects();
  };
  const handleEditSubject = (sub) => {
      setEditingId(sub.id); setSubjectName(sub.name); setActiveTab('subject'); window.scrollTo(0,0);
  };

  const handleEditQuestion = (q) => {
      setEditingId(q.id); setQuestionText(q.text); setAnswers(q.options);
      const idx = q.options.findIndex(opt => opt === q.correctAnswer);
      setCorrectIndex(idx !== -1 ? idx : 0);
      window.scrollTo(0,0);
  };
  const handleDeleteQuestion = async (id) => {
      if(!window.confirm("Delete card?")) return;
      await deleteDoc(doc(db, "questions", id));
      toast.success("Deleted");
      fetchQuestions(selectedQuiz);
  };

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-6xl mx-auto">
      <h1 className="text-4xl font-black italic uppercase mb-8">Admin <span className="text-indigo-500">Control</span></h1>

      <div className="flex flex-wrap gap-4 mb-8">
        {[
            {id: 'subject', label: 'Subjects', icon: <LayoutGrid size={16}/>}, 
            {id: 'quiz', label: 'Quizzes', icon: <FileText size={16}/>}, 
            {id: 'question', label: 'Cards', icon: <CheckCircle size={16}/>}
        ].map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); resetForms(); }} className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 border border-white/5'}`}>
                {tab.icon} {tab.label}
            </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-1 bg-[#0b0f1a] border border-white/10 p-6 rounded-3xl h-fit sticky top-6">
             <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                 {editingId ? <Edit size={16}/> : <Save size={16}/>} {editingId ? `EDIT ${activeTab}` : `NEW ${activeTab}`}
             </h3>
             
             {/* --- SUBJECT FORM --- */}
             {activeTab === 'subject' && (
                 <form onSubmit={handleSaveSubject} className="space-y-4">
                     <input value={subjectName} onChange={e => setSubjectName(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-indigo-500" placeholder="Subject Name" />
                     <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-white text-xs tracking-widest uppercase">{editingId ? "Update" : "Create"}</button>
                 </form>
             )}

             {/* --- QUIZ FORM --- */}
             {activeTab === 'quiz' && (
                 <form onSubmit={handleSaveQuiz} className="space-y-4">
                     <select value={selectedSubjectForQuiz} onChange={e => setSelectedSubjectForQuiz(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none">
                         <option value="">-- Select Subject --</option>
                         {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                     </select>
                     <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none" placeholder="Quiz Title" />
                     <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-white text-xs tracking-widest uppercase">{editingId ? "Update" : "Create"}</button>
                 </form>
             )}

             {/* --- QUESTION FORM & JSON UPLOAD --- */}
             {activeTab === 'question' && (
                 <div className="space-y-6">
                     <form onSubmit={handleSaveQuestion} className="space-y-4">
                         <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); fetchQuizzes(e.target.value); }} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs">
                             <option value="">1. Select Subject</option>
                             {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                         <select value={selectedQuiz} onChange={e => { setSelectedQuiz(e.target.value); fetchQuestions(e.target.value); }} disabled={!selectedSubject} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white text-xs">
                             <option value="">2. Select Quiz</option>
                             {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                         </select>
                         
                         <div className="h-px bg-white/10"></div>

                         <textarea rows={3} value={questionText} onChange={e => setQuestionText(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white text-sm outline-none" placeholder="Question Text..." />
                         
                         <div className="grid grid-cols-2 gap-2">
                             {answers.map((ans, idx) => (
                                 <div key={idx} className="relative">
                                     <input value={ans} onChange={e => { const n = [...answers]; n[idx] = e.target.value; setAnswers(n); }} className={`w-full bg-black/40 border p-2 rounded-lg text-white text-xs outline-none ${correctIndex === idx ? 'border-green-500' : 'border-white/10'}`} placeholder={`Opt ${idx+1}`} />
                                     <div onClick={() => setCorrectIndex(idx)} className={`w-3 h-3 rounded-full absolute top-2 right-2 cursor-pointer ${correctIndex === idx ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                                 </div>
                             ))}
                         </div>

                         <div className="flex gap-2">
                            <button disabled={loading || !selectedQuiz} className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-white text-xs tracking-widest uppercase">
                                {editingId ? "Save" : "Add Card"}
                            </button>
                            {editingId && <button type="button" onClick={resetForms} className="bg-gray-700 px-4 rounded-xl text-xs"><X size={14}/></button>}
                         </div>
                     </form>

                     {/* --- JSON UPLOAD SECTION (The New Loader) --- */}
                     {!editingId && (
                         <div className="pt-6 border-t border-white/10">
                            <div className="bg-indigo-900/10 p-4 rounded-xl border border-dashed border-indigo-500/30 text-center relative overflow-hidden">
                                {isUploading ? (
                                    <div className="py-4">
                                        <div className="flex items-center justify-center gap-2 mb-2 text-indigo-400 font-bold animate-pulse">
                                            <Loader2 size={20} className="animate-spin" />
                                            UPLOADING DATA...
                                        </div>
                                        
                                        {/* Progress Bar Container */}
                                        <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/10">
                                            {/* Actual Bar */}
                                            <div 
                                                className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-300 ease-out"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                        
                                        <p className="text-xs text-right mt-1 text-gray-400 font-mono">{uploadProgress}% COMPLETE</p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs text-indigo-300 mb-2 uppercase tracking-widest flex items-center justify-center gap-2"><Upload size={14}/> Bulk Upload (JSON)</p>
                                        <input 
                                            type="file" 
                                            accept=".json"
                                            onChange={handleJsonUpload}
                                            disabled={!selectedQuiz}
                                            className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 disabled:opacity-50"
                                        />
                                        <div className="text-[9px] text-gray-500 mt-2 font-mono bg-black/20 p-2 rounded break-all flex items-center gap-2 justify-center">
                                            <FileJson size={12}/> {`[{"question":"...","options":["A","B"],"answer":"A"}]`}
                                        </div>
                                    </>
                                )}
                            </div>
                         </div>
                     )}
                 </div>
             )}
          </div>

          {/* Right Column: Display Lists */}
          <div className="lg:col-span-2 space-y-4">
              
              {/* SUBJECTS LIST */}
              {activeTab === 'subject' && (
                  <div className="space-y-2">
                      {subjects.map(sub => (
                          <div key={sub.id} className="bg-white/5 p-4 rounded-xl flex justify-between items-center hover:bg-white/10">
                              <span className="font-bold">{sub.name}</span>
                              <div className="flex gap-2">
                                  <button onClick={() => handleEditSubject(sub)} className="text-blue-400 hover:bg-blue-400/20 p-2 rounded"><Edit size={16}/></button>
                                  <button onClick={() => handleDeleteSubject(sub.id)} className="text-red-400 hover:bg-red-400/20 p-2 rounded"><Trash2 size={16}/></button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              {/* QUIZZES LIST */}
              {activeTab === 'quiz' && (
                  <div className="space-y-2">
                      <p className="text-xs text-gray-500 mb-2">Select a subject in the form to manage quizzes better.</p>
                      {quizzes.length > 0 ? quizzes.map(quiz => (
                          <div key={quiz.id} className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                              <div><span className="font-bold block">{quiz.title}</span><span className="text-[10px] text-gray-500">ID: {quiz.id}</span></div>
                              <div className="flex gap-2">
                                  <button onClick={() => { setEditingId(quiz.id); setQuizTitle(quiz.title); setSelectedSubjectForQuiz(quiz.subjectId); window.scrollTo(0,0); }} className="text-blue-400 hover:bg-blue-400/20 p-2 rounded"><Edit size={16}/></button>
                              </div>
                          </div>
                      )) : <p className="text-gray-500 italic">No quizzes loaded.</p>}
                  </div>
              )}

              {/* QUESTIONS GRID */}
              {activeTab === 'question' && (
                  <div ref={cardsContainerRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {questions.length > 0 ? questions.map((q) => (
                          <div key={q.id} className="bg-[#0b0f1a] border border-white/5 p-5 rounded-2xl relative group hover:border-indigo-500/30 transition-all">
                              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEditQuestion(q)} className="bg-blue-500/20 text-blue-400 p-1.5 rounded hover:bg-blue-500/40 transition-colors"><Edit size={14}/></button>
                                  <button onClick={() => handleDeleteQuestion(q.id)} className="bg-red-500/20 text-red-400 p-1.5 rounded hover:bg-red-500/40 transition-colors"><Trash2 size={14}/></button>
                              </div>
                              <h4 className="font-bold text-sm mb-3 pr-16">{q.text}</h4>
                              <div className="space-y-1">
                                  {q.options.map((opt, idx) => (
                                      <div key={idx} className={`text-xs p-2 rounded border ${opt === q.correctAnswer ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'border-transparent text-gray-500'}`}>
                                          {opt}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )) : (
                          <div className="col-span-full text-center py-10 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                              {selectedQuiz ? "No cards in this deck." : "Select Subject & Quiz to view."}
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default Admin;