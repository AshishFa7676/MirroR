
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LogEntry, LogType, Task, ViewState, UserProfile, JournalEntry, PomodoroState } from './types';
import { StorageService } from './services/storageService';
import { soundService } from './services/soundService';
import { Onboarding } from './components/Onboarding';
import { ActivityLog } from './components/ActivityLog';
import { Journal } from './components/Journal';
import Analytics from './components/Analytics';
import { Planner } from './components/Planner';
import { ReflectionSession } from './components/ReflectionSession';
import { TaskCard } from './components/TaskCard';
import { SocraticGatekeeper } from './components/SocraticGatekeeper';
import { CompletionVerifier } from './components/CompletionVerifier';
import { ShieldLog } from './components/ShieldLog';
import { CreateTaskDialog } from './components/CreateTaskDialog';
import { 
  LayoutDashboard, CheckSquare, Book, Activity, User, 
  Plus, Flame, Target, Clock, Settings, Pause, Play, History
} from 'lucide-react';

// --- HELPERS ---
const generateId = () => crypto.randomUUID();

const isTaskBlocked = (task: Task, allTasks: Task[]) => {
  if (!task.dependencies || task.dependencies.length === 0) return false;
  const dependencies = allTasks.filter(t => task.dependencies.includes(t.id));
  return dependencies.some(t => t.status !== 'COMPLETED');
};

// --- COMPONENTS ---

interface SidebarProps {
  view: ViewState;
  setView: (v: ViewState) => void;
  profile: UserProfile | null;
}

const Sidebar: React.FC<SidebarProps> = ({ view, setView, profile }) => {
  const items = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: ViewState.TASKS, label: 'Planner', icon: <CheckSquare size={20} /> },
    { id: ViewState.JOURNAL, label: 'Journal', icon: <Book size={20} /> },
    { id: ViewState.ANALYTICS, label: 'Patterns', icon: <Activity size={20} /> },
    { id: ViewState.HISTORY, label: 'The Ledger', icon: <History size={20} /> },
  ];

  return (
    <div className="w-64 bg-surface border-r border-border h-screen flex flex-col hidden md:flex shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold shadow-glow">
            <Flame size={18} fill="white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">MIRROR</span>
        </div>
        <p className="text-[10px] text-gray-500 font-mono pl-11">NO ESCAPES.</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => { soundService.playClick(); setView(item.id); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              view === item.id 
                ? 'bg-gradient-primary text-white shadow-glow' 
                : 'text-gray-400 hover:bg-card hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-gray-400">
            <User size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">Analyst</span>
            <span className="text-[10px] text-gray-500 font-mono">Debt: {Math.floor(profile?.integrityDebt || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PomodoroWidgetProps {
  state: PomodoroState;
  onToggle: () => void;
  onReset: () => void;
  onUpdateSettings: (work: number, breakMin: number) => void;
}

const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({ 
  state, 
  onToggle, 
  onReset, 
  onUpdateSettings 
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const getDisplayTime = () => {
    if (!state.isActive || !state.startTime) {
      return state.durationMinutes * 60;
    }
    const elapsedSeconds = Math.floor((now - state.startTime) / 1000);
    const remaining = (state.durationMinutes * 60) - elapsedSeconds;
    return Math.max(0, remaining);
  };

  const secondsLeft = getDisplayTime();
  const mins = Math.floor(secondsLeft / 60);
  const secs = Math.floor(secondsLeft % 60);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden h-full flex flex-col justify-between">
      {showSettings && (
        <div className="absolute inset-0 bg-surface/95 z-20 flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Timer Config</h3>
          <div className="flex gap-4">
             <div className="text-center">
               <label className="text-[10px] text-gray-500 uppercase block mb-1">Work</label>
               <input id="pomoWork" type="number" defaultValue={state.settings.work} className="bg-black border border-gray-700 w-16 p-2 text-white text-center rounded text-sm"/>
             </div>
             <div className="text-center">
               <label className="text-[10px] text-gray-500 uppercase block mb-1">Break</label>
               <input id="pomoBreak" type="number" defaultValue={state.settings.break} className="bg-black border border-gray-700 w-16 p-2 text-white text-center rounded text-sm"/>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(false)} className="text-xs text-gray-500 px-4 py-2 hover:text-white">Cancel</button>
            <button onClick={() => {
              const w = parseInt((document.getElementById('pomoWork') as HTMLInputElement).value) || 25;
              const b = parseInt((document.getElementById('pomoBreak') as HTMLInputElement).value) || 5;
              onUpdateSettings(w, b);
              setShowSettings(false);
            }} className="text-xs bg-primary text-white px-4 py-2 rounded font-bold">Save</button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 text-white font-bold">
          <Clock size={18} className={state.isBreak ? "text-success" : "text-primary"} />
          <span>{state.isBreak ? "Recovery Protocol" : "Deep Work Cycle"}</span>
        </div>
        <Settings size={16} className="text-gray-600 hover:text-white cursor-pointer" onClick={() => setShowSettings(true)} />
      </div>
      
      <div className="text-center py-4">
        <div className={`text-7xl font-mono font-bold tracking-tighter tabular-nums ${state.isBreak ? 'text-success' : 'text-white'}`}>
          {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </div>
        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-2">
          {state.isActive ? "Focus Locked" : "System Idle"}
        </div>
      </div>

      <div className="flex justify-center gap-2">
         <button onClick={() => { soundService.playClick(); onReset(); }} className="p-3 rounded-full bg-surface border border-border text-gray-400 hover:text-white hover:border-gray-600 transition-all">
           <History size={18} />
         </button>
         <button 
           onClick={() => { soundService.playClick(); onToggle(); }}
           className="px-8 py-3 bg-white text-black rounded-full font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-gray-200 transition-colors"
         >
           {state.isActive ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" />}
           {state.isActive ? "Pause" : "Start"}
         </button>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.ONBOARDING);
  
  // GLOBAL STATE
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [pomodoro, setPomodoro] = useState<PomodoroState>({
    id: 'global_pomodoro',
    isActive: false,
    isBreak: false,
    durationMinutes: 25,
    settings: { work: 25, break: 5 }
  });

  const lastActionTime = useRef(Date.now());
  const notifRef = useRef<Record<string, number>>({}); 

  // GLOBAL MODAL STATE
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // GLOBAL INTERVENTION MODALS
  const [gatekeeperTask, setGatekeeperTask] = useState<Task | null>(null);
  const [verifierTask, setVerifierTask] = useState<Task | null>(null);

  // --- PERSISTENCE & INIT ---
  useEffect(() => {
    const load = async () => {
      // WAKE UP AUDIO CONTEXT on first click
      const resumeAudio = () => {
        soundService.playClick(); 
        window.removeEventListener('click', resumeAudio);
      };
      window.addEventListener('click', resumeAudio);

      const p = await StorageService.getAll('profile');
      const t = await StorageService.getAll('tasks');
      const l = await StorageService.getAll('logs');
      const j = await StorageService.getAll('journals');
      const pomo = await StorageService.get('pomodoro', 'global_pomodoro');
      
      if (p.length > 0) {
        setProfile(p[0]);
        setView(ViewState.DASHBOARD);
      }
      setTasks(t);
      setLogs(l.sort((a,b) => b.timestamp - a.timestamp));
      setJournals(j.sort((a,b) => b.timestamp - a.timestamp));
      if (pomo) setPomodoro(pomo);

      if ('Notification' in window && Notification.permission !== 'granted') {
         Notification.requestPermission();
      }
    };
    load();
  }, []);

  const saveLog = (type: LogType, content: string, metadata?: any) => {
    lastActionTime.current = Date.now(); 
    const log: LogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      content,
      metadata
    };
    
    // Optimistic Update & Sync Save
    setLogs(prev => [log, ...prev]);
    StorageService.add('logs', log).catch(err => console.error("Log save failed", err));
  };
  
  const savePomodoro = (newState: PomodoroState) => {
    setPomodoro(newState);
    StorageService.save('pomodoro', newState);
  };

  const handleSaveReportToJournal = (reportContent: string) => {
      const now = new Date();
      const hour = now.getHours();
      let timeOfDay: JournalEntry['metadata']['time_of_day'] = 'night';
      if (hour >= 5 && hour < 12) timeOfDay = 'morning';
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
      else if (hour >= 17 && hour < 21) timeOfDay = 'evening';

      const entry: JournalEntry = {
          id: generateId(),
          timestamp: Date.now(),
          startTime: Date.now(),
          content: reportContent,
          metadata: {
              word_count: reportContent.split(' ').length,
              char_count: reportContent.length,
              writing_duration_seconds: 0,
              keystrokes: 0,
              pauses: 0,
              words_per_minute: 0,
              time_of_day: timeOfDay,
              hour_of_day: hour,
              day_of_week: now.toLocaleDateString('en-US', { weekday: 'long' })
          }
      };
      
      setJournals(prev => [entry, ...prev]);
      StorageService.add('journals', entry);
      saveLog(LogType.JOURNAL_DUMP, "Deep Analysis Report saved to Journal.", { reportLength: reportContent.length });
  };

  // --- BACKGROUND PROCESSES (NOTIFICATIONS) ---
  useEffect(() => {
    const interval = setInterval(() => {
       const now = Date.now();
       
       if (pomodoro.isActive && pomodoro.startTime) {
           const elapsed = Math.floor((now - pomodoro.startTime) / 1000);
           const totalSeconds = pomodoro.durationMinutes * 60;
           if (elapsed >= totalSeconds) {
               soundService.playAlarm();
               // Haptic feedback for mobile
               if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
               
               saveLog(LogType.POMODORO_SESSION, `${pomodoro.isBreak ? 'Recovery' : 'Work'} cycle complete.`);
               if ('Notification' in window && Notification.permission === 'granted') {
                   new Notification('Timer Complete', { body: 'Cycle finished. Report to console.' });
               }
               savePomodoro({ ...pomodoro, isActive: false, startTime: undefined });
           }
       }

       tasks.forEach(t => {
          if (t.status === 'SCHEDULED' && t.scheduledTimestamp && t.remindersEnabled) {
              const diffMs = t.scheduledTimestamp - now;
              const diffMin = Math.floor(diffMs / 60000);
              const triggers = [10, 5, 2];
              
              if (triggers.includes(diffMin)) {
                  const key = `${t.id}-remind-${diffMin}`;
                  if (!notifRef.current[key]) {
                      notifRef.current[key] = now;
                      soundService.playAlarm();
                      if (navigator.vibrate) navigator.vibrate(200);
                      if ('Notification' in window && Notification.permission === 'granted') {
                         const n = new Notification(`Task Starting Soon: ${t.title}`, { 
                             body: `${diffMin} minutes remaining. Prepare for execution.`,
                             requireInteraction: true 
                         });
                         n.onclick = () => window.focus();
                      }
                  }
              }
          }

          if (t.status === 'PAUSED' && t.pausedUntil) {
             const leftMs = t.pausedUntil - now;
             
             if (leftMs <= 5000 && leftMs > 0) {
                 const key = `${t.id}-pause-warn`;
                 if (!notifRef.current[key]) {
                     notifRef.current[key] = now;
                     soundService.playAlarm(); 
                     if (navigator.vibrate) navigator.vibrate(200);
                     if ('Notification' in window && Notification.permission === 'granted') {
                         const n = new Notification('BREAK ENDING', { 
                             body: `Return to: ${t.title} immediately.`,
                             requireInteraction: true 
                         });
                         n.onclick = () => window.focus();
                     }
                 }
             }

             if (leftMs <= 0) {
                 soundService.playAlarm(); 
                 
                 const key = `${t.id}-pause-end-log`;
                 if (!notifRef.current[key]) {
                     notifRef.current[key] = now;
                     saveLog(LogType.ALARM_TRIGGERED, `Break ended for ${t.title}. Alarm engaged.`);
                 }
             }
          }
       });

       const hasActiveTask = tasks.some(t => t.status === 'IN_PROGRESS');
       if (hasActiveTask) {
         const inactivityTime = now - lastActionTime.current;
         if (inactivityTime > 45 * 60 * 1000 && inactivityTime < (45 * 60 * 1000 + 2000)) {
           if ('Notification' in window && Notification.permission === 'granted') {
             new Notification('Inertia Detected', { body: 'Are you working or drifting? Log your status.' });
           }
           soundService.playError();
           saveLog(LogType.GHOSTING_DETECTED, "System detected prolonged inactivity during active protocol.");
         }
       }

    }, 1000);
    return () => clearInterval(interval);
  }, [tasks, pomodoro]);

  // --- HANDLERS ---
  const handleTaskStart = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    if (task.dependencies && task.dependencies.length > 0) {
        const blocking = tasks.filter(t => task.dependencies.includes(t.id) && t.status !== 'COMPLETED');
        if (blocking.length > 0) {
            alert(`BLOCKED BY: ${blocking.map(t => t.title).join(', ')}`);
            soundService.playError();
            return;
        }
    }

    const updatedTask: Task = { ...task, status: 'IN_PROGRESS', lastSessionStart: Date.now(), pausedUntil: undefined };
    // Atomic Update Pattern
    const newTasks = tasks.map(t => t.id === id ? updatedTask : t);
    setTasks(newTasks);
    StorageService.saveItem('tasks', updatedTask);
    saveLog(LogType.TASK_STARTED, `Execution initiated: ${task.title}`);
  };

  const handleTaskPause = useCallback((id: string, minutes: number | null, transcript?: string) => {
    setTasks(prev => {
        const task = prev.find(t => t.id === id);
        if (!task) return prev;

        const addedTime = task.lastSessionStart ? Math.floor((Date.now() - task.lastSessionStart)/1000) : 0;
        const updatedTask: Task = {
            ...task,
            status: 'PAUSED',
            accumulatedTimeSeconds: task.accumulatedTimeSeconds + addedTime,
            lastSessionStart: undefined,
            pausedUntil: minutes ? Date.now() + (minutes * 60 * 1000) : undefined,
            escapeAttempts: (task.escapeAttempts || 0) + 1
        };
        
        // Save to DB
        StorageService.saveItem('tasks', updatedTask);
        saveLog(LogType.TASK_PAUSED, `Paused task. Duration: ${minutes}m`, { transcript });

        return prev.map(t => t.id === id ? updatedTask : t);
    });
  }, []);

  const handleTaskComplete = useCallback((id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      
      const addedTime = task.lastSessionStart ? Math.floor((Date.now() - task.lastSessionStart)/1000) : 0;
      const updatedTask: Task = {
        ...task,
        status: 'COMPLETED',
        accumulatedTimeSeconds: task.accumulatedTimeSeconds + addedTime,
        lastSessionStart: undefined,
        pausedUntil: undefined
      };

      StorageService.saveItem('tasks', updatedTask);
      saveLog(LogType.TASK_COMPLETED, `Task verified and completed.`);

      let newTaskList = prev.map(t => t.id === id ? updatedTask : t);

      // Handle recurrence
      if (task.recurrence && task.recurrence !== 'NONE') {
         const nextStart = new Date();
         if (task.recurrence === 'DAILY') nextStart.setDate(nextStart.getDate() + 1);
         if (task.recurrence === 'WEEKLY') nextStart.setDate(nextStart.getDate() + 7);
         
         const nextTask: Task = {
           ...task,
           id: generateId(),
           status: 'SCHEDULED',
           accumulatedTimeSeconds: 0,
           escapeAttempts: 0,
           lastSessionStart: undefined,
           pausedUntil: undefined,
           scheduledTimeStart: nextStart.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
           deadlineTimestamp: undefined,
           remindersEnabled: task.remindersEnabled
         };
         
         StorageService.saveItem('tasks', nextTask);
         newTaskList = [nextTask, ...newTaskList];
      }
      return newTaskList;
    });
  }, []);

  const handleTaskDelete = (id: string, reason: string) => {
    const t = tasks.find(x => x.id === id);
    const newTasks = tasks.filter(x => x.id !== id);
    setTasks(newTasks);
    // Bulk save for deletes to ensure full sync
    StorageService.save('tasks', newTasks); 
    saveLog(LogType.TASK_DELETED, `Task destroyed: ${t?.title}`, { reason });
  };

  const handleSaveTask = (data: Partial<Task>) => {
    soundService.playClick();
    
    if (editingTask) {
        // UPDATE EXISTING
        const updatedTask = { ...editingTask, ...data };
        const newTasks = tasks.map(t => t.id === editingTask.id ? updatedTask : t);
        setTasks(newTasks);
        StorageService.saveItem('tasks', updatedTask);
        saveLog(LogType.CONTRACT_AMENDED, `Obligation updated: ${updatedTask.title}`);
        setEditingTask(null);
    } else {
        // CREATE NEW
        const t: Task = {
            id: generateId(),
            title: data.title!,
            description: data.description,
            category: data.category!,
            tags: [],
            scheduledTimeStart: data.scheduledTimeStart!,
            scheduledTimestamp: data.scheduledTimestamp,
            deadlineTimestamp: data.deadlineTimestamp,
            durationMinutes: data.durationMinutes!,
            recurrence: data.recurrence,
            status: 'SCHEDULED',
            accumulatedTimeSeconds: 0,
            stakes: 'HIGH',
            dependencies: data.dependencies || [],
            subTasks: [],
            escapeAttempts: 0,
            remindersEnabled: data.remindersEnabled ?? true
        };
        const newTasks = [t, ...tasks];
        setTasks(newTasks);
        StorageService.saveItem('tasks', t);
        saveLog(LogType.CONTRACT_SIGNED, `Obligation etched: ${t.title}`);
    }
    setIsTaskModalOpen(false);
  };

  const handleOpenEdit = (task: Task) => {
      setEditingTask(task);
      setIsTaskModalOpen(true);
  };

  const handleOpenCreate = () => {
      setEditingTask(null);
      setIsTaskModalOpen(true);
  };

  if (view === ViewState.ONBOARDING) {
    return <Onboarding onComplete={(p) => { 
      setProfile(p); 
      StorageService.save('profile', p);
      setView(ViewState.DASHBOARD); 
    }} addLog={saveLog} />;
  }

  const activeTasks = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PAUSED');
  const pendingTasks = tasks.filter(t => t.status === 'SCHEDULED');
  const integrity = tasks.length ? Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100) : 100;

  return (
    <div className="flex h-screen bg-background text-gray-300 font-sans selection:bg-primary/30 overflow-hidden">
      <Sidebar view={view} setView={setView} profile={profile} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 border-b border-border flex items-center justify-between px-6 md:px-8 bg-surface/50 backdrop-blur-md z-10 shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{view.charAt(0) + view.slice(1).toLowerCase()}</h1>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium">Face your tasks. No escapes.</p>
          </div>
          <div className="flex gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Integrity</span>
                <span className={`text-xl font-black ${integrity < 50 ? 'text-danger' : 'text-success'}`}>{integrity}%</span>
             </div>
             {view === ViewState.DASHBOARD && (
               <button 
                onClick={handleOpenCreate}
                className="bg-gradient-primary hover:brightness-110 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-glow transition-all flex items-center gap-2"
              >
                <Plus size={18} strokeWidth={3} /> <span className="hidden md:inline">Quick Task</span>
              </button>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-0 scrollbar-hide pb-24 relative">
          
          {view === ViewState.DASHBOARD && (
            <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-80">
                <PomodoroWidget 
                  state={pomodoro} 
                  onToggle={() => pomodoro.isActive ? savePomodoro({...pomodoro, isActive:false}) : savePomodoro({...pomodoro, isActive:true, startTime: Date.now()})} 
                  onReset={() => savePomodoro({...pomodoro, isActive:false, startTime:undefined})} 
                  onUpdateSettings={(w, b) => savePomodoro({...pomodoro, settings:{work:w, break:b}, durationMinutes:w, isActive:false, startTime:undefined})} 
                />
                
                <ReflectionSession 
                   onAddLog={saveLog} 
                   onSaveJournal={handleSaveReportToJournal} 
                />
              </div>

              {/* INTEGRATED SHIELD LOG */}
              <div className="lg:col-span-2">
                 <ShieldLog onLogShield={(s) => saveLog(LogType.SHIELD_LOGGED, `Shield activated: ${s}`)} />
              </div>

              <div>
                 <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Flame size={18} className="text-primary"/> Active Front</h2>
                 {activeTasks.length === 0 && (
                   <div className="text-center p-8 border border-dashed border-border rounded-xl text-gray-600 text-sm">No active operations. Initiate a protocol.</div>
                 )}
                 {activeTasks.map(t => (
                   <TaskCard 
                      key={t.id} 
                      task={t} 
                      onStart={() => handleTaskStart(t.id)} 
                      onRequestPause={() => setGatekeeperTask(t)}
                      onRequestComplete={() => setVerifierTask(t)}
                      onDelete={(r) => handleTaskDelete(t.id, r)}
                      onRequestReschedule={() => handleOpenEdit(t)}
                      isBlocked={isTaskBlocked(t, tasks)}
                    />
                 ))}
              </div>

              <div>
                 <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Target size={18} className="text-gray-400"/> Pending Protocols</h2>
                 {pendingTasks.map(t => (
                   <TaskCard 
                      key={t.id} 
                      task={t} 
                      onStart={() => handleTaskStart(t.id)} 
                      onRequestPause={() => setGatekeeperTask(t)}
                      onRequestComplete={() => setVerifierTask(t)}
                      onDelete={(r) => handleTaskDelete(t.id, r)}
                      onRequestReschedule={() => handleOpenEdit(t)}
                      isBlocked={isTaskBlocked(t, tasks)}
                    />
                 ))}
              </div>
            </div>
          )}

          {view === ViewState.TASKS && (
            <Planner 
              tasks={tasks} 
              onAddTaskRequest={handleOpenCreate}
              onEditTaskRequest={handleOpenEdit}
              onDeleteTask={(id) => handleTaskDelete(id, "Deleted from planner")} 
              onStartTask={handleTaskStart} 
              onRequestPause={setGatekeeperTask}
              onRequestComplete={setVerifierTask}
              sprintGoals={profile?.sprintGoals || []} 
            />
          )}
          {view === ViewState.ANALYTICS && (
            <Analytics 
              logs={logs} 
              tasks={tasks} 
              profile={profile!} 
              journals={journals} 
              onSaveReport={handleSaveReportToJournal}
            />
          )}
          {view === ViewState.HISTORY && <ActivityLog logs={logs} />}
          {view === ViewState.JOURNAL && (
            <Journal 
              journals={journals} 
              setJournals={(fn) => {
                 if (typeof fn === 'function') {
                   setJournals(prev => {
                     const next = fn(prev);
                     StorageService.save('journals', next);
                     return next;
                   });
                 } else {
                   setJournals(fn);
                   StorageService.save('journals', fn);
                 }
              }} 
              profile={profile!} 
              onAddLog={saveLog} 
            />
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-border bg-surface/90 backdrop-blur-xl p-4 flex justify-around fixed bottom-0 left-0 w-full z-50">
           <button onClick={() => setView(ViewState.DASHBOARD)} className={view === ViewState.DASHBOARD ? 'text-primary' : 'text-gray-500'}><LayoutDashboard /></button>
           <button onClick={() => setView(ViewState.TASKS)} className={view === ViewState.TASKS ? 'text-primary' : 'text-gray-500'}><CheckSquare /></button>
           <button onClick={handleOpenCreate} className="bg-gradient-primary rounded-full p-3 -mt-8 shadow-glow text-white"><Plus /></button>
           <button onClick={() => setView(ViewState.ANALYTICS)} className={view === ViewState.ANALYTICS ? 'text-primary' : 'text-gray-500'}><Activity /></button>
           <button onClick={() => setView(ViewState.JOURNAL)} className={view === ViewState.JOURNAL ? 'text-primary' : 'text-gray-500'}><User /></button>
        </div>
      </main>

      {/* GLOBAL CREATE/EDIT TASK MODAL */}
      <CreateTaskDialog 
         isOpen={isTaskModalOpen}
         onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
         onSave={handleSaveTask}
         tasks={tasks}
         initialTask={editingTask}
      />

      {/* GLOBAL INTERVENTION MODALS */}
      {gatekeeperTask && (
        <SocraticGatekeeper 
          taskTitle={gatekeeperTask.title} 
          onAllowPause={(duration, transcript) => {
             handleTaskPause(gatekeeperTask.id, duration, transcript);
             setGatekeeperTask(null);
          }}
          onCancel={() => setGatekeeperTask(null)}
        />
      )}

      {verifierTask && (
        <CompletionVerifier 
          task={verifierTask}
          onVerified={() => {
             handleTaskComplete(verifierTask.id);
             setVerifierTask(null);
          }}
          onFail={(shouldReschedule) => {
             setVerifierTask(null);
             if (shouldReschedule) {
                // Open the modal for rescheduling instead of blind 1-hour bump
                handleOpenEdit(verifierTask);
             }
          }}
          onCancel={() => setVerifierTask(null)}
        />
      )}
    </div>
  );
}
