
import React, { useState } from 'react';
import { LogEntry, LogType } from '../types';
import { Terminal, Clock, Database, ChevronDown, ChevronRight, Calendar } from 'lucide-react';

interface ActivityLogProps {
  logs: LogEntry[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Performance Optimization: Only render the last 150 events
  const displayLogs = logs.slice(0, 150);

  // Group by Date
  const groupedLogs = displayLogs.reduce((acc, log) => {
    const date = new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, LogEntry[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getTypeStyle = (type: LogType) => {
    switch (type) {
      case LogType.TASK_COMPLETED:
      case LogType.QUIZ_SUCCESS:
      case LogType.REFLECTION_SESSION_COMPLETED:
        return 'border-l-success text-success';
      case LogType.TASK_STARTED:
      case LogType.TASK_RESUMED:
        return 'border-l-primary text-primary';
      case LogType.CONTRACT_BREACHED:
      case LogType.TASK_DELETED:
      case LogType.GHOSTING_DETECTED:
      case LogType.ALARM_TRIGGERED:
        return 'border-l-danger text-danger';
      case LogType.REFLECTION_SUBMITTED:
      case LogType.JOURNAL_DUMP:
        return 'border-l-purple-500 text-purple-400';
      default:
        return 'border-l-gray-600 text-gray-400';
    }
  };

  const renderMetadata = (log: LogEntry) => {
    if (!log.metadata) return null;

    return (
      <div className="mt-2 bg-black/50 p-3 rounded border border-gray-800 text-[10px] font-mono overflow-x-auto">
        <div className="uppercase text-gray-600 mb-1 tracking-widest">Raw Metadata Payload</div>
        {log.type === LogType.REFLECTION_SUBMITTED && (
           <div className="space-y-1">
              <div className="text-gray-400"><span className="text-purple-500">PROMPT ID:</span> {log.metadata.prompt_id}</div>
              <div className="text-gray-400"><span className="text-purple-500">CATEGORY:</span> {log.metadata.category}</div>
              <div className="text-gray-400"><span className="text-purple-500">SKIPPED:</span> {log.metadata.skipped ? 'YES' : 'NO'}</div>
           </div>
        )}
        {log.type === LogType.JOURNAL_DUMP && (
           <div className="grid grid-cols-2 gap-2">
              <div>WPM: {log.metadata.words_per_minute}</div>
              <div>Words: {log.metadata.word_count}</div>
              <div>Time: {log.metadata.writing_duration_seconds}s</div>
              <div>Pauses: {log.metadata.pauses}</div>
           </div>
        )}
        <pre className="text-gray-500 mt-2">{JSON.stringify(log.metadata, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden p-6 md:p-12">
      <div className="flex justify-between items-end mb-8 border-b border-border pb-6">
        <div>
           <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
             <Database size={24} className="text-primary" /> THE PANOPTICON
           </h2>
           <p className="text-xs text-gray-500 font-mono mt-2">TOTAL RECALL OF BEHAVIORAL VECTORS</p>
        </div>
        <div className="flex flex-col items-end gap-1">
           <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600 bg-surface px-3 py-1 rounded border border-border">
              <Terminal size={12} /> {logs.length} EVENTS TOTAL
           </div>
           <div className="text-[9px] text-gray-700 font-mono">
              Displaying recent {displayLogs.length}
           </div>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 pr-2 scrollbar-hide pb-20 space-y-8">
        {logs.length === 0 && (
          <div className="text-gray-600 text-xs italic text-center pt-20 uppercase tracking-widest border border-dashed border-border p-8 rounded-xl">
            The ledger is empty. Act to generate data.
          </div>
        )}

        {sortedDates.map(date => (
           <div key={date} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 mb-4 border-b border-border flex items-center gap-2">
                 <Calendar size={14} className="text-gray-500"/>
                 <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{date}</span>
              </div>
              
              <div className="space-y-1 relative ml-2">
                 <div className="absolute left-[-9px] top-2 bottom-2 w-px bg-gray-800" />

                 {groupedLogs[date].sort((a,b) => b.timestamp - a.timestamp).map(log => {
                    const isExpanded = expandedId === log.id;
                    return (
                       <div 
                          key={log.id} 
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className={`relative pl-6 py-3 cursor-pointer group transition-all duration-200 hover:bg-surface/50 rounded-r-lg ${isExpanded ? 'bg-surface/50' : ''}`}
                       >
                          <div className={`absolute left-[-13px] top-5 w-2 h-2 rounded-full border-2 border-background ${getTypeStyle(log.type).replace('border-l-', 'bg-')}`} />

                          <div className="flex justify-between items-start">
                             <div className="flex-1 mr-4">
                                <div className="flex items-center gap-2 mb-1">
                                   <span className={`text-[10px] font-black uppercase tracking-wider ${getTypeStyle(log.type).split(' ')[1]}`}>
                                      {log.type.replace(/_/g, ' ')}
                                   </span>
                                   <span className="text-[10px] font-mono text-gray-600">
                                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                                   </span>
                                </div>
                                <p className="text-sm text-gray-300 font-medium leading-relaxed break-words">
                                   {log.content}
                                </p>
                             </div>
                             <div className="text-gray-600 group-hover:text-white transition-colors shrink-0 pt-1">
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                             </div>
                          </div>

                          {isExpanded && (
                             <div className="mt-2 animate-in slide-in-from-top-1 duration-200">
                                {renderMetadata(log)}
                             </div>
                          )}
                       </div>
                    );
                 })}
              </div>
           </div>
        ))}
      </div>
    </div>
  );
};
