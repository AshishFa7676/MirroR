
import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { LogType, UserProfile, JournalEntry, JournalMetadata } from '../types';
import { Brain, Save, Loader, History, Terminal, Sun, Cloud, Moon, Star, Trash2, Zap } from 'lucide-react';

interface JournalProps {
  journals: JournalEntry[];
  setJournals: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  profile: UserProfile;
  onAddLog: (type: LogType, content: string, metadata?: any) => void;
}

export const Journal: React.FC<JournalProps> = ({ journals, setJournals, profile, onAddLog }) => {
  // Load draft from localStorage on mount
  const [entry, setEntry] = useState(() => localStorage.getItem('journal_draft') || '');
  const [showHistory, setShowHistory] = useState(false);
  
  // Track specific analysis loading states by entry ID
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  
  // Live Stats
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stats, setStats] = useState({ words: 0, chars: 0, wpm: 0, pauses: 0, keystrokes: 0 });
  const lastKeyTime = useRef<number>(0);

  // Persistence for Drafts
  useEffect(() => {
    localStorage.setItem('journal_draft', entry);
  }, [entry]);

  // Stats Logic
  useEffect(() => {
    if (!entry) {
      setStats({ words: 0, chars: 0, wpm: 0, pauses: 0, keystrokes: 0 });
      setStartTime(null);
      return;
    }
    if (!startTime) setStartTime(Date.now());

    const words = entry.trim().split(/\s+/).filter(x => x).length;
    const chars = entry.length;
    const durationMin = startTime ? (Date.now() - startTime) / 60000 : 0;
    const wpm = durationMin > 0 ? Math.round(words / durationMin) : 0;

    setStats(s => ({ ...s, words, chars, wpm }));
  }, [entry, startTime]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const now = Date.now();
    
    // Command+Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
      return;
    }

    setStats(s => ({ ...s, keystrokes: s.keystrokes + 1 }));
    
    // Pause Detection (>3s)
    if (now - lastKeyTime.current > 3000 && lastKeyTime.current !== 0) {
       setStats(s => ({ ...s, pauses: s.pauses + 1 }));
    }
    lastKeyTime.current = now;
  };

  const handleSave = async () => {
    if (!entry.trim()) return;
    
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay: JournalMetadata['time_of_day'] = 'night';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';

    const metadata: JournalMetadata = {
      word_count: stats.words,
      char_count: stats.chars,
      writing_duration_seconds: startTime ? Math.floor((Date.now() - startTime) / 1000) : 0,
      keystrokes: stats.keystrokes,
      pauses: stats.pauses,
      words_per_minute: stats.wpm,
      time_of_day: timeOfDay,
      hour_of_day: hour,
      day_of_week: now.toLocaleDateString('en-US', { weekday: 'long' })
    };
    
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      startTime: startTime || Date.now(),
      content: entry,
      metadata
    };
    
    setJournals(prev => [newEntry, ...prev]);
    StorageService.add('journals', newEntry); // O(1) persistence
    onAddLog(LogType.JOURNAL_DUMP, `Journal entry saved. ${stats.words} words.`, metadata);
    
    // Clear State & Storage
    setEntry('');
    localStorage.removeItem('journal_draft');
    setStartTime(null);
  };

  const handleReflect = async (journalId: string, content: string) => {
    if (analyzingIds.has(journalId)) return;
    
    // Add to loading set
    setAnalyzingIds(prev => new Set(prev).add(journalId));
    
    try {
        const feedback = await GeminiService.reflectOnJournal(content, profile);
        
        // Update local state
        setJournals(prev => prev.map(j => {
            if (j.id === journalId) {
                const updated = { ...j, reflection: feedback };
                // Persist update
                StorageService.saveItem('journals', updated);
                return updated;
            }
            return j;
        }));
        onAddLog(LogType.AI_PSYCH_PROFILE, "AI Reflection generated on journal entry.");
    } catch (e) {
        console.error("Reflection failed", e);
        alert("Amon is currently unreachable.");
    } finally {
        // Remove from loading set
        setAnalyzingIds(prev => {
            const next = new Set(prev);
            next.delete(journalId);
            return next;
        });
    }
  };

  const getTimeIcon = (t: string) => {
    switch(t) {
      case 'morning': return <Sun size={14} className="text-yellow-500"/>;
      case 'afternoon': return <Cloud size={14} className="text-blue-400"/>;
      case 'evening': return <Moon size={14} className="text-indigo-400"/>;
      default: return <Star size={14} className="text-purple-400"/>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-void p-6 md:p-12 overflow-hidden">
      <div className="flex justify-between items-center mb-6 border-b border-gray-900 pb-6">
        <div>
          <h2 className="text-2xl md:text-5xl font-black text-white tracking-tighter flex items-center gap-3">
            <Brain className="text-danger" size={24} /> NEURAL DUMP
          </h2>
          <div className="flex gap-4 mt-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
             <span>{stats.words} WORDS</span>
             <span>{stats.wpm} WPM</span>
             <span className={stats.pauses > 5 ? 'text-danger' : 'text-gray-500'}>{stats.pauses} PAUSES</span>
          </div>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className={`p-3 border transition-all ${showHistory ? 'bg-danger text-white border-danger' : 'border-gray-800 text-gray-500 hover:text-white'}`}
        >
          {showHistory ? <Terminal size={18}/> : <History size={18}/>}
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {showHistory ? (
          <div className="flex-1 overflow-y-auto space-y-8 pr-2 scrollbar-hide">
            {journals.map(j => (
                  <div key={j.id} className="border border-gray-900 p-5 bg-surface/20 hover:bg-surface/40 transition-all relative group">
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-2">
                         {j.metadata?.time_of_day && getTimeIcon(j.metadata.time_of_day)}
                         <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">{new Date(j.timestamp).toLocaleTimeString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                       <button onClick={() => {
                           const filtered = journals.filter(x => x.id !== j.id);
                           setJournals(filtered);
                           StorageService.save('journals', filtered); // Bulk save for delete is safer logic-wise
                       }} className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-danger"><Trash2 size={12}/></button>
                    </div>
                    <p className="text-gray-300 font-mono text-xs mb-4 leading-relaxed whitespace-pre-wrap">{j.content}</p>
                    
                    {j.metadata && (
                      <div className="flex gap-3 text-[8px] font-mono text-gray-600 mb-2 border-t border-gray-800 pt-2">
                         <span>{j.metadata.word_count} words</span>
                         <span>{j.metadata.words_per_minute} wpm</span>
                         <span>{j.metadata.pauses} pauses</span>
                      </div>
                    )}

                    {j.reflection ? (
                      <div className="border-l-2 border-danger pl-4 py-2 bg-danger/5 animate-in slide-in-from-left-2">
                        <p className="text-[10px] italic text-red-200 font-bold">"{j.reflection}"</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleReflect(j.id, j.content)}
                        disabled={analyzingIds.has(j.id)}
                        className="mt-2 text-[9px] font-black uppercase text-purple-400 flex items-center gap-2 hover:text-white transition-colors disabled:opacity-50"
                      >
                         {analyzingIds.has(j.id) ? <Loader className="animate-spin" size={10}/> : <Zap size={10}/>}
                         {analyzingIds.has(j.id) ? "ANALYZING..." : "GENERATE REFLECTION"}
                      </button>
                    )}
                  </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex-1 relative">
              <textarea 
                autoFocus
                value={entry}
                onChange={e => setEntry(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Expose the truth... (⌘+Enter to save)"
                className="w-full h-full bg-black/40 border border-gray-900 p-6 text-white font-mono text-sm md:text-xl focus:border-danger outline-none resize-none transition-all scrollbar-hide"
              />
            </div>
            <button 
              onClick={handleSave}
              disabled={!entry.trim()}
              className={`
                py-6 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 transition-all
                ${entry.trim() ? 'bg-white text-black hover:bg-danger hover:text-white' : 'bg-gray-900 text-gray-700 opacity-50'}
              `}
            >
              <Save size={18}/>
              <span>COMMIT TO ARCHIVE (⌘+ENTER)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
