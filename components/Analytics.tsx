
import React, { useState, useMemo } from 'react';
import { GeminiService } from '../services/geminiService';
import { LogEntry, Task, UserProfile, JournalEntry, LogType } from '../types';
import { BarChart2, AlertTriangle, Terminal, Activity, TrendingDown, Target, Clock, MessageCircle } from 'lucide-react';

interface AnalyticsProps {
  logs: LogEntry[];
  tasks: Task[];
  profile: UserProfile;
  journals: JournalEntry[];
}

export default function Analytics({ logs, tasks, profile, journals }: AnalyticsProps) {
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inquisitionMode, setInquisitionMode] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);

  const metrics = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const total = tasks.length;
    const integrity = total === 0 ? 100 : Math.round((completed / total) * 100);
    const focusSeconds = tasks.reduce((acc, t) => acc + t.actualTimeSpentSeconds, 0);
    const debtCount = logs.filter(l => l.type.includes('BREACHED') || l.type.includes('REPUDIATION') || l.type.includes('GHOSTING')).length;
    return { integrity, completed, total, focusHours: (focusSeconds / 3600).toFixed(1), debtCount };
  }, [tasks, logs]);

  const runAnalysis = async () => {
    setIsLoading(true);
    const result = await GeminiService.analyzeBehaviorLogs(logs, profile, answers);
    setReport(result);
    setInquisitionMode(false);
    setIsLoading(false);
  };

  const startInquisition = async () => {
    setIsLoading(true);
    const qs = await GeminiService.generateInquisitionQuestions(logs, profile);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(''));
    setInquisitionMode(true);
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-void p-6 md:p-12 overflow-y-auto">
      <div className="mb-10 flex justify-between items-end border-b border-gray-900 pb-8">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
            <BarChart2 className="text-danger" size={32} /> BEHAVIORAL AUTOPSY
          </h2>
          <p className="text-gray-600 font-mono mt-2 text-[10px] uppercase tracking-widest">Identifying failure patterns in the Dec 18-25 sprint.</p>
        </div>
        <div className="text-right">
           <div className="text-[8px] font-black text-danger uppercase tracking-widest mb-1">Debt Units</div>
           <div className="text-2xl font-black text-white tabular-nums">{metrics.debtCount * 12}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Integrity', val: `${metrics.integrity}%`, color: metrics.integrity < 50 ? 'text-danger' : 'text-success' },
          { label: 'Deep Work', val: `${metrics.focusHours}h`, color: 'text-white' },
          { label: 'Obligations', val: `${metrics.completed}/${metrics.total}`, color: 'text-white' },
          { label: 'Debt Events', val: metrics.debtCount, color: 'text-danger' }
        ].map(m => (
          <div key={m.label} className="bg-surface/40 p-6 border border-gray-900">
            <div className="text-[8px] font-black text-gray-700 uppercase mb-2 tracking-widest">{m.label}</div>
            <div className={`text-2xl font-black ${m.color} tabular-nums`}>{m.val}</div>
          </div>
        ))}
      </div>

      <div className="bg-black/60 border border-gray-900 p-8 font-mono">
        {isLoading ? (
          <div className="py-20 text-center">
             <div className="animate-spin h-8 w-8 border-2 border-danger border-t-transparent rounded-full mx-auto mb-4"></div>
             <div className="text-danger font-black text-[10px] tracking-widest uppercase">Amon is synthesizing the truth...</div>
          </div>
        ) : inquisitionMode ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
             <h3 className="text-white font-black text-xs uppercase tracking-[0.5em] mb-8 flex items-center gap-3">
               <MessageCircle size={16} className="text-danger"/> INQUISITION PROTOCOL
             </h3>
             {questions.map((q, i) => (
               <div key={i} className="space-y-3">
                 <p className="text-gray-400 text-sm italic">"{q}"</p>
                 <textarea 
                   value={answers[i]} 
                   onChange={e => { const n = [...answers]; n[i] = e.target.value; setAnswers(n); }}
                   className="w-full bg-void border border-gray-800 p-4 text-white text-sm outline-none focus:border-danger h-24"
                 />
               </div>
             ))}
             <button onClick={runAnalysis} className="w-full bg-danger text-white py-4 font-black uppercase text-xs tracking-widest hover:bg-red-900">SUBMIT ANSWERS FOR AUTOPSY</button>
          </div>
        ) : report ? (
          <div className="animate-in fade-in duration-500">
             <div className="text-danger text-[10px] font-black uppercase tracking-[0.8em] mb-6">REPORT_GENERATED</div>
             <div className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap prose prose-invert">{report}</div>
             <button onClick={() => setReport('')} className="mt-10 text-[8px] text-gray-600 hover:text-white uppercase font-black underline">Archive Report</button>
          </div>
        ) : (
          <div className="text-center py-10 space-y-8">
             <Terminal size={48} className="mx-auto text-gray-800 opacity-20" />
             <p className="text-gray-600 text-[10px] uppercase tracking-widest">The registry requires data to identify failure modes.</p>
             <div className="flex flex-col gap-4 max-w-sm mx-auto">
               <button onClick={startInquisition} className="bg-danger text-white py-4 font-black uppercase text-xs tracking-widest hover:bg-red-800 shadow-xl transition-all">START INQUISITION PROTOCOL</button>
               <button onClick={runAnalysis} className="border border-gray-800 text-gray-600 py-4 font-black uppercase text-xs tracking-widest hover:text-white hover:border-white">RUN FAST AUTOPSY</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
