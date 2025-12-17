
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
      onAddLog(LogType.SYSTEM_EVENT, `NEURAL_DUMP session initiated at ${new Date().toLocaleTimeString()}`);
    }
    if (entry.length === 0) setStartTime(null);
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
    onAddLog(LogType.JOURNAL_DUMP, `DUMP ARCHIVED. Session duration: ${Math.floor((Date.now() - (startTime || Date.now())) / 1000)}s`);
    onAddLog(LogType.AI_PSYCH_PROFILE, feedback);
    
    setEntry('');
    setStartTime(null);
    setIsAnalyzing(false);
  };

  const groupedJournals = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    journals.forEach(j => {
      const dateStr = new Date(j.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(j);
    });
    return groups;
  }, [journals]);

  return (
    <div className="h-full flex flex-col bg-surface p-6 lg:p-12 overflow-hidden relative">
      <div className="flex justify-between items-center mb-10 border-b-2 border-gray-900 pb-8">
        <div>
          <h2 className="text-3xl lg:text-6xl font-black text-white tracking-tighter flex items-center gap-5">
            <Brain className="text-danger" size={40} /> NEURAL DUMP
          </h2>
          <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.4em] mt-2">Forensic indexing of cognitive rationalizations.</p>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className={`group p-4 border-2 transition-all flex items-center gap-3 ${showHistory ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-gray-800 text-gray-500 hover:text-white hover:border-white'}`}
        >
          {showHistory ? <Terminal size={20}/> : <History size={20}/>}
          <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">{showHistory ? 'INPUT' : 'ARCHIVE'}</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-8 overflow-hidden">
        {showHistory ? (
          <div className="flex-1 overflow-y-auto space-y-10 pr-4 scrollbar-hide">
            {journals.length === 0 && (
              <div className="text-center py-32 opacity-10">
                <Brain size={100} className="mx-auto mb-6" />
                <p className="font-black uppercase text-xs tracking-[1em]">ARCHIVE VACANT</p>
              </div>
            )}
            {Object.entries(groupedJournals).map(([date, entries]) => (
              <div key={date} className="space-y-6">
                <div className="flex items-center gap-4">
                  <Calendar size={14} className="text-danger" />
                  <h3 className="text-white font-black text-[10px] uppercase tracking-[0.5em]">{date}</h3>
                  <div className="flex-1 h-[1px] bg-gray-900" />
                </div>
                {entries.map(j => (
                  <div key={j.id} className="border border-gray-900 p-8 bg-black/30 hover:bg-black/50 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-danger transition-all duration-500" />
                    <div className="flex justify-between items-center mb-6">
                       <div className="flex items-center gap-3 text-[9px] font-black text-gray-600 uppercase">
                          <Clock size={12} className="text-danger"/> {new Date(j.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-gray-800">/</span>
                          <span className="text-gray-500">SESSION: {Math.floor((j.timestamp - j.startTime) / 1000)}S</span>
                       </div>
                    </div>
                    <p className="text-gray-300 font-mono text-base mb-8 leading-relaxed whitespace-pre-wrap">{j.content}</p>
                    {j.reflection && (
                      <div className="bg-danger/5 border-l-4 border-danger p-6 relative">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-danger/10 to-transparent pointer-events-none" />
                        <p className="text-xs italic text-red-200 uppercase leading-snug font-bold relative z-10">
                          " {j.reflection} "
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-8">
            <div className="flex-1 relative group">
              <textarea 
                autoFocus
                value={entry}
                onChange={e => setEntry(e.target.value)}
                placeholder="Amon is monitoring your internal monologue. Expose the truth..."
                className="w-full h-full bg-void border-2 border-gray-900 p-10 text-white font-mono text-lg lg:text-2xl focus:border-danger outline-none resize-none transition-all scrollbar-hide shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"
              />
              <div className={`absolute top-0 right-0 p-6 transition-opacity duration-500 ${startTime ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center gap-3 bg-danger/10 px-4 py-2 border border-danger/30">
                  <div className="w-2 h-2 bg-danger rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-danger uppercase tracking-[0.3em]">LIVE RECORDING</span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleSave}
              disabled={isAnalyzing || !entry.trim()}
              className={`
                py-8 font-black uppercase tracking-[0.8em] text-sm md:text-base flex items-center justify-center gap-6 transition-all shadow-2xl
                ${entry.trim() ? 'bg-white text-black hover:bg-danger hover:text-white active:scale-95' : 'bg-gray-900 text-gray-700 opacity-50 cursor-not-allowed'}
              `}
            >
              {isAnalyzing ? <Loader className="animate-spin" size={24} /> : <Save size={24}/>}
              <span>{isAnalyzing ? "ETCHING..." : "COMMIT TO ARCHIVE"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
