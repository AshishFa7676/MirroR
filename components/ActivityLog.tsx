
import React from 'react';
import { LogEntry, LogType } from '../types';

interface ActivityLogProps {
  logs: LogEntry[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  const getTypeColor = (type: LogType) => {
    switch (type) {
      case LogType.QUIZ_SUCCESS: return 'text-green-500 border-green-900';
      case LogType.CONTRACT_BREACHED:
      case LogType.QUIZ_FAILURE: return 'text-red-500 border-red-900';
      case LogType.SOCRATIC_INTERROGATION:
      case LogType.GHOSTING_DETECTED: return 'text-yellow-500 border-yellow-900';
      default: return 'text-gray-500 border-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full bg-void overflow-hidden">
      <div className="flex justify-between items-end mb-6 border-b border-gray-900 pb-4">
        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400">IMMUTABLE LOG</h2>
        <span className="text-[8px] text-gray-700 font-mono uppercase">{logs.length} RECORDS</span>
      </div>
      <div className="overflow-y-auto flex-1 space-y-4 pr-2 scrollbar-hide pb-20">
        {sortedLogs.length === 0 && (
          <div className="text-gray-800 text-[10px] italic text-center pt-20 uppercase tracking-widest">Existence is theoretical.</div>
        )}
        {sortedLogs.map((log) => (
          <div key={log.id} className={`border-l-2 pl-4 py-2 ${getTypeColor(log.type)} bg-surface/10`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[8px] font-mono opacity-40 uppercase tracking-widest">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[8px] font-black uppercase tracking-tighter opacity-80">{log.type.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-[11px] font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">{log.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
