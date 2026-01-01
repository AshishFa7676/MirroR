
import React, { useState } from 'react';
import { GeminiService } from '../services/geminiService';
import { LogEntry, Task, UserProfile, JournalEntry, PatternAnalysis, LogType } from '../types';
import { BarChart2, Activity, Target, Zap, AlertTriangle, CheckCircle, Search, Save, Database, Brain } from 'lucide-react';
import { soundService } from '../services/soundService';

interface AnalyticsProps {
  logs: LogEntry[];
  tasks: Task[];
  profile: UserProfile;
  journals: JournalEntry[];
  // Assuming a prop to save generated report as journal entry
  onSaveReport?: (report: string) => void;
}

export default function Analytics({ logs, tasks, profile, journals, onSaveReport }: AnalyticsProps) {
  const [report, setReport] = useState<PatternAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVED'>('IDLE');

  const runAnalysis = async () => {
    setIsLoading(true);
    soundService.playClick();
    try {
      const result = await GeminiService.generatePatternAnalysis(tasks, logs, journals);
      setReport(result);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleSaveToJournal = () => {
    if (!report || !onSaveReport) return;
    soundService.playComplete();
    const content = `AI PATTERN ANALYSIS REPORT
    
SCORE: ${report.overallScore}/100
PRIMARY PATTERN: ${report.primaryPattern}

HONEST TRUTH:
${report.honestTruth}

ESCAPE VECTORS:
${report.escapePatterns.map(p => `- ${p.pattern} (${p.frequency})`).join('\n')}

PRODUCTIVITY:
- Peak: ${report.productivityInsights.peakHours.join(', ')}
- Worst: ${report.productivityInsights.worstHours.join(', ')}

RECOMMENDATIONS:
${report.urgentRecommendations.map(r => `- ${r.recommendation}: ${r.reason}`).join('\n')}
    `;
    onSaveReport(content);
    setSaveStatus('SAVED');
    setTimeout(() => setSaveStatus('IDLE'), 3000);
  };

  return (
    <div className="h-full flex flex-col bg-void p-6 md:p-12 overflow-y-auto">
      <div className="mb-10 border-b border-gray-900 pb-8">
        <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
                <Search className="text-danger" size={32} /> DEEP PATTERN ANALYSIS
              </h2>
              <p className="text-gray-600 font-mono mt-2 text-[10px] uppercase tracking-widest">Using Gemini to expose behavioral architecture.</p>
            </div>
            <button 
              onClick={runAnalysis} 
              disabled={isLoading}
              className="bg-danger text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-800 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <Activity className="animate-spin" size={14}/>}
              RUN AUTOPSY
            </button>
        </div>
        
        {/* Data Stats Bar */}
        <div className="grid grid-cols-4 gap-4">
            <div className="bg-surface border border-gray-800 p-3 rounded flex flex-col items-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Tasks</span>
                <span className="text-white font-mono text-xl">{tasks.length}</span>
            </div>
            <div className="bg-surface border border-gray-800 p-3 rounded flex flex-col items-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Activities</span>
                <span className="text-white font-mono text-xl">{logs.length}</span>
            </div>
            <div className="bg-surface border border-gray-800 p-3 rounded flex flex-col items-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Journals</span>
                <span className="text-white font-mono text-xl">{journals.length}</span>
            </div>
            <div className="bg-surface border border-gray-800 p-3 rounded flex flex-col items-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Escapes</span>
                <span className="text-white font-mono text-xl">{tasks.reduce((acc, t) => acc + (t.escapeAttempts || 0), 0)}</span>
            </div>
        </div>
      </div>

      {!report && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-700 space-y-4 py-12">
           <Database size={48} className="opacity-20"/>
           <span className="text-xs uppercase tracking-widest border border-dashed border-gray-800 px-6 py-2 rounded-full">Initiate analysis to see results</span>
        </div>
      )}

      {report && (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
          <div className="flex justify-end">
             <button 
                onClick={handleSaveToJournal} 
                disabled={saveStatus === 'SAVED'}
                className={`text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${saveStatus === 'SAVED' ? 'text-success' : 'text-gray-500 hover:text-white'}`}
             >
                {saveStatus === 'SAVED' ? <CheckCircle size={14} /> : <Save size={14} />} 
                {saveStatus === 'SAVED' ? 'Report Archived' : 'Save Report to Journal'}
             </button>
          </div>

          {/* Top Level Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border border-gray-800 p-8 flex flex-col items-center justify-center rounded-2xl relative overflow-hidden">
               <div className={`absolute inset-0 opacity-10 ${report.overallScore > 70 ? 'bg-success' : report.overallScore > 40 ? 'bg-yellow-500' : 'bg-danger'}`} />
               <h3 className="text-gray-500 text-[10px] uppercase tracking-widest font-black mb-2">Productivity Score</h3>
               <div className={`text-6xl font-black ${report.overallScore > 70 ? 'text-success' : report.overallScore > 40 ? 'text-yellow-500' : 'text-danger'}`}>
                 {report.overallScore}
               </div>
            </div>
            
            <div className="md:col-span-2 bg-surface border border-gray-800 p-8 rounded-2xl flex flex-col justify-center">
               <h3 className="text-gray-500 text-[10px] uppercase tracking-widest font-black mb-4">Primary Pattern Identified</h3>
               <p className="text-2xl font-black text-white uppercase leading-none">{report.primaryPattern}</p>
            </div>
          </div>

          {/* Honest Truth */}
          <div className="bg-black border border-danger p-8 rounded-2xl">
             <div className="flex items-center gap-2 text-danger font-black uppercase text-xs tracking-widest mb-4">
               <AlertTriangle size={16}/> The Honest Truth
             </div>
             <p className="text-gray-300 font-mono text-sm leading-relaxed">
               {report.honestTruth}
             </p>
          </div>

          {/* Grid of Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Escape Patterns */}
             <div className="bg-surface border border-gray-800 p-6 rounded-xl">
                <h3 className="text-white font-bold uppercase text-sm mb-4">Escape Vectors</h3>
                <div className="space-y-3">
                  {report.escapePatterns.map((ep, i) => (
                    <div key={i} className="bg-black/40 p-3 rounded border border-gray-800">
                       <div className="text-white font-bold text-xs">{ep.pattern}</div>
                       <div className="flex justify-between mt-1 text-[10px] text-gray-500 font-mono">
                          <span>Freq: {ep.frequency}</span>
                          <span>Trigger: {ep.triggerTime}</span>
                       </div>
                    </div>
                  ))}
                </div>
             </div>

             {/* Productivity Stats */}
             <div className="bg-surface border border-gray-800 p-6 rounded-xl">
                <h3 className="text-white font-bold uppercase text-sm mb-4">Temporal Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-green-900/10 border border-green-900/30 p-3 rounded">
                      <div className="text-[10px] text-green-500 font-black uppercase">Peak Hours</div>
                      <div className="text-white font-bold">{report.productivityInsights.peakHours.join(', ')}</div>
                   </div>
                   <div className="bg-red-900/10 border border-red-900/30 p-3 rounded">
                      <div className="text-[10px] text-red-500 font-black uppercase">Worst Hours</div>
                      <div className="text-white font-bold">{report.productivityInsights.worstHours.join(', ')}</div>
                   </div>
                   <div className="col-span-2 bg-gray-900 p-3 rounded border border-gray-800">
                      <div className="flex justify-between text-xs">
                         <span className="text-gray-500">Best Category: <span className="text-white">{report.productivityInsights.bestCategory}</span></span>
                         <span className="text-gray-500">Worst: <span className="text-white">{report.productivityInsights.worstCategory}</span></span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
          
          {/* Recommendations */}
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-8 rounded-2xl">
             <h3 className="text-white font-bold uppercase text-sm mb-6 flex items-center gap-2">
               <Zap size={16} className="text-yellow-500"/> Urgent Recommendations
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {report.urgentRecommendations.map((rec, i) => (
                   <div key={i} className="flex gap-4">
                      <div className="text-gray-600 font-mono font-bold text-xl">0{i+1}</div>
                      <div>
                         <div className="text-white font-bold text-sm mb-1">{rec.recommendation}</div>
                         <div className="text-gray-500 text-xs">{rec.reason}</div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
