
import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Clock, Bell, BellOff, X } from 'lucide-react';
import { soundService } from '../services/soundService';

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  tasks: Task[];
  initialTask?: Task | null;
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ isOpen, onClose, onSave, tasks, initialTask }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<'ANALYST_PREP' | 'LIFE_MAINTENANCE' | 'OTHER'>('ANALYST_PREP');
  const [duration, setDuration] = useState(60);
  const [recurrence, setRecurrence] = useState<'NONE' | 'DAILY' | 'WEEKLY'>('NONE');
  
  const [startTime, setStartTime] = useState('');
  const [deadline, setDeadline] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [dependency, setDependency] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setTitle(initialTask.title);
        setDesc(initialTask.description || '');
        setCategory(initialTask.category);
        setDuration(initialTask.durationMinutes);
        if (initialTask.scheduledTimestamp) {
            const d = new Date(initialTask.scheduledTimestamp);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            setStartTime(d.toISOString().slice(0, 16));
        }
        if (initialTask.deadlineTimestamp) {
            const d = new Date(initialTask.deadlineTimestamp);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            setDeadline(d.toISOString().slice(0, 16));
        }
        setRemindersEnabled(initialTask.remindersEnabled ?? true);
        setDependency(initialTask.dependencies?.[0] || '');
      } else {
        // Defaults for new task
        setTitle(''); 
        setDesc(''); 
        setCategory('ANALYST_PREP'); 
        setDuration(60);
        setRecurrence('NONE');
        setDependency(''); 
        setRemindersEnabled(true);
        
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
        nextHour.setMinutes(nextHour.getMinutes() - nextHour.getTimezoneOffset());
        setStartTime(nextHour.toISOString().slice(0, 16));

        const dead = new Date();
        dead.setDate(dead.getDate() + 1);
        dead.setMinutes(dead.getMinutes() - dead.getTimezoneOffset());
        setDeadline(dead.toISOString().slice(0, 16));
      }
    }
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!title.trim()) {
        soundService.playError();
        return;
    }
    if (!startTime) {
        alert("START TIME IS MANDATORY.");
        return;
    }
    soundService.playClick();
    
    const startObj = new Date(startTime);
    const deadlineObj = deadline ? new Date(deadline) : undefined;

    onSave({
      title,
      description: desc,
      category,
      durationMinutes: duration,
      recurrence,
      scheduledTimeStart: startObj.toLocaleTimeString(),
      scheduledTimestamp: startObj.getTime(),
      deadlineTimestamp: deadlineObj?.getTime(),
      dependencies: dependency ? [dependency] : [],
      remindersEnabled
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
        
        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-tight flex items-center gap-2">
           <Clock className="text-primary" size={20}/>
           {initialTask ? 'Reschedule Protocol' : 'New Obligation'}
        </h2>
        
        <div className="space-y-4">
          <div className="space-y-1">
             <label className="text-[10px] text-gray-500 uppercase font-bold">Protocol Title</label>
             <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Master SQL Joins" className="w-full bg-black border border-gray-700 p-3 text-white rounded focus:border-primary outline-none font-bold" autoFocus />
          </div>
          
          <div className="space-y-1">
             <label className="text-[10px] text-gray-500 uppercase font-bold">Details / Criteria</label>
             <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Success looks like..." className="w-full bg-black border border-gray-700 p-3 text-white rounded focus:border-gray-500 outline-none h-20 resize-none text-sm" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] text-gray-500 uppercase block mb-1">Category</label>
               <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-black border border-gray-700 p-2 text-white text-xs rounded outline-none focus:border-primary">
                 <option value="ANALYST_PREP">Analyst Prep</option>
                 <option value="LIFE_MAINTENANCE">Life Maint</option>
                 <option value="OTHER">Other</option>
               </select>
             </div>
             <div>
               <label className="text-[10px] text-gray-500 uppercase block mb-1">Duration (min)</label>
               <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full bg-black border border-gray-700 p-2 text-white text-xs rounded outline-none focus:border-primary" />
             </div>
          </div>

          <div className="border border-gray-800 rounded p-3 bg-black/30">
             <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-800">
                <Clock size={12} className="text-primary"/> 
                <span className="text-[10px] font-bold text-primary uppercase">Temporal Constraints</span>
             </div>
             <div className="space-y-3">
                <div>
                   <label className="text-[10px] text-gray-500 uppercase block mb-1">Start Time (Mandatory)</label>
                   <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-black border border-gray-700 p-2 text-white text-xs rounded font-mono outline-none focus:border-primary" />
                </div>
                <div>
                   <label className="text-[10px] text-gray-500 uppercase block mb-1">Hard Deadline</label>
                   <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-black border border-gray-700 p-2 text-white text-xs rounded font-mono outline-none focus:border-primary" />
                </div>
             </div>
          </div>

          <div className="flex justify-between items-center bg-black/30 p-2 rounded border border-gray-800">
             <div className="flex items-center gap-2">
                {remindersEnabled ? <Bell size={14} className="text-white"/> : <BellOff size={14} className="text-gray-600"/>}
                <span className="text-[10px] uppercase font-bold text-gray-400">System Interruption (Alarm)</span>
             </div>
             <button onClick={() => setRemindersEnabled(!remindersEnabled)} className={`w-10 h-5 rounded-full relative transition-colors ${remindersEnabled ? 'bg-primary' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${remindersEnabled ? 'left-6' : 'left-1'}`}/>
             </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Blocked By</label>
                <select value={dependency} onChange={e => setDependency(e.target.value)} className="w-full bg-black border border-gray-700 p-2 text-white text-xs rounded outline-none focus:border-primary">
                    <option value="">-- None --</option>
                    {tasks.filter((t: Task) => t.status !== 'COMPLETED' && t.id !== initialTask?.id).map((t: Task) => (
                        <option key={t.id} value={t.id}>{t.title.substring(0, 15)}...</option>
                    ))}
                </select>
            </div>
            {!initialTask && (
                <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Recurrence</label>
                <select value={recurrence} onChange={e => setRecurrence(e.target.value as any)} className="w-full bg-black border border-gray-700 p-2 text-white text-xs rounded outline-none focus:border-primary">
                    <option value="NONE">None</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                </select>
                </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-8">
           <button onClick={() => { soundService.playClick(); onClose(); }} className="flex-1 py-3 bg-surface border border-gray-700 text-gray-400 font-bold text-xs hover:text-white rounded hover:bg-gray-800 uppercase tracking-wider">Cancel</button>
           <button onClick={handleSubmit} className="flex-1 py-3 bg-gradient-primary text-white font-bold text-xs rounded shadow-glow hover:brightness-110 uppercase tracking-wider">
             {initialTask ? 'Commit Changes' : 'Initiate Protocol'}
           </button>
        </div>
      </div>
    </div>
  );
};
