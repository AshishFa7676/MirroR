
import React, { useState, useMemo } from 'react';
import { GeminiService } from '../services/geminiService';
import { LogEntry, Task, UserProfile, JournalEntry, LogType } from '../types';
import { BarChart2, AlertTriangle, Terminal, Activity, TrendingDown, Target, Clock, MessageCircle, Calendar } from 'lucide-react';

interface AnalyticsProps {
  logs: LogEntry[];
  tasks: Task[];
  profile: UserProfile;
  journals: JournalEntry[];
}

export default function Analytics({ logs, tasks, profile, journals }: AnalyticsProps) {
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const metrics = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const total = tasks.length;
    const integrity = total === 0 ? 100 : Math.round((completed / total) * 100);
    const focusSeconds = tasks.reduce((acc, t) => acc + t.actualTimeSpentSeconds, 0);
    const debtEvents = logs.filter(l => [LogType.CONTRACT_BREACHED, LogType.GHOSTING_DETECTED, LogType.QUIZ_FAILURE].includes(l.type)).length;
    return { integrity, completed, total, focusHours: (focusSeconds / 3600).toFixed(1), debtEvents };
  }, [tasks, logs]);

  // Heatmap generation logic
  const heatmapData = useMemo(() => {
    const hours = new Array(24).fill(0).map(() => new Array(7).fill(0));
    logs.forEach(l => {
      if ([LogType.CONTRACT_BREACHED, LogType.SHIELD_LOGGED, LogType.GHOSTING_DETECTED].includes(l.type)) {
        const date = new Date(l.timestamp);
        hours[date.getHours()][date.getDay()] += 1;
      }
    });
    return hours;
  }, [logs]);

  const runAnalysis = async () => {
    setIsLoading(true);
    const result = await GeminiService.analyzeBehaviorLogs(logs, profile, []);
    setReport(result);
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-void p-6 md:p-12 overflow-y-auto">
      <div className="mb-10 border-b border-gray-900 pb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
            <BarChart2 className="text-danger" size={32} /> BEHAVIORAL AUTOPSY
          </h2>
          <p className="text-gray-600 font-mono mt-2 text-[10px] uppercase tracking-widest">Identifying failure patterns in the Analyst sprint.</p>
        </div>
        <button onClick={runAnalysis} className="bg-danger text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-800">RUN AUTOPSY</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Integrity', val: `${metrics.integrity}%`, color: metrics.integrity < 50 ? 'text-danger' : 'text-success' },
          { label: 'Focus', val: `${metrics.focusHours}h`, color: 'text-white' },
          { label: 'Verified', val: `${metrics.completed}/${metrics.total}`, color: 'text-white' },
          { label: 'Debt Events', val: metrics.debtEvents, color: 'text-danger' }
        ].map(m => (
          <div key={m.label} className="bg-surface/40 p-6 border border-gray-900">
            <div className="text-[8px] font-black text-gray-700 uppercase mb-2 tracking-widest">{m.label}</div>
            <div className={`text-2xl font-black ${m.color} tabular-nums`}>{m.val}</div>
          </div>
        ))}
      </div>

      <div className="mb-10 bg-surface/30 border border-gray-900 p-8">
        <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6 flex items-center gap-3">
          <Calendar size={14} className="text-danger" /> FAILURE DENSITY MAP (BY HOUR)
        </h3>
        <div className="grid grid-cols-24 gap-1 h-32">
          {heatmapData.map((dayData, h) => (
            <div key={h} className="flex flex-col gap-1">
              {dayData.map((val, d) => (
                <div 
                  key={d} 
                  className="flex-1 transition-all"
                  style={{ backgroundColor: val > 0 ? `rgba(127, 29, 29, ${Math.min(1, val * 0.3)})` : '#18181b' }}
                  title={`${h}:00 - ${val} failure(s)`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-[8px] font-black text-gray-800 uppercase tracking-widest">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>

      {report && (
        <div className="bg-black/60 border border-danger/50 p-8 font-mono animate-in fade-in">
           <div className="text-danger text-[10px] font-black uppercase tracking-[0.8em] mb-6 flex items-center gap-3">
             <Activity size={14}/> FORENSIC_ANALYSIS_COMPLETE
           </div>
           <div className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap prose prose-invert">{report}</div>
           <button onClick={() => setReport('')} className="mt-10 text-[8px] text-gray-600 hover:text-white uppercase font-black underline">Close Report</button>
        </div>
      )}
    </div>
  );
}
