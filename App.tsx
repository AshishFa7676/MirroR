
import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, LogType, Task, ViewState, UserProfile, JournalEntry } from './types';
import { GeminiService } from './services/geminiService';
import { ActivityLog } from './components/ActivityLog';
import { Planner } from './components/Planner';
import { Journal } from './components/Journal';
import { Onboarding } from './components/Onboarding';
import Analytics from './components/Analytics';
import { 
  ShieldAlert, Brain, List, BarChart2, 
  History, Volume2, VolumeX, Menu, X, ArrowRight, Clock
} from 'lucide-react';

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.ONBOARDING);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isMuted, setIsMuted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [lockdownMode, setLockdownMode] = useState<'NONE' | 'GAUNTLET' | 'QUIZ' | 'VOID_INTERROGATION' | 'DELETION_FRICTION' | 'RESCHEDULE' | 'AMENDMENT_FRICTION'>('NONE');
  const [currentAiQuestion, setCurrentAiQuestion] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quizData, setQuizData] = useState<{qs: string[], ans: string[]}>({qs: [], ans: []});
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingAmendment, setPendingAmendment] = useState<Task | null>(null);

  const audioCtx = useRef<AudioContext | null>(null);
  const alarmInterval = useRef<number | null>(null);
  const lastAlarmTime = useRef<string | null>(null);

  // Persistence Registry
  useEffect(() => {
    const savedLogs = localStorage.getItem('mirror_logs');
    const savedTasks = localStorage.getItem('mirror_tasks');
    const savedProfile = localStorage.getItem('mirror_profile');
    const savedJournals = localStorage.getItem('mirror_journals');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedJournals) setJournals(JSON.parse(savedJournals));
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
      setView(ViewState.PLANNER);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mirror_logs', JSON.stringify(logs));
    localStorage.setItem('mirror_tasks', JSON.stringify(tasks));
    localStorage.setItem('mirror_journals', JSON.stringify(journals));
    if (profile) localStorage.setItem('mirror_profile', JSON.stringify(profile));
  }, [logs, tasks, profile, journals]);

  // Main System Loop: Alarms, Timers, and Heartbeat
  useEffect(() => {
    const mainLoop = setInterval(() => {
      const nowStr = new Date().toTimeString().slice(0, 5);
      localStorage.setItem('mirror_hb', Date.now().toString());

      // OBLIGATION START ALARM
      tasks.forEach(t => {
        if (t.status === 'SCHEDULED' && t.scheduledTimeStart === nowStr && lastAlarmTime.current !== nowStr) {
          lastAlarmTime.current = nowStr;
          addLog(LogType.ALARM_TRIGGERED, `CRITICAL OBLIGATION START: ${t.title}`);
          playAlarm(true);
        }
      });

      if (activeTaskId && lockdownMode === 'NONE') {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            playAlarm(true);
            startQuiz(); 
            return 0;
          }
          return prev - 1;
        });
        setTasks(p => p.map(t => t.id === activeTaskId ? { ...t, actualTimeSpentSeconds: t.actualTimeSpentSeconds + 1 } : t));
      }
    }, 1000);
    return () => clearInterval(mainLoop);
  }, [activeTaskId, lockdownMode, tasks]);

  // GHOSTING DETECTION: The system detects when the user leaves the registry
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && activeTaskId && lockdownMode === 'NONE') {
        const lastHB = localStorage.getItem('mirror_hb');
        if (lastHB) {
          const gap = Math.floor((Date.now() - parseInt(lastHB)) / 1000);
          if (gap > 30) {
            setLockdownMode('VOID_INTERROGATION');
            setCurrentAiQuestion(`Unaccounted absence: ${gap} seconds. Your intellectual procrastination thrives in silence. Justify this gap.`);
            addLog(LogType.GHOSTING_DETECTED, `VOID BREACH: ${gap}s unaccounted divergence.`);
            playAlarm(true);
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [activeTaskId, lockdownMode]);

  const addLog = (type: LogType, content: string, metadata?: any) => {
    setLogs(p => [{ id: crypto.randomUUID(), timestamp: Date.now(), type, content, metadata }, ...p]);
  };

  const playAlarm = (persistent: boolean = false) => {
    if (isMuted) return;
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const trigger = () => {
        const osc = audioCtx.current!.createOscillator();
        const gain = audioCtx.current!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, audioCtx.current!.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.current!.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.current!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current!.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.current!.destination);
        osc.start();
        osc.stop(audioCtx.current!.currentTime + 0.5);
      };
      trigger();
      if (persistent && !alarmInterval.current) {
        alarmInterval.current = window.setInterval(trigger, 1000);
      }
    } catch (e) {}
  };

  const stopAlarm = () => {
    if (alarmInterval.current) {
      clearInterval(alarmInterval.current);
      alarmInterval.current = null;
    }
  };

  const startQuiz = async () => {
    setIsLoading(true);
    setLockdownMode('QUIZ');
    const task = tasks.find(t => t.id === activeTaskId)!;
    try {
      const qs = await GeminiService.generateTechnicalQuiz(task.title);
      setQuizData({ qs, ans: new Array(qs.length).fill('') });
    } catch (e) {
      setQuizData({ qs: ["Confirm your work manually.", "Identify your technical shortcuts.", "Confirm completion integrity."], ans: ["","",""] });
    }
    setIsLoading(false);
  };

  const handleYieldAttempt = async () => {
    setIsLoading(true);
    setLockdownMode('GAUNTLET');
    const task = tasks.find(t => t.id === activeTaskId);
    try {
      const q = await GeminiService.getSocraticQuestion(task!, profile!, logs.map(l => l.content), 1);
      setCurrentAiQuestion(q);
    } catch (e) {
      setCurrentAiQuestion("Why yield now? Your 180-day failure pattern is repeating.");
    }
    setIsLoading(false);
  };

  const finalizeYield = () => {
    if (userInput.length < 50) return alert("Cognitive depth insufficient. 50 characters of absolute truth required.");
    addLog(LogType.CONTRACT_BREACHED, `ABORTED: ${tasks.find(t => t.id === activeTaskId)?.title}. LOGIC: ${userInput}`);
    setLockdownMode('RESCHEDULE');
    setCurrentAiQuestion("Failure documented in Registry. Define the next remediation point.");
    setUserInput('');
    stopAlarm();
  };

  const handleDeleteAttempt = async (id: string) => {
    setPendingDeleteId(id);
    setLockdownMode('DELETION_FRICTION');
    setIsLoading(true);
    const task = tasks.find(t => t.id === id);
    try {
      const q = await GeminiService.getSocraticQuestion(task!, profile!, [], 0);
      setCurrentAiQuestion(q);
    } catch (e) {
      setCurrentAiQuestion("Is this deletion another shield for your cowardice?");
    }
    setIsLoading(false);
  };

  const handleAmendAttempt = async (task: Task) => {
    setPendingAmendment(task);
    setLockdownMode('AMENDMENT_FRICTION');
    setIsLoading(true);
    try {
      const q = await GeminiService.getSocraticQuestion(task, profile!, [], 0);
      setCurrentAiQuestion(q);
    } catch (e) {
      setCurrentAiQuestion("Why must you amend the obligation? Identify the weakness.");
    }
    setIsLoading(false);
  };

  const finalizeReschedule = (newTime: string) => {
    const tid = activeTaskId || tasks.find(t => t.status === 'SCHEDULED' && t.scheduledTimeStart < new Date().toTimeString().slice(0,5))?.id;
    if (!tid) return setLockdownMode('NONE');
    setTasks(p => p.map(t => t.id === tid ? { ...t, status: 'SCHEDULED', scheduledTimeStart: newTime } : t));
    addLog(LogType.CONTRACT_BREACHED, `REMEDIATION SCHEDULED: ${newTime}`);
    setLockdownMode('NONE'); setActiveTaskId(null); setView(ViewState.PLANNER); stopAlarm();
  };

  const integrityScore = tasks.length === 0 ? 100 : Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100);

  if (view === ViewState.ONBOARDING) {
    return <Onboarding onComplete={(p) => { setProfile(p); setView(ViewState.PLANNER); addLog(LogType.CONFESSION, "Registry Initiated."); }} />;
  }

  return (
    <div className="h-screen w-screen bg-void text-gray-300 font-mono flex flex-col overflow-hidden select-none">
      
      {/* GLOBAL TERMINAL HEADER */}
      <header className="h-20 lg:h-24 bg-surface/90 border-b-2 border-gray-900 flex items-center justify-between px-8 lg:px-12 z-[200] backdrop-blur-3xl">
        <div className="flex items-center gap-6">
          <ShieldAlert className={integrityScore < 50 ? 'text-danger animate-pulse shadow-[0_0_20px_#7f1d1d]' : 'text-success'} size={28}/>
          <div className="flex flex-col">
            <span className="text-[14px] font-black tracking-tighter text-white uppercase leading-none">MIRROR // AMON_v3.5_FINAL</span>
            <span className="text-[8px] font-bold text-gray-600 uppercase tracking-[0.5em] mt-2">METACOGNITIVE_INTERROGATION_ACTIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
           <div className="text-right hidden sm:block">
             <div className="text-[8px] font-black text-gray-600 uppercase tracking-[0.4em] mb-1">INTEGRITY_INDEX</div>
             <div className={`text-2xl font-black tabular-nums ${integrityScore < 40 ? 'text-danger' : 'text-success'}`}>{integrityScore}%</div>
           </div>
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-4 border-2 border-gray-800 lg:hidden hover:bg-white/5 transition-all active:scale-95">
             {isSidebarOpen ? <X size={24}/> : <Menu size={24}/>}
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {/* SIDEBAR NAVIGATION */}
        <nav className={`
          fixed lg:relative inset-0 w-full lg:w-80 bg-surface/98 lg:bg-surface border-r-2 border-gray-900 z-[250] transition-all duration-700
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}>
          <div className="flex-1 overflow-y-auto py-12">
            {[
              { v: ViewState.PLANNER, icon: <List size={26}/>, label: 'REGISTRY INDEX', desc: 'Current Obligations' },
              { v: ViewState.JOURNAL, icon: <Brain size={26}/>, label: 'NEURAL DUMP', desc: 'Cognitive Auditing' },
              { v: ViewState.ANALYTICS, icon: <BarChart2 size={26}/>, label: 'BEHAVIORAL AUTOPSY', desc: 'Pathology Reports' },
              { v: ViewState.HISTORY, icon: <History size={26}/>, label: 'IMMUTABLE LOG', desc: 'Registry Record' }
            ].map(item => (
              <button 
                key={item.v} 
                onClick={() => { setView(item.v); setIsSidebarOpen(false); }} 
                className={`w-full p-10 flex items-center gap-8 transition-all group ${view === item.v ? 'bg-white text-black shadow-[0_0_50px_rgba(255,255,255,0.1)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <div className={`${view === item.v ? 'text-black' : 'group-hover:text-danger'} transition-colors`}>{item.icon}</div>
                <div className="text-left">
                  <div className="text-[12px] font-black uppercase tracking-[0.3em]">{item.label}</div>
                  <div className="text-[8px] font-bold uppercase mt-1.5 opacity-40">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="p-10 border-t-2 border-gray-900 space-y-8 mb-28 lg:mb-0">
             <button onClick={() => setIsMuted(!isMuted)} className="flex items-center justify-between w-full text-gray-600 hover:text-white transition-all group">
               <div className="flex items-center gap-5">
                {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                <span className="text-[11px] font-black uppercase tracking-[0.4em]">{isMuted ? 'SILENT' : 'SYSTEM_AUDIO'}</span>
               </div>
               <div className={`w-12 h-1.5 ${isMuted ? 'bg-gray-800' : 'bg-danger shadow-[0_0_15px_#7f1d1d]'}`} />
             </button>
          </div>
        </nav>

        {/* MAIN DISPLAY AREA */}
        <main className="flex-1 overflow-y-auto bg-void relative pb-32 lg:pb-0 scroll-smooth">
          {view === ViewState.EXECUTION_TUNNEL ? (
            <div className="h-full flex flex-col items-center justify-center p-10 bg-black relative">
              <div className="absolute inset-0 opacity-15 pointer-events-none">
                 <div className="h-full w-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-danger via-transparent to-transparent" />
              </div>
              <h2 className="text-[14px] tracking-[2em] text-danger font-black mb-16 uppercase animate-pulse relative z-10">OBLIGATION_ENGAGED</h2>
              <h1 className="text-5xl lg:text-[10rem] font-black text-white mb-20 tracking-tighter uppercase leading-none text-center relative z-10 drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                {tasks.find(t => t.id === activeTaskId)?.title}
              </h1>
              <div className="text-[10rem] lg:text-[24rem] font-mono text-danger mb-24 tabular-nums font-black relative z-10 drop-shadow-[0_0_80px_rgba(127,29,29,0.5)]">
                {Math.floor(pomodoroTime / 60)}:{Math.floor(pomodoroTime % 60).toString().padStart(2, '0')}
              </div>
              <div className="flex flex-col lg:flex-row gap-10 w-full max-w-4xl relative z-10">
                <button onClick={handleYieldAttempt} className="flex-1 border-4 border-danger text-danger py-10 font-black uppercase text-lg tracking-[0.5em] hover:bg-danger/10 transition-all active:scale-95 shadow-2xl">ABORT_CONTRACT</button>
                <button onClick={startQuiz} className="flex-1 bg-white text-black py-10 font-black uppercase text-lg tracking-[0.5em] hover:bg-gray-200 shadow-[0_0_100px_rgba(255,255,255,0.1)] transition-all active:scale-95">VERIFY_EXECUTION</button>
              </div>
            </div>
          ) : (
            <div className="h-full animate-in fade-in duration-1000">
              {view === ViewState.PLANNER && <Planner tasks={tasks} onAddTask={t => { addLog(LogType.CONTRACT_SIGNED, `OBLIGATION ETCHED: ${t.title}`); setTasks(p => [...p, t]); }} onDeleteTask={handleDeleteAttempt} onUpdateTask={handleAmendAttempt} onStartTask={id => { setActiveTaskId(id); setView(ViewState.EXECUTION_TUNNEL); setPomodoroTime(25 * 60); stopAlarm(); }} sprintGoals={profile?.sprintGoals || []} />}
              {view === ViewState.JOURNAL && <Journal journals={journals} setJournals={setJournals} profile={profile!} onAddLog={addLog} />}
              {view === ViewState.ANALYTICS && <Analytics logs={logs} tasks={tasks} profile={profile!} journals={journals} />}
              {view === ViewState.HISTORY && <div className="p-12 lg:p-24"><ActivityLog logs={logs} /></div>}
            </div>
          )}
        </main>

        {/* MOBILE BOTTOM NAVIGATION */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 h-28 bg-surface/98 border-t-2 border-gray-900 z-[230] flex items-center justify-around px-8 pb-10 backdrop-blur-2xl">
          {[
            { v: ViewState.PLANNER, icon: <List size={30}/> },
            { v: ViewState.JOURNAL, icon: <Brain size={30}/> },
            { v: ViewState.ANALYTICS, icon: <BarChart2 size={30}/> },
            { v: ViewState.HISTORY, icon: <History size={30}/> }
          ].map(item => (
            <button key={item.v} onClick={() => setView(item.v)} className={`p-5 transition-all rounded-2xl ${view === item.v ? 'text-white bg-white/10 shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] border-2 border-white/20' : 'text-gray-600'}`}>
              {item.icon}
            </button>
          ))}
        </div>
      </div>

      {/* AMON'S INTERROGATION GAUNTLET (LOCKDOWN OVERLAY) */}
      {lockdownMode !== 'NONE' && (
        <div className="fixed inset-0 z-[600] bg-void/99 flex items-center justify-center p-6 backdrop-blur-3xl animate-in zoom-in-95 duration-500">
           <div className={`w-full max-w-4xl bg-surface border-4 p-12 lg:p-24 shadow-[0_0_150px_rgba(0,0,0,1)] relative transition-all duration-700 ${['GAUNTLET', 'VOID_INTERROGATION', 'DELETION_FRICTION'].includes(lockdownMode) ? 'border-danger' : 'border-white'}`}>
              <div className="absolute top-0 left-0 w-full h-2 bg-danger shadow-[0_0_30px_#7f1d1d]" />
              
              <h2 className="text-4xl font-black mb-12 uppercase flex items-center gap-6 text-white tracking-tighter">
                <ShieldAlert className="text-danger" size={48}/> {lockdownMode.replace(/_/g, ' ')}
              </h2>

              {isLoading ? (
                <div className="text-center py-32">
                  <div className="animate-spin h-20 w-20 border-4 border-danger border-t-transparent rounded-full mx-auto mb-12"></div>
                  <div className="text-danger font-black text-[12px] tracking-[1em] uppercase animate-pulse">AMON IS ANALYZING YOUR PATTERNS...</div>
                </div>
              ) : (
                <div className="space-y-16">
                   <p className="text-3xl lg:text-5xl text-red-100 italic border-l-8 border-danger pl-12 py-6 leading-tight font-black transition-all">"{currentAiQuestion || 'Identify the source of your divergence.'}"</p>
                   
                   {lockdownMode === 'QUIZ' ? (
                     <div className="space-y-10">
                        {quizData.qs.map((q, i) => (
                          <div key={i} className="space-y-6">
                             <label className="text-[12px] font-black text-gray-500 uppercase tracking-[0.2em]">{q}</label>
                             <input autoFocus={i === 0} value={quizData.ans[i]} onChange={e => { const n = [...quizData.ans]; n[i] = e.target.value; setQuizData({...quizData, ans: n}); }} className="w-full bg-black border-2 border-gray-800 p-8 text-white text-xl outline-none font-mono focus:border-white transition-all shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]" />
                          </div>
                        ))}
                        <button onClick={async () => {
                          setIsLoading(true);
                          const res = await GeminiService.gradeQuiz(quizData.qs, quizData.ans);
                          if (res.passed) {
                            addLog(LogType.QUIZ_SUCCESS, `VERIFICATION PASSED: ${tasks.find(t => t.id === activeTaskId)?.title}`);
                            setTasks(p => p.map(t => t.id === activeTaskId ? { ...t, status: 'COMPLETED' } : t));
                            setLockdownMode('NONE'); setActiveTaskId(null); setView(ViewState.PLANNER); stopAlarm();
                          } else {
                            addLog(LogType.QUIZ_FAILURE, `VERIFICATION FAILED: ${res.feedback}`);
                            setLockdownMode('RESCHEDULE'); setCurrentAiQuestion(`AUDIT_FAILED: ${res.feedback}. Negotiate remediation.`);
                          }
                          setIsLoading(false);
                        }} className="w-full bg-white text-black py-8 font-black uppercase tracking-[0.8em] text-sm lg:text-base hover:bg-gray-200 shadow-2xl transition-all active:scale-95">SUBMIT EVIDENCE FOR AUDIT</button>
                     </div>
                   ) : lockdownMode === 'RESCHEDULE' ? (
                     <div className="flex flex-col items-center gap-14 py-20">
                        <div className="relative">
                          <input type="time" onChange={e => finalizeReschedule(e.target.value)} className="bg-void border-8 border-danger p-14 text-8xl lg:text-[12rem] font-black text-white text-center outline-none shadow-[0_0_100px_rgba(127,29,29,0.4)]" />
                          <div className="absolute -top-6 -right-6 bg-danger text-white p-4 animate-bounce rounded-full shadow-2xl"><Clock size={32}/></div>
                        </div>
                        <p className="text-[12px] text-gray-600 uppercase tracking-[0.6em] font-black">THE REGISTRY DEMANDS A SPECIFIC TIME OF RETURN.</p>
                     </div>
                   ) : (
                     <>
                        <div className="relative group">
                          <textarea autoFocus value={userInput} onChange={e => setUserInput(e.target.value)} className="w-full h-72 bg-black border-2 border-gray-800 p-12 text-white text-xl lg:text-2xl outline-none focus:border-danger transition-all resize-none shadow-[inset_0_0_50px_rgba(0,0,0,1)]" placeholder="State your truth... 50 characters minimum." />
                          <div className={`absolute bottom-6 right-8 text-[12px] font-black tracking-widest ${userInput.length >= 50 ? 'text-success' : 'text-danger'} animate-pulse`}>
                            {userInput.length} / 50 CHARS
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-8">
                           {lockdownMode === 'DELETION_FRICTION' ? (
                             <>
                               <button onClick={() => setLockdownMode('NONE')} className="flex-1 bg-gray-900 text-white py-8 font-black uppercase text-xs lg:text-sm tracking-[0.2em] hover:bg-gray-800 transition-all">RETAIN OBLIGATION</button>
                               <button onClick={() => { if(userInput.length >= 50) { addLog(LogType.OBLIGATION_REPUDIATION, `DELETED: ${tasks.find(t => t.id === pendingDeleteId)?.title}. LOGIC: ${userInput}`); setTasks(p => p.filter(t => t.id !== pendingDeleteId)); setLockdownMode('NONE'); setUserInput(''); } else alert("Admission rejected. Minimum 50 characters required."); }} className="flex-1 bg-danger text-white py-8 font-black uppercase text-xs lg:text-sm tracking-[0.2em] hover:bg-red-900 shadow-2xl transition-all">CONFIRM REPUDIATION</button>
                             </>
                           ) : lockdownMode === 'AMENDMENT_FRICTION' ? (
                             <>
                               <button onClick={() => setLockdownMode('NONE')} className="flex-1 bg-gray-900 text-white py-8 font-black uppercase text-xs lg:text-sm tracking-[0.2em]">CANCEL AMENDMENT</button>
                               <button onClick={() => { if(userInput.length >= 50) { addLog(LogType.CONTRACT_AMENDED, `AMENDED: ${pendingAmendment?.title}. LOGIC: ${userInput}`); setTasks(p => p.map(t => t.id === pendingAmendment?.id ? pendingAmendment! : t)); setLockdownMode('NONE'); setUserInput(''); } else alert("Admission rejected. Minimum 50 characters required."); }} className="flex-1 bg-white text-black py-8 font-black uppercase text-xs lg:text-sm tracking-[0.2em] hover:bg-gray-200 shadow-2xl transition-all">COMMIT AMENDMENT</button>
                             </>
                           ) : (
                             <button onClick={() => { if(userInput.length >= 50) { if(lockdownMode === 'GAUNTLET') finalizeYield(); else { addLog(LogType.VOID_EXPLANATION, userInput); setLockdownMode('NONE'); stopAlarm(); } } else alert("Admission rejected. Minimum 50 characters required."); }} className="w-full bg-white text-black py-10 font-black uppercase tracking-[1em] text-sm lg:text-base shadow-[0_0_100px_rgba(255,255,255,0.1)] hover:bg-danger hover:text-white transition-all active:scale-95">COMMIT TO REGISTRY</button>
                           )}
                        </div>
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
