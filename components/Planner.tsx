
import React, { useState } from 'react';
import { Task } from '../types';
import { Clock } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { soundService } from '../services/soundService';

interface PlannerProps {
  tasks: Task[];
  onAddTaskRequest: () => void; // Parent opens modal
  onEditTaskRequest: (task: Task) => void; // Parent opens modal
  onDeleteTask: (id: string) => void;
  onStartTask: (id: string) => void;
  onRequestPause: (task: Task) => void;
  onRequestComplete: (task: Task) => void;
  sprintGoals: string[];
}

export const Planner: React.FC<PlannerProps> = ({ 
    tasks, 
    onAddTaskRequest,
    onEditTaskRequest,
    onDeleteTask, 
    onStartTask,
    onRequestPause,
    onRequestComplete
}) => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACTIVE' | 'COMPLETED'>('PENDING');

  const pending = tasks.filter(t => t.status === 'SCHEDULED' || t.status === 'MISSED');
  const active = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PAUSED');
  const completed = tasks.filter(t => t.status === 'COMPLETED');

  const currentList = activeTab === 'ACTIVE' ? active : activeTab === 'PENDING' ? pending : completed;

  const isTaskBlocked = (task: Task) => {
    if (!task.dependencies || task.dependencies.length === 0) return false;
    const dependencies = tasks.filter(t => task.dependencies.includes(t.id));
    return dependencies.some(t => t.status !== 'COMPLETED');
  };

  return (
    <div className="h-full flex flex-col bg-void relative">
      <div className="p-6 md:p-8 border-b border-border bg-surface/30 flex justify-between items-center shrink-0">
        <div>
           <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Operations</h1>
           <div className="flex gap-4 mt-2">
             <button onClick={() => { soundService.playClick(); setActiveTab('ACTIVE'); }} className={`text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'ACTIVE' ? 'text-primary border-primary' : 'text-gray-500 border-transparent'}`}>Active ({active.length})</button>
             <button onClick={() => { soundService.playClick(); setActiveTab('PENDING'); }} className={`text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'PENDING' ? 'text-white border-white' : 'text-gray-500 border-transparent'}`}>Pending ({pending.length})</button>
             <button onClick={() => { soundService.playClick(); setActiveTab('COMPLETED'); }} className={`text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'COMPLETED' ? 'text-white border-white' : 'text-gray-500 border-transparent'}`}>Completed ({completed.length})</button>
           </div>
        </div>
        <button onClick={() => { soundService.playClick(); onAddTaskRequest(); }} className="bg-white text-black p-3 rounded-full hover:bg-gray-200 transition-colors shadow-glow">
          <Clock size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 scrollbar-hide">
        {currentList.length === 0 && (
           <div className="text-center py-20 text-gray-600 text-xs uppercase tracking-widest">No protocols in this sector.</div>
        )}
        
        {currentList.map(task => (
            <TaskCard 
              key={task.id}
              task={task}
              isBlocked={isTaskBlocked(task)}
              onStart={() => onStartTask(task.id)}
              onRequestPause={() => onRequestPause(task)}
              onRequestComplete={() => onRequestComplete(task)}
              onDelete={(reason) => onDeleteTask(task.id)}
              onRequestReschedule={() => onEditTaskRequest(task)}
            />
        ))}
      </div>
    </div>
  );
};
