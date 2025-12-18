
import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, LogType, Task, ViewState, UserProfile, JournalEntry, SubTask } from './types';
import { GeminiService } from './services/geminiService';
import { StorageService } from './services/storageService';
import { ActivityLog } from './components/ActivityLog';
import { Planner } from './components/Planner';
import { Journal } from './components/Journal';
import { Onboarding } from './components/Onboarding';
import { ShieldLog } from './components/ShieldLog';
import Analytics from './components/Analytics';
import { 
  ShieldAlert, Brain, List, BarChart2, 
  History, Menu, X, ArrowRight, Clock, AlertTriangle, AlertCircle, Download, Upload, Bell
} from 'lucide-react';

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.ONBOARDING);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [pomodoroTime, setPomodoroTime] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [debtUnits, setDebtUnits] = useState(0);
  
  const [lockdownMode, setLockdownMode] = useState<'NONE' | 'GAUNTLET' | 'QUIZ' | 'EVIDENCE_AUDit' | 'DELETION_FRICTION' | 'RESCHEDULE' | 'AMENDMENT_FRICTION' | 'BREACH_ALERT' | 'PROACTIVE_AUTOPSY'>('NONE');
  const [currentAiQuestion, setCurrentAiQuestion] = useState('');
  const [userInput, setUserInput] = useState('');
  const [technicalEvidence, setTechnicalEvidence] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quizData, setQuizData] = useState<{qs: string[], ans: string[]}>({qs: [], ans: []});
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteTimer, setDeleteTimer] = useState(0);

  const lastSyncRef = useRef<number>(Date.now());

  useEffect(() => {
    const loadData = async () => {
      const l = await StorageService.getAll('logs');
      const t = await StorageService.getAll('tasks');
      const j = await StorageService.getAll('journals');
      const p = await StorageService.getAll('profile');
      
      const sortedLogs = l.sort((a,b) => b.timestamp - a.timestamp);
      setLogs(sortedLogs);
      setTasks(t);
      setJournals(j);
      
      if (p.length > 0) {
        const userProfile = p[0];
        setProfile(userProfile);
        setDebtUnits(userProfile.integrityDebt || 0);
        setView(ViewState.PLANNER);
        
        const lastLog = sortedLogs[0];
        if (lastLog && (Date.now() - lastLog.timestamp) > 24 * 60 * 60 * 1000) {
          triggerProactiveAutopsy();
        }
      }
    };
    loadData();
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const now = Date.now();
    if (now - lastSyncRef.current > 2000 || lockdownMode !== 'NONE') {
      if (logs.length) StorageService.save('logs', logs);
      if (tasks.length) StorageService.save('tasks', tasks);
      if (journals.length) StorageService.save('journals', journals);
      if (profile) StorageService.save('profile', { ...profile, integrityDebt: debtUnits, id: 'current' });
      lastSyncRef.current = now;
    }
  }, [logs, tasks, journals, profile, debtUnits, lockdownMode]);

  const triggerProactiveAutopsy = () => {
    setLockdownMode('PROACTIVE_AUTOPSY');
    setCurrentAiQuestion("Registry inactivity detected for >24h. The void is expanding. State the divergence that occurred during this absence.");
  };

  useEffect(() => {
    const mainLoop = setInterval(() => {
      const nowTs = Date.now();
      const nowStr = new Date().toTimeString().slice(0, 5);
      
      const sortedLogs = [...logs].sort((a,b) => b.timestamp - a.timestamp);
      const lastLog = sortedLogs[0];
      if (lastLog && (nowTs - lastLog.timestamp) > 24 * 60 * 60 * 1000 && lockdownMode === 'NONE') {
        triggerProactiveAutopsy();
      }

      tasks.forEach(t => {
        if (t.status === 'SCHEDULED' && t.scheduledTimeStart === nowStr && localStorage.getItem(`alert_${t.id}`) !== nowStr) {
          localStorage.setItem(`alert_${t.id}`, nowStr);
          addLog(LogType.ALARM_TRIGGERED, `OBLIGATION START: ${t.title}`);
          setLockdownMode('BREACH_ALERT');
          setCurrentAiQuestion(`OBLIGATION DETECTED: ${t.title}. The registry demands execution.`);
          sendNotification(`MIRROR: Obligation Started`, `Registry task "${t.title}" is now active.`);
        }
      });

      if (!activeTaskId && lockdownMode === 'NONE') {
        setDebtUnits(prev => prev + 0.01);
      }

      if (activeTaskId && lockdownMode === 'NONE') {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            startQuiz(); 
            return 0;
          }
          return prev - 1;
        });
        setTasks(p => p.map(t => t.id === activeTaskId ? { ...t, actualTimeSpentSeconds: t.actualTimeSpentSeconds + 1 } : t));
      }

      if (lockdownMode === 'DELETION_FRICTION' && deleteTimer > 0) {
        setDeleteTimer(prev => prev - 1);
      }
    }, 1000);
    return () => clearInterval(mainLoop);
  }, [activeTaskId, lockdownMode, tasks, deleteTimer, logs]);

  const sendNotification = (title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  };

  const addLog = (type: LogType, content: string, metadata?: any) => {
    setLogs(p => [{ id: crypto.randomUUID(), timestamp: Date.now(), type, content, metadata }, ...p]);
  };

  const startQuiz = async () => {
    setIsLoading(true);
    setLockdownMode('QUIZ');
    const task = tasks.find(t => t.id === activeTaskId)!;
    try {
      const qs = await GeminiService.generateTechnicalQuiz(task.title);
      setQuizData({ qs, ans: new Array(qs.length).fill('') });
    } catch (e) {
      setQuizData({ qs: ["Manual verification required."], ans: [""] });
    }
    setIsLoading(false);
  };

  const finalizeEvidence = async () => {
    setIsLoading(true);
    const task = tasks.find(t => t.id === activeTaskId)!;
    const res = await GeminiService.verifyTechnicalEvidence(task.title, technicalEvidence);
    if (res.passed) {
      addLog(LogType.QUIZ_SUCCESS, `VERIFIED: ${task.title}. Audit: ${res.audit}`);
      setTasks(p => p.map(t => t.id === activeTaskId ? { ...t, status: 'COMPLETED', technicalEvidence } : t));
      setLockdownMode('NONE'); 
      setActiveTaskId(null); 
      setView(ViewState.PLANNER);
      setTechnicalEvidence('');
    } else {
      addLog(LogType.QUIZ_FAILURE, `EVIDENCE REJECTED: ${res.audit}`);
      setDebtUnits(p => p + 100);
      setCurrentAiQuestion(`AUDIT FAILED: ${res.audit}. Legitimate technical proof is required.`);
      setLockdownMode('EVIDENCE_AUDit');
    }
    setIsLoading(false);
  };

  const handleLogShield = (shield: string) => {
    addLog(LogType.SHIELD_LOGGED, `INTELLECTUAL SHIELD ADMITTED: ${shield}`);
    setDebtUnits(prev => prev + 50);
  };

  const integrityScore = tasks.length === 0 ? 100 : Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100);

  if (view === ViewState.ONBOARDING) {
    return <Onboarding onComplete={(p) => { setProfile(p); setView(ViewState.PLANNER); addLog(LogType.CONFESSION, "Registry Initiated."); }} />;
  }

  const navItems = [
    { v: ViewState.PLANNER, icon: <List size={22}/>, label: 'REGISTRY' },
    { v: ViewState.JOURNAL, icon: <Brain size={22}/>, label: 'DUMP' },
    { v: ViewState.ANALYTICS, icon: <BarChart2 size={22}/>, label: 'AUTOPSY' },
    { v: ViewState.HISTORY, icon: <History size={22}/>, label: 'LOGS' }
  ];

  return (
    <div className={`h-screen w-screen bg-void text-gray-300 font-mono flex flex-col overflow-hidden select-none ${lockdownMode !== 'NONE' ? 'animate-pulse' : ''}`}>
      
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-900 z-[300]">
        <div className="h-full bg-danger transition-all duration-1000 shadow-[0_0_15px_#7f1d1d]" style={{ width: `${Math.min(100, (debtUnits / 1000) * 100)}%` }} />
      </div>

      <header className="h-16 lg:h-20 bg-surface/90 border-b border-gray-900 flex items-center justify-between px-6 lg:px-12 z-[200] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <ShieldAlert className={integrityScore < 50 ? 'text-danger animate-pulse' : 'text-success'} size={24}/>
          <div className="flex flex-col">
            <span className="text-[12px] font-black tracking-tighter text-white uppercase leading-none leading-none">MIRROR // AMON_V2.0</span>
            <span className="hidden lg:block text-[8px] font-bold text-gray-600 uppercase tracking-[0.5em] mt-1.5">BEHAVIORAL_TRACKING</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 lg:gap-12">
           <div className="text-right">
             <div className="text-[8px] font-black text-danger uppercase tracking-widest mb-0.5">DEBT</div>
             <div className="text-lg lg:text-2xl font-black tabular-nums text-danger leading-none">{Math.floor(debtUnits)}</div>
           </div>
           <div className="text-right hidden xs:block">
             <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5">INTG</div>
             <div className={`text-lg lg:text-2xl font-black tabular-nums leading-none ${integrityScore < 40 ? 'text-danger' : 'text-success'}`}>{integrityScore}%</div>
           </div>
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 border border-gray-800 lg:hidden text-gray-400">
             {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative flex">
        <nav className={`
          fixed lg:relative inset-0 w-full lg:w-72 bg-void lg:bg-surface border-r border-gray-900 z-[250] transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}>
          <div className="flex-1 overflow-y-auto py-12 lg:py-6">
            {navItems.map(item => (
              <button key={item.v} onClick={() => { setView(item.v); setIsSidebarOpen(false); }} className={`w-full px-10 py-8 lg:px-6 lg:py-4 flex items-center gap-6 transition-all group ${view === item.v ? 'bg-danger text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                {item.icon}
                <div className="text-left">
                  <div className="text-[11px] font-black uppercase tracking-widest">{item.label}</div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-6 border-t border-gray-900 lg:hidden flex gap-4">
             <button onClick={() => {/* export func */}} className="flex-1 p-4 border border-gray-800 text-xs font-black flex items-center justify-center gap-2"><Download size={16}/> EXPORT</button>
             <button onClick={() => {/* import func */}} className="flex-1 p-4 border border-gray-800 text-xs font-black flex items-center justify-center gap-2"><Upload size={16}/> IMPORT</button>
          </div>

          <div className="p-6 border-t border-gray-900">
             <ShieldLog onLogShield={handleLogShield} />
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto bg-void relative pb-24 lg:pb-0 scrollbar-hide">
          {view === ViewState.EXECUTION_TUNNEL ? (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-black relative">
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_#7f1d1d,_transparent_70%)]" />
              <h2 className="text-[10px] tracking-[1em] text-danger font-black mb-8 uppercase z-10 text-center">CONTRACT_ACTIVE</h2>
              <h1 className="text-3xl lg:text-6xl font-black text-white mb-12 tracking-tighter uppercase text-center z-10 leading-none">
                {tasks.find(t => t.id === activeTaskId)?.title}
              </h1>
              <div className="text-7xl lg:text-[12rem] font-mono text-danger mb-16 tabular-nums font-black z-10 drop-shadow-[0_0_20px_#7f1d1d]">
                {Math.floor(pomodoroTime / 60)}:{Math.floor(pomodoroTime % 60).toString().padStart(2, '0')}
              </div>
              <div className="flex flex-col lg:flex-row gap-4 w-full max-w-xl z-10">
                <button onClick={() => { setIsLoading(true); setLockdownMode('GAUNTLET'); GeminiService.getSocraticQuestion(tasks.find(t => t.id === activeTaskId)!, profile!, [], 1).then(q => { setCurrentAiQuestion(q); setIsLoading(false); }); }} className="flex-1 border-2 border-danger text-danger py-6 font-black uppercase tracking-widest text-xs hover:bg-danger/10">ABORT</button>
                <button onClick={() => setLockdownMode('EVIDENCE_AUDit')} className="flex-1 bg-white text-black py-6 font-black uppercase tracking-widest text-xs">VERIFY</button>
              </div>
            </div>
          ) : (
            <div className="h-full">
              {view === ViewState.PLANNER && <Planner tasks={tasks} onAddTask={t => { addLog(LogType.CONTRACT_SIGNED, `OBLIGATION ETCHED: ${t.title}`); setTasks(p => [...p, t]); }} onDeleteTask={id => { setPendingDeleteId(id); setLockdownMode('DELETION_FRICTION'); setDeleteTimer(10); setCurrentAiQuestion("Is this deletion a strategy or a retreat? State your failure admission."); }} onUpdateTask={t => { setLockdownMode('AMENDMENT_FRICTION'); setCurrentAiQuestion("Why modify the contract? State your admission."); }} onStartTask={id => { const task = tasks.find(t => t.id === id); setActiveTaskId(id); setView(ViewState.EXECUTION_TUNNEL); setPomodoroTime((task?.durationMinutes || 25) * 60); }} sprintGoals={profile?.sprintGoals || []} />}
              {view === ViewState.JOURNAL && <Journal journals={journals} setJournals={setJournals} profile={profile!} onAddLog={addLog} />}
              {view === ViewState.ANALYTICS && <Analytics logs={logs} tasks={tasks} profile={profile!} journals={journals} />}
              {view === ViewState.HISTORY && <div className="p-6 lg:p-12"><ActivityLog logs={logs} /></div>}
            </div>
          )}
        </main>

        <div className="fixed bottom-0 left-0 w-full h-16 bg-surface/95 border-t border-gray-900 lg:hidden flex items-center justify-around z-[400] backdrop-blur-2xl">
           {navItems.map(item => (
             <button 
              key={item.v} 
              onClick={() => setView(item.v)} 
              className={`flex flex-col items-center gap-1 transition-colors ${view === item.v ? 'text-danger' : 'text-gray-600'}`}
             >
               {item.icon}
               <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
             </button>
           ))}
        </div>
      </div>

      {lockdownMode !== 'NONE' && (
        <div className="fixed inset-0 z-[600] bg-void/98 flex items-center justify-center p-4 backdrop-blur-xl overflow-y-auto">
           <div className={`w-full max-w-2xl bg-surface border-2 p-8 lg:p-16 shadow-2xl border-danger`}>
              <h2 className="text-xl md:text-3xl font-black mb-8 uppercase flex items-center gap-4 text-white tracking-tighter">
                <ShieldAlert className="text-danger" size={32}/> {lockdownMode.replace(/_/g, ' ')}
              </h2>
              {isLoading ? (
                <div className="text-center py-20 animate-pulse text-danger font-black tracking-widest uppercase text-xs">AMON IS ANALYZING...</div>
              ) : (
                <div className="space-y-8">
                   <p className="text-lg md:text-2xl text-red-100 italic border-l-4 border-danger pl-6 font-bold leading-tight">"{currentAiQuestion}"</p>
                   
                   {lockdownMode === 'EVIDENCE_AUDit' ? (
                     <div className="space-y-6">
                        <textarea autoFocus value={technicalEvidence} onChange={e => setTechnicalEvidence(e.target.value)} className="w-full h-48 bg-black border border-gray-800 p-6 text-white text-sm outline-none focus:border-white resize-none" placeholder="Paste evidence (SQL/Python)..." />
                        <button onClick={finalizeEvidence} className="w-full bg-white text-black py-5 font-black uppercase tracking-widest text-xs">AUDIT EVIDENCE</button>
                        <button onClick={() => setLockdownMode('NONE')} className="w-full text-[10px] text-gray-600 uppercase font-black">Cancel</button>
                     </div>
                   ) : (
                     <>
                        <textarea autoFocus value={userInput} onChange={e => setUserInput(e.target.value)} className="w-full h-48 bg-black border border-gray-800 p-6 text-white text-sm outline-none focus:border-danger resize-none" placeholder="Admission required..." />
                        <button 
                          disabled={userInput.length < 50 || deleteTimer > 0} 
                          onClick={() => { 
                            if (lockdownMode === 'DELETION_FRICTION' && pendingDeleteId) {
                              setTasks(p => p.filter(t => t.id !== pendingDeleteId));
                            }
                            setLockdownMode('NONE'); setUserInput(''); setDeleteTimer(0); 
                          }} 
                          className={`w-full py-5 font-black uppercase tracking-widest text-xs ${userInput.length >= 50 && deleteTimer === 0 ? 'bg-white text-black' : 'bg-gray-900 text-gray-700'}`}
                        >
                          {deleteTimer > 0 ? `COOLING DOWN (${deleteTimer}s)` : 'COMMIT'}
                        </button>
                        <p className="text-center text-[8px] text-gray-600 uppercase tracking-widest">{userInput.length}/50 MIN</p>
                     </>
                   )}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
