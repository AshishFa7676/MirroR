
import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Trash2, ShieldCheck, Zap, Clock, ShieldAlert, Target, Calendar, Edit3, AlertCircle, ArrowRight } from 'lucide-react';

interface PlannerProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (task: Task) => void;
  onStartTask: (id: string) => void;
  sprintGoals: string[];
}

export const Planner: React.FC<PlannerProps> = ({ tasks, onAddTask, onDeleteTask, onUpdateTask, onStartTask, sprintGoals }) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [stakes, setStakes] = useState<'LOW' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleAdd = () => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.toUpperCase(),
      category: 'ANALYST_PREP',
      scheduledTimeStart: time,
      durationMinutes: 60,
      status: 'SCHEDULED',
      actualTimeSpentSeconds: 0,
      stakes
    };
    onAddTask(newTask);
    setTitle('');
  };

  const getTimeRemaining = (scheduledTime: string) => {
    const [h, m] = scheduledTime.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target < now) return "EXPIRED";
    const diff = target.getTime() - now.getTime();
    const hh = Math.floor(diff / 3600000);
    const mm = Math.floor((diff % 3600000) / 60000);
    const ss = Math.floor((diff % 60000) / 1000);
    return `${hh}h ${mm}m ${ss}s`;
  };

  const daysToDeadline = Math.ceil((new Date('2025-12-25').getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="h-full flex flex-col bg-void">
      {/* SPRINT DASHBOARD */}
      <div className="p-8 lg:p-16 border-b-2 border-gray-900 bg-surface/30 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 opacity-5 pointer-events-none">
          <Target size={400} className="text-danger" />
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-12 relative z-10">
          <div>
            <h1 className="text-4xl lg:text-8xl font-black text-white tracking-tighter uppercase leading-none">THE REGISTRY</h1>
            <div className="flex items-center gap-4 mt-6">
              <span className="text-danger font-black text-[10px] lg:text-[12px] uppercase tracking-[0.6em] animate-pulse">ANALYST SPRINT OBLIGATION</span>
              <span className="text-gray-800">/</span>
              <span className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">ZERO TOLERANCE PROTOCOL</span>
            </div>
          </div>
          <div className="flex items-center gap-6 bg-black/60 p-8 border-2 border-danger/20 shadow-[0_0_50px_rgba(127,29,29,0.1)]">
             <div className="h-16 w-1.5 bg-danger shadow-[0_0_20px_#7f1d1d]" />
             <div className="text-left">
                <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-2">DAYS TO COLLAPSE</div>
                <div className="text-5xl font-black text-white tabular-nums leading-none">0{daysToDeadline}</div>
             </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 relative z-10">
           {sprintGoals.map(skill => (
             <div key={skill} className="px-5 py-2 bg-black/50 border border-gray-800 text-[10px] font-black text-gray-500 hover:text-white hover:border-gray-600 transition-all uppercase tracking-widest cursor-default">{skill}</div>
           ))}
        </div>
      </div>

      {/* REGISTRATION FORM */}
      <div className="p-8 lg:p-16 bg-black/40 border-b-2 border-gray-900 space-y-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative group">
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="DEFINE NEW OBLIGATION..." 
              className="w-full bg-surface border-2 border-gray-800 p-8 text-white font-black text-base lg:text-lg focus:border-danger outline-none transition-all placeholder:text-gray-800" 
            />
            <Zap className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-800 group-focus-within:text-danger transition-colors" size={24}/>
          </div>
          <div className="flex gap-6">
            <div className="relative flex-1 lg:w-40">
              <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700" size={18} />
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-surface border-2 border-gray-800 pl-16 pr-6 py-6 text-white font-black text-lg outline-none focus:border-danger" />
            </div>
            <select value={stakes} onChange={e => setStakes(e.target.value as any)} className="bg-surface border-2 border-gray-800 p-6 text-gray-400 font-black text-[11px] outline-none w-full lg:w-48 focus:border-danger">
              <option value="LOW">LOW RISK</option>
              <option value="HIGH">HIGH RISK</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>
        <button onClick={handleAdd} className="w-full bg-white text-black py-8 font-black uppercase tracking-[0.8em] text-xs lg:text-sm hover:bg-danger hover:text-white transition-all shadow-2xl active:scale-95 group">
          ETCH CONTRACT TO REGISTRY <ArrowRight className="inline-block ml-4 group-hover:translate-x-4 transition-transform" size={18}/>
        </button>
      </div>

      {/* TASK LIST */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-16 space-y-6 pb-40 lg:pb-16 scrollbar-hide">
        {tasks.length === 0 && (
          <div className="text-center py-40 opacity-10">
            <ShieldAlert size={120} className="mx-auto mb-10" />
            <p className="text-[14px] font-black uppercase tracking-[1.5em]">NO OBLIGATIONS ETCHED</p>
          </div>
        )}
        {tasks.sort((a,b) => a.scheduledTimeStart.localeCompare(b.scheduledTimeStart)).map(task => {
          const overdue = task.scheduledTimeStart < now.toTimeString().slice(0, 5) && task.status === 'SCHEDULED';
          return (
            <div key={task.id} className={`flex border-2 border-gray-900 bg-surface/20 group hover:bg-surface/50 hover:border-gray-800 transition-all ${task.status === 'COMPLETED' ? 'opacity-20 grayscale scale-[0.98]' : ''}`}>
               <div className={`w-3 ${task.status === 'COMPLETED' ? 'bg-success' : task.stakes === 'CRITICAL' ? 'bg-danger animate-pulse shadow-[0_0_10px_#7f1d1d]' : overdue ? 'bg-red-900' : 'bg-gray-800'}`} />
               <div className="p-8 lg:p-14 flex-1 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase">
                      <span className={overdue ? 'text-danger flex items-center gap-3' : 'text-gray-600 flex items-center gap-3'}>
                        <Calendar size={14}/> TODAY
                      </span>
                      <span className={overdue ? 'text-danger font-bold animate-pulse' : 'text-gray-400'}>{task.scheduledTimeStart}</span>
                      <span className="text-gray-800">/</span>
                      <span className={task.stakes === 'CRITICAL' ? 'text-danger' : 'text-gray-600'}>{task.stakes} PRIORITY</span>
                      {task.status === 'SCHEDULED' && !overdue && (
                        <span className="text-danger flex items-center gap-3 ml-4 bg-danger/10 px-3 py-1 border border-danger/20">
                          <AlertCircle size={12}/> T-{getTimeRemaining(task.scheduledTimeStart)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-none group-hover:text-danger transition-colors">{task.title}</h3>
                  </div>
                  <div className="flex items-center gap-6 w-full lg:w-auto">
                    {task.status === 'SCHEDULED' && (
                      <button 
                        onClick={() => onStartTask(task.id)} 
                        className="flex-1 lg:flex-none bg-white text-black px-16 py-5 text-[12px] font-black uppercase hover:bg-danger hover:text-white transition-all shadow-2xl active:scale-95"
                      >
                        EXECUTE
                      </button>
                    )}
                    {task.status === 'COMPLETED' ? (
                      <ShieldCheck className="text-success" size={40}/>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => onUpdateTask(task)} className="p-5 text-gray-800 hover:text-white hover:bg-white/5 transition-all"><Edit3 size={24}/></button>
                        <button onClick={() => onDeleteTask(task.id)} className="p-5 text-gray-800 hover:text-danger hover:bg-danger/5 transition-all"><Trash2 size={24}/></button>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
