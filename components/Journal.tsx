
import React, { useState, useEffect, useMemo } from 'react';
import { GeminiService } from '../services/geminiService';
import { LogType, UserProfile, JournalEntry } from '../types';
import { Brain, Save, Loader, History, Clock, Terminal, ChevronRight, Calendar } from 'lucide-react';

interface JournalProps {
  journals: JournalEntry[];
  setJournals: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  profile: UserProfile;
  onAddLog: (type: LogType, content: string, metadata?: any) => void;
}

export const Journal: React.FC<JournalProps> = ({ journals, setJournals, profile, onAddLog }) => {
  const [entry, setEntry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (entry.length === 1 && !startTime) {
      setStartTime(Date.now());
    }
  }, [entry]);

  const handleSave = async () => {
    if (!entry.trim()) return;
    setIsAnalyzing(true);
    let feedback = "Amon's gaze is averted.";
    try {
      feedback = await GeminiService.reflectOnJournal(entry, profile);
    } catch (e) {
      console.warn("AI Reflection failed.");
    }
    
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      startTime: startTime || Date.now(),
      content: entry,
      reflection: feedback
    };
    
    setJournals(prev => [newEntry, ...prev]);
    onAddLog(LogType.JOURNAL_DUMP, `NEURAL ARCHIVE: Session duration ${Math.floor((Date.now() - (startTime || Date.now())) / 1000)}s`);
    
    setEntry('');
    setStartTime(null);
    setIsAnalyzing(false);
  };

  const groupedJournals = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    journals.forEach(j => {
      const dateStr = new Date(j.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(j);
    });
    return groups;
  }, [journals]);

  return (
    <div className="h-full flex flex-col bg-void p-6 md:p-12 overflow-hidden">
      <div className="flex justify-between items-center mb-6 border-b border-gray-900 pb-6">
        <div>
          <h2 className="text-2xl md:text-5xl font-black text-white tracking-tighter flex items-center gap-3">
            <Brain className="text-danger" size={24} /> NEURAL DUMP
          </h2>
          <p className="text-gray-600 font-mono text-[8px] uppercase tracking-widest mt-1">FORENSIC INDEXING OF COGNITIVE RATIONALIZATIONS.</p>
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
            {Object.entries(groupedJournals).map(([date, entries]) => (
              <div key={date} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-gray-600 font-black text-[9px] uppercase tracking-widest">{date}</h3>
                  <div className="flex-1 h-[1px] bg-gray-900" />
                </div>
                {(entries as JournalEntry[]).map(j => (
                  <div key={j.id} className="border border-gray-900 p-5 bg-surface/20 hover:bg-surface/40 transition-all">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">{new Date(j.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-gray-300 font-mono text-xs mb-4 leading-relaxed whitespace-pre-wrap">{j.content}</p>
                    {j.reflection && (
                      <div className="border-l-2 border-danger pl-4 py-2 bg-danger/5">
                        <p className="text-[10px] italic text-red-200 font-bold">"{j.reflection}"</p>
                      </div>
                    )}
                  </div>
                ))}
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
                placeholder="Amon is monitoring your internal monologue. Expose the truth..."
                className="w-full h-full bg-black/40 border border-gray-900 p-6 text-white font-mono text-sm md:text-xl focus:border-danger outline-none resize-none transition-all scrollbar-hide"
              />
              {startTime && (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-danger/20 border border-danger/40">
                  <div className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse" />
                  <span className="text-[8px] font-black text-danger uppercase tracking-widest">RECORDING</span>
                </div>
              )}
            </div>
            <button 
              onClick={handleSave}
              disabled={isAnalyzing || !entry.trim()}
              className={`
                py-6 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 transition-all
                ${entry.trim() ? 'bg-white text-black hover:bg-danger hover:text-white' : 'bg-gray-900 text-gray-700 opacity-50'}
              `}
            >
              {isAnalyzing ? <Loader className="animate-spin" size={18} /> : <Save size={18}/>}
              <span>{isAnalyzing ? "ETCHING..." : "COMMIT TO ARCHIVE"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
