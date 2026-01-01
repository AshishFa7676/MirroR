
import React, { useState, useEffect, useRef } from 'react';
import { LogType, ReflectionResponse } from '../types';
import { StorageService } from '../services/storageService';
import { Brain, Save, X, Edit2, SkipForward, ArrowRight, CornerDownLeft, AlertCircle, Check } from 'lucide-react';

interface ReflectionSessionProps {
  onAddLog: (type: LogType, content: string, metadata?: any) => void;
  onSaveJournal: (content: string) => void;
}

const REFLECTION_PROMPTS = [
  { id: 1, category: "Metacognition", question: "What thinking patterns led you to avoid your most important task today?" },
  { id: 2, category: "Self-Awareness", question: "What 'productive' activities did you use to escape real work? (news, research, planning)" },
  { id: 3, category: "Self-Awareness", question: "When did you feel most focused today? What were you doing differently?" },
  { id: 4, category: "Metacognition", question: "What task created the most resistance? Why do you think that is?" },
  { id: 5, category: "Metacognition", question: "What excuses did your mind generate today? Were any of them truly valid?" },
  { id: 6, category: "Goal Setting", question: "How did today's actions move you closer to (or further from) your goal?" },
  { id: 7, category: "Growth", question: "If you could redo today, what one thing would you change?" },
  { id: 8, category: "Self-Awareness", question: "What emotions came up when you faced a difficult task? How did you respond?" }
];

export const ReflectionSession: React.FC<ReflectionSessionProps> = ({ onAddLog, onSaveJournal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [responses, setResponses] = useState<ReflectionResponse[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [mode, setMode] = useState<'PROMPT' | 'REVIEW'>('PROMPT');
  
  // LOCK THE SESSION DATE ON MOUNT to prevent "Midnight Split" bugs
  const [sessionDate] = useState(() => new Date().toDateString());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load persistent session data
  useEffect(() => {
    const loadSession = async () => {
      const allReflections = await StorageService.getAll('reflections');
      // Filter strictly by the locked session date
      const sessionResponses = allReflections.filter((r: ReflectionResponse) => r.dateString === sessionDate);
      
      // Sort by prompt ID to ensure integrity
      sessionResponses.sort((a, b) => a.promptId - b.promptId);
      setResponses(sessionResponses);

      // Intelligent Resume Logic
      const answeredIds = sessionResponses.map(r => r.promptId);
      
      // If we have an answer for the first prompt, maybe we should auto-fill the current input with it?
      // No, let's find the first UNANSWERED prompt.
      const firstUnanswered = REFLECTION_PROMPTS.findIndex(p => !answeredIds.includes(p.id));
      
      if (firstUnanswered !== -1) {
        setCurrentPromptIndex(firstUnanswered);
      } else if (sessionResponses.length === REFLECTION_PROMPTS.length) {
        setMode('REVIEW');
      }
    };
    if (isOpen) {
      loadSession();
    }
  }, [isOpen, sessionDate]);

  // When switching prompts, rehydrate the input if an answer exists
  useEffect(() => {
    if (mode === 'PROMPT') {
      const existing = responses.find(r => r.promptId === REFLECTION_PROMPTS[currentPromptIndex].id);
      if (existing && existing.response !== 'SKIPPED') {
        setCurrentInput(existing.response);
      } else {
        setCurrentInput('');
      }
      // Auto-focus logic
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentPromptIndex, mode, responses]);

  const handleSaveResponse = async (skip = false) => {
    const prompt = REFLECTION_PROMPTS[currentPromptIndex];
    const answer = skip ? "SKIPPED" : currentInput.trim();
    
    // Don't save empty strings unless skipping
    if (!answer && !skip) return;

    const newResponse: ReflectionResponse = {
      id: `${sessionDate}-${prompt.id}`, // Guaranteed unique per day
      promptId: prompt.id,
      question: prompt.question,
      category: prompt.category,
      response: answer,
      timestamp: Date.now(),
      dateString: sessionDate
    };

    // Optimistic Update
    const updatedResponses = [
      ...responses.filter(r => r.promptId !== prompt.id), 
      newResponse
    ].sort((a, b) => a.promptId - b.promptId);
    
    setResponses(updatedResponses);
    await StorageService.saveItem('reflections', newResponse);
    
    onAddLog(LogType.REFLECTION_SUBMITTED, `Prompt ${prompt.id} ${skip ? 'skipped' : 'answered'}`, {
      prompt_id: prompt.id,
      length: answer.length,
      skipped: skip
    });

    // Navigation Logic
    // 1. Is there a next prompt?
    if (currentPromptIndex < REFLECTION_PROMPTS.length - 1) {
       setCurrentPromptIndex(prev => prev + 1);
    } else {
       // 2. Are we done?
       const allAnswered = REFLECTION_PROMPTS.every(p => 
         updatedResponses.some(r => r.promptId === p.id)
       );
       if (allAnswered) {
         setMode('REVIEW');
       } else {
         // 3. Find first hole
         const hole = REFLECTION_PROMPTS.findIndex(p => !updatedResponses.some(r => r.promptId === p.id));
         if (hole !== -1) setCurrentPromptIndex(hole);
       }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveResponse(false);
    }
  };

  const handleFinalSubmit = () => {
    const journalContent = responses.map(a => 
      `**${a.category.toUpperCase()}**\n*${a.question}*\n${a.response}`
    ).join('\n\n---\n\n');

    const fullEntry = `# Daily Reflection Session\n📅 ${sessionDate}\n\n${journalContent}`;
    
    onSaveJournal(fullEntry);
    onAddLog(LogType.REFLECTION_SESSION_COMPLETED, "Daily Reflection Completed", {
      date: sessionDate,
      total_words: responses.reduce((acc, r) => acc + r.response.length, 0)
    });
    
    setIsOpen(false);
  };

  // --- RENDER ---

  const completedCount = responses.filter(r => r.response !== 'SKIPPED').length;
  const skippedCount = responses.filter(r => r.response === 'SKIPPED').length;
  const progressPercent = ((completedCount + skippedCount) / REFLECTION_PROMPTS.length) * 100;

  if (!isOpen) {
    return (
      <div 
        onClick={() => setIsOpen(true)}
        className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all group h-full flex flex-col justify-between shadow-card"
      >
        <div className="absolute top-0 right-0 p-10 bg-purple-500/5 blur-[50px] rounded-full pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-4">
             <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
               <Brain size={16} className="text-purple-500 group-hover:text-white" />
             </div>
             <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Metacognition</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Daily Reflection</h3>
          <p className="text-gray-500 text-xs font-mono">
            {completedCount === REFLECTION_PROMPTS.length 
              ? "SESSION COMPLETE // READY TO ARCHIVE" 
              : `PROGRESS: ${Math.round(progressPercent)}%`}
          </p>
        </div>
        <div className="flex gap-1.5 mt-4">
          {REFLECTION_PROMPTS.map(p => {
             const resp = responses.find(r => r.promptId === p.id);
             let color = 'bg-gray-800';
             if (resp) color = resp.response === 'SKIPPED' ? 'bg-yellow-600' : 'bg-purple-500';
             
             return (
               <div key={p.id} className={`h-1.5 flex-1 rounded-full transition-colors ${color}`} />
             );
          })}
        </div>
      </div>
    );
  }

  // ACTIVE MODAL
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-surface border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 text-gray-600 hover:text-white transition-colors"><X size={20}/></button>
        
        {/* Header / Nav Dots */}
        <div className="mb-8">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2 text-purple-500 font-bold uppercase text-xs tracking-widest">
                <Brain size={16} /> Neural Audit // {sessionDate}
             </div>
             <div className="text-[10px] font-mono text-gray-500 uppercase">
               {mode === 'REVIEW' ? 'FINAL REVIEW' : `PROMPT ${currentPromptIndex + 1}/${REFLECTION_PROMPTS.length}`}
             </div>
           </div>

           <div className="flex justify-between items-center gap-2">
              {REFLECTION_PROMPTS.map((p, idx) => {
                 const resp = responses.find(r => r.promptId === p.id);
                 const isCurrent = currentPromptIndex === idx && mode === 'PROMPT';
                 
                 let bgClass = 'bg-gray-800 hover:bg-gray-700';
                 if (resp) {
                   bgClass = resp.response === 'SKIPPED' ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-purple-600 hover:bg-purple-500';
                 }
                 if (isCurrent) bgClass = 'bg-white shadow-[0_0_10px_white] scale-110';

                 return (
                    <button 
                      key={p.id} 
                      onClick={() => {
                        setCurrentPromptIndex(idx);
                        setMode('PROMPT');
                      }}
                      className={`h-2 flex-1 rounded-full transition-all duration-300 ${bgClass}`}
                      title={p.category}
                    />
                 );
              })}
           </div>
        </div>

        {/* PROMPT MODE */}
        {mode === 'PROMPT' && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
             <span className="text-purple-400 font-mono text-[10px] mb-2 px-2 py-1 bg-purple-500/10 rounded w-fit uppercase font-bold tracking-wider">
               {REFLECTION_PROMPTS[currentPromptIndex].category}
             </span>
             <h2 className="text-xl md:text-2xl font-bold text-white mb-6 leading-tight">
               {REFLECTION_PROMPTS[currentPromptIndex].question}
             </h2>
             
             <div className="relative flex-1 mb-6">
                <textarea 
                  ref={inputRef}
                  value={currentInput}
                  onChange={e => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Expose the logic..."
                  className="w-full h-full bg-black/40 border border-gray-800 p-5 text-white text-base md:text-lg rounded-xl focus:border-purple-500 focus:bg-black/60 outline-none resize-none font-mono leading-relaxed"
                />
                <div className="absolute bottom-4 right-4 text-[10px] text-gray-600 font-mono flex items-center gap-1 pointer-events-none">
                  <CornerDownLeft size={10} /> CMD+ENTER
                </div>
             </div>

             <div className="flex justify-between items-center">
                <button 
                  onClick={() => handleSaveResponse(true)}
                  className="text-gray-500 hover:text-yellow-500 text-xs font-bold uppercase flex items-center gap-2 px-3 py-2 rounded hover:bg-yellow-500/10 transition-colors"
                >
                  <SkipForward size={14} /> Skip
                </button>
                
                <button 
                  disabled={!currentInput.trim()}
                  onClick={() => handleSaveResponse(false)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold uppercase text-xs tracking-wider flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow"
                >
                  {currentPromptIndex === REFLECTION_PROMPTS.length - 1 ? 'Review' : 'Next'} <ArrowRight size={16} />
                </button>
             </div>
          </div>
        )}

        {/* REVIEW MODE */}
        {mode === 'REVIEW' && (
           <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Check className="text-purple-500" /> Session Summary
              </h2>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6 scrollbar-hide">
                 {responses.length === 0 && <p className="text-gray-500 text-center py-10">Silence is an answer too.</p>}
                 
                 {responses.map(r => (
                    <div 
                      key={r.id} 
                      onClick={() => {
                        const idx = REFLECTION_PROMPTS.findIndex(p => p.id === r.promptId);
                        if (idx !== -1) {
                          setCurrentPromptIndex(idx);
                          setMode('PROMPT');
                        }
                      }}
                      className="bg-black/40 border border-gray-800 p-4 rounded-xl group hover:border-purple-500/50 cursor-pointer transition-colors relative"
                    >
                       <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${r.response === 'SKIPPED' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-purple-500/10 text-purple-400'} uppercase`}>
                            {r.category}
                          </span>
                          <Edit2 size={12} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                       <p className="text-gray-400 text-xs font-bold mb-1 line-clamp-1">{r.question}</p>
                       <p className={`font-mono text-sm whitespace-pre-wrap ${r.response === 'SKIPPED' ? 'text-yellow-600 italic' : 'text-white'}`}>
                         {r.response}
                       </p>
                    </div>
                 ))}
                 
                 {responses.length < REFLECTION_PROMPTS.length && (
                   <div className="p-4 border border-dashed border-gray-800 rounded-xl text-center">
                     <p className="text-gray-500 text-xs mb-2">Incomplete Session</p>
                     <button onClick={() => {
                        const firstMissing = REFLECTION_PROMPTS.findIndex(p => !responses.some(r => r.promptId === p.id));
                        if(firstMissing !== -1) { setCurrentPromptIndex(firstMissing); setMode('PROMPT'); }
                     }} className="text-purple-400 text-xs font-bold uppercase hover:underline">Continue</button>
                   </div>
                 )}
              </div>
              <button 
                onClick={handleFinalSubmit}
                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <Save size={18} /> Commit to Archive
              </button>
           </div>
        )}
      </div>
    </div>
  );
};
