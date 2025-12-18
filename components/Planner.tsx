
import React, { useState, useEffect } from 'react';
import { Task, SubTask } from '../types';
import { Trash2, ShieldCheck, Zap, Clock, ShieldAlert, Target, Calendar, Edit3, AlertCircle, ArrowRight, Plus, CheckSquare, Square, Code, LayoutGrid } from 'lucide-react';

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
  const [subTasks, setSubTasks] = useState<string[]>(['']);
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
      stakes,
      subTasks: subTasks.filter(s => s.trim()).map(s => ({ id: crypto.randomUUID(), title: s, completed: false }))
    };
    onAddTask(newTask);
    setTitle('');
    setSubTasks(['']);
  };

  const daysToDeadline = Math.ceil((new Date('2025-12-25').getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="h-full flex flex-col bg-void">
      <div className="p-6 md:p-12 border-b border-gray-900 bg-surface/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-3xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">THE REGISTRY</h1>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="text-danger font-black text-[8px] md:text-[10px] uppercase tracking-widest animate-pulse">ANALYST SPRINT OBLIGATION</span>
              <span className="text-gray-800">/</span>
              <span className="text-gray-500 font-mono text-[8px] uppercase tracking-widest">ZERO TOLERANCE PROTOCOL</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-black/60 p-4 md:p-6 border border-danger/30 w-fit">
             <div className="h-10 md:h-12 w-1 bg-danger shadow-[0_0_10px_#7f1d1d]" />
             <div className="text-left">
                <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">DAYS TO COLLAPSE</div>
                <div className="text-3xl md:text-4xl font-black text-white tabular-nums leading-none">
                  {daysToDeadline < 10 ? `0${daysToDeadline}` : daysToDeadline}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 py-6 border-b border-gray-900">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
           {sprintGoals.map(goal => (
             <div key={goal} className="border border-gray-800 p-2 text-center text-[8px] font-black text-gray-500 uppercase tracking-tighter hover:border-white hover:text-white transition-colors">
               {goal}
             </div>
           ))}
        </div>
      </div>

      <div className="p-6 md:p-12 bg-black/40 border-b border-gray-900 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="DEFINE NEW OBLIGATION..." 
              className="w-full bg-surface border border-gray-800 p-5 text-white font-black text-sm md:text-base focus:border-danger outline-none transition-all placeholder:text-gray-800" 
            />
            <Zap className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-800 group-focus-within:text-danger" size={18}/>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" size={14} />
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-surface border border-gray-800 pl-10 pr-4 py-3 text-white font-black text-xs outline-none focus:border-danger" />
            </div>
            <select value={stakes} onChange={e => setStakes(e.target.value as any)} className="bg-surface border border-gray-800 p-3 text-gray-500 font-black text-[9px] outline-none focus:border-danger uppercase">
              <option value="LOW">LOW RISK</option>
              <option value="HIGH">HIGH RISK</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>
        <button onClick={handleAdd} className="w-full bg-white text-black py-5 font-black uppercase tracking-[0.5em] text-[10px] hover:bg-danger hover:text-white transition-all group">
          ETCH TO REGISTRY
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-4 pb-32 lg:pb-12 scrollbar-hide">
        {tasks.length === 0 && (
          <div className="text-center py-20 opacity-10">
            <LayoutGrid size={48} className="mx-auto mb-4" />
            <p className="text-[10px] font-black tracking-widest uppercase">Registry Empty</p>
          </div>
        )}
        {tasks.sort((a,b) => a.scheduledTimeStart.localeCompare(b.scheduledTimeStart)).map(task => {
          const overdue = task.scheduledTimeStart < now.toTimeString().slice(0, 5) && task.status === 'SCHEDULED';
          return (
            <div key={task.id} className={`flex border border-gray-900 bg-surface/20 group hover:bg-surface/50 transition-all ${task.status === 'COMPLETED' ? 'opacity-30' : ''}`}>
               <div className={`w-1.5 ${task.status === 'COMPLETED' ? 'bg-success' : task.stakes === 'CRITICAL' ? 'bg-danger animate-pulse' : overdue ? 'bg-red-900' : 'bg-gray-800'}`} />
               <div className="p-5 md:p-8 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-4 text-[8px] font-black uppercase">
                      <span className={overdue ? 'text-danger' : 'text-gray-600'}>{task.scheduledTimeStart}</span>
                      <span className="text-gray-800">/</span>
                      <span className={task.stakes === 'CRITICAL' ? 'text-danger' : 'text-gray-600'}>{task.stakes}</span>
                    </div>
                    <h3 className="text-lg md:text-3xl font-black text-white tracking-tighter uppercase leading-none group-hover:text-danger transition-colors">{task.title}</h3>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    {task.status === 'SCHEDULED' && (
                      <button onClick={() => onStartTask(task.id)} className="flex-1 md:flex-none bg-white text-black px-8 py-3 text-[10px] font-black uppercase hover:bg-danger hover:text-white transition-all">EXECUTE</button>
                    )}
                    {task.status === 'COMPLETED' ? (
                      <ShieldCheck className="text-success" size={24}/>
                    ) : (
                      <div className="flex gap-1">
                        <button onClick={() => onDeleteTask(task.id)} className="p-3 text-gray-800 hover:text-danger"><Trash2 size={18}/></button>
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
