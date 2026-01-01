
import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Clock, Play, Pause, CheckSquare, X, Flame, CalendarClock, Trash2, AlertOctagon, Lock, Bell, Edit2 } from 'lucide-react';
import { soundService } from '../services/soundService';

interface TaskCardProps {
  task: Task;
  onStart: () => void;
  onRequestPause: () => void; // Parent opens Gatekeeper
  onRequestComplete: () => void; // Parent opens Verifier
  onDelete: (reason: string) => void;
  onRequestReschedule: () => void;
  isBlocked?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onStart, 
  onRequestPause, 
  onRequestComplete, 
  onDelete,
  onRequestReschedule,
  isBlocked = false
}) => {
  const [showDeleteResistance, setShowDeleteResistance] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [mode, setMode] = useState<'CHOICE' | 'DESTROY'>('CHOICE');
  const [now, setNow] = useState(Date.now());

  // Timer logic
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const sessionDuration = (task.status === 'IN_PROGRESS' && task.lastSessionStart) 
    ? Math.floor((now - task.lastSessionStart) / 1000) 
    : 0;
  const totalSeconds = task.accumulatedTimeSeconds + sessionDuration;
  
  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  const handleStart = () => {
    if (isBlocked) {
        soundService.playError();
        return;
    }
    soundService.playStart();
    onStart();
  };

  const handlePauseRequest = () => {
    soundService.playClick();
    onRequestPause(); // Trigger Gatekeeper in parent
  };

  const handleCompleteRequest = () => {
    soundService.playClick();
    onRequestComplete(); // Trigger Verifier in parent
  };

  const handleDestroy = () => {
    if (deleteInput === "I ABANDON MY DUTY") {
      soundService.playError();
      onDelete("DESTRUCTIVE_ABANDONMENT");
    }
  };

  const getBreakCountdown = (task: Task) => {
    if (!task.pausedUntil) return "00:00";
    const diff = Math.max(0, Math.floor((task.pausedUntil - now) / 1000));
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  return (
    <div className={`p-5 rounded-2xl bg-card border ${task.status === 'IN_PROGRESS' ? 'border-primary/50 shadow-[0_0_15px_-5px_rgba(249,115,22,0.3)]' : task.status === 'PAUSED' ? 'border-warning/30' : 'border-border'} relative overflow-hidden group mb-4 transition-all ${isBlocked ? 'opacity-75 grayscale' : ''}`}>
      
      {/* DELETION RESISTANCE MODAL OVERLAY */}
      {showDeleteResistance && (
        <div className="absolute inset-0 bg-black/95 z-30 flex flex-col items-center justify-center p-6 border-2 border-danger animate-in zoom-in-95">
           {mode === 'CHOICE' ? (
             <div className="text-center w-full">
               <AlertOctagon className="text-warning mx-auto mb-2" size={32} />
               <h3 className="text-white font-black uppercase text-sm mb-4">Resistance Detected</h3>
               <p className="text-gray-400 text-xs mb-6">You are attempting to delete an active protocol. This is logged as failure.</p>
               <div className="flex gap-3">
                 <button 
                    onClick={() => { setShowDeleteResistance(false); onRequestReschedule(); }} 
                    className="flex-1 bg-white text-black py-3 text-xs font-bold uppercase rounded hover:bg-gray-200"
                 >
                   <CalendarClock size={14} className="inline mr-1"/> Reschedule
                 </button>
                 <button 
                    onClick={() => setMode('DESTROY')} 
                    className="flex-1 bg-danger/20 text-danger border border-danger/50 py-3 text-xs font-bold uppercase rounded hover:bg-danger hover:text-white transition-colors"
                 >
                   <Trash2 size={14} className="inline mr-1"/> Destroy
                 </button>
               </div>
               <button onClick={() => setShowDeleteResistance(false)} className="mt-4 text-[10px] text-gray-500 underline">Cancel</button>
             </div>
           ) : (
             <div className="text-center w-full">
               <h4 className="text-danger font-black mb-2 text-xs uppercase tracking-widest">Type to Confirm</h4>
               <p className="text-gray-500 text-[10px] mb-4 font-mono">"I ABANDON MY DUTY"</p>
               <input 
                 value={deleteInput}
                 onChange={e => setDeleteInput(e.target.value)}
                 placeholder="..."
                 className="w-full bg-surface border border-danger/50 p-3 text-white text-xs mb-3 focus:outline-none font-mono text-center uppercase"
                 autoFocus
               />
               <div className="flex gap-2 w-full">
                 <button onClick={() => setShowDeleteResistance(false)} className="flex-1 bg-surface border border-gray-700 text-gray-400 py-3 text-xs font-bold uppercase">Cancel</button>
                 <button 
                   disabled={deleteInput !== "I ABANDON MY DUTY"} 
                   onClick={handleDestroy} 
                   className="flex-1 bg-danger text-white py-3 text-xs font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Execute
                 </button>
               </div>
             </div>
           )}
        </div>
      )}

      {/* Main Card Content */}
      <div className="flex justify-between items-start mb-4">
         <div>
            <h3 className="text-lg font-bold text-white mb-1 leading-tight">{task.title}</h3>
            <div className="flex gap-2 flex-wrap mt-2">
               {task.tags.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-gray-500 font-mono">{t}</span>)}
               {task.status === 'IN_PROGRESS' && <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 font-bold"><Flame size={10}/> EXECUTING</span>}
               {isBlocked && <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-gray-700 text-gray-500 flex items-center gap-1 font-bold"><Lock size={10}/> LOCKED</span>}
               {task.scheduledTimeStart && <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-gray-500 flex items-center gap-1 font-mono"><Clock size={10}/> {task.scheduledTimeStart}</span>}
               {task.remindersEnabled && <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-gray-500"><Bell size={10}/></span>}
            </div>
         </div>
         <button onClick={() => { soundService.playClick(); setShowDeleteResistance(true); }} className="text-gray-700 hover:text-danger p-1"><X size={16}/></button>
      </div>

      <div className="bg-surface/50 rounded-xl p-3 mb-4 flex items-center justify-between border border-white/5">
         <div className="flex items-center gap-2">
            <Clock size={16} className={task.status === 'IN_PROGRESS' ? "text-primary animate-pulse" : "text-gray-600"}/>
            <span className="font-mono text-xl text-white font-bold tracking-tight">{formatTime(totalSeconds)}</span>
         </div>
         {task.status === 'PAUSED' && (
            <div className="text-warning font-mono text-xs font-bold flex items-center gap-1 animate-pulse">
                PAUSED: {getBreakCountdown(task)}
            </div>
         )}
      </div>

      <div className="flex gap-2">
         {task.status === 'IN_PROGRESS' ? (
           <>
            <button onClick={handlePauseRequest} className="flex-1 bg-surface border border-border text-white py-3 rounded-lg text-xs font-bold hover:bg-white/10 flex items-center justify-center gap-2 uppercase tracking-wide">
              <Pause size={14} /> Pause
            </button>
            <button onClick={handleCompleteRequest} className="flex-1 bg-success/10 text-success border border-success/30 py-3 rounded-lg text-xs font-bold hover:bg-success/20 flex items-center justify-center gap-2 uppercase tracking-wide">
               <CheckSquare size={14} /> Finish
            </button>
           </>
         ) : task.status !== 'COMPLETED' ? (
           <>
            {task.status === 'PAUSED' ? (
                <button onClick={handleStart} className="flex-1 py-3 bg-white text-black rounded-lg text-xs font-bold hover:bg-gray-200 flex items-center justify-center gap-2 uppercase tracking-wide">
                   <Play size={14} /> Resume
                </button>
            ) : (
                <button 
                    onClick={handleStart} 
                    disabled={isBlocked}
                    className={`flex-1 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-wide transition-all ${isBlocked ? 'bg-surface border border-border text-gray-500 cursor-not-allowed' : 'bg-gradient-primary text-white shadow-glow hover:brightness-110'}`}
                >
                  {isBlocked ? <Lock size={14}/> : <Play size={14}/>} Initiate
                </button>
            )}
            
            <button onClick={onRequestReschedule} className="p-3 bg-surface border border-border text-gray-500 rounded-lg hover:text-white">
               <Edit2 size={16}/>
            </button>
           </>
         ) : (
           <div className="w-full text-center text-xs font-bold text-success uppercase py-3 border border-success/30 bg-success/10 rounded-lg">
             Protocol Complete
           </div>
         )}
      </div>
    </div>
  );
};
